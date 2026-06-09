import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel, triggerCompetitionEvent } from "@/lib/pusher-server";
import { sendPushNotification } from "@/lib/web-push";

export async function POST(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const body = await req.json();
    const { approved } = body; // true = approve, false = reject

    if (typeof approved !== "boolean") {
      return Response.json({ error: "Invalid request. 'approved' must be a boolean." }, { status: 400 });
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

    if (!coupleEntry.pendingEditField) {
      return Response.json({ error: "No pending edit request" }, { status: 400 });
    }

    // Make sure the responding user is not the one who requested the edit
    if (coupleEntry.pendingEditRequestedById === currentUser.id) {
      return Response.json({ error: "You cannot approve your own edit request" }, { status: 400 });
    }

    if (!approved) {
      // Rejected — clear pending edit
      await db.competitionCouple.update({
        where: { id: coupleEntry.id },
        data: {
          pendingEditField: null,
          pendingEditValue: null,
          pendingEditRequestedById: null,
          pendingEditApprovedByUser1: false,
          pendingEditApprovedByUser2: false,
        },
      });

      // Send push notification to requester
      try {
        if (coupleEntry.pendingEditRequestedById) {
          const requester = await db.user.findUnique({
            where: { id: coupleEntry.pendingEditRequestedById },
            select: { pushSubscription: true },
          });
          if (requester?.pushSubscription) {
            await sendPushNotification(requester.pushSubscription, {
              title: "❌ Edit Rejected",
              body: `${currentUser.name} rejected the edit request.`,
              url: "/competition",
              tag: "competition-edit-rejected",
            });
          }
        }
      } catch {}

      // Notify requester via Pusher
      if (pusherServer && coupleEntry.pendingEditRequestedById) {
        const channel = getPartnerChannel(currentUser.id, user.partnerId);
        await pusherServer
          .trigger(channel, "competition-update", {
            type: "edit-rejected",
            userId: currentUser.id,
          })
          .catch(() => {});
      }

      return Response.json({
        success: true,
        approved: false,
        message: "Edit request rejected",
      });
    }

    // Approved — apply the change
    const isUser1 = currentUser.id === a;
    const updateData: Record<string, any> = {};

    if (isUser1) {
      updateData.pendingEditApprovedByUser1 = true;
    } else {
      updateData.pendingEditApprovedByUser2 = true;
    }

    await db.competitionCouple.update({
      where: { id: coupleEntry.id },
      data: updateData,
    });

    // Re-read to check if both have approved
    const freshEntry = await db.competitionCouple.findUniqueOrThrow({
      where: { id: coupleEntry.id },
    });

    // Since only the partner who DIDN'T request needs to approve, check if the requesting user already auto-approved
    // Actually, the requesting user's approval is implicit by them making the request
    // So we check: if the requester is user1, we need user2 to approve (and vice versa)
    const requesterIsUser1 = freshEntry.pendingEditRequestedById === freshEntry.user1Id;

    let bothApproved = false;
    if (requesterIsUser1) {
      // User1 requested, we need user2 to approve
      bothApproved = freshEntry.pendingEditApprovedByUser2;
    } else {
      // User2 requested, we need user1 to approve
      bothApproved = freshEntry.pendingEditApprovedByUser1;
    }

    if (bothApproved) {
      // Apply the edit
      const fieldToUpdate = freshEntry.pendingEditField as string;
      const valueToApply = freshEntry.pendingEditValue as string;

      const editUpdateData: Record<string, any> = {};
      if (fieldToUpdate === "teamName") {
        editUpdateData.teamName = valueToApply;
      } else if (fieldToUpdate === "teamImage") {
        editUpdateData.teamImage = valueToApply;
      }

      // Clear pending edit fields
      editUpdateData.pendingEditField = null;
      editUpdateData.pendingEditValue = null;
      editUpdateData.pendingEditRequestedById = null;
      editUpdateData.pendingEditApprovedByUser1 = false;
      editUpdateData.pendingEditApprovedByUser2 = false;

      await db.competitionCouple.update({
        where: { id: coupleEntry.id },
        data: editUpdateData,
      });

      // Send push notification to requester
      try {
        if (coupleEntry.pendingEditRequestedById) {
          const requester = await db.user.findUnique({
            where: { id: coupleEntry.pendingEditRequestedById },
            select: { pushSubscription: true },
          });
          if (requester?.pushSubscription) {
            const fieldLabel = fieldToUpdate === "teamName" ? "team name" : "team avatar";
            await sendPushNotification(requester.pushSubscription, {
              title: "✅ Edit Approved!",
              body: `${currentUser.name} approved the ${fieldLabel} change!`,
              url: "/competition",
              tag: "competition-edit-approved",
            });
          }
        }
      } catch {}

      // Notify requester via Pusher
      if (pusherServer) {
        const channel = getPartnerChannel(currentUser.id, user.partnerId);
        await pusherServer
          .trigger(channel, "competition-update", {
            type: "edit-approved",
            userId: currentUser.id,
            field: fieldToUpdate,
            value: valueToApply,
          })
          .catch(() => {});
      }

      // Broadcast to public channel for leaderboard update
      await triggerCompetitionEvent("competition-update", {
        type: "team-updated",
        field: fieldToUpdate,
      });

      return Response.json({
        success: true,
        approved: true,
        isComplete: true,
        updatedField: fieldToUpdate,
        updatedValue: valueToApply,
      });
    } else {
      // Still waiting for the other partner
      return Response.json({
        success: true,
        approved: true,
        isComplete: false,
        message: "You approved! Waiting for the other partner to confirm...",
      });
    }
  } catch (error) {
    console.error("Competition approve-edit error:", error);
    return Response.json({ error: "Failed to process edit approval" }, { status: 500 });
  }
}
