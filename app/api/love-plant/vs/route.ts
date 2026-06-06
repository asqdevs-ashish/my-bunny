import { prisma } from "@/lib/prisma";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";
import { getApiUser } from "@/lib/api-auth";
import { MAX_WATER_GLASSES } from "@/lib/constants";

export interface VsCompareEntry {
  current: number;
  goal: number;
  score: number; // 0-100%
  label: string;
}

export interface VsPartnerData {
  id: string;
  name: string;
  today: {
    water: VsCompareEntry;
    meals: VsCompareEntry;
    mood: { mood: string; emoji: string; label: string } | null;
    overall: number; // 0-100
  };
  week: {
    water: number;
    meals: number;
  };
  lifetime: {
    water: number;
    meals: number;
  };
}

export interface VsResponse {
  you: VsPartnerData;
  partner: VsPartnerData;
  categories: Array<{
    key: string;
    label: string;
    icon: string;
    winner: "you" | "partner" | "tie";
    yourScore: number;
    partnerScore: number;
    yourDisplay: string;
    partnerDisplay: string;
  }>;
  overallWinner: "you" | "partner" | "tie";
  overallYourScore: number;
  overallPartnerScore: number;
}

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "Happy" },
  stressed: { emoji: "😰", label: "Stressed" },
  tired: { emoji: "😴", label: "Tired" },
  productive: { emoji: "💪", label: "Productive" },
};

async function computePartnerVsData(
  userId: string,
  name: string,
  todayStart: Date,
  todayEnd: Date,
  weekStart: Date
): Promise<VsPartnerData> {
  const db = prisma;
  if (!db) {
    return {
      id: userId,
      name,
      today: {
        water: { current: 0, goal: MAX_WATER_GLASSES, score: 0, label: "Water" },
        meals: { current: 0, goal: 3, score: 0, label: "Meals" },
        mood: null,
        overall: 0,
      },
      week: { water: 0, meals: 0 },
      lifetime: { water: 0, meals: 0 },
    };
  }

  // Today's data
  const [waterLog, mealLogs, todayMood] = await Promise.all([
    db.waterLog.findUnique({
      where: { userId_date: { userId, date: todayStart } },
    }),
    db.mealLog.findMany({
      where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    db.userMood.findFirst({
      where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const waterCurrent = waterLog?.count || 0;
  const mealsCurrent = mealLogs.length;
  const waterScore = Math.min((waterCurrent / MAX_WATER_GLASSES) * 100, 100);
  const mealScore = Math.min((mealsCurrent / 3) * 100, 100);
  const overall = Math.round((waterScore + mealScore) / 2);

  // Week data
  const weekMeals = await db.mealLog.count({
    where: { userId, createdAt: { gte: weekStart, lte: todayEnd } },
  });
  const weekWaterLogs = await db.waterLog.findMany({
    where: { userId, date: { gte: weekStart } },
  });
  const weekWater = weekWaterLogs.reduce((sum, l) => sum + l.count, 0);

  // Lifetime data
  const [lifetimeWaterAgg, lifetimeMeals] = await Promise.all([
    db.waterLog.aggregate({ where: { userId }, _sum: { count: true } }),
    db.mealLog.count({ where: { userId } }),
  ]);

  const moodData = todayMood
    ? MOOD_MAP[todayMood.mood] || { emoji: "💭", label: todayMood.mood }
    : null;

  return {
    id: userId,
    name,
    today: {
      water: { current: waterCurrent, goal: MAX_WATER_GLASSES, score: Math.round(waterScore), label: "Water" },
      meals: { current: mealsCurrent, goal: 3, score: Math.round(mealScore), label: "Meals" },
      mood: todayMood ? { mood: todayMood.mood, ...moodData! } : null,
      overall,
    },
    week: { water: weekWater, meals: weekMeals },
    lifetime: {
      water: lifetimeWaterAgg._sum.count || 0,
      meals: lifetimeMeals,
    },
  };
}

function getWinner(
  yourScore: number,
  partnerScore: number
): "you" | "partner" | "tie" {
  if (yourScore > partnerScore) return "you";
  if (partnerScore > yourScore) return "partner";
  return "tie";
}

export async function GET(request: Request) {
  const userData = await getApiUser(request);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveOrCreateCurrentUser(userData);
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user?.partner) {
      return Response.json({
        you: null,
        partner: null,
        categories: [],
        overallWinner: null,
        overallYourScore: 0,
        overallPartnerScore: 0,
        linked: false,
      });
    }

    const partner = user.partner;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [you, partnerData] = await Promise.all([
      computePartnerVsData(currentUser.id, currentUser.name || "You", todayStart, todayEnd, weekStart),
      computePartnerVsData(partner.id, partner.name || "Partner", todayStart, todayEnd, weekStart),
    ]);

    const categories = [
      {
        key: "water",
        label: "💧 Water Today",
        icon: "💧",
        winner: getWinner(you.today.water.score, partnerData.today.water.score),
        yourScore: you.today.water.score,
        partnerScore: partnerData.today.water.score,
        yourDisplay: `${you.today.water.current}/${you.today.water.goal}`,
        partnerDisplay: `${partnerData.today.water.current}/${partnerData.today.water.goal}`,
      },
      {
        key: "meals",
        label: "🍽️ Meals Today",
        icon: "🍽️",
        winner: getWinner(you.today.meals.score, partnerData.today.meals.score),
        yourScore: you.today.meals.score,
        partnerScore: partnerData.today.meals.score,
        yourDisplay: `${you.today.meals.current}/${you.today.meals.goal}`,
        partnerDisplay: `${partnerData.today.meals.current}/${partnerData.today.meals.goal}`,
      },
      {
        key: "week_water",
        label: "📊 Water (7d)",
        icon: "📊",
        winner: getWinner(you.week.water, partnerData.week.water),
        yourScore: Math.min((you.week.water / (MAX_WATER_GLASSES * 7)) * 100, 100),
        partnerScore: Math.min((partnerData.week.water / (MAX_WATER_GLASSES * 7)) * 100, 100),
        yourDisplay: `${you.week.water}`,
        partnerDisplay: `${partnerData.week.water}`,
      },
      {
        key: "week_meals",
        label: "📊 Meals (7d)",
        icon: "📊",
        winner: getWinner(you.week.meals, partnerData.week.meals),
        yourScore: Math.min((you.week.meals / 21) * 100, 100),
        partnerScore: Math.min((partnerData.week.meals / 21) * 100, 100),
        yourDisplay: `${you.week.meals}`,
        partnerDisplay: `${partnerData.week.meals}`,
      },
      {
        key: "lifetime_water",
        label: "🏆 Total Water",
        icon: "🏆",
        winner: getWinner(you.lifetime.water, partnerData.lifetime.water),
        yourScore: Math.min((you.lifetime.water / 200) * 100, 100),
        partnerScore: Math.min((partnerData.lifetime.water / 200) * 100, 100),
        yourDisplay: `${you.lifetime.water}`,
        partnerDisplay: `${partnerData.lifetime.water}`,
      },
      {
        key: "lifetime_meals",
        label: "🏆 Total Meals",
        icon: "🏆",
        winner: getWinner(you.lifetime.meals, partnerData.lifetime.meals),
        yourScore: Math.min((you.lifetime.meals / 100) * 100, 100),
        partnerScore: Math.min((partnerData.lifetime.meals / 100) * 100, 100),
        yourDisplay: `${you.lifetime.meals}`,
        partnerDisplay: `${partnerData.lifetime.meals}`,
      },
    ];

    const overallWinner = getWinner(you.today.overall, partnerData.today.overall);

    const response: VsResponse = {
      you,
      partner: partnerData,
      categories,
      overallWinner,
      overallYourScore: you.today.overall,
      overallPartnerScore: partnerData.today.overall,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Failed to fetch VS data:", error);
    return new Response("Failed to fetch VS data", { status: 500 });
  }
}
