import { prisma } from "@/lib/prisma";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const userData = await getApiUser(request);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const memories = await db.memory.findMany({
      where: {
        OR: [
          { userId: userData.id },
          { user: { partneredUsers: { some: { id: userData.id } } } },
          { user: { partnerId: userData.id } }
        ]
      },
      orderBy: { date: "desc" },
      include: { user: { select: { name: true } } }
    });

    return Response.json(memories);
  } catch (error) {
    console.error("Failed to fetch memories:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch memories" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const { imageUrl, caption, date } = await req.json();
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const memory = await db.memory.create({
      data: {
        userId: userData.id,
        imageUrl,
        caption,
        date: date ? new Date(date) : new Date(),
      }
    });

    // Trigger Pusher event to notify partner's UI in real-time
    if (pusherServer) {
      const user = await db.user.findUnique({
        where: { id: userData.id },
        select: { partnerId: true },
      });
      if (user?.partnerId) {
        const channel = getPartnerChannel(userData.id, user.partnerId);
        await pusherServer
          .trigger(channel, "partner-update", {
            userId: userData.id,
            type: "memory",
            timestamp: new Date().toISOString(),
          })
          .catch((err: Error) => {
            console.error("Pusher trigger (partner-update) failed:", err);
          });
      }
    }

    return Response.json(memory, { status: 201 });
  } catch (error) {
    console.error("Failed to create memory:", error);
    return new Response(JSON.stringify({ error: "Failed to create memory" }), { status: 500 });
  }
}
