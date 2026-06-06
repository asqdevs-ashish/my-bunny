import { CompetitionLeaderboard } from "@/components/competition-leaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Heart, Swords } from "lucide-react";
import Link from "next/link";
import { LayoutDashboard, Sprout } from "lucide-react";

export default function CompetitionPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl xl:max-w-[90rem] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-[#1a1a0a] dark:via-[#1a1a0a] dark:to-[#121212] shadow-xl shadow-amber-200/30 dark:shadow-amber-900/10">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200/10 via-transparent to-yellow-200/10 dark:from-amber-500/5 dark:via-transparent dark:to-yellow-500/5 animate-gradient" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-3xl animate-float" />
            <div className="absolute -bottom-10 -left-10 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-yellow-200/40 dark:bg-yellow-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>
          <CardContent className="relative p-4 sm:p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    Love Plant League 🏆
                  </h1>
                </div>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
                  Compete with other couples to see who has the healthiest love plant!
                  Log meals, drink water, and climb the leaderboard together! 💪
                </p>
              </div>
              <div className="hidden md:flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-400 dark:from-amber-500 dark:to-yellow-500 shadow-lg shadow-amber-300/30 dark:shadow-amber-800/30 animate-float">
                <Swords className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 shadow-sm">
                <Trophy className="h-3 w-3" />
                Healthy couple wins
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-rose-600 dark:text-rose-400 shadow-sm">
                <Heart className="h-3 w-3" fill="currentColor" />
                Both partners must join
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nav tabs */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Link
              href="/love-plant"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <Sprout className="h-3.5 w-3.5" />
              Garden
            </Link>
            <Link
              href="/competition"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm"
            >
              <Trophy className="h-3.5 w-3.5" />
              Leaderboard
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        {/* Leaderboard */}
        <div className="animate-slide-up">
          <CompetitionLeaderboard />
        </div>
      </main>
    </div>
  );
}
