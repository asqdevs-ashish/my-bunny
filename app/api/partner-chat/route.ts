import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { sendPushNotification } from "@/lib/web-push";
import { resolveCurrentUser } from "@/lib/current-user";
import { encryptMessage, decryptMessage } from "@/lib/chat-encryption";

export async function GET(request: Request) {
  const userData = await getApiUser(request);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return Response.json({ messages: [], partner: null });
    }
    const userId = currentUser.id;

    // Get the current user with partner info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { partnerId: true },
    });

    if (!user?.partnerId) {
      return Response.json({
        messages: [],
        partner: null,
      });
    }

    // Fetch messages between the two users (both directions)
    const messages = await db.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: user.partnerId },
          { senderId: user.partnerId, receiverId: userId },
        ],
        role: "partner",
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // ── Mark partner's messages as read (blue tick) ──
    const now = new Date();
    const unreadPartnerMessages = messages.filter(
      (m) => m.senderId === user.partnerId && !m.readAt
    );
    const unreadIds = unreadPartnerMessages.map((m) => m.id);

    if (unreadIds.length > 0) {
      await db.chatMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: now },
      });

      // Notify partner via Pusher that their messages were read
      if (pusherServer) {
        const channel = getPartnerChannel(userId, user.partnerId);
        await pusherServer
          .trigger(channel, "messages-read", {
            readAt: now.toISOString(),
            messageIds: unreadIds,
          })
          .catch(() => {});
      }
    }

    // Decrypt all messages before returning (with updated readAt)
    const decryptedMessages = messages.map((msg) => ({
      ...msg,
      content: decryptMessage(msg.content),
      readAt: unreadIds.includes(msg.id) ? now.toISOString() : msg.readAt?.toISOString() || null,
    }));

    return Response.json({
      messages: decryptedMessages,
      partnerId: user.partnerId,
    });
  } catch (error) {
    console.error("Failed to fetch partner chat:", error);
    return new Response("Failed to fetch messages", { status: 500 });
  }
}

export async function POST(req: Request) {
  const userData = await getApiUser(req);
  if (!userData?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return new Response(
        JSON.stringify({ error: "Message content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");

    // Use userData directly as it has id matching resolveCurrentUser expectations
    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: "User not found in database. Please logout and login again." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const userId = currentUser.id;

    // Get partner info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { partnerId: true },
    });

    if (!user?.partnerId) {
      return new Response(
        JSON.stringify({ error: "No partner linked" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Encrypt the message content before saving to database
    const encryptedContent = encryptMessage(content.trim());

    // Save message to database (encrypted at rest)
    const message = await db.chatMessage.create({
      data: {
        senderId: userId,
        receiverId: user.partnerId,
        role: "partner",
        content: encryptedContent,
      },
    });

    // Trigger Pusher event for real-time delivery (send decrypted content to client)
    if (pusherServer) {
      const channel = getPartnerChannel(userId, user.partnerId);
      await pusherServer.trigger(channel, "new-message", {
        message: {
          ...message,
          content: content.trim(), // Send plaintext via Pusher (already over HTTPS)
          readAt: null,            // New messages start unread
        },
      }).catch((err: Error) => {
        console.error("Pusher trigger failed:", err);
      });
    }

    // Return decrypted message to sender (with readAt = null since partner hasn't seen it yet)
    const responseMessage = {
      ...message,
      content: content.trim(),
      readAt: null,
    };

    // Send web push notification to partner (background notification)
    const sender = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    try {
      const partner = await db.user.findUnique({
        where: { id: user.partnerId },
        select: { pushSubscription: true },
      });

      if (partner?.pushSubscription) {
        const contentPreview = content.trim().length > 80
          ? content.trim().slice(0, 80) + "…"
          : content.trim();

        await sendPushNotification(partner.pushSubscription, {
          title: `💕 ${sender?.name || "Your Partner"}`,
          body: contentPreview,
          url: "/partner-chat",
          tag: `partner-msg-${user.partnerId}`,
        });
      }
    } catch (pushErr) {
      console.error("Failed to send push notification:", pushErr);
    }

    return Response.json({ message: responseMessage }, { status: 201 });
  } catch (error) {
    console.error("Failed to send message:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send message" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
