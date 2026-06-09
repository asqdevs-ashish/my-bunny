import { prisma } from "@/lib/prisma";

export interface LeaderboardEntry {
  rank: number;
  coupleKey: string;
  teamName: string | null;
  teamImage: string | null;
  name1: string | null;
  name2: string | null;
  user1Name: string;
  user2Name: string;
  user1Image: string | null;
  user2Image: string | null;
  health: number;
  streak: number;
  stage: string;
  achievementCount: number;
  user1Id: string;
  user2Id: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalCouples: number;
}

function getStage(health: number): string {
  if (health >= 80) return "FLOWER";
  if (health >= 50) return "PLANT";
  if (health >= 20) return "SPROUT";
  return "SEED";
}

export async function GET() {
  try {
    const db = prisma;
    if (!db) {
      return Response.json({ entries: [], totalCouples: 0 });
    }

    // Find active competition
    const competition = await db.competition.findFirst({
      where: { isActive: true },
    });

    if (!competition) {
      return Response.json({ entries: [], totalCouples: 0 });
    }

    // Get all couples in competition
    const couples = await db.competitionCouple.findMany({
      where: {
        competitionId: competition.id,
        teamName: { not: null },
        user1Agreed: true,
        user2Agreed: true,
      },
    });

    if (couples.length === 0) {
      return Response.json({ entries: [], totalCouples: 0 });
    }

    // For each couple, get their love plant health data
    const entries: LeaderboardEntry[] = [];

    for (const couple of couples) {
      const { coupleKey } = couple;

      // Get love plant data
      const lovePlant = await db.lovePlant.findUnique({
        where: { coupleKey },
        include: {
          dailySnapshots: {
            orderBy: { date: "desc" },
            take: 365,
          },
          achievements: true,
          user1: { select: { name: true, id: true, image: true } },
          user2: { select: { name: true, id: true, image: true } },
        },
      });

      if (!lovePlant) continue;

      // Calculate current health from most recent snapshot
      const latestSnapshot = lovePlant.dailySnapshots[0];
      const health = latestSnapshot?.health ?? 0;

      // Calculate streak (consecutive days with health > 0)
      let streak = 0;
      for (const snap of lovePlant.dailySnapshots) {
        if (snap.health > 0) streak++;
        else break;
      }

      entries.push({
        rank: 0, // Will be calculated after sorting
        coupleKey,
        teamName: couple.teamName,
        teamImage: couple.teamImage,
        name1: couple.nameSuggestedByUser1,
        name2: couple.nameSuggestedByUser2,
        user1Name: lovePlant.user1.name,
        user2Name: lovePlant.user2.name,
        user1Image: lovePlant.user1.image,
        user2Image: lovePlant.user2.image,
        user1Id: lovePlant.user1.id,
        user2Id: lovePlant.user2.id,
        health,
        streak,
        stage: getStage(health),
        achievementCount: lovePlant.achievements.length,
      });
    }

    // Sort: health desc, then streak desc, then achievements desc
    entries.sort((a, b) => {
      if (b.health !== a.health) return b.health - a.health;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.achievementCount - a.achievementCount;
    });

    // Assign ranks
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    return Response.json({ entries, totalCouples: entries.length });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return Response.json({ entries: [], totalCouples: 0 });
  }
}
