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
    const isUser1 = currentUser.id === a;

    let coupleEntry = await db.competitionCouple.findUnique({
      where: { coupleKey },
    });

    if (!coupleEntry) {
      return Response.json({ error: "Join the competition first" }, { status: 400 });
    }

    // Get the suggested name from either partner
    const suggestedName = coupleEntry.nameSuggestedByUser1 || coupleEntry.nameSuggestedByUser2;
    if (!suggestedName) {
      return Response.json(
        { error: "No team name suggested yet. Use AI to suggest a name first." },
        { status: 400 }
      );
    }

    // Set this user as agreed
    if (isUser1) {
      await db.competitionCouple.update({
        where: { id: coupleEntry.id },
        data: { user1Agreed: true },
      });
    } else {
      await db.competitionCouple.update({
        where: { id: coupleEntry.id },
        data: { user2Agreed: true },
      });
    }

    // 🔁 FRESH re-read to handle race condition when both users approve simultaneously
    // Without this, concurrent updates may each see only their own change as true
    const freshEntry = await db.competitionCouple.findUniqueOrThrow({
      where: { id: coupleEntry.id },
    });

    const bothAgreed = freshEntry.user1Agreed && freshEntry.user2Agreed;
    let teamName = freshEntry.teamName;

    if (bothAgreed && !teamName) {
      const finalName = freshEntry.nameSuggestedByUser1 || freshEntry.nameSuggestedByUser2 || "Love Team ❤️";
      const updated = await db.competitionCouple.update({
        where: { id: coupleEntry.id },
        data: { teamName: finalName },
      });
      teamName = updated.teamName;
      coupleEntry = updated;
    } else {
      coupleEntry = freshEntry;
    }

    // Notify partner via Pusher
    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, user.partnerId);
      await pusherServer
        .trigger(channel, "competition-update", {
          type: "approved",
          userId: currentUser.id,
        })
        .catch(() => {});
    }

    // Broadcast to public competition channel for live leaderboard updates
    await triggerCompetitionEvent("competition-update", {
      type: bothAgreed ? "team-locked" : "approved",
    });

    return Response.json({
      success: true,
      teamName: teamName || null,
      user1Agreed: coupleEntry.user1Agreed,
      user2Agreed: coupleEntry.user2Agreed,
      isComplete: !!(coupleEntry.user1Agreed && coupleEntry.user2Agreed && coupleEntry.teamName),
    });
  } catch (error) {
    console.error("Competition approve error:", error);
    return Response.json({ error: "Failed to approve" }, { status: 500 });
  }
}
