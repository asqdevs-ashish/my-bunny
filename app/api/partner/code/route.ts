import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";
import { getApiUser } from "@/lib/api-auth";

// POST: Generate a new partner code for the current user
export async function POST(request: Request) {
  const userData = await getApiUser(request);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(userData);

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await db.user.update({
      where: { id: currentUser.id },
      data: { partnerCode: code },
    });

    return Response.json({ code: user.partnerCode });
  } catch (error) {
    console.error("Failed to generate partner code:", error);
    return new Response("Failed to generate code", { status: 500 });
  }
}

// PUT: Link to a partner using their code
export async function PUT(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return new Response("Code is required", { status: 400 });
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(userData);

    // Find the user with this partner code
    const partner = await db.user.findUnique({
      where: { partnerCode: code },
    });

    if (!partner) {
      return new Response("Invalid code — no user found with this code", { status: 404 });
    }

    if (partner.id === currentUser.id) {
      return new Response("You cannot link to yourself!", { status: 400 });
    }

    // Check if partner is already linked
    if (partner.partnerId) {
      return new Response("This user is already linked to someone else", { status: 409 });
    }

    // Link both users
    const now = new Date();
    await db.user.update({
      where: { id: currentUser.id },
      data: { partnerId: partner.id, partnerSince: now, partnerCode: null },
    });
    await db.user.update({
      where: { id: partner.id },
      data: { partnerId: currentUser.id, partnerSince: now, partnerCode: null },
    });

    // Create LovePlant record for the couple (if not exists)
    const [a, b] = [currentUser.id, partner.id].sort();
    const coupleKey = `${a}_${b}`;
    await db.lovePlant.upsert({
      where: { coupleKey },
      update: {},
      create: { coupleKey, user1Id: a, user2Id: b },
    }).catch((e) => console.error("Failed to create LovePlant:", e));

    // Trigger Pusher event to notify both users' UIs in real-time
    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, partner.id);
      await pusherServer.trigger(channel, "partner-status-update", {
        linked: true,
        partner1Id: currentUser.id,
        partner2Id: partner.id,
        partner1Name: currentUser.name,
        partner2Name: partner.name,
      }).catch((err: Error) => {
        console.error("Pusher trigger (partner-status-update) failed:", err);
      });
    }

    return Response.json({
      success: true,
      partner: { id: partner.id, name: partner.name, email: partner.email },
    });
  } catch (error) {
    console.error("Failed to link partner:", error);
    return new Response("Failed to link partner", { status: 500 });
  }
}
