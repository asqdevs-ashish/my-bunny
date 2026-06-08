"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACHIEVEMENT_META,
  STAGE_META,
  type AchievementType,
  type PlantStage,
  type Achievement,
} from "@/hooks/use-love-plant";
import {
  Trophy,
  Sprout,
  Flower2,
  Flame,
  Star,
  Droplets,
  UtensilsCrossed,
  Loader2,
  Sparkles,
  Heart,
  Award,
  LayoutDashboard,
  TrendingUp,
  Check,
  Lock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Achievement data with unlock criteria ───────────────────
interface AchievementInfo {
  type: AchievementType;
  icon: React.ElementType;
  emoji: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  criteria: string;
  gradient: string;
}

const ACHIEVEMENTS_INFO: AchievementInfo[] = [
  {
    type: "first_bloom",
    icon: Flower2,
    emoji: "🌸",
    label: "First Bloom",
    description: "Your love plant bloomed for the first time!",
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/30 border-pink-200/50 dark:border-pink-800/30",
    criteria: "Reach FLOWER stage (76%+ health)",
    gradient: "from-pink-400 to-rose-300",
  },
  {
    type: "three_day_streak",
    icon: Flame,
    emoji: "🔥",
    label: "3-Day Streak",
    description: "3 days of caring together!",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/30 border-orange-200/50 dark:border-orange-800/30",
    criteria: "Both partners log water & meals for 3 days straight",
    gradient: "from-orange-400 to-amber-400",
  },
  {
    type: "seven_day_streak",
    icon: Star,
    emoji: "💫",
    label: "7-Day Streak",
    description: "A whole week of love and care!",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/50 dark:border-yellow-800/30",
    criteria: "Both partners log water & meals for 7 days straight",
    gradient: "from-yellow-400 to-amber-300",
  },
  {
    type: "perfect_week",
    icon: Trophy,
    emoji: "🌟",
    label: "Perfect Week",
    description: "Perfect health for 7 days straight!",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30",
    criteria: "Maintain 90%+ health for 7 consecutive days",
    gradient: "from-emerald-400 to-green-300",
  },
  {
    type: "water_warriors",
    icon: Droplets,
    emoji: "💧",
    label: "Water Warriors",
    description: "100 glasses of water logged together!",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/30",
    criteria: "Log 100 glasses of water combined",
    gradient: "from-blue-400 to-cyan-300",
  },
  {
    type: "meal_masters",
    icon: UtensilsCrossed,
    emoji: "🍽️",
    label: "Meal Masters",
    description: "50 meals logged together!",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30",
    criteria: "Log 50 meals combined",
    gradient: "from-amber-400 to-orange-300",
  },
];

// ─── Achievement Card ────────────────────────────────────────
function AchievementCard({
  info,
  isUnlocked,
  awardedAt,
  isNew,
}: {
  info: AchievementInfo;
  isUnlocked: boolean;
  awardedAt: string | null;
  isNew: boolean;
}) {
  const Icon = info.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 transition-all duration-300",
        isUnlocked
          ? `${info.bgColor} hover:shadow-lg hover:scale-[1.02]`
          : "bg-card/50 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50",
        isNew && "animate-bounce-in"
      )}
    >
      {/* Gradient overlay for unlocked */}
      {isUnlocked && (
        <div className={cn(
          "absolute inset-0 opacity-5",
          `bg-gradient-to-br ${info.gradient}`
        )} />
      )}

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon container */}
          <div className={cn(
            "relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
            isUnlocked
              ? `bg-gradient-to-br ${info.gradient} shadow-lg`
              : "bg-muted/50"
          )}>
            {isUnlocked ? (
              <>
                <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                {isNew && (
                  <span className="absolute -top-1 -right-1 h-4 w-4">
                    <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping" />
                    <span className="absolute inset-0 rounded-full bg-yellow-400" />
                  </span>
                )}
              </>
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground/50" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className={cn(
                "text-sm sm:text-base font-semibold",
                isUnlocked ? "text-foreground" : "text-muted-foreground/70"
              )}>
                {info.emoji} {info.label}
              </h3>
              {isUnlocked && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  <Check className="h-2.5 w-2.5" />
                  Done
                </span>
              )}
            </div>

            <p className={cn(
              "text-xs leading-relaxed",
              isUnlocked ? "text-foreground/80" : "text-muted-foreground/50"
            )}>
              {info.description}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Target className={cn(
                "h-3 w-3",
                isUnlocked ? "text-muted-foreground" : "text-muted-foreground/40"
              )} />
              <span className={cn(
                "text-[10px]",
                isUnlocked ? "text-muted-foreground" : "text-muted-foreground/40"
              )}>
                {info.criteria}
              </span>
            </div>

            {isUnlocked && awardedAt && (
              <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                Unlocked on {new Date(awardedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stage Progress ──────────────────────────────────────────
function StageProgress({ stage, health }: { stage: PlantStage; health: number }) {
  const stages: PlantStage[] = ["SEED", "SPROUT", "PLANT", "FLOWER"];
  const currentIndex = stages.indexOf(stage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Plant Evolution</span>
        <span className="text-[10px] font-medium text-muted-foreground">{health}% health</span>
      </div>
      <div className="flex items-center gap-1">
        {stages.map((s, i) => {
          const meta = STAGE_META[s];
          const isReached = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all duration-500",
                isReached
                  ? `bg-gradient-to-br ${meta.color} text-white shadow-md`
                  : "bg-muted/50 text-muted-foreground/40",
                isCurrent && "ring-2 ring-offset-2 ring-offset-background ring-rose-400 animate-pulse-soft"
              )}>
                <span>{meta.emoji}</span>
              </div>
              <span className={cn(
                "text-[8px] font-medium",
                isReached ? "text-foreground" : "text-muted-foreground/40"
              )}>
                {meta.label.split(" ")[0]}
              </span>
              {i < stages.length - 1 && (
                <div className={cn(
                  "h-0.5 w-full -mt-1",
                  i < currentIndex ? "bg-gradient-to-r from-emerald-400 to-green-400" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function LovePlantAchievements() {
  const [plantData, setPlantData] = useState<{
    stage: PlantStage;
    health: number;
    achievements: Achievement[];
    newAchievements: AchievementType[];
    streak: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/love-plant");
        if (res.ok) {
          const json = await res.json();
          setPlantData(json);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Count unlocked achievements
  const unlockedTypes = new Set(plantData?.achievements.map((a) => a.type) || []);
  const unlockedCount = unlockedTypes.size;
  const totalCount = ACHIEVEMENTS_INFO.length;

  return (
    <div className="space-y-4 sm:space-y-6">
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
                  Love Plant Achievements 🏆
                </h1>
              </div>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
                Track your achievements and milestones as you grow your love plant together!
                Each achievement unlocks as you and your partner care for your plant. 💕
              </p>
            </div>
            <div className="hidden md:flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-400 dark:from-amber-500 dark:to-yellow-500 shadow-lg shadow-amber-300/30 dark:shadow-amber-800/30 animate-float">
              <Award className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 shadow-sm">
              <Trophy className="h-3 w-3" />
              {unlockedCount}/{totalCount} Unlocked
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-rose-600 dark:text-rose-400 shadow-sm">
              <Heart className="h-3 w-3" fill="currentColor" />
              Teamwork makes the dream work
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
            href="/love-plant/history"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            History
          </Link>
          <Link
            href="/love-plant/achievements"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm"
          >
            <Trophy className="h-3.5 w-3.5" />
            Achievements
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

      {/* Progress Overview */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="overflow-hidden border-0 shadow-lg shadow-amber-200/20 dark:shadow-amber-900/10">
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-xl font-bold text-amber-500 tabular-nums">{unlockedCount}/{totalCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Achievements</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-200/20 dark:shadow-emerald-900/10">
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-xl font-bold text-emerald-500 tabular-nums">{plantData?.health || 0}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plant Health</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg shadow-orange-200/20 dark:shadow-orange-900/10">
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-xl font-bold text-orange-500 tabular-nums">{plantData?.streak || 0}d</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg shadow-rose-200/20 dark:shadow-rose-900/10">
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-xl font-bold text-rose-500 tabular-nums">
                  {plantData ? STAGE_META[plantData.stage].emoji : "🌱"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stage</p>
              </CardContent>
            </Card>
          </div>

          {/* Stage Progress */}
          {plantData && (
            <Card>
              <CardContent className="p-4 sm:p-5">
                <StageProgress stage={plantData.stage} health={plantData.health} />
              </CardContent>
            </Card>
          )}

          {/* New Achievements Banner */}
          {plantData?.newAchievements && plantData.newAchievements.length > 0 && (
            <div className="animate-bounce-in rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800/50 p-3 sm:p-4 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                <Trophy className="h-6 w-6 text-amber-500 animate-bounce" />
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <p className="text-sm sm:text-base font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                🎉 New Achievement{plantData.newAchievements.length > 1 ? "s" : ""} Unlocked!
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {plantData.newAchievements.map((t) => {
                  const meta = ACHIEVEMENT_META[t];
                  return (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      {meta.emoji} {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Achievements List */}
          <div className="grid gap-3 sm:gap-4">
            {ACHIEVEMENTS_INFO.map((info) => {
              const achievement = plantData?.achievements.find(
                (a) => a.type === info.type
              );
              const isUnlocked = !!achievement;
              const isNew = plantData?.newAchievements?.includes(info.type) || false;

              return (
                <AchievementCard
                  key={info.type}
                  info={info}
                  isUnlocked={isUnlocked}
                  awardedAt={achievement?.awardedAt || null}
                  isNew={isNew}
                />
              );
            })}
          </div>

          {/* Motivation */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 dark:from-rose-900/20 dark:to-amber-900/20 px-3 py-1.5 text-[11px] font-medium text-foreground/80 shadow-sm">
              <Heart className="h-3.5 w-3.5 text-rose-400" fill="currentColor" />
              {unlockedCount === totalCount
                ? "All achievements unlocked! You're the ultimate couple! 👑✨"
                : `${totalCount - unlockedCount} more to go! Keep nurturing your love plant! 🌱💕`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
