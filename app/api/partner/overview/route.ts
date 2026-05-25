import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveCurrentUser(session.user);
    if (!currentUser) {
      return Response.json({ linked: false, partner: null });
    }

    // Find current user with partner info
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user || !user.partner) {
      return Response.json({ linked: false, partner: null });
    }

    const partner = user.partner;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch partner's today data in parallel
    const [todayMeals, todayMood, waterLog] = await Promise.all([
      db.mealLog.findMany({
        where: {
          userId: partner.id,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.userMood.findFirst({
        where: {
          userId: partner.id,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.waterLog.findUnique({
        where: {
          userId_date: {
            userId: partner.id,
            date: todayStart,
          },
        },
      }),
    ]);

    return Response.json({
      linked: true,
      partnerSince: user.partnerSince,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        today: {
          meals: todayMeals.map((m) => ({
            id: m.id,
            mealName: m.mealName,
            isOutside: m.isOutside,
            cost: m.cost,
            createdAt: m.createdAt,
          })),
          mood: todayMood
            ? { mood: todayMood.mood, note: todayMood.note }
            : null,
          waterGlasses: waterLog?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch partner overview:", error);
    return new Response("Failed to fetch partner overview", { status: 500 });
  }
}
