import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export type NotificationType = "water" | "meal" | "love" | "mood";

export interface NotificationPreferences {
  water: boolean;
  meal: boolean;
  love: boolean;
  mood: boolean;
  /** Timezone offset in minutes from UTC (e.g. IST = 330) */
  timezoneOffset?: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  water: true,
  meal: true,
  love: true,
  mood: false,
};

/**
 * GET /api/push/preferences
 * Load notification preferences for the current user from the server.
 * Returns defaults if nothing saved yet.
 */
export async function GET(request: Request) {
  const userData = await getApiUser(request);
  if (!userData?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const user = await db.user.findUnique({
      where: { id: userData.id },
      select: { notificationPrefs: true },
    });

    const prefs = (user?.notificationPrefs as NotificationPreferences | null) ?? DEFAULT_PREFERENCES;

    return Response.json({ preferences: prefs });
  } catch (error) {
    console.error("Failed to load preferences:", error);
    return Response.json({ preferences: DEFAULT_PREFERENCES });
  }
}

/**
 * POST /api/push/preferences
 * Save notification preferences for the current user to the server.
 * Body: { preferences: { water: boolean, meal: boolean, love: boolean, mood: boolean } }
 */
export async function POST(req: Request) {
  const userData = await getApiUser(req);
  if (!userData?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const prefs = body.preferences as Partial<NotificationPreferences>;

    if (!prefs || typeof prefs !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid preferences object" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");

    // Validate each field
    const validPrefs: NotificationPreferences = {
      water: typeof prefs.water === "boolean" ? prefs.water : DEFAULT_PREFERENCES.water,
      meal: typeof prefs.meal === "boolean" ? prefs.meal : DEFAULT_PREFERENCES.meal,
      love: typeof prefs.love === "boolean" ? prefs.love : DEFAULT_PREFERENCES.love,
      mood: typeof prefs.mood === "boolean" ? prefs.mood : DEFAULT_PREFERENCES.mood,
      timezoneOffset: typeof prefs.timezoneOffset === "number" ? prefs.timezoneOffset : undefined,
    };

    await db.user.update({
      where: { id: userData.id },
      data: { notificationPrefs: validPrefs as unknown as Record<string, boolean> },
    });

    return Response.json({ preferences: validPrefs, saved: true });
  } catch (error) {
    console.error("Failed to save preferences:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save preferences" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
