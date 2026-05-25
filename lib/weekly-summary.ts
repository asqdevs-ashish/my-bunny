import { prisma } from "@/lib/prisma";

export interface WeeklySummaryData {
  period: { from: string; to: string };
  meals: {
    total: number;
    home: number;
    outside: number;
    totalSpent: number;
    uniqueMealsCount: number;
    mealsByDay: Record<string, number>;
  };
  moods: {
    total: number;
    counts: Record<string, number>;
    topMood: string;
    topMoodCount: number;
  };
}

/**
 * Fetch weekly summary for a given user.
 * Returns the last 7 days of meal and mood data with aggregated stats.
 */
export async function getWeeklySummaryForUser(userId: string): Promise<WeeklySummaryData | null> {
  const db = prisma;
  if (!db) return null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  try {
    const [meals, moods] = await Promise.all([
      db.mealLog.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo, lte: today },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.userMood.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo, lte: today },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalMeals = meals.length;
    const homeMeals = meals.filter((m) => !m.isOutside).length;
    const outsideMeals = meals.filter((m) => m.isOutside).length;
    const totalSpent = meals.reduce((sum, m) => sum + (m.cost || 0), 0);
    const uniqueMeals = [...new Set(meals.map((m) => m.mealName.toLowerCase()))];

    const mealsByDay: Record<string, number> = {};
    meals.forEach((m) => {
      const day = new Date(m.createdAt).toLocaleDateString("en", { weekday: "short" });
      mealsByDay[day] = (mealsByDay[day] || 0) + 1;
    });

    const moodCounts: Record<string, number> = {};
    moods.forEach((m) => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });

    let topMood = "happy";
    let topMoodCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > topMoodCount) {
        topMood = mood;
        topMoodCount = count;
      }
    });

    return {
      period: {
        from: sevenDaysAgo.toISOString(),
        to: today.toISOString(),
      },
      meals: {
        total: totalMeals,
        home: homeMeals,
        outside: outsideMeals,
        totalSpent: Math.round(totalSpent * 100) / 100,
        uniqueMealsCount: uniqueMeals.length,
        mealsByDay,
      },
      moods: {
        total: moods.length,
        counts: moodCounts,
        topMood,
        topMoodCount,
      },
    };
  } catch {
    return null;
  }
}
