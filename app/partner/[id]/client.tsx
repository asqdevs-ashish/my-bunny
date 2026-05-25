"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  ArrowLeft,
  Droplets,
  UtensilsCrossed,
  Smile,
  Clock,
  Home,
  Store,
  IndianRupee,
  Sparkles,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Formatting Helpers ──────────────────────────────────────
function formatCurrency(amount: number) {
  if (amount >= 10000000) return (amount / 10000000).toFixed(1) + "Cr";
  if (amount >= 100000) return (amount / 100000).toFixed(1) + "L";
  if (amount >= 1000) return (amount / 1000).toFixed(1) + "k";
  return amount.toString();
}

// ─── Anniversary Helper ──────────────────────────────────────
const START_DATE = new Date("2025-07-28T00:00:00");

function getTimeElapsed() {
  const now = new Date();
  let diff = now.getTime() - START_DATE.getTime();

  if (diff < 0) return null;

  // Exact breakdown
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  diff -= years * (1000 * 60 * 60 * 24 * 365.25);

  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  diff -= months * (1000 * 60 * 60 * 24 * 30.44);

  const daysTotal = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(daysTotal / 7);
  const days = daysTotal % 7;
  diff -= daysTotal * (1000 * 60 * 60 * 24);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);

  const minutes = Math.floor(diff / (1000 * 60));

  return { years, months, weeks, days, hours, minutes };
}

function getNextAnniversary() {
  const now = new Date();
  let next = new Date(now.getFullYear(), 6, 28); // July is month 6 (0-indexed)
  if (now > next) next.setFullYear(now.getFullYear() + 1);
  
  const diff = next.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { date: next, days };
}

interface WeeklySummaryData {
  period: { from: string; to: string };
  meals: {
    total: number;
    home: number;
    outside: number;
    totalSpent: number;
    uniqueMealsCount: number;
    mealsByDay: Record<string, number>;
  };
  moods: {
    total: number;
    counts: Record<string, number>;
    topMood: string;
    topMoodCount: number;
  };
}

interface PartnerProfileData {
  partner: {
    id: string;
    name: string;
    email: string;
    partnerSince: string | null;
  };
  today: {
    meals: Array<{
      id: string;
      mealName: string;
      ingredients: string;
      isOutside: boolean;
      cost: number | null;
      notes: string | null;
      createdAt: string;
    }>;
    moods: Array<{
      id: string;
      mood: string;
      note: string | null;
      createdAt: string;
    }>;
    waterGlasses: number;
  };
  weeklySummary: WeeklySummaryData | null;
}

const MOOD_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: "😊", label: "Happy", color: "text-green-500" },
  stressed: { emoji: "😰", label: "Stressed", color: "text-orange-500" },
  tired: { emoji: "😴", label: "Tired", color: "text-purple-500" },
  productive: { emoji: "💪", label: "Productive", color: "text-amber-500" },
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊",
  stressed: "😰",
  tired: "😴",
  productive: "💪",
};

export function PartnerProfileClient({ data }: { data: PartnerProfileData }) {
  const router = useRouter();
  const { partner, today } = data;
  const [timeElapsed, setTimeElapsed] = useState(getTimeElapsed());
  const [mounted, setMounted] = useState(false);
  const nextAnniv = getNextAnniversary();

  useEffect(() => {
    setMounted(true);
    
    // Confetti if it's the day! (July 28)
    const now = new Date();
    if (now.getMonth() === 6 && now.getDate() === 28) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#fb7185", "#fbbf24", "#f43f5e"]
      });
    }

    const timer = setInterval(() => {
      setTimeElapsed(getTimeElapsed());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard")}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Partner Header */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 dark:from-[#1a1a2e] dark:via-[#1a1a2e] dark:to-[#121212] shadow-xl shadow-rose-200/30 dark:shadow-amber-900/10">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-200/10 via-transparent to-amber-200/10 dark:from-amber-500/5 dark:via-transparent dark:to-rose-500/5 animate-gradient" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 dark:from-amber-500 dark:to-yellow-500 shadow-lg shadow-rose-300/30 dark:shadow-amber-800/30">
                <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {partner.name} 💕
                </h1>
                <p className="flex items-center gap-1.5 mt-1 text-sm font-medium text-rose-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Together since 28 July 2025
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Today is {new Date().toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full w-fit animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  Next Anniversary in {nextAnniv.days} days!
                </div>
              </div>
            </div>

            {/* Time Counter Grid */}
            {mounted && timeElapsed && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 bg-white/40 dark:bg-black/20 backdrop-blur-sm p-3 rounded-2xl border border-rose-100 dark:border-rose-900/20 shadow-sm">
                {[
                  { label: "Years", value: timeElapsed.years },
                  { label: "Months", value: timeElapsed.months },
                  { label: "Weeks", value: timeElapsed.weeks },
                  { label: "Days", value: timeElapsed.days },
                  { label: "Hours", value: timeElapsed.hours },
                  { label: "Mins", value: timeElapsed.minutes },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px]">
                    <span className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {item.value}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
        {/* Mood Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Smile className="h-4 w-4 text-purple-500" />
              Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            {today.moods.length > 0 ? (
              <div className="space-y-2">
                {today.moods.map((m) => {
                  const config = MOOD_CONFIG[m.mood] || { emoji: "🥰", label: m.mood, color: "text-muted-foreground" };
                  return (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg bg-secondary/30 p-2">
                      <span className="text-xl">{config.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        {m.note && (
                          <p className="text-xs text-muted-foreground">{m.note}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Smile className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No mood logged today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Water Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-blue-500" />
              Water
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative flex items-center justify-center">
                <div className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full border-4",
                  today.waterGlasses >= 8
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                    : today.waterGlasses >= 4
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                )}>
                  <span className={cn(
                    "text-2xl font-bold",
                    today.waterGlasses >= 8
                      ? "text-green-600 dark:text-green-400"
                      : today.waterGlasses >= 4
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground"
                  )}>
                    {today.waterGlasses}
                  </span>
                </div>
                {today.waterGlasses >= 8 && (
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                of 8 glasses drunk
              </p>
              {today.waterGlasses < 8 && (
                <p className="text-[11px] text-muted-foreground/60">
                  {8 - today.waterGlasses} glasses to go! 💪
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meals Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <UtensilsCrossed className="h-4 w-4 text-amber-500" />
              Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {today.meals.length > 0 ? (
              <div className="space-y-2">
                {today.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="rounded-lg border border-border/50 bg-card p-2.5 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                        meal.isOutside ? "bg-orange-100 dark:bg-orange-900/30" : "bg-green-100 dark:bg-green-900/30"
                      )}>
                        {meal.isOutside ? (
                          <Store className="h-3 w-3 text-orange-500" />
                        ) : (
                          <Home className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{meal.mealName}</p>
                        {meal.ingredients && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {meal.ingredients}
                          </p>
                        )}
                      </div>
                      {meal.cost && (
                        <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {meal.cost}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      <Clock className="inline h-3 w-3 mr-0.5" />
                      {new Date(meal.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <UtensilsCrossed className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No meals logged today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Moods Timeline */}
      {today.moods.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-purple-500" />
              Mood Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {today.moods.map((m, i) => {
                const config = MOOD_CONFIG[m.mood] || { emoji: "🥰", label: m.mood, color: "text-muted-foreground" };
                return (
                  <div key={m.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                        <span>{config.emoji}</span>
                      </div>
                      {i < today.moods.length - 1 && (
                        <div className="mt-1 h-full w-0.5 bg-gradient-to-b from-purple-200 to-transparent dark:from-purple-800" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{config.label}</p>
                      {m.note && (
                        <p className="text-xs text-muted-foreground">{m.note}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60">
                        {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partner's Weekly Summary */}
      {data.weeklySummary && data.weeklySummary.meals.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-emerald-500" />
                {partner.name}&apos;s Week 📊
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Meal Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg bg-secondary/40 p-2 text-center">
                <p className="text-lg font-bold text-foreground">{data.weeklySummary.meals.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-2 text-center">
                <p className="text-lg font-bold text-foreground">{data.weeklySummary.meals.home}</p>
                <p className="text-[10px] text-muted-foreground">Home</p>
              </div>
              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 p-2 text-center">
                <p className="text-lg font-bold text-foreground">{data.weeklySummary.meals.outside}</p>
                <p className="text-[10px] text-muted-foreground">Outside</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 p-2 text-center min-w-0 flex flex-col justify-center overflow-hidden">
                <p className="text-base sm:text-lg font-bold text-foreground truncate leading-tight" title={`₹${data.weeklySummary.meals.totalSpent.toLocaleString('en-IN')}`}>
                  ₹{formatCurrency(data.weeklySummary.meals.totalSpent)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Spent</p>
              </div>
            </div>

            {/* Meals Per Day Bar Chart */}
            {Object.keys(data.weeklySummary.meals.mealsByDay).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Meals Per Day</p>
                <div className="flex items-end gap-1 h-20">
                  {DAY_ORDER.map((day) => {
                    const count = data.weeklySummary!.meals.mealsByDay[day] || 0;
                    const maxCount = Math.max(
                      ...Object.values(data.weeklySummary!.meals.mealsByDay),
                      1
                    );
                    const heightPx = count > 0 ? Math.max((count / maxCount) * 80, 8) : 4;
                    return (
                      <div key={day} className="flex flex-1 flex-col items-center justify-end gap-0.5 h-full">
                        <span className="text-[10px] font-medium text-foreground/70">{count || ""}</span>
                        <div
                          className={cn(
                            "w-full max-w-[20px] rounded-t-sm transition-all duration-500",
                            count > 0
                              ? "bg-gradient-to-t from-emerald-400 to-emerald-300 dark:from-emerald-600 dark:to-emerald-500"
                              : "bg-muted"
                          )}
                          style={{
                            height: `${heightPx}px`,
                            minHeight: count > 0 ? "8px" : "4px",
                          }}
                        />
                        <span className="text-[9px] text-muted-foreground">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mood Summary */}
            {data.weeklySummary.moods.total > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-purple-200/50 dark:border-purple-800/30 bg-purple-50/50 dark:bg-purple-900/10 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{MOOD_EMOJIS[data.weeklySummary.moods.topMood] || "🥰"}</span>
                  <div>
                    <p className="text-xs font-medium capitalize">{data.weeklySummary.moods.topMood}</p>
                    <p className="text-[10px] text-muted-foreground">Top mood this week</p>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.weeklySummary.moods.total}</p>
                  <p className="text-[10px] text-muted-foreground">check-ins</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
