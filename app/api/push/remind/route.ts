import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/web-push";
import { getMoodCheckBody } from "@/lib/utils";

const LOVE_NOTIFICATIONS = [
  "Hey baby! Just a reminder — you're amazing! 💕",
  "Smile meri jaan! You're the best thing that happened to me 😊",
  "Don't forget — you're loved more than you know! ❤️",
  "Time for a self-care break! You deserve it ✨",
  "Just a reminder: You're beautiful inside and out! 🌸",
];

const WATER_NOTIFICATIONS = [
  "Time to hydrate, baby! 💧",
  "Drink up, beautiful! Your skin will thank you! ✨",
  "Water break! 8 glasses a day keeps the glow going! 🥤",
  "Psst... drink some water! 🤍",
  "Hydration queen! Time for a glass 💦",
];

const MEAL_MESSAGES: Record<number, string> = {
  9: "Baby, it's breakfast 🥞 time! What should I suggest today?",
  13: "Baby, it's lunch 🍛 time! What should I suggest today?",
  20: "Baby, it's dinner 🍜 time! What should I suggest today?",
};

function getMealTag(hour: number): string {
  const tags: Record<number, string> = {
    9: "breakfast-time",
    13: "lunch-time",
    20: "dinner-time",
  };
  return tags[hour] || "meal-time";
}

interface ReminderConfig {
  title: string;
  url: string;
  hours: number[];
  getBody: (hour: number) => string;
  getTag: (hour: number) => string;
}

const REMINDER_CONFIG: Record<string, ReminderConfig> = {
  water: {
    title: "💧 Water Reminder",
    url: "/dashboard",
    hours: [8, 10, 12, 14, 16, 18, 20, 22], // Every 2 hours from 8 AM to 10 PM
    getBody: () => WATER_NOTIFICATIONS[Math.floor(Math.random() * WATER_NOTIFICATIONS.length)],
    getTag: () => "water-reminder",
  },
  love: {
    title: "💕 Love Note for You",
    url: "/dashboard",
    hours: [9, 13, 17, 21],
    getBody: () => LOVE_NOTIFICATIONS[Math.floor(Math.random() * LOVE_NOTIFICATIONS.length)],
    getTag: () => "love-note",
  },
  meal: {
    title: "🍽️ Time to Eat!",
    url: "/dashboard",
    hours: [9, 13, 20],
    getBody: (hour: number) => MEAL_MESSAGES[hour] || "Baby, it's time to eat! 🍽️",
    getTag: getMealTag,
  },
  mood: {
    title: "🥰 Mood Check",
    url: "/mood",
    hours: [15],
    getBody: (hour: number) => getMoodCheckBody(hour),
    getTag: () => "mood-check",
  },
};

type ReminderType = "water" | "love" | "meal" | "mood";
const VALID_TYPES: ReminderType[] = ["water", "love", "meal", "mood"];

/** Check if secret key matches (for cron job access without session) */
function isAuthorizedCron(url: URL): boolean {
  const secret = url.searchParams.get("secret");
  return secret === process.env.CRON_SECRET;
}

/**
 * Send a push notification for a given reminder type to a specific user.
 * Returns true if sent successfully.
 */
async function sendReminderPush(
  pushSubscription: unknown,
  type: ReminderType
): Promise<boolean> {
  const config = REMINDER_CONFIG[type];
  const hour = new Date().getHours();

  return sendPushNotification(pushSubscription, {
    title: config.title,
    body: config.getBody(hour),
    tag: config.getTag(hour),
    url: config.url,
  });
}

// Allow serverless function to stay alive longer for delayed pushes (Vercel)
export const maxDuration = 30;

/**
 * Get the push subscription for a user — from body subscription or from DB.
 * Saves client-provided subscription to DB for future use.
 */
async function getPushSubscription(reqBody: { subscription?: unknown }, userId: string) {
  const db = prisma;
  if (!db) throw new Error("Database not available");

  let subToUse = reqBody.subscription;

  if (!subToUse || typeof subToUse !== "object" || !(subToUse as any)?.endpoint) {
    // No subscription in body — check DB
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });
    subToUse = user?.pushSubscription;
  } else {
    // Client sent the subscription — save it to DB for future cron jobs
    await db.user.update({
      where: { id: userId },
      data: { pushSubscription: subToUse },
    }).catch(() => {});
  }

  return subToUse;
}

/**
 * POST /api/push/remind
 * Body: { type: "water" | "love" | "meal" | "mood", subscription?: object, delay?: number }
 * 
 * Called from client-side when a reminder fires.
 * Sends server-side Web Push for background delivery on mobile.
 * 
 * If `delay` is provided (in ms), the push is sent after that delay,
 * allowing you to close the app and still receive the notification.
 * 
 * If `subscription` is provided in the body (from the browser), it will be
 * saved to the user's record and used immediately.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, delay } = body;

    const db = prisma;
    if (!db) throw new Error("Database not available");

    // ── DELAYED / BATCHED MODE ─────────────────────────────
    // When delay is set, we accept either a single `type` or a `types[]` array.
    // This lets the "Test 7s Delayed" button send all 4 types in ONE request.
    if (typeof delay === "number" && delay > 0) {
      const delayMs = Math.min(delay, 25000);

      // Determine which types to send:
      let typesToSend: ReminderType[];
      if (body.types && Array.isArray(body.types)) {
        typesToSend = body.types.filter((t: string) =>
          VALID_TYPES.includes(t as ReminderType)
        );
      } else if (type && VALID_TYPES.includes(type)) {
        typesToSend = [type as ReminderType];
      } else {
        return new Response(
          JSON.stringify({ error: "No valid reminder type(s) provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (typesToSend.length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid reminder types provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get the push subscription
      const subToUse = await getPushSubscription(body, session.user.id);
      if (!subToUse) {
        return new Response(
          JSON.stringify({ error: "No push subscription found. Enable notifications first." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // IMPORTANT: We AWAIT the timeout before responding so that Vercel's
      // serverless function stays alive. If we responded immediately, Vercel
      // would freeze the function and the setTimeout callback would never fire.
      const results: { type: string; success: boolean }[] = [];

      // Wait for the initial delay (allows user to close the app)
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Send each type with 1s stagger to avoid overwhelming the push service
      for (let i = 0; i < typesToSend.length; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        try {
          const sent = await sendReminderPush(subToUse, typesToSend[i]);
          results.push({ type: typesToSend[i], success: sent });
        } catch (e) {
          console.error(`Delayed push failed for ${typesToSend[i]}:`, e);
          results.push({ type: typesToSend[i], success: false });
        }
      }

      return Response.json({
        success: true,
        delayed: delayMs,
        results,
        message: `Sent ${results.filter(r => r.success).length}/${results.length} notifications after ${delayMs}ms delay`,
      });
    }

    // ── NORMAL IMMEDIATE MODE ─────────────────────────────
    // No delay — validate a single type and send immediately
    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid reminder type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the push subscription
    const subToUse = await getPushSubscription(body, session.user.id);
    if (!subToUse) {
      return new Response(
        JSON.stringify({ error: "No push subscription found. Enable notifications first." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sent = await sendReminderPush(subToUse, type as ReminderType);

    if (sent) {
      return Response.json({ success: true, type, message: "Reminder sent via push notification" });
    }

    return new Response(
      JSON.stringify({ error: "Failed to send push notification" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Failed to send reminder push:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send reminder" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET /api/push/remind?type=water
 * GET /api/push/remind?secret=YOUR_CRON_SECRET   <-- for cron jobs (sends ALL due reminders)
 *
 * - With a valid session: sends the specified type reminder
 * - With ?secret=CRON_SECRET: sends all due reminders to ALL users (for cron-job.org)
 *   Set CRON_SECRET in your .env file. Kept secure — never exposed to client.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const isCron = isAuthorizedCron(url);

  let userId: string | null = null;

  if (!isCron) {
    // Normal user request — require auth session
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    userId = session.user.id;
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    if (isCron) {
      // ─── CRON JOB MODE ───────────────────────────
      // Loop through all users with push subscriptions
      // and send due reminders based on current time,
      // respecting each user's notification preferences
      // and avoiding duplicate sends within the same hour.
      const allUsers = await db.user.findMany({
        select: { id: true, pushSubscription: true, notificationPrefs: true, lastReminderSent: true },
      });
      // Only include users with a valid push subscription
      const users = allUsers.filter(
        (u): u is typeof u & { pushSubscription: object } =>
          u.pushSubscription !== null && typeof u.pushSubscription === "object"
      );

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const results: { userId: string; type: string; success: boolean; skipped?: string }[] = [];

      for (const user of users) {
        // Parse user preferences (default: all enabled)
        const prefs = (user.notificationPrefs as Record<string, boolean> | null) ?? {
          water: true, meal: true, love: true, mood: true,
        };
        // Parse last-sent tracking (default: empty)
        const lastSent = (user.lastReminderSent as Record<string, string> | null) ?? {};

        // ── Calculate user's local hour from their timezone offset ──
        const prefsWithTz = user.notificationPrefs as Record<string, unknown> | null;
        const tzOffsetMinutes = (prefsWithTz?.timezoneOffset as number | undefined) ?? 0;
        const utcMinutes = hour * 60 + minute;
        const localMinutes = (utcMinutes + tzOffsetMinutes + 1440) % 1440;
        const localHour = Math.floor(localMinutes / 60);
        const localHourForDedup = localHour;

        for (const reminderType of VALID_TYPES) {
          const config = REMINDER_CONFIG[reminderType];

          // ── Check 1: Is this reminder due at the user's local hour?
          if (!config.hours.includes(localHour)) continue;

          // ── Check 2: Does the user want this reminder type?
          if (!prefs[reminderType]) {
            results.push({ userId: user.id, type: reminderType, success: false, skipped: "disabled by user" });
            continue;
          }

          // ── Check 3: Already sent in this hour? (dedup using local hour)
          const lastSentStr = lastSent[reminderType];
          if (lastSentStr) {
            const lastSentDate = new Date(lastSentStr);
            // Convert lastSent to user's local hour for comparison
            const lastSentLocalMinutes = (lastSentDate.getUTCHours() * 60 + lastSentDate.getUTCMinutes() + tzOffsetMinutes + 1440) % 1440;
            const lastSentLocalHour = Math.floor(lastSentLocalMinutes / 60);
            const lastSentLocalDate = new Date(lastSentDate.getTime() + tzOffsetMinutes * 60 * 1000);
            if (
              lastSentLocalHour === localHourForDedup &&
              lastSentLocalDate.getUTCDate() === now.getUTCDate() &&
              lastSentLocalDate.getUTCMonth() === now.getUTCMonth() &&
              lastSentLocalDate.getUTCFullYear() === now.getUTCFullYear()
            ) {
              results.push({ userId: user.id, type: reminderType, success: false, skipped: "already sent this hour" });
              continue;
            }
          }

          // ── Send the push! (pass localHour so getBody can generate right greeting)
          if (user.pushSubscription) {
            // Override sendReminderPush to use localHour for body generation
            const success = await sendPushNotification(user.pushSubscription, {
              title: config.title,
              body: config.getBody(localHour),
              tag: config.getTag(localHour),
              url: config.url,
            });
            if (success) {
              // Record the send time for dedup
              lastSent[reminderType] = now.toISOString();
            }
            results.push({ userId: user.id, type: reminderType, success });
          }
        }

        // Persist updated lastReminderSent for this user
        await db.user.update({
          where: { id: user.id },
          data: { lastReminderSent: lastSent },
        }).catch((e) => {
          console.error(`Failed to update lastReminderSent for user ${user.id}:`, e);
        });
      }

      const sentCount = results.filter((r) => r.success).length;
      const skippedCount = results.filter((r) => r.skipped).length;

      return Response.json({
        success: true,
        mode: "cron",
        hour,
        minute,
        totalUsers: users.length,
        remindersSent: sentCount,
        remindersSkipped: skippedCount,
        results,
        message: `Sent ${sentCount} reminders, skipped ${skippedCount} (${users.length} users with subscriptions)`,
      });
    }

    // ─── NORMAL USER MODE ─────────────────────────
    const user = await db.user.findUnique({
      where: { id: userId! },
      select: { pushSubscription: true },
    });

    if (!user?.pushSubscription) {
      return Response.json({ error: "No push subscription", sent: [] });
    }

    if (type && VALID_TYPES.includes(type as ReminderType)) {
      const sent = await sendReminderPush(user.pushSubscription, type as ReminderType);
      return Response.json({ success: true, sent: [{ type, success: sent }] });
    }

    return Response.json({ success: true, sent: [] });
  } catch (error) {
    console.error("Failed to process reminders:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process reminders" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
