import { pusherServer } from "@/lib/pusher-server";
import { getApiUser } from "@/lib/api-auth";

export async function POST(req: Request) {
  const userData = await getApiUser(req);
  if (!userData?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!pusherServer) {
    return new Response(
      JSON.stringify({ 
        error: "Real-time chat is not enabled. Please configure PUSHER_APP_ID, PUSHER_KEY, and PUSHER_SECRET in your .env file." 
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await req.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    if (!socketId || !channelName) {
      return new Response(
        JSON.stringify({ error: "Missing socket_id or channel_name" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // The channel name format: private-partner-{id1}-{id2}
    // Verify the authenticated user is one of the two users in the channel
    const userId = userData.id;
    const parts = channelName.split("-");
    const channelUserId1 = parts[2];
    const channelUserId2 = parts[3];

    if (userId !== channelUserId1 && userId !== channelUserId2) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Not a member of this channel" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: userId,
      user_info: { name: userData.name || "User" },
    });

    return new Response(JSON.stringify(authResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Pusher auth error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
