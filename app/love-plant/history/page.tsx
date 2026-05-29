import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { LovePlantHistory } from "@/components/love-plant-history";
import { Card, CardContent } from "@/components/ui/card";
import { Sprout, TrendingUp, Heart, LayoutDashboard } from "lucide-react";

export default async function LovePlantHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 dark:from-[#0a1a0f] dark:via-[#0d1f12] dark:to-[#1a1a0a] shadow-xl shadow-emerald-200/30 dark:shadow-emerald-900/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/10 via-transparent to-amber-200/10 dark:from-emerald-500/5 dark:via-transparent dark:to-amber-500/5 animate-gradient" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full bg-emerald-200/40 dark:bg-emerald-500/10 blur-3xl animate-float" />
            <div className="absolute -bottom-10 -left-10 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>
          <CardContent className="relative p-4 sm:p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    Love Plant History 📈
                  </h1>
                </div>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
                  Track your love plant&apos;s growth over the past 30 days. See trends, streaks, and
                  how your teamwork has evolved! 💕
                </p>
              </div>
              <div className="hidden md:flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-400 dark:from-emerald-500 dark:to-green-600 shadow-lg shadow-emerald-300/30 dark:shadow-emerald-800/30 animate-float">
                <Heart className="h-7 w-7 lg:h-8 lg:w-8 text-white" fill="currentColor" />
              </div>
            </div>

            {/* Quick info badges */}
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 shadow-sm">
                <Sprout className="h-3 w-3" />
                30-Day View
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 shadow-sm">
                <TrendingUp className="h-3 w-3" />
                Daily Snapshots
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Chart */}
        <LovePlantHistory />

        {/* Back links */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="/love-plant"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <Sprout className="h-3.5 w-3.5" />
            Back to Garden
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
