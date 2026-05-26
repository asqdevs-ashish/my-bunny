import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/web-push";

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
    getBody: () => "How are you feeling this afternoon, baby? Tap to tell me!",
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

/**
 * POST /api/push/remind
 * Body: { type: "water" | "love" | "meal" | "mood" }
 * Called from client-side when the app is open and a reminder fires.
 * Sends server-side Web Push for background delivery on mobile.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { type } = await req.json();
    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid reminder type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { pushSubscription: true },
    });

    if (!user?.pushSubscription) {
      return new Response(
        JSON.stringify({ error: "No push subscription found. Enable notifications first." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sent = await sendReminderPush(user.pushSubscription, type as ReminderType);

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
      // and send due reminders based on current time
      const allUsers = await db.user.findMany({
        select: { id: true, pushSubscription: true },
      });
      // Only include users with a valid push subscription
      const users = allUsers.filter(
        (u): u is { id: string; pushSubscription: object } =>
          u.pushSubscription !== null && typeof u.pushSubscription === "object"
      );

      const hour = new Date().getHours();
      const results: { userId: string; type: string; success: boolean }[] = [];

      for (const user of users) {
        for (const reminderType of VALID_TYPES) {
          const config = REMINDER_CONFIG[reminderType];
          // Only send if current hour matches reminder schedule
          if (config.hours.includes(hour) && user.pushSubscription) {
            const success = await sendReminderPush(
              user.pushSubscription,
              reminderType
            );
            results.push({ userId: user.id, type: reminderType, success });
          }
        }
      }

      return Response.json({
        success: true,
        mode: "cron",
        hour,
        remindersSent: results.filter((r) => r.success).length,
        results,
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
