import { prisma } from "@/lib/prisma";
import { triggerCompetitionEvent } from "@/lib/pusher-server";

/** Get Monday midnight of the current week */
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const BADGE_TITLES: Record<number, string> = {
  1: "🥇 Gold Champions",
  2: "🥈 Silver Champions",
  3: "🥉 Bronze Champions",
};

const BADGE_COLORS: Record<number, string> = {
  1: "from-yellow-400 to-amber-500",
  2: "from-gray-300 to-gray-400",
  3: "from-amber-600 to-amber-700",
};

export interface BadgeInfo {
  rank: number;
  title: string;
  color: string;
  weekOf: string;
  coupleKey: string;
}

/**
 * GET /api/competition/badges
 * Returns badges awarded this week
 */
export async function GET() {
  try {
    const db = prisma;
    if (!db) return Response.json({ badges: [] });

    const weekStart = getWeekStart();
    const badges = await db.competitionBadge.findMany({
      where: { weekOf: weekStart },
      orderBy: { rank: "asc" },
    });

    return Response.json({
      badges: badges.map((b) => ({
        rank: b.rank,
        title: b.title,
        color: BADGE_COLORS[b.rank] || "from-amber-400 to-yellow-400",
        weekOf: b.weekOf.toISOString(),
        coupleKey: b.coupleKey,
      })),
    });
  } catch (error) {
    console.error("Badges fetch error:", error);
    return Response.json({ badges: [] });
  }
}

/**
 * POST /api/competition/badges
 * Calculate and award badges to top 3 couples for this week
 * (Called periodically or manually)
 */
export async function POST() {
  try {
    const db = prisma;
    if (!db) return Response.json({ error: "DB not available" }, { status: 500 });

    const competition = await db.competition.findFirst({
      where: { isActive: true },
    });

    if (!competition) {
      return Response.json({ error: "No active competition" }, { status: 400 });
    }

    // Get all teams that have joined
    const couples = await db.competitionCouple.findMany({
      where: {
        competitionId: competition.id,
        teamName: { not: null },
        user1Agreed: true,
        user2Agreed: true,
      },
    });

    if (couples.length < 3) {
      return Response.json({ error: "Need at least 3 teams to award badges" }, { status: 400 });
    }

    // Calculate scores for each couple
    type CoupleScore = { coupleKey: string; health: number; streak: number; achievementCount: number };
    const scores: CoupleScore[] = [];

    for (const couple of couples) {
      const lovePlant = await db.lovePlant.findUnique({
        where: { coupleKey: couple.coupleKey },
        include: {
          dailySnapshots: { orderBy: { date: "desc" }, take: 365 },
          achievements: true,
        },
      });

      if (!lovePlant) continue;

      const latestSnapshot = lovePlant.dailySnapshots[0];
      const health = latestSnapshot?.health ?? 0;

      let streak = 0;
      for (const snap of lovePlant.dailySnapshots) {
        if (snap.health > 0) streak++;
        else break;
      }

      scores.push({
        coupleKey: couple.coupleKey,
        health,
        streak,
        achievementCount: lovePlant.achievements.length,
      });
    }

    if (scores.length < 3) {
      return Response.json({ error: "Need at least 3 couples with active love plants" }, { status: 400 });
    }

    // Sort by health > streak > achievements
    scores.sort((a, b) => {
      if (b.health !== a.health) return b.health - a.health;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.achievementCount - a.achievementCount;
    });

    // Award badges to top 3
    const weekStart = getWeekStart();
    const awardedBadges: BadgeInfo[] = [];

    for (let i = 0; i < 3; i++) {
      const { coupleKey } = scores[i];
      const rank = i + 1;

      // Upsert badge (replace if already awarded for this week)
      await db.competitionBadge.upsert({
        where: { coupleKey_weekOf: { coupleKey, weekOf: weekStart } },
        update: { rank, title: BADGE_TITLES[rank] },
        create: {
          coupleKey,
          rank,
          title: BADGE_TITLES[rank],
          weekOf: weekStart,
        },
      });

      awardedBadges.push({
        rank,
        title: BADGE_TITLES[rank],
        color: BADGE_COLORS[rank],
        weekOf: weekStart.toISOString(),
        coupleKey,
      });
    }

    // Broadcast that badges were updated
    await triggerCompetitionEvent("badges-updated", { badges: awardedBadges });

    return Response.json({ badges: awardedBadges });
  } catch (error) {
    console.error("Badges award error:", error);
    return Response.json({ error: "Failed to award badges" }, { status: 500 });
  }
}
