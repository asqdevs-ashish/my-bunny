import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

    const moods = await db.userMood.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return Response.json(moods);
  } catch (error) {
    console.error("Failed to fetch moods:", error);
    return new Response("Failed to fetch moods", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { mood, note } = await req.json();

    const validMoods = ["happy", "stressed", "tired", "productive"];
    if (!validMoods.includes(mood)) {
      return new Response("Invalid mood", { status: 400 });
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

    const moodEntry = await db.userMood.create({
      data: {
        userId: currentUser.id,
        mood,
        note: note || null,
      },
    });

    // Trigger Pusher event to notify partner's UI in real-time
    if (pusherServer && currentUser.partnerId) {
      const channel = getPartnerChannel(currentUser.id, currentUser.partnerId);
      await pusherServer
        .trigger(channel, "partner-update", {
          userId: currentUser.id,
          type: "mood",
          timestamp: new Date().toISOString(),
        })
        .catch((err: Error) => {
          console.error("Pusher trigger (partner-update) failed:", err);
        });
    }

    return Response.json(moodEntry, { status: 201 });
  } catch (error) {
    console.error("Failed to log mood:", error);
    return new Response("Failed to log mood", { status: 500 });
  }
}
