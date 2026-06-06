import { prisma } from "@/lib/prisma";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const userData = await getApiUser(request);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    // Fetch notes sent to me or by me
    const notes = await db.secretNote.findMany({
      where: {
        OR: [
          { receiverId: userData.id },
          { senderId: userData.id }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { name: true } },
        receiver: { select: { name: true } }
      }
    });

    return Response.json(notes);
  } catch (error) {
    console.error("Failed to fetch secret notes:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch secret notes" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const { content } = await req.json();
    const db = prisma;
    if (!db) throw new Error("Database not available");

    // Find partner
    const user = await db.user.findUnique({
      where: { id: userData.id },
      select: { partnerId: true, partneredUsers: { select: { id: true }, take: 1 } }
    });

    const partnerId = user?.partnerId || user?.partneredUsers[0]?.id;

    if (!partnerId) {
      return new Response(JSON.stringify({ error: "No partner linked" }), { status: 400 });
    }

    const note = await db.secretNote.create({
      data: {
        senderId: userData.id,
        receiverId: partnerId,
        content,
      }
    });

    // Trigger Pusher event to notify partner's UI in real-time
    if (pusherServer) {
      const channel = getPartnerChannel(userData.id, partnerId);
      await pusherServer
        .trigger(channel, "partner-update", {
          userId: userData.id,
          type: "secret-note",
          timestamp: new Date().toISOString(),
        })
        .catch((err: Error) => {
          console.error("Pusher trigger (partner-update) failed:", err);
        });
    }

    return Response.json(note, { status: 201 });
  } catch (error) {
    console.error("Failed to create secret note:", error);
    return new Response(JSON.stringify({ error: "Failed to create secret note" }), { status: 500 });
  }
}
