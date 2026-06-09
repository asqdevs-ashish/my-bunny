import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel, triggerCompetitionEvent } from "@/lib/pusher-server";
import { sendPushNotification } from "@/lib/web-push";

/**
 * POST /api/competition/join
 * 
 * NEW FLOW: This acts as "Invite Partner to Join".
 * User1 clicks "Invite Partner", creates/updates the couple entry,
 * and the partner is asked (via realtime Pusher) Yes or No.
 * They respond via /api/competition/respond.
 */
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
      // Create entry — the initiator marks themselves as agreed
      coupleEntry = await db.competitionCouple.create({
        data: {
          competitionId: competition.id,
          coupleKey,
          user1Id: a,
          user2Id: b,
          user1Agreed: isUser1,
          user2Agreed: !isUser1,
          // Reset decline status
          user1Declined: false,
          user2Declined: false,
        },
      });
    } else {
      // If partner previously declined, reset and try again
      if (isUser1 && coupleEntry.user2Declined) {
        coupleEntry = await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user1Agreed: true, user2Declined: false, user2Agreed: false },
        });
      } else if (!isUser1 && coupleEntry.user1Declined) {
        coupleEntry = await db.competitionCouple.update({
          where: { id: coupleEntry.id },
          data: { user2Agreed: true, user1Declined: false, user1Agreed: false },
        });
      } else {
        // Already agreed or pending
        return Response.json({ 
          success: true, 
          status: coupleEntry.user1Agreed && coupleEntry.user2Agreed ? "already_joined" : "invite_sent",
          message: coupleEntry.teamName ? "Already in the competition!" : "Invite already sent to partner"
        });
      }
    }

    // Notify partner via Pusher — they'll see the invite UI
    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, user.partnerId);
      await pusherServer
        .trigger(channel, "competition-update", {
          type: "invite-sent",
          userId: currentUser.id,
          partnerName: currentUser.name,
        })
        .catch(() => {});
    }

    // Send push notification to partner
    try {
      const partnerUser = await db.user.findUnique({
        where: { id: user.partnerId },
        select: { pushSubscription: true },
      });
      if (partnerUser?.pushSubscription) {
        await sendPushNotification(partnerUser.pushSubscription, {
          title: "🏆 Competition Invite!",
          body: `${currentUser.name} wants to join the Love Plant League with you!`,
          url: "/competition",
          tag: "competition-invite",
        });
      }
    } catch (err) {
      console.error("Failed to send competition invite push:", err);
    }

    return Response.json({
      success: true,
      status: "invite_sent",
      message: `Invitation sent to ${user.partner.name}! 💌`,
      coupleKey,
    });
  } catch (error) {
    console.error("Competition join error:", error);
    return Response.json({ error: "Failed to join competition" }, { status: 500 });
  }
}
