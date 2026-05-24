"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  UtensilsCrossed,
  Home,
  Store,
  IndianRupee,
  Smile,
  TrendingUp,
  Sparkles,
  Share2,
  Check,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatWeeklyForShare,
  copyToClipboard,
  shareViaWhatsApp,
} from "@/lib/share";

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

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const moodEmojis: Record<string, string> = {
  happy: "😊",
  stressed: "😰",
  tired: "😴",
  productive: "💪",
};

export function WeeklySummary() {
  const [data, setData] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareSent, setShareSent] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/weekly-summary");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  async function handleCopySummary() {
    if (!data) return;
    const text = formatWeeklyForShare(data);
    const ok = await copyToClipboard(text);
    if (ok) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  }

  function handleWhatsAppShare() {
    if (!data) return;
    const text = formatWeeklyForShare(data);
    shareViaWhatsApp(text);
    setShareSent(true);
    setTimeout(() => setShareSent(false), 3000);
  }

  return (
    <Card className="relative overflow-hidden group/card">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base min-w-0">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-500" />
            <span className="truncate">Weekly Summary 📊</span>
          </CardTitle>
          {/* Share with Partner buttons */}
          {data && data.meals.total > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1.5 text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:shadow-sm transition-all active:scale-95"
                title="Copy summary to share"
              >
                {shareCopied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-2 py-1.5 text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:shadow-sm transition-all active:scale-95"
                title="Share on WhatsApp"
              >
                {shareSent ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span className="hidden sm:inline">Sent!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-3 w-3" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : !data || data.meals.total === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              No data this week yet. Start logging! 🚀
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Meal Stats */}
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <UtensilsCrossed className="h-3 w-3" />
                This Week&apos;s Meals
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                <div className="rounded-lg bg-secondary/40 p-2 sm:p-3 text-center">
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {data.meals.total}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Total Meals
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-2 sm:p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Home className="h-3 w-3 text-green-500" />
                    <p className="text-lg sm:text-2xl font-bold text-foreground">
                      {data.meals.home}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Home
                  </p>
                </div>
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 p-2 sm:p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Store className="h-3 w-3 text-orange-500" />
                    <p className="text-lg sm:text-2xl font-bold text-foreground">
                      {data.meals.outside}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Outside
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 p-2 sm:p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="h-3 w-3 text-amber-500" />
                    <p className="text-lg sm:text-2xl font-bold text-foreground">
                      ₹{data.meals.totalSpent}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Spent
                  </p>
                </div>
              </div>
            </div>

            {/* Unique Meals + Mood */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {/* Unique Meals */}
              <div className="flex-1 min-w-[120px] rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                  Unique Dishes
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.meals.uniqueMealsCount}
                  </span>
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
                </div>
              </div>

              {/* Top Mood */}
              {data.moods.total > 0 && (
                <div className="flex-1 min-w-[120px] rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    Top Mood
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl">
                      {moodEmojis[data.moods.topMood] || "🥰"}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 capitalize">
                      {data.moods.topMood}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Week Progress - Bar Chart */}
            {Object.keys(data.meals.mealsByDay).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Meals Per Day
                </p>
                <div className="flex items-end gap-1 h-20 sm:h-28">
                  {DAY_ORDER.map((day) => {
                    const count = data.meals.mealsByDay[day] || 0;
                    const maxCount = Math.max(
                      ...Object.values(data.meals.mealsByDay),
                      1
                    );
                    const heightPx = count > 0 ? Math.max((count / maxCount) * 80, 8) : 4;

                    return (
                      <div
                        key={day}
                        className="flex flex-1 flex-col items-center justify-end gap-0.5 h-full"
                      >
                        <span className="text-[10px] font-medium text-foreground/70">
                          {count || ""}
                        </span>
                        <div
                          className={cn(
                            "w-full max-w-[20px] sm:max-w-[28px] rounded-t-sm transition-all duration-500",
                            count > 0
                              ? "bg-gradient-to-t from-emerald-400 to-emerald-300 dark:from-emerald-600 dark:to-emerald-500"
                              : "bg-muted"
                          )}
                          style={{
                            height: `${heightPx}px`,
                            minHeight: count > 0 ? "8px" : "4px",
                          }}
                        />
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
