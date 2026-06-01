import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WaterTracker } from "@/components/water-tracker";
import { MealLogger } from "@/components/meal-logger";
import { LovePlant } from "@/components/love-plant";
import { WeeklySummary } from "@/components/weekly-summary";
import { MoodSelector } from "@/components/mood-selector";
import { LoveNotes } from "@/components/love-notes";
import { MoodRecipes } from "@/components/mood-recipes";
import { ShareButton } from "@/components/share-button";
import { NotificationSettingsWrapper } from "@/components/notification-settings-wrapper";
import { PartnerOverview } from "@/components/partner-overview";
import { MemoryScrapbook } from "@/components/memory-scrapbook";
import { SecretNoteExchange } from "@/components/secret-note-exchange";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Heart,
  Sparkles,
  UtensilsCrossed,
  Smile,
  Sun,
  BookHeart,
  Music,
} from "lucide-react";

// ─── Section Divider ────────────────────────────────────────
function SectionDivider({
  label,
  icon: Icon,
  delay,
}: {
  label: string;
  icon: React.ElementType;
  delay: string;
}) {
  return (
    <div
      className="animate-fade-in flex items-center gap-3 pt-2 sm:pt-3 first:pt-0"
      style={{ animationDelay: delay } as React.CSSProperties}
    >
      <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 shadow-sm">
        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500 dark:text-rose-400" />
      </div>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-rose-200/50 via-amber-200/30 to-transparent dark:from-rose-800/30 dark:via-amber-800/20" />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl xl:max-w-[90rem] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 md:pb-6">
        {/* ─── Welcome Header ─── */}
        <div className="animate-slide-up">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 dark:from-[#1a1a2e] dark:via-[#1a1a2e] dark:to-[#121212] shadow-xl shadow-rose-200/30 dark:shadow-amber-900/10 xl:rounded-3xl">
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
                    My Bunny 🥰
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
        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-5">
          {/* ── SECTION 1: Daily Check-ins ── */}
          <SectionDivider label="Daily Check-ins" icon={Sun} delay="0.05s" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
            <div className="animate-slide-up lg:col-span-2 xl:col-span-3" style={{ animationDelay: "0.1s" } as React.CSSProperties}>
              <MoodSelector />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "0.13s" } as React.CSSProperties}>
              <WaterTracker />
            </div>
          </div>

          {/* ── SECTION 2: Nutrition & Growth ── */}
          <SectionDivider label="Nutrition &amp; Growth" icon={UtensilsCrossed} delay="0.16s" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
            <div className="animate-slide-up" style={{ animationDelay: "0.19s" } as React.CSSProperties}>
              <MealLogger />
            </div>
            <div className="animate-slide-up lg:col-span-2 xl:col-span-3" style={{ animationDelay: "0.22s" } as React.CSSProperties}>
              <LovePlant />
            </div>
          </div>

          {/* ── SECTION 3: Together ── */}
          <SectionDivider label="Together" icon={Heart} delay="0.25s" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1">
            <div className="animate-slide-up" style={{ animationDelay: "0.28s" } as React.CSSProperties}>
              <PartnerOverview />
            </div>
          </div>

          {/* ── SECTION 4: Romance ── */}
          <SectionDivider label="Romance" icon={BookHeart} delay="0.31s" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-5">
            <div className="animate-slide-up lg:col-span-1 xl:col-span-2" style={{ animationDelay: "0.34s" } as React.CSSProperties}>
              <SecretNoteExchange />
            </div>
            <div className="animate-slide-up lg:col-span-2 xl:col-span-3" style={{ animationDelay: "0.37s" } as React.CSSProperties}>
              <MemoryScrapbook />
            </div>
          </div>

          {/* ── SECTION 5: Inspiration ── */}
          <SectionDivider label="Inspiration" icon={Music} delay="0.4s" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-3">
            <div className="animate-slide-up" style={{ animationDelay: "0.43s" } as React.CSSProperties}>
              <LoveNotes />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "0.46s" } as React.CSSProperties}>
              <MoodRecipes />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "0.49s" } as React.CSSProperties}>
              <WeeklySummary />
            </div>
          </div>

          {/* ── SECTION 6: Settings ── */}
          <SectionDivider label="Preferences" icon={Smile} delay="0.52s" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1">
            <div className="animate-slide-up" style={{ animationDelay: "0.55s" } as React.CSSProperties}>
              <NotificationSettingsWrapper />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
