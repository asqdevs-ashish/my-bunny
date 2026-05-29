import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { MAX_WATER_GLASSES } from "@/lib/constants";
import { sendPushNotification } from "@/lib/web-push";

// ─── Constants ────────────────────────────────────────────────
const MEAL_GOAL = 3;
const HEALTH_RANGE = { min: 0, max: 100 };

export type PlantStage = "SEED" | "SPROUT" | "PLANT" | "FLOWER";

export type AchievementType =
  | "first_bloom"
  | "three_day_streak"
  | "seven_day_streak"
  | "perfect_week"
  | "water_warriors"
  | "meal_masters";

export const ACHIEVEMENT_META: Record<
  AchievementType,
  { label: string; emoji: string; description: string }
> = {
  first_bloom: {
    label: "First Bloom",
    emoji: "🌸",
    description: "Your love plant bloomed for the first time!",
  },
  three_day_streak: {
    label: "3-Day Streak",
    emoji: "🔥",
    description: "3 days of caring together!",
  },
  seven_day_streak: {
    label: "7-Day Streak",
    emoji: "💫",
    description: "A whole week of love and care!",
  },
  perfect_week: {
    label: "Perfect Week",
    emoji: "🌟",
    description: "Perfect health for 7 days straight!",
  },
  water_warriors: {
    label: "Water Warriors",
    emoji: "💧",
    description: "100 glasses of water logged together!",
  },
  meal_masters: {
    label: "Meal Masters",
    emoji: "🍽️",
    description: "50 meals logged together!",
  },
};

function getStage(health: number): PlantStage {
  if (health >= 76) return "FLOWER";
  if (health >= 51) return "PLANT";
  if (health >= 26) return "SPROUT";
  return "SEED";
}

interface PartnerProgress {
  water: { current: number; goal: number };
  meals: { current: number; goal: number };
  score: number;
}

interface LovePlantResponse {
  stage: PlantStage;
  health: number;
  userProgress: PartnerProgress;
  partnerProgress: PartnerProgress;
  combinedScore: number;
  coupleKey: string | null;
  streak: number;
  achievements: Array<{ type: AchievementType; awardedAt: string }>;
  newAchievements: AchievementType[];
  updatedAt: string;
}

// ─── Helper: compute a partner's daily progress ───────────────
async function computePartnerProgress(
  userId: string,
  todayStart: Date,
  todayEnd: Date
): Promise<PartnerProgress> {
  const db = prisma;
  if (!db) {
    return { water: { current: 0, goal: MAX_WATER_GLASSES }, meals: { current: 0, goal: MEAL_GOAL }, score: 0 };
  }

  const [waterLog, mealLogs] = await Promise.all([
    db.waterLog.findUnique({
      where: { userId_date: { userId, date: todayStart } },
    }),
    db.mealLog.findMany({
      where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
    }),
  ]);

  const water = { current: waterLog?.count || 0, goal: MAX_WATER_GLASSES };
  const meals = { current: mealLogs.length, goal: MEAL_GOAL };

  const waterScore = Math.min(water.current / water.goal, 1);
  const mealScore = Math.min(meals.current / meals.goal, 1);
  const score = Math.round(((waterScore + mealScore) / 2) * 100);

  return { water, meals, score };
}

// ─── Helper: compute daily streak for both partners ──────────
async function computeStreak(
  user1Id: string,
  user2Id: string
): Promise<number> {
  const db = prisma;
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - daysAgo);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayDate = new Date(dayStart);
    dayDate.setHours(0, 0, 0, 0);

    // Check both partners had at least 1 water AND 1 meal on this day
    const [u1Water, u1Meals, u2Water, u2Meals] = await Promise.all([
      db.waterLog.findUnique({
        where: { userId_date: { userId: user1Id, date: dayDate } },
      }),
      db.mealLog.count({
        where: { userId: user1Id, createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      db.waterLog.findUnique({
        where: { userId_date: { userId: user2Id, date: dayDate } },
      }),
      db.mealLog.count({
        where: { userId: user2Id, createdAt: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    const bothActive =
      (u1Water?.count || 0) > 0 && u1Meals > 0 &&
      (u2Water?.count || 0) > 0 && u2Meals > 0;

    if (bothActive) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ─── Helper: check & award achievements ───────────────────────
async function checkAndAwardAchievements(
  coupleKey: string,
  user1Id: string,
  user2Id: string,
  currentHealth: number
): Promise<AchievementType[]> {
  const db = prisma;
  if (!db) return [];

  const newAchievements: AchievementType[] = [];
  const existing = await db.lovePlantAchievement.findMany({
    where: { coupleKey },
    select: { type: true },
  });
  const earned = new Set(existing.map((a) => a.type));

  async function award(type: AchievementType): Promise<boolean> {
    if (earned.has(type)) return false;
    try {
      await db!.lovePlantAchievement.create({
        data: { coupleKey, type },
      });
      newAchievements.push(type);
      return true;
    } catch {
      return false;
    }
  }

  // 1. First Bloom — reached FLOWER stage
  if (currentHealth >= 76) {
    await award("first_bloom");
  }

  // 2. Water Warriors — combined lifetime water glasses >= 100
  if (!earned.has("water_warriors")) {
    const [u1WaterLogs, u2WaterLogs] = await Promise.all([
      db.waterLog.aggregate({ where: { userId: user1Id }, _sum: { count: true } }),
      db.waterLog.aggregate({ where: { userId: user2Id }, _sum: { count: true } }),
    ]);
    const totalGlasses = (u1WaterLogs._sum.count || 0) + (u2WaterLogs._sum.count || 0);
    if (totalGlasses >= 100) {
      await award("water_warriors");
    }
  }

  // 3. Meal Masters — combined lifetime meals >= 50
  if (!earned.has("meal_masters")) {
    const [u1Meals, u2Meals] = await Promise.all([
      db.mealLog.count({ where: { userId: user1Id } }),
      db.mealLog.count({ where: { userId: user2Id } }),
    ]);
    if (u1Meals + u2Meals >= 50) {
      await award("meal_masters");
    }
  }

  // 4. Streak-based achievements
  const streak = await computeStreak(user1Id, user2Id);
  if (streak >= 7) {
    await award("seven_day_streak");
    // Perfect week: streak >= 7 AND check if all days had both health = 100%
    // For simplicity, award perfect_week with 7-day streak
    // (exact check would need per-day health calculation)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    let allPerfect = true;
    for (let d = 0; d < 7; d++) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - d);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const [u1W, u1M, u2W, u2M] = await Promise.all([
        db.waterLog.findUnique({ where: { userId_date: { userId: user1Id, date: day } } }),
        db.mealLog.count({ where: { userId: user1Id, createdAt: { gte: day, lte: dayEnd } } }),
        db.waterLog.findUnique({ where: { userId_date: { userId: user2Id, date: day } } }),
        db.mealLog.count({ where: { userId: user2Id, createdAt: { gte: day, lte: dayEnd } } }),
      ]);
      const u1Pct = Math.min((u1W?.count || 0) / MAX_WATER_GLASSES, 1) * 0.5 + Math.min(u1M / MEAL_GOAL, 1) * 0.5;
      const u2Pct = Math.min((u2W?.count || 0) / MAX_WATER_GLASSES, 1) * 0.5 + Math.min(u2M / MEAL_GOAL, 1) * 0.5;
      if (u1Pct < 1 || u2Pct < 1) {
        allPerfect = false;
        break;
      }
    }
    if (allPerfect) {
      await award("perfect_week");
    }
  }
  if (streak >= 3) {
    await award("three_day_streak");
  }

  return newAchievements;
}

// ─── Helper: send wilting push notification ───────────────────
async function sendWiltingAlert(
  userId: string,
  partnerId: string,
  health: number
): Promise<void> {
  const db = prisma;
  if (!db) return;

  // Only alert if health < 25
  if (health >= 25) return;

  try {
    // Get partner's push subscription
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { pushSubscription: true, name: true },
    });

    if (partner?.pushSubscription) {
      await sendPushNotification(partner.pushSubscription, {
        title: "🌱 Love Plant Wilting!",
        body: `Your love plant needs care! Only ${health}% healthy. Log water & meals together to save it! 🆘`,
        url: "/love-plant",
        tag: "love-plant-wilt",
      });
    }

    // Also send to the user themselves
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });

    if (user?.pushSubscription && user.pushSubscription !== partner?.pushSubscription) {
      await sendPushNotification(user.pushSubscription, {
        title: "🌱 Love Plant Wilting!",
        body: `Your love plant needs care! Only ${health}% healthy. Log water & meals together to save it! 🆘`,
        url: "/love-plant",
        tag: "love-plant-wilt",
      });
    }
  } catch (err) {
    console.error("Failed to send wilting alert:", err);
  }
}

// ─── GET /api/love-plant ──────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveOrCreateCurrentUser(session.user);

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user?.partner) {
      return Response.json({
        stage: "SEED" as PlantStage,
        health: 0,
        userProgress: { water: { current: 0, goal: MAX_WATER_GLASSES }, meals: { current: 0, goal: MEAL_GOAL }, score: 0 },
        partnerProgress: { water: { current: 0, goal: MAX_WATER_GLASSES }, meals: { current: 0, goal: MEAL_GOAL }, score: 0 },
        combinedScore: 0,
        coupleKey: null,
        streak: 0,
        achievements: [],
        newAchievements: [],
        updatedAt: new Date().toISOString(),
      } as LovePlantResponse);
    }

    const partner = user.partner;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Compute both partners' progress in parallel
    const [myProgress, partnerProgress] = await Promise.all([
      computePartnerProgress(currentUser.id, todayStart, todayEnd),
      computePartnerProgress(partner.id, todayStart, todayEnd),
    ]);

    const rawCombined = Math.round((myProgress.score + partnerProgress.score) / 2);
    const health = Math.max(HEALTH_RANGE.min, Math.min(HEALTH_RANGE.max, rawCombined));

    // Get or create LovePlant record (ONLY create if not exists — no upsert on every request)
    const [a, b] = [currentUser.id, partner.id].sort();
    const coupleKey = `${a}_${b}`;
    let lovePlant = await db.lovePlant.findUnique({ where: { coupleKey } });
    if (!lovePlant) {
      lovePlant = await db.lovePlant.create({
        data: { coupleKey, user1Id: a, user2Id: b },
      }).catch(() => null);
    }

    // Compute streak
    const streak = await computeStreak(currentUser.id, partner.id);

    // Fetch existing achievements
    const dbAchievements = await db.lovePlantAchievement.findMany({
      where: { coupleKey },
      orderBy: { awardedAt: "desc" },
    });

    // Check & award new achievements
    const newAchievements = lovePlant
      ? await checkAndAwardAchievements(coupleKey, currentUser.id, partner.id, health)
      : [];

    // Serialize achievements (convert Date → string)
    const serializedAchievements = dbAchievements.map((a) => ({
      type: a.type as AchievementType,
      awardedAt: a.awardedAt.toISOString(),
    }));

    // Add newly awarded achievements to the list
    for (const t of newAchievements) {
      serializedAchievements.unshift({ type: t, awardedAt: new Date().toISOString() });
    }

    // Save daily snapshot (upsert to avoid duplicates)
    if (lovePlant) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await db.lovePlantDailySnapshot.upsert({
        where: { coupleKey_date: { coupleKey, date: today } },
        update: {
          health,
          user1Water: myProgress.water.current,
          user1Meals: myProgress.meals.current,
          user2Water: partnerProgress.water.current,
          user2Meals: partnerProgress.meals.current,
        },
        create: {
          coupleKey,
          date: today,
          health,
          user1Water: myProgress.water.current,
          user1Meals: myProgress.meals.current,
          user2Water: partnerProgress.water.current,
          user2Meals: partnerProgress.meals.current,
        },
      }).catch(() => {});
    }

    // If health is wilting, send push alert (fire-and-forget)
    if (health < 25) {
      sendWiltingAlert(currentUser.id, partner.id, health).catch(() => {});
    }

    const response: LovePlantResponse = {
      stage: getStage(health),
      health,
      userProgress: myProgress,
      partnerProgress,
      combinedScore: health,
      coupleKey: lovePlant?.coupleKey || null,
      streak,
      achievements: serializedAchievements,
      newAchievements,
      updatedAt: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error) {
    console.error("Failed to fetch love plant:", error);
    return new Response("Failed to fetch love plant", { status: 500 });
  }
}

// ─── POST /api/love-plant (trigger a Pusher update) ───────────
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveOrCreateCurrentUser(session.user);
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user?.partner) {
      return Response.json({ ok: false, reason: "No partner linked" });
    }

    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, user.partner.id);
      await pusherServer.trigger(channel, "love-plant-update", {
        triggeredBy: currentUser.id,
        timestamp: new Date().toISOString(),
      }).catch((err) => console.error("Pusher trigger (love-plant) failed:", err));
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to trigger love plant update:", error);
    return new Response("Failed to trigger love plant update", { status: 500 });
  }
}
