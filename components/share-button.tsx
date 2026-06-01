"use client";

import { useState } from "react";
import { Share2, Check, Loader2, MessageCircle } from "lucide-react";
import {
  formatDailyOverview,
  copyToClipboard,
  shareViaWhatsApp,
  type DailyOverviewMeal,
} from "@/lib/share";

export function ShareButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<"copied" | "sent" | null>(null);

  async function handleShare() {
    setLoading(true);

    try {
      // 1. Fetch today's meals from API
      let meals: DailyOverviewMeal[] = [];
      try {
        const res = await fetch("/api/meals");
        if (res.ok) {
          const allMeals = await res.json();
          const today = new Date().toDateString();
          meals = allMeals.filter((m: { createdAt: string }) => {
            const mealDate = new Date(m.createdAt).toDateString();
            return mealDate === today;
          });
        }
      } catch {
        // API unavailable — continue without meals
      }

      // 2. Fetch water from DB API
      let waterGlasses = 0;
      try {
        const res = await fetch("/api/water");
        if (res.ok) {
          const data = await res.json();
          waterGlasses = data.count || 0;
        }
      } catch {
        // API unavailable — continue without water
      }

      // 3. Fetch today's mood from DB API
      let mood: string | null = null;
      try {
        const res = await fetch("/api/mood");
        if (res.ok) {
          const data = await res.json();
          const today = new Date().toDateString();
          // Find today's mood from the returned list
          const todayMood = Array.isArray(data) 
            ? data.find((m: { createdAt: string }) => new Date(m.createdAt).toDateString() === today)
            : null;
          mood = todayMood?.mood || null;
        }
      } catch {
        // API unavailable — continue without mood
      }

      // 4. Format the overview
      const text = formatDailyOverview({ meals, waterGlasses, mood });

      // 5. Auto-copy to clipboard
      await copyToClipboard(text);

      // 6. Show toast
      setToast("copied");
      setTimeout(() => setToast(null), 4000);

      // 7. Open WhatsApp with the text
      shareViaWhatsApp(text);
      setTimeout(() => setToast("sent"), 1000);
    } catch {
      // Fallback if something fails
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Main share button */}
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/30 transition-all cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-wait"
        title="Share with Partner"
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Share 💕
          </>
        )}
      </button>

      {/* Toast notification */}
      {toast === "copied" && (
        <div className="absolute right-0 sm:left-0 sm:right-auto top-full z-50 mt-2 w-56 animate-fade-in">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-card shadow-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">Copied! ✅</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ab yeh WhatsApp pe bhej do apne partner ko! 💬
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse">
              <MessageCircle className="h-3 w-3" />
              Opening WhatsApp...
            </div>
          </div>
        </div>
      )}

      {toast === "sent" && (
        <div className="absolute right-0 sm:left-0 sm:right-auto top-full z-50 mt-2 w-56 animate-fade-in">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Sent to WhatsApp! 💬
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Now paste &amp; send to your partner 💕
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
