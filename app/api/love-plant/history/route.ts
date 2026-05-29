import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";
import { MAX_WATER_GLASSES } from "@/lib/constants";

const MEAL_GOAL = 3;

interface DayEntry {
  date: string;
  health: number;
  user1Water: number;
  user1Meals: number;
  user2Water: number;
  user2Meals: number;
  stage: "SEED" | "SPROUT" | "PLANT" | "FLOWER";
}

function getStage(health: number): DayEntry["stage"] {
  if (health >= 76) return "FLOWER";
  if (health >= 51) return "PLANT";
  if (health >= 26) return "SPROUT";
  return "SEED";
}

// ─── GET /api/love-plant/history ──────────────────────────────
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
      return Response.json({ history: [], partnerName: null });
    }

    const partner = user.partner;
    const [a, b] = [currentUser.id, partner.id].sort();
    const coupleKey = `${a}_${b}`;
    const isCurrentUserFirst = currentUser.id === a;
    const u1Id = isCurrentUserFirst ? currentUser.id : partner.id;
    const u2Id = isCurrentUserFirst ? partner.id : currentUser.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compute date range: 29 days ago → today (30 days total)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);

    // Fetch existing snapshots
    const existingSnapshots = await db.lovePlantDailySnapshot.findMany({
      where: {
        coupleKey,
        date: { gte: startDate, lte: today },
      },
      orderBy: { date: "asc" },
    });

    const snapshotsByDate = new Map(
      existingSnapshots.map((s) => [s.date.toISOString().split("T")[0], s])
    );

    const history: DayEntry[] = [];
    const missingDays: Date[] = [];

    // Walk through each day and fill in gaps
    for (let i = 0; i < 30; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dayKey = day.toISOString().split("T")[0];

      const existing = snapshotsByDate.get(dayKey);
      if (existing) {
        history.push({
          date: dayKey,
          health: existing.health,
          user1Water: existing.user1Water,
          user1Meals: existing.user1Meals,
          user2Water: existing.user2Water,
          user2Meals: existing.user2Meals,
          stage: getStage(existing.health),
        });
      } else {
        // Mark for on-the-fly computation
        missingDays.push(day);
        // Push placeholder — will be filled below
        history.push({
          date: dayKey,
          health: 0,
          user1Water: 0,
          user1Meals: 0,
          user2Water: 0,
          user2Meals: 0,
          stage: "SEED",
        });
      }
    }

    // Compute missing days in parallel (up to 30 days)
    if (missingDays.length > 0) {
      const dayComputations = missingDays.map(async (day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const [u1Water, u1Meals, u2Water, u2Meals] = await Promise.all([
          db.waterLog.findUnique({
            where: { userId_date: { userId: u1Id, date: dayStart } },
          }),
          db.mealLog.count({
            where: { userId: u1Id, createdAt: { gte: dayStart, lte: dayEnd } },
          }),
          db.waterLog.findUnique({
            where: { userId_date: { userId: u2Id, date: dayStart } },
          }),
          db.mealLog.count({
            where: { userId: u2Id, createdAt: { gte: dayStart, lte: dayEnd } },
          }),
        ]);

        const u1WaterCount = u1Water?.count || 0;
        const u2WaterCount = u2Water?.count || 0;
        const u1MealCount = u1Meals;
        const u2MealCount = u2Meals;

        const u1Score = Math.min(
          Math.round(
            (Math.min(u1WaterCount / MAX_WATER_GLASSES, 1) + Math.min(u1MealCount / MEAL_GOAL, 1)) / 2 * 100
          ), 100
        );
        const u2Score = Math.min(
          Math.round(
            (Math.min(u2WaterCount / MAX_WATER_GLASSES, 1) + Math.min(u2MealCount / MEAL_GOAL, 1)) / 2 * 100
          ), 100
        );
        const health = Math.round((u1Score + u2Score) / 2);

        // Save computed snapshot for next time
        await db.lovePlantDailySnapshot.upsert({
          where: { coupleKey_date: { coupleKey, date: dayStart } },
          update: { health, user1Water: u1WaterCount, user1Meals: u1MealCount, user2Water: u2WaterCount, user2Meals: u2MealCount },
          create: { coupleKey, date: dayStart, health, user1Water: u1WaterCount, user1Meals: u1MealCount, user2Water: u2WaterCount, user2Meals: u2MealCount },
        }).catch(() => {});

        return {
          date: dayStart.toISOString().split("T")[0],
          health,
          user1Water: u1WaterCount,
          user1Meals: u1MealCount,
          user2Water: u2WaterCount,
          user2Meals: u2MealCount,
          stage: getStage(health),
        };
      });

      const computed = await Promise.all(dayComputations);
      // Merge computed entries back into history
      const computedMap = new Map(computed.map((c) => [c.date, c]));
      for (let i = 0; i < history.length; i++) {
        const computedEntry = computedMap.get(history[i].date);
        if (computedEntry) {
          history[i] = computedEntry;
        }
      }
    }

    return Response.json({
      history,
      partnerName: partner.name || "Partner",
      myName: user.name || "You",
    });
  } catch (error) {
    console.error("Failed to fetch love plant history:", error);
    return new Response("Failed to fetch love plant history", { status: 500 });
  }
}
