import { prisma } from "@/lib/prisma";
import { triggerCompetitionEvent } from "@/lib/pusher-server";

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

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * GET /api/competition/award-badges
 *
 * Cron-job friendly endpoint — call this every Monday to auto-award badges.
 * Can be used with:
 *   - Vercel Cron Jobs (crons section in vercel.json)
 *   - cron-job.org (free cron service)
 *   - GitHub Actions
 *   - Any uptime monitor
 *
 * Returns: { awarded: boolean, badges: [...], message: string }
 *
 * Idempotent: if badges already awarded for this week, returns existing badges.
 */
export async function GET() {
  try {
    const db = prisma;
    if (!db) {
      return Response.json({ awarded: false, badges: [], message: "DB not available" }, { status: 500 });
    }

    const competition = await db.competition.findFirst({
      where: { isActive: true },
    });

    if (!competition) {
      return Response.json({ awarded: false, badges: [], message: "No active competition" });
    }

    const weekStart = getWeekStart();

    // Check if badges already awarded for this week (idempotent)
    const existingBadges = await db.competitionBadge.findMany({
      where: { weekOf: weekStart },
      orderBy: { rank: "asc" },
    });

    if (existingBadges.length > 0) {
      return Response.json({
        awarded: false,
        badges: existingBadges.map((b) => ({
          rank: b.rank,
          title: b.title,
          color: BADGE_COLORS[b.rank] || "from-amber-400 to-yellow-400",
          weekOf: b.weekOf.toISOString(),
          coupleKey: b.coupleKey,
        })),
        message: "Badges already awarded for this week",
      });
    }

    // Get all teams
    const couples = await db.competitionCouple.findMany({
      where: {
        competitionId: competition.id,
        teamName: { not: null },
        user1Agreed: true,
        user2Agreed: true,
      },
    });

    if (couples.length < 3) {
      return Response.json({
        awarded: false,
        badges: [],
        message: `Only ${couples.length} teams — need at least 3 for badges`,
      });
    }

    // Calculate scores
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
      return Response.json({
        awarded: false,
        badges: [],
        message: `Only ${scores.length} active couples — need at least 3`,
      });
    }

    // Sort by health > streak > achievements
    scores.sort((a, b) => {
      if (b.health !== a.health) return b.health - a.health;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.achievementCount - a.achievementCount;
    });

    // Award badges to top 3
    const awardedBadges: Array<{
      rank: number;
      title: string;
      color: string;
      weekOf: string;
      coupleKey: string;
    }> = [];

    for (let i = 0; i < 3; i++) {
      const { coupleKey } = scores[i];
      const rank = i + 1;

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

    // Broadcast to all users
    await triggerCompetitionEvent("badges-updated", { badges: awardedBadges });

    return Response.json({
      awarded: true,
      badges: awardedBadges,
      message: `🏅 Badges awarded! Top 3 couples got weekly badges.`,
    });
  } catch (error) {
    console.error("Auto-award badges error:", error);
    return Response.json({ awarded: false, badges: [], message: "Internal error" }, { status: 500 });
  }
}
