import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Get meals from past 7 days
    const meals = await prisma.mealLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get moods from past 7 days
    const moods = await prisma.userMood.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Calculate meal stats
    const totalMeals = meals.length;
    const homeMeals = meals.filter((m) => !m.isOutside).length;
    const outsideMeals = meals.filter((m) => m.isOutside).length;
    const totalSpent = meals.reduce((sum, m) => sum + (m.cost || 0), 0);
    const uniqueMeals = [...new Set(meals.map((m) => m.mealName.toLowerCase()))];

    // Group meals by day
    const mealsByDay: Record<string, number> = {};
    meals.forEach((m) => {
      const day = new Date(m.createdAt).toLocaleDateString("en", { weekday: "short" });
      mealsByDay[day] = (mealsByDay[day] || 0) + 1;
    });

    // Mood trends
    const moodCounts: Record<string, number> = {};
    moods.forEach((m) => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });

    // Most common mood
    let topMood = "happy";
    let topMoodCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > topMoodCount) {
        topMood = mood;
        topMoodCount = count;
      }
    });

    return Response.json({
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
    });
  } catch (error) {
    console.error("Failed to fetch weekly summary:", error);
    return new Response("Failed to fetch weekly summary", { status: 500 });
  }
}
