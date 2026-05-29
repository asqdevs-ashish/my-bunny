import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";

// GET: Fetch today's water log for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const log = await db.waterLog.findUnique({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: todayStart,
        },
      },
    });

    return Response.json({ glasses: log?.count || 0 });
  } catch (error) {
    console.error("Failed to fetch water log:", error);
    return new Response("Failed to fetch water log", { status: 500 });
  }
}

// POST: Update water glasses count
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { glasses } = await req.json();
    if (typeof glasses !== "number" || glasses < 0 || glasses > 20) {
      return new Response("Invalid glasses count", { status: 400 });
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const log = await db.waterLog.upsert({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: todayStart,
        },
      },
      update: { count: glasses },
      create: {
        userId: currentUser.id,
        date: todayStart,
        count: glasses,
      },
    });

    // Trigger Love Plant update via Pusher (notify partner)
    if (pusherServer && currentUser.partnerId) {
      const channel = getPartnerChannel(currentUser.id, currentUser.partnerId);
      await pusherServer
        .trigger(channel, "love-plant-update", {
          triggeredBy: currentUser.id,
          timestamp: new Date().toISOString(),
        })
        .catch((err) => console.error("Pusher trigger (love-plant) failed:", err));
    }

    return Response.json({ glasses: log.count });
  } catch (error) {
    console.error("Failed to update water log:", error);
    return new Response("Failed to update water log", { status: 500 });
  }
}
