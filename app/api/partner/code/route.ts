import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";

// POST: Generate a new partner code for the current user
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

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
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return new Response("Code is required", { status: 400 });
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

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

    return Response.json({
      success: true,
      partner: { id: partner.id, name: partner.name, email: partner.email },
    });
  } catch (error) {
    console.error("Failed to link partner:", error);
    return new Response("Failed to link partner", { status: 500 });
  }
}
