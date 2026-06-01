import webpush from "web-push";

/**
 * Configure web-push with VAPID details.
 * VAPID keys should be generated with: npx web-push generate-vapid-keys
 */
function createWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@mybunny.app";

  if (!publicKey || !privateKey) {
    console.warn(
      "web-push: Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY. Push notifications disabled."
    );
    return null;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export const webPush = createWebPush();

/**
 * Send a push notification to a user's stored subscription.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendPushNotification(
  subscription: unknown,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }
): Promise<boolean> {
  if (!webPush) return false;

  try {
    // Always use "My Bunny 💕" as the notification title so that
    // on Android (even if PWA not installed), the notification shows the
    // app name prominently instead of the browser name.
    // The original title (e.g., "💧 Water Reminder") is shown in the body.
    await webPush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify({
        title: "My Bunny 💕",
        body: `${payload.title} — ${payload.body}`,
        url: payload.url || "/dashboard",
        tag: payload.tag || "partner-message",
        icon: "/icon-192.jpeg",
        badge: "/icon-192.jpeg",
        vibrate: [100, 50, 100],
        actions: [
          { action: "open", title: "Open App 💕" },
        ],
      })
    );
    return true;
  } catch (error) {
    // If subscription is invalid (expired/unsubscribed), log but don't crash
    if (error instanceof Error && "statusCode" in error) {
      const status = (error as { statusCode: number }).statusCode;
      if (status === 410 || status === 404) {
        console.warn("Push subscription expired or invalid (410/404)");
      } else {
        console.error("Push notification error:", status, error.message);
      }
    } else {
      console.error("Push notification error:", error);
    }
    return false;
  }
}
