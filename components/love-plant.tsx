"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useLovePlant,
  STAGE_META,
  ACHIEVEMENT_META,
  type PlantStage,
  type AchievementType,
} from "@/hooks/use-love-plant";
import {
  Heart,
  Sprout,
  Flower2,
  Droplets,
  UtensilsCrossed,
  Loader2,
  Frown,
  Sun,
  Moon,
  Sparkles,
  Trophy,
  Flame,
  Star,
  Award,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_WATER_GLASSES } from "@/lib/constants";

// ─── SVG Plant Visualizer ─────────────────────────────────────
function PlantSVG({ stage, health }: { stage: PlantStage; health: number }) {
  const isWilting = health < 25 && stage !== "SEED";
  const animationClass = isWilting ? "animate-wilt" : "animate-grow";

  return (
    <svg viewBox="0 0 200 240" className="w-full max-w-[180px] mx-auto drop-shadow-xl">
      {/* Pot */}
      <defs>
        <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#270f01" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="flowerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Pot body */}
      <path d="M60 200 L65 230 L135 230 L140 200 Z" fill="url(#potGrad)" />
      {/* Pot rim */}
      <rect x="55" y="195" width="90" height="8" rx="3" fill="#a16207" />
      {/* Soil */}
      <ellipse cx="100" cy="195" rx="38" ry="8" fill="url(#soilGrad)" />

      {/* ─── SEED Stage ─── */}
      {stage === "SEED" && (
        <g className={animationClass}>
          <ellipse cx="100" cy="185" rx="10" ry="7" fill="#92400e" />
          <path d="M100 185 Q100 165 105 155" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="108" cy="153" rx="7" ry="4" fill="#4ade80" transform="rotate(-20 108 153)" />
          <circle cx="85" cy="178" r="2" fill="#fbbf24" opacity="0.6" className="animate-ping" />
          <circle cx="118" cy="175" r="1.5" fill="#fbbf24" opacity="0.4" className="animate-ping" style={{ animationDelay: "0.5s" }} />
        </g>
      )}

      {/* ─── SPROUT Stage ─── */}
      {stage === "SPROUT" && (
        <g className={animationClass}>
          <path d="M100 195 Q95 160 100 130" stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M98 145 Q80 135 75 145 Q82 148 98 148" fill="url(#leafGrad)" opacity="0.9" />
          <path d="M102 155 Q120 142 125 152 Q118 156 102 158" fill="url(#leafGrad)" opacity="0.8" />
          <path d="M100 130 Q92 118 100 112 Q108 118 100 130" fill="#4ade80" />
          <ellipse cx="100" cy="192" rx="20" ry="4" fill="#451a03" />
        </g>
      )}

      {/* ─── PLANT Stage ─── */}
      {stage === "PLANT" && (
        <g className={animationClass}>
          <path d="M100 195 Q90 160 95 110 Q100 80 100 60" stroke="#16a34a" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M96 150 Q70 135 65 150 Q75 155 96 155" fill="url(#leafGrad)" />
          <path d="M104 140 Q130 125 135 140 Q125 145 104 145" fill="url(#leafGrad)" />
          <path d="M97 120 Q75 108 70 120 Q80 124 97 124" fill="#22c55e" />
          <path d="M103 110 Q128 98 132 112 Q122 116 103 116" fill="#22c55e" />
          <ellipse cx="100" cy="55" rx="10" ry="12" fill="#4ade80" opacity="0.7" />
          <circle cx="100" cy="55" r="6" fill="#86efac" />
          {!isWilting && (
            <>
              <line x1="100" y1="35" x2="100" y2="25" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="80" y1="50" x2="72" y2="44" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="120" y1="50" x2="128" y2="44" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </>
          )}
        </g>
      )}

      {/* ─── FLOWER Stage ─── */}
      {stage === "FLOWER" && (
        <g className={animationClass}>
          <path d="M100 195 Q88 140 95 85 Q100 55 100 40" stroke="#15803d" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M96 150 Q65 130 60 150 Q72 158 96 158" fill="url(#leafGrad)" />
          <path d="M104 140 Q135 118 140 138 Q128 145 104 145" fill="url(#leafGrad)" />
          <path d="M97 115 Q72 100 68 115 Q78 120 97 120" fill="#22c55e" />
          <path d="M103 105 Q130 90 134 105 Q122 110 103 110" fill="#22c55e" />
          <path d="M98 80 Q80 68 76 80 Q84 84 98 84" fill="#4ade80" />
          <path d="M102 70 Q122 58 126 72 Q116 76 102 76" fill="#4ade80" />
          <g filter="url(#glow)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <ellipse
                key={i}
                cx={100 + 18 * Math.cos((angle * Math.PI) / 180)}
                cy={38 + 18 * Math.sin((angle * Math.PI) / 180)}
                rx="9" ry="6"
                fill="url(#flowerGrad)"
                opacity={0.8 + 0.2 * Math.sin(i * 1.5)}
                transform={`rotate(${angle} ${100 + 18 * Math.cos((angle * Math.PI) / 180)} ${38 + 18 * Math.sin((angle * Math.PI) / 180)})`}
                className="origin-center"
              />
            ))}
            <circle cx="100" cy="38" r="8" fill="#facc15" />
            <circle cx="98" cy="36" r="2" fill="#fef08a" />
            <circle cx="102" cy="36" r="2" fill="#fef08a" />
            <circle cx="100" cy="40" r="2" fill="#fef08a" />
          </g>
          <circle cx="130" cy="60" r="2" fill="#f472b6" className="animate-ping" style={{ animationDelay: "0.3s" }} />
          <circle cx="70" cy="70" r="1.5" fill="#facc15" className="animate-ping" style={{ animationDelay: "0.8s" }} />
        </g>
      )}

      {isWilting && (
        <g className="animate-wilt">
          <path d="M100 195 Q95 160 100 130 Q105 160 100 195" fill="rgba(120, 53, 15, 0.15)" />
          <line x1="65" y1="135" x2="75" y2="140" stroke="#a16207" strokeWidth="1" opacity="0.5" />
          <line x1="135" y1="125" x2="125" y2="130" stroke="#a16207" strokeWidth="1" opacity="0.5" />
          <path d="M100 170 Q103 175 100 180 Q97 175 100 170" fill="#60a5fa" opacity="0.4" className="animate-bounce" />
        </g>
      )}
    </svg>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({
  label,
  icon: Icon,
  current,
  goal,
  color,
}: {
  label: string;
  icon: React.ElementType;
  current: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className={cn("h-3.5 w-3.5", color)} />
          {label}
        </span>
        <span className="font-medium tabular-nums">{current}/{goal}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/50">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
            pct >= 100 ? "bg-gradient-to-r from-green-500 to-emerald-400" : `bg-gradient-to-r ${color}`
          )}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-white/20 animate-shimmer" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── New Achievement Toast ────────────────────────────────────
function AchievementToast({
  type,
  onDismiss,
}: {
  type: AchievementType;
  onDismiss: () => void;
}) {
  const meta = ACHIEVEMENT_META[type];
  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-up">
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 shadow-2xl shadow-amber-200/50 dark:shadow-amber-900/30 p-4 max-w-xs backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 shadow-lg animate-bounce-in">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                🎉 Achievement Unlocked!
              </p>
              <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {meta.emoji} {meta.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Achievement Badge ────────────────────────────────────────
function AchievementBadge({ type }: { type: AchievementType }) {
  const meta = ACHIEVEMENT_META[type];
  const iconMap: Record<AchievementType, React.ElementType> = {
    first_bloom: Flower2,
    three_day_streak: Flame,
    seven_day_streak: Star,
    perfect_week: Star,
    water_warriors: Droplets,
    meal_masters: UtensilsCrossed,
  };
  const Icon = iconMap[type] || Award;

  return (
    <div
      className="group relative flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-3 py-2 hover:bg-card hover:shadow-sm transition-all duration-200 cursor-default"
      title={meta.description}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20">
        <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-foreground truncate">{meta.emoji} {meta.label}</p>
        <p className="text-[9px] text-muted-foreground truncate">{meta.description}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function LovePlant() {
  const { data: session } = useSession();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("You");
  const [visibleToasts, setVisibleToasts] = useState<AchievementType[]>([]);

  useEffect(() => {
    fetch("/api/partner/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.linked && d.partner) {
          setPartnerId(d.partner.id);
          setPartnerName(d.partner.name);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.user?.name) setMyName(session.user.name);
  }, [session]);

  const { data: plant, loading, error, refetch } = useLovePlant({
    partnerId,
    myId: session?.user?.id || null,
  });

  // Show new achievement toasts (with proper cleanup)
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < (plant.newAchievements?.length || 0); i++) {
      const type = plant.newAchievements[i];
      const showTimeout = setTimeout(() => {
        setVisibleToasts((prev) => [...prev, type]);
        const dismissTimeout = setTimeout(() => {
          setVisibleToasts((prev) => prev.filter((t) => t !== type));
        }, 5000);
        timeouts.push(dismissTimeout);
      }, i * 2000);
      timeouts.push(showTimeout);
    }
    return () => timeouts.forEach(clearTimeout);
  }, [plant.newAchievements]);

  const stageMeta = STAGE_META[plant.stage];
  const hasNewAchievements = plant.newAchievements?.length > 0;

  return (
    <Card className="relative overflow-hidden group/card">
      {/* New Achievement Toasts */}
      {visibleToasts.map((type) => (
        <AchievementToast
          key={type}
          type={type}
          onDismiss={() => setVisibleToasts((prev) => prev.filter((t) => t !== type))}
        />
      ))}

      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/30 via-transparent to-emerald-50/30 dark:from-amber-900/5 dark:via-transparent dark:to-emerald-900/5" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-20 animate-float",
            plant.stage === "FLOWER"
              ? "bg-pink-300 dark:bg-pink-500/20"
              : plant.stage === "PLANT"
              ? "bg-green-300 dark:bg-green-500/20"
              : "bg-amber-300 dark:bg-amber-500/20"
          )}
        />
      </div>

      <CardHeader className="relative pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sprout className="h-5 w-5 text-emerald-500" />
            Love Plant 🌱
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Streak badge */}
            {plant.streak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400 shadow-sm">
                <Flame className="h-3 w-3" />
                {plant.streak}d
              </span>
            )}
            {/* Stage badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm",
                plant.stage === "FLOWER"
                  ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                  : plant.stage === "PLANT"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : plant.stage === "SPROUT"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              )}
            >
              {stageMeta.emoji} {stageMeta.label.split(" ")[0]}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Frown className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Could not load plant data</p>
            <button onClick={refetch} className="text-xs text-rose-500 hover:underline">Try again</button>
          </div>
        ) : !partnerId ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Heart className="h-6 w-6 text-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              Link with your partner to grow a love plant together! 💕
            </p>
          </div>
        ) : (
          <>
            {/* ─── Plant Visualizer ─── */}
            <div className="relative">
              <PlantSVG stage={plant.stage} health={plant.health} />

              {/* Health indicator */}
              <div className="absolute -top-1 -right-1 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 px-2 py-0.5 text-[10px] tabular-nums shadow-sm">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    plant.health >= 75 ? "bg-green-500" : plant.health >= 50 ? "bg-yellow-500" : plant.health >= 25 ? "bg-orange-500" : "bg-red-500"
                  )}
                />
                {plant.health}%
              </div>

              <p className="text-center text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {stageMeta.description}
              </p>
            </div>

            {/* ─── Health Score Bar ─── */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Heart className={cn("h-3.5 w-3.5", plant.health >= 75 ? "text-green-500" : plant.health >= 50 ? "text-yellow-500" : "text-red-500")} fill="currentColor" />
                  Combined Health
                </span>
                <span className="font-bold tabular-nums">{plant.combinedScore}%</span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
                    plant.health >= 75 ? "bg-gradient-to-r from-green-500 to-emerald-400" : plant.health >= 50 ? "bg-gradient-to-r from-yellow-500 to-amber-400" : plant.health >= 25 ? "bg-gradient-to-r from-orange-500 to-amber-500" : "bg-gradient-to-r from-red-500 to-rose-500"
                  )}
                  style={{ width: `${plant.health}%` }}
                />
              </div>
            </div>

            {/* ─── Progress Breakdown ─── */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today's Progress</p>

              <div className="space-y-2 p-2 rounded-lg bg-background/50">
                <p className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                  <Sun className="h-3 w-3 text-amber-400" />
                  {myName}
                </p>
                <ProgressBar label="Water" icon={Droplets} current={plant.userProgress.water.current} goal={MAX_WATER_GLASSES} color="text-blue-500" />
                <ProgressBar label="Meals" icon={UtensilsCrossed} current={plant.userProgress.meals.current} goal={plant.userProgress.meals.goal} color="text-amber-500" />
              </div>

              {partnerName && (
                <div className="space-y-2 p-2 rounded-lg bg-background/50">
                  <p className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Moon className="h-3 w-3 text-indigo-400" />
                    {partnerName}
                  </p>
                  <ProgressBar label="Water" icon={Droplets} current={plant.partnerProgress.water.current} goal={MAX_WATER_GLASSES} color="text-blue-500" />
                  <ProgressBar label="Meals" icon={UtensilsCrossed} current={plant.partnerProgress.meals.current} goal={plant.partnerProgress.meals.goal} color="text-amber-500" />
                </div>
              )}
            </div>

            {/* ─── Achievements Section ─── */}
            {plant.achievements?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Achievements ({plant.achievements.length})
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {plant.achievements.map((a) => (
                    <AchievementBadge key={a.type} type={a.type as AchievementType} />
                  ))}
                </div>
              </div>
            )}

            {/* ─── New Achievement celebration banner ─── */}
            {hasNewAchievements && (
              <div className="animate-bounce-in rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800/50 p-3 text-center shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  <Trophy className="h-5 w-5 text-amber-500 animate-bounce" />
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                </div>
                <p className="text-sm font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                  🎉 New Achievement{plant.newAchievements.length > 1 ? "s" : ""} Unlocked!
                </p>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {plant.newAchievements.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                      {ACHIEVEMENT_META[t].emoji} {ACHIEVEMENT_META[t].label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Motivation Message ─── */}
            <div className="text-center">
              {plant.health >= 100 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 px-3 py-1 text-[11px] font-medium text-pink-600 dark:text-pink-400 animate-bounce-in">
                  <Flower2 className="h-3.5 w-3.5" />
                  Perfect harmony! Your love is in full bloom! 🌸
                </span>
              ) : plant.health >= 75 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Almost there! Keep nurturing your plant together! 🌻
                </span>
              ) : plant.health >= 50 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/20 px-3 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Growing steady! Log your meals & water to help it bloom! 🌿
                </span>
              ) : plant.health >= 25 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/20 px-3 py-1 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                  Your plant needs care! Don't forget to hydrate & eat! 💧
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/20 px-3 py-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                  Your love plant is wilting! Water & meals needed urgently! 🆘
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
