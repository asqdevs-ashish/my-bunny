import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { sendPushNotification } from "@/lib/web-push";

/**
 * POST /api/partner/partner-since-respond
 * Accept or reject a proposed anniversary date.
 * Body: { approved: boolean }
 */
export async function POST(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const body = await req.json();
    const { approved } = body;

    if (typeof approved !== "boolean") {
      return Response.json({ error: "'approved' must be a boolean" }, { status: 400 });
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

    // Check if there's a pending date
    if (!user.partnerSincePending || !user.partnerSincePendingProposerId) {
      return Response.json({ error: "No pending anniversary date proposal" }, { status: 400 });
    }

    // Make sure the current user is NOT the proposer
    if (user.partnerSincePendingProposerId === currentUser.id) {
      return Response.json({ error: "You cannot confirm your own proposal" }, { status: 400 });
    }

    if (approved) {
      // Accept — set partnerSince on BOTH users and clear pending
      await db.user.updateMany({
        where: { id: { in: [currentUser.id, user.partnerId] } },
        data: {
          partnerSince: user.partnerSincePending,
          partnerSincePending: null,
          partnerSincePendingProposerId: null,
        },
      });

      // Send push notification to proposer
      try {
        if (user.partnerSincePendingProposerId) {
          const proposerUser = await db.user.findUnique({
            where: { id: user.partnerSincePendingProposerId },
            select: { pushSubscription: true },
          });
          if (proposerUser?.pushSubscription) {
            const dateStr = user.partnerSincePending.toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            });
            await sendPushNotification(proposerUser.pushSubscription, {
              title: "✅ Anniversary Confirmed!",
              body: `${currentUser.name} confirmed ${dateStr} as your anniversary date! 🎉`,
              url: `/partner/${currentUser.id}`,
              tag: "anniversary-confirmed",
            });
          }
        }
      } catch {}

      // Notify proposer via Pusher
      if (pusherServer && user.partnerSincePendingProposerId) {
        const channel = getPartnerChannel(currentUser.id, user.partnerId);
        await pusherServer
          .trigger(channel, "partner-status-update", {
            type: "partner-since-confirmed",
            confirmedById: currentUser.id,
            confirmedByName: currentUser.name,
          })
          .catch(() => {});
      }

      return Response.json({
        success: true,
        approved: true,
        message: "Anniversary date confirmed! 🎉",
        partnerSince: user.partnerSincePending.toISOString(),
      });
    } else {
      // Reject — clear pending
      await db.user.updateMany({
        where: { id: { in: [currentUser.id, user.partnerId] } },
        data: {
          partnerSincePending: null,
          partnerSincePendingProposerId: null,
        },
      });

      // Send push notification to proposer
      try {
        if (user.partnerSincePendingProposerId) {
          const proposerUser = await db.user.findUnique({
            where: { id: user.partnerSincePendingProposerId },
            select: { pushSubscription: true },
          });
          if (proposerUser?.pushSubscription) {
            await sendPushNotification(proposerUser.pushSubscription, {
              title: "❌ Anniversary Rejected",
              body: `${currentUser.name} rejected the proposed anniversary date.`,
              url: `/partner/${currentUser.id}`,
              tag: "anniversary-rejected",
            });
          }
        }
      } catch {}

      // Notify proposer via Pusher
      if (pusherServer && user.partnerSincePendingProposerId) {
        const channel = getPartnerChannel(currentUser.id, user.partnerId);
        await pusherServer
          .trigger(channel, "partner-status-update", {
            type: "partner-since-rejected",
            rejectedById: currentUser.id,
            rejectedByName: currentUser.name,
          })
          .catch(() => {});
      }

      return Response.json({
        success: true,
        approved: false,
        message: "Anniversary date rejected",
      });
    }
  } catch (error) {
    console.error("Partner-since respond error:", error);
    return Response.json({ error: "Failed to respond" }, { status: 500 });
  }
}
