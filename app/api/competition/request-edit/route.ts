import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { sendPushNotification } from "@/lib/web-push";

export async function POST(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const body = await req.json();
    const { field, value } = body; // field: "teamName" | "teamImage"

    if (!field || !["teamName", "teamImage"].includes(field)) {
      return Response.json({ error: "Invalid field. Use 'teamName' or 'teamImage'." }, { status: 400 });
    }

    if (!value || value.trim() === "") {
      return Response.json({ error: "Value cannot be empty" }, { status: 400 });
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

    const coupleEntry = await db.competitionCouple.findUnique({
      where: { coupleKey },
    });

    if (!coupleEntry) {
      return Response.json({ error: "Not in the competition" }, { status: 400 });
    }

    if (!coupleEntry.teamName) {
      return Response.json({ error: "Join the competition first with a team name" }, { status: 400 });
    }

    // If there's already a pending edit, check it's not from the same user
    if (coupleEntry.pendingEditField) {
      if (coupleEntry.pendingEditRequestedById === currentUser.id) {
        return Response.json({ error: "You already have a pending edit request. Wait for your partner to respond." }, { status: 400 });
      }
      return Response.json({ error: "There's already a pending edit request from your partner. Respond to that first." }, { status: 400 });
    }

    // Create pending edit request
    await db.competitionCouple.update({
      where: { id: coupleEntry.id },
      data: {
        pendingEditField: field,
        pendingEditValue: value.trim(),
        pendingEditRequestedById: currentUser.id,
        pendingEditApprovedByUser1: false,
        pendingEditApprovedByUser2: false,
      },
    });

    // Notify partner via Pusher
    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, user.partnerId);
      await pusherServer
        .trigger(channel, "competition-update", {
          type: "edit-requested",
          userId: currentUser.id,
          field,
          value: value.trim(),
        })
        .catch(() => {});
    }

    // Send push notification to partner
    try {
      const partnerPushUser = await db.user.findUnique({
        where: { id: user.partnerId },
        select: { pushSubscription: true },
      });
      if (partnerPushUser?.pushSubscription) {
        const fieldLabel = field === "teamName" ? "team name" : "team avatar";
        await sendPushNotification(partnerPushUser.pushSubscription, {
          title: "✏️ Edit Request",
          body: `${currentUser.name} wants to change the ${fieldLabel}. Tap to approve or reject.`,
          url: "/competition",
          tag: "competition-edit-request",
        });
      }
    } catch {}

    return Response.json({
      success: true,
      message: `Edit request sent to ${user.partner.name}`,
      pendingEditField: field,
      pendingEditValue: value.trim(),
    });
  } catch (error) {
    console.error("Competition request-edit error:", error);
    return Response.json({ error: "Failed to request edit" }, { status: 500 });
  }
}
