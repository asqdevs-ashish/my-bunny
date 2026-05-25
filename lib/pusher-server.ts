import Pusher from "pusher";

function createPusherServer() {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || "ap2";

  if (!appId || !key || !secret) {
    console.warn(
      "Pusher server: Missing PUSHER_APP_ID, PUSHER_KEY, or PUSHER_SECRET. Real-time chat will not work."
    );
    return null;
  }

  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
}

export const pusherServer = createPusherServer();

/**
 * Build a deterministic private channel name for two user IDs.
 * Sorted lexicographically so both partners subscribe to the same channel.
 */
export function getPartnerChannel(userId1: string, userId2: string): string {
  const [a, b] = [userId1, userId2].sort();
  return `private-partner-${a}-${b}`;
}
