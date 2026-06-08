import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LovePlantAchievements } from "./client";

export const dynamic = "force-dynamic";

export default async function LovePlantAchievementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
        <LovePlantAchievements />
      </main>
    </div>
  );
}
