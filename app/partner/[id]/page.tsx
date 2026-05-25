import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeeklySummaryForUser } from "@/lib/weekly-summary";
import { Nav } from "@/components/nav";
import { PartnerProfileClient } from "./client";

// Disable static generation — this page is dynamic per user session
export const dynamic = "force-dynamic";

export default async function PartnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: partnerId } = await params;
  const userId = session.user.id;

  const db = prisma;
  if (!db) redirect("/dashboard");

  // Verify they're actually partners
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { partner: true },
  });

  if (!user?.partner || user.partner.id !== partnerId) {
    redirect("/dashboard");
  }

  const partner = user.partner;

  // Fetch partner's full today data
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayMeals, todayMoods, waterLog] = await Promise.all([
    db.mealLog.findMany({
      where: { userId: partner.id, createdAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { createdAt: "desc" },
    }),
    db.userMood.findMany({
      where: { userId: partner.id, createdAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { createdAt: "desc" },
    }),
    db.waterLog.findUnique({
      where: { userId_date: { userId: partner.id, date: todayStart } },
    }),
  ]);

  // Fetch partner's weekly summary
  const weeklySummary = await getWeeklySummaryForUser(partner.id);

  // Serialize dates for client component
  const serializedData = {
    partner: {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      partnerSince: partner.partnerSince?.toISOString() || null,
    },
    today: {
      meals: todayMeals.map((m) => ({
        id: m.id,
        mealName: m.mealName,
        ingredients: m.ingredients,
        isOutside: m.isOutside,
        cost: m.cost,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
      })),
      moods: todayMoods.map((m) => ({
        id: m.id,
        mood: m.mood,
        note: m.note,
        createdAt: m.createdAt.toISOString(),
      })),
      waterGlasses: waterLog?.count || 0,
    },
    weeklySummary,
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-4 sm:py-6">
        <PartnerProfileClient data={serializedData} />
      </main>
    </div>
  );
}
