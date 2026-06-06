import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel, triggerCompetitionEvent } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return Response.json({ error: "User not found" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user?.partnerId || !user?.partner) {
      return Response.json({ error: "Link with a partner first" }, { status: 400 });
    }

    const [a, b] = [currentUser.id, user.partnerId].sort();
    const coupleKey = `${a}_${b}`;

    // Get or create competition
    let competition = await db.competition.findFirst({
      where: { isActive: true },
    });

    if (!competition) {
      competition = await db.competition.create({
        data: { name: "Love Plant League", isActive: true },
      });
    }

    // Get or create couple entry
    let coupleEntry = await db.competitionCouple.findUnique({
      where: { coupleKey },
    });

    const isUser1 = currentUser.id === a;

    if (!coupleEntry) {
      coupleEntry = await db.competitionCouple.create({
        data: {
          competitionId: competition.id,
          coupleKey,
          user1Id: a,
          user2Id: b,
          user1Agreed: isUser1,
          user2Agreed: !isUser1,
        },
      });
    } else {
      // Update agreement for the current user
      if (isUser1) {
        coupleEntry = await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user1Agreed: true },
        });
      } else {
        coupleEntry = await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user2Agreed: true },
        });
      }
    }

    // Notify partner via Pusher
    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, user.partnerId);
      await pusherServer
        .trigger(channel, "competition-update", {
          type: "join",
          userId: currentUser.id,
        })
        .catch(() => {});
    }

    // Broadcast to public competition channel for live leaderboard updates
    await triggerCompetitionEvent("competition-update", {
      type: "join",
    });

    return Response.json({
      success: true,
      user1Agreed: coupleEntry.user1Agreed,
      user2Agreed: coupleEntry.user2Agreed,
      isComplete: coupleEntry.user1Agreed && coupleEntry.user2Agreed,
    });
  } catch (error) {
    console.error("Competition join error:", error);
    return Response.json({ error: "Failed to join competition" }, { status: 500 });
  }
}
