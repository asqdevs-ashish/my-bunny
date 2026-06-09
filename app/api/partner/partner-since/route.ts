import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { sendPushNotification } from "@/lib/web-push";

/**
 * POST /api/partner/partner-since
 * Propose/edit the anniversary date. Partner must confirm.
 * Body: { date: string (ISO), hour?: number, minute?: number }
 */
export async function POST(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const body = await req.json();
    let { date, hour, minute } = body;

    if (!date) {
      return Response.json({ error: "Date is required" }, { status: 400 });
    }

    // Parse and validate the date
    const proposedDate = new Date(date);
    if (isNaN(proposedDate.getTime())) {
      return Response.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Apply hour/minute if provided
    if (typeof hour === "number" && !isNaN(hour)) {
      proposedDate.setHours(hour);
    } else {
      proposedDate.setHours(0);
    }
    if (typeof minute === "number" && !isNaN(minute)) {
      proposedDate.setMinutes(minute);
    } else {
      proposedDate.setMinutes(0);
    }
    proposedDate.setSeconds(0);
    proposedDate.setMilliseconds(0);

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

    // Set the pending date on BOTH users
    await db.user.updateMany({
      where: { id: { in: [currentUser.id, user.partnerId] } },
      data: {
        partnerSincePending: proposedDate,
        partnerSincePendingProposerId: currentUser.id,
      },
    });

    // Notify partner via Pusher
    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, user.partnerId);
      await pusherServer
        .trigger(channel, "partner-status-update", {
          type: "partner-since-proposed",
          proposedDate: proposedDate.toISOString(),
          proposedByName: currentUser.name,
          proposedById: currentUser.id,
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
        const dateStr = proposedDate.toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        });
        await sendPushNotification(partnerUser.pushSubscription, {
          title: "🎂 Anniversary Date Proposed",
          body: `${currentUser.name} set ${dateStr} as your anniversary date. Tap to confirm!`,
          url: `/partner/${currentUser.id}`,
          tag: "anniversary-proposed",
        });
      }
    } catch {}

    return Response.json({
      success: true,
      message: `Anniversary date proposed to ${user.partner.name}! They need to confirm.`,
      proposedDate: proposedDate.toISOString(),
    });
  } catch (error) {
    console.error("Partner-since proposal error:", error);
    return Response.json({ error: "Failed to propose date" }, { status: 500 });
  }
}
