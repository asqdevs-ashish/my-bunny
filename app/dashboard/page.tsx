import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { WaterTracker } from "@/components/water-tracker";
import { MealLogger } from "@/components/meal-logger";
import { WeeklySummary } from "@/components/weekly-summary";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { MoodSelector } from "@/components/mood-selector";
import { LoveNotes } from "@/components/love-notes";
import { MoodRecipes } from "@/components/mood-recipes";
import { ShareButton } from "@/components/share-button";
import { NotificationProvider } from "@/components/notification-provider";
import { NotificationSettingsWrapper } from "@/components/notification-settings-wrapper";
import { PartnerOverview } from "@/components/partner-overview";
import { MemoryScrapbook } from "@/components/memory-scrapbook";
import { SecretNoteExchange } from "@/components/secret-note-exchange";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Heart,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Welcome Header */}
        <div className="animate-slide-up">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 dark:from-[#1a1a2e] dark:via-[#1a1a2e] dark:to-[#121212] shadow-xl shadow-rose-200/30 dark:shadow-amber-900/10">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-200/10 via-transparent to-amber-200/10 dark:from-amber-500/5 dark:via-transparent dark:to-rose-500/5 animate-gradient" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full bg-rose-200/40 dark:bg-amber-500/10 blur-3xl animate-float" />
              <div className="absolute -bottom-10 -left-10 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-amber-200/40 dark:bg-rose-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            </div>
            <CardContent className="relative p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    Suar 🥰
                  </h1>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
                    Your personal AI chef is ready to help you cook something
                    amazing today! Check in your mood, track your water, and
                    let&apos;s eat healthy &amp; happy! 💕
                  </p>
                </div>
                <div className="hidden md:flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 dark:from-amber-500 dark:to-yellow-500 shadow-lg shadow-rose-300/30 dark:shadow-amber-800/30 animate-float">
                  <UtensilsCrossed className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-rose-600 dark:text-rose-400 shadow-sm hover:shadow-md transition-all duration-200">
                  <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="currentColor" />
                  Made with love
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/20 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 shadow-sm hover:shadow-md transition-all duration-200">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Personalised
                </div>
                <ShareButton />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Widget Grid — single column on mobile, 3 columns on desktop */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Mood Selector — spans 2 cols on desktop */}
          <div className="animate-slide-up lg:col-span-2" style={{ animationDelay: "0.1s" } as React.CSSProperties}>
            <MoodSelector />
          </div>

          {/* Water Tracker */}
          <div className="animate-slide-up" style={{ animationDelay: "0.15s" } as React.CSSProperties}>
            <WaterTracker />
          </div>

          {/* Meal Logger */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" } as React.CSSProperties}>
            <MealLogger />
          </div>

          {/* Partner Update — full width */}
          <div className="animate-slide-up lg:col-span-3" style={{ animationDelay: "0.25s" } as React.CSSProperties}>
            <PartnerOverview />
          </div>

          {/* Private Love Note */}
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" } as React.CSSProperties}>
            <SecretNoteExchange />
          </div>

          {/* Memory Scrapbook */}
          <div className="animate-slide-up" style={{ animationDelay: "0.35s" } as React.CSSProperties}>
            <MemoryScrapbook />
          </div>

          {/* Love Note for You */}
          <div className="animate-slide-up" style={{ animationDelay: "0.4s" } as React.CSSProperties}>
            <LoveNotes />
          </div>

          {/* Weekly Summary */}
          <div className="animate-slide-up" style={{ animationDelay: "0.45s" } as React.CSSProperties}>
            <WeeklySummary />
          </div>

          {/* Recipe Ideas */}
          <div className="animate-slide-up" style={{ animationDelay: "0.5s" } as React.CSSProperties}>
            <MoodRecipes />
          </div>

          {/* App Reminder — full width */}
          <div className="animate-slide-up lg:col-span-3" style={{ animationDelay: "0.55s" } as React.CSSProperties}>
            <NotificationSettingsWrapper />
          </div>
        </div>
      </main>

      {/* Footer */}

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}
