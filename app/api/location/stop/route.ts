import { prisma } from "@/lib/prisma";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { resolveCurrentUser } from "@/lib/current-user";
import { getApiUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  const userData = await getApiUser(request);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = prisma;
  if (!db) {
    return new Response("Database not available", { status: 503 });
  }

  try {
    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return new Response("User not found", { status: 400 });
    }

    if (!currentUser.partnerId) {
      return new Response("No partner linked", { status: 400 });
    }

    // Set isSharing to false (only update if record exists)
    await db.location.updateMany({
      where: { userId: currentUser.id },
      data: { isSharing: false },
    });

    // Notify partner via Pusher
    const channel = getPartnerChannel(currentUser.id, currentUser.partnerId);
    if (pusherServer) {
      await pusherServer
        .trigger(channel, "location-stop", {
          userId: currentUser.id,
        })
        .catch((err: Error) => {
          console.error("Pusher trigger failed:", err);
        });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to stop sharing:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
