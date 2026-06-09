import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel, triggerCompetitionEvent } from "@/lib/pusher-server";
import { sendPushNotification } from "@/lib/web-push";

// Fallback names when AI is unavailable
const FALLBACK_NAMES = [
  "Love Blossoms 🌸",
  "Power Couple ⚡",
  "Heart & Soul 💕",
  "Forever Together 💑",
  "Soulmates United 💞",
  "Sweethearts 🍯",
  "Two Hearts 💖",
  "Endless Love ♾️",
  "Dream Team 🌟",
  "Love Warriors 💪",
];

function getFallbackName(): string {
  return FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
}

export async function POST(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const body = await req.json();
    const { response } = body; // "yes" or "no"

    if (!response || !["yes", "no"].includes(response)) {
      return Response.json({ error: "Invalid response. Use 'yes' or 'no'." }, { status: 400 });
    }

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

    // Find the couple entry
    let coupleEntry = await db.competitionCouple.findUnique({
      where: { coupleKey },
    });

    if (!coupleEntry) {
      return Response.json({ error: "No invite found. Partner needs to start the join process first." }, { status: 400 });
    }

    if (response === "yes") {
      // Mark as agreed
      if (isUser1) {
        await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user1Agreed: true, user1Declined: false },
        });
      } else {
        await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user2Agreed: true, user2Declined: false },
        });
      }

      // Re-read to get fresh data
      const freshEntry = await db.competitionCouple.findUniqueOrThrow({
        where: { id: coupleEntry.id },
      });

      const bothAgreed = freshEntry.user1Agreed && freshEntry.user2Agreed;

      // If both agreed, auto-generate a team name and lock it
      let newTeamName: string | null = null;
      if (bothAgreed && !freshEntry.teamName) {
        // Use AI-suggested name if available, otherwise fallback
        const generatedName = freshEntry.nameSuggestedByUser1 || freshEntry.nameSuggestedByUser2 || getFallbackName();
        newTeamName = generatedName;
        await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { teamName: generatedName },
        });
      } else if (freshEntry.teamName) {
        newTeamName = freshEntry.teamName;
      }

      // Send push notification to partner
      try {
        const partnerPushUser = await db.user.findUnique({
          where: { id: user.partnerId },
          select: { pushSubscription: true },
        });
        if (partnerPushUser?.pushSubscription) {
          await sendPushNotification(partnerPushUser.pushSubscription, {
            title: "🎉 Partner Joined!",
            body: `${currentUser.name} said YES! You're both in the competition! 🏆`,
            url: "/competition",
            tag: "competition-joined",
          });
        }
      } catch {}

      // Notify partner
      if (pusherServer) {
        const channel = getPartnerChannel(currentUser.id, user.partnerId);
        await pusherServer
          .trigger(channel, "competition-update", {
            type: "responded-yes",
            userId: currentUser.id,
          })
          .catch(() => {});
      }

      // Broadcast to public channel
      await triggerCompetitionEvent("competition-update", {
        type: bothAgreed ? "team-joined" : "responded-yes",
      });

      return Response.json({
        success: true,
        agreed: true,
        isComplete: bothAgreed && !!newTeamName,
        teamName: newTeamName,
      });
    } else {
      // "no" — mark as declined
      if (isUser1) {
        await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user1Declined: true, user1Agreed: false },
        });
      } else {
        await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user2Declined: true, user2Agreed: false },
        });
      }

      // Send push notification to partner
      try {
        const partnerPushUser = await db.user.findUnique({
          where: { id: user.partnerId },
          select: { pushSubscription: true },
        });
        if (partnerPushUser?.pushSubscription) {
          await sendPushNotification(partnerPushUser.pushSubscription, {
            title: "😔 Competition Declined",
            body: `${currentUser.name} declined the competition invite.`,
            url: "/competition",
            tag: "competition-declined",
          });
        }
      } catch {}

      // Notify partner
      if (pusherServer) {
        const channel = getPartnerChannel(currentUser.id, user.partnerId);
        await pusherServer
          .trigger(channel, "competition-update", {
            type: "responded-no",
            userId: currentUser.id,
          })
          .catch(() => {});
      }

      return Response.json({
        success: true,
        agreed: false,
        declined: true,
      });
    }
  } catch (error) {
    console.error("Competition respond error:", error);
    return Response.json({ error: "Failed to respond" }, { status: 500 });
  }
}
