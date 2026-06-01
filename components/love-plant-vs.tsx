"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Swords,
  Trophy,
  Heart,
  Loader2,
  Frown,
  Zap,
  Target,
  Star,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VsResponse } from "@/app/api/love-plant/vs/route";

// ─── Sub-components ──────────────────────────────────────────

function WinnerBadge({ type }: { type: "you" | "partner" | "tie" }) {
  if (type === "tie") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
        Tie
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider animate-bounce-in",
        type === "you"
          ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
          : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
      )}
    >
      <Trophy className="h-2.5 w-2.5" />
      {type === "you" ? "You" : "Partner"}
    </span>
  );
}

function CategoryRow({
  label,
  icon,
  yourDisplay,
  partnerDisplay,
  winner,
  yourScore,
  partnerScore,
}: {
  label: string;
  icon: string;
  yourDisplay: string;
  partnerDisplay: string;
  winner: "you" | "partner" | "tie";
  yourScore: number;
  partnerScore: number;
}) {
  return (
    <div className="group rounded-xl border border-border/40 bg-card/30 p-3 hover:bg-card/60 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          {icon} {label}
        </span>
        <WinnerBadge type={winner} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-right">
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              winner === "you" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
            )}
          >
            {yourDisplay}
          </span>
        </div>
        <span className="text-[9px] font-bold text-muted-foreground/40 w-4 text-center shrink-0">VS</span>
        <div className="flex-1">
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              winner === "partner" ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
            )}
          >
            {partnerDisplay}
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              winner === "you"
                ? "bg-gradient-to-r from-rose-400 to-rose-500"
                : "bg-gradient-to-r from-rose-200 to-rose-300 dark:from-rose-800/30 dark:to-rose-700/30"
            )}
            style={{ width: `${yourScore}%` }}
          />
        </div>
        <span className="text-[8px] text-muted-foreground/40 w-4 text-center shrink-0">VS</span>
        <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              winner === "partner"
                ? "bg-gradient-to-r from-indigo-400 to-indigo-500"
                : "bg-gradient-to-r from-indigo-200 to-indigo-300 dark:from-indigo-800/30 dark:to-indigo-700/30"
            )}
            style={{ width: `${partnerScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Mood Display ────────────────────────────────────────────
function MoodDisplay({
  mood,
  side,
}: {
  mood: { mood: string; emoji: string; label: string } | null;
  side: "left" | "right";
}) {
  if (!mood) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-0.5 py-1",
          side === "left" ? "items-end" : "items-start"
        )}
      >
        <span className="text-lg opacity-30">💭</span>
        <span className="text-[9px] text-muted-foreground/40">No mood</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 py-1",
        side === "left" ? "items-end" : "items-start"
      )}
    >
      <span className="text-lg animate-bounce-in">{mood.emoji}</span>
      <span className="text-[9px] font-medium text-muted-foreground">
        {mood.label}
      </span>
    </div>
  );
}

// ─── Trash Talk Messages ─────────────────────────────────────
function getTrashTalk(
  overallWinner: "you" | "partner" | "tie" | null,
  yourScore: number,
  partnerScore: number,
  yourName: string,
  partnerName: string
): string {
  if (overallWinner === "tie") {
    const msgs = [
      "It's a tie! You're equally amazing! 🤝",
      "Dead even! Time to step it up, both of you! ⚡",
      "Perfect balance! Teamwork makes the dream work! ✨",
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  if (overallWinner === "you") {
    const diff = yourScore - partnerScore;
    if (diff >= 40) {
      const msgs = [
        `${partnerName} needs to step up their game! 🏆`,
        `Absolute domination! You're crushing it! 🔥`,
        `No competition today! You're on fire! 💪`,
      ];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
    if (diff >= 20) {
      const msgs = [
        `You're in the lead! Keep it up, ${partnerName} is chasing! 🏃`,
        `Nice lead! Don't get too comfortable though! 😎`,
        `You're winning! But ${partnerName} is right behind! 👀`,
      ];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
    const msgs = [
      `Close one! You're barely ahead! 😅`,
      `Slim lead! ${partnerName} could catch up any moment! ⚡`,
      `A narrow victory today! Every water & meal counts! 💧`,
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // Partner is winning
  const diff = partnerScore - yourScore;
  if (diff >= 40) {
    const msgs = [
      `${partnerName} is showing you how it's done! 🔥`,
      `You got destroyed today! Time to bounce back! 💪`,
      `${partnerName} is the champion today! Learn from the best! 👑`,
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (diff >= 20) {
    const msgs = [
      `${partnerName} is in the lead! Can you catch up? 🏃`,
      `Behind but not out! Tomorrow is a new day! 🌅`,
      `${partnerName} is pulling ahead! Step it up! ⚡`,
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  const msgs = [
    `So close! Just a little more and you'll overtake! 😤`,
    `Almost there! One more glass of water could flip it! 💧`,
    `Trailing by a tiny margin! You got this! 💪`,
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ─── Main Component ──────────────────────────────────────────
export function PartnerVs() {
  const { data: session } = useSession();
  const [data, setData] = useState<VsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myName, setMyName] = useState("You");
  const [partnerName, setPartnerName] = useState("Partner");

  useEffect(() => {
    if (session?.user?.name) setMyName(session.user.name);
  }, [session]);

  useEffect(() => {
    async function fetchVs() {
      try {
        setLoading(true);
        const res = await fetch("/api/love-plant/vs");
        if (res.ok) {
          const json: VsResponse = await res.json();
          setData(json);
          setPartnerName(json.partner?.name || "Partner");
          setError(null);
        } else {
          const text = await res.text();
          setError(text || "Failed to load comparison");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchVs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchVs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refetch when love-plant related events happen
  useEffect(() => {
    const handleFocus = () => {
      fetch("/api/love-plant/vs")
        .then((r) => r.json())
        .then((json: VsResponse) => {
          setData(json);
          setPartnerName(json.partner?.name || "Partner");
        })
        .catch(() => {});
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <Frown className="h-8 w-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Could not load comparison</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.you || !data?.partner) {
    return null;
  }

  const trashTalk = getTrashTalk(
    data.overallWinner,
    data.overallYourScore,
    data.overallPartnerScore,
    myName,
    partnerName
  );

  const overallPct = Math.max(data.overallYourScore, data.overallPartnerScore, 1);
  const yourBarWidth = (data.overallYourScore / overallPct) * 100;
  const partnerBarWidth = (data.overallPartnerScore / overallPct) * 100;

  return (
    <Card className="relative overflow-hidden group/card">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-50/20 via-transparent to-indigo-50/20 dark:from-rose-900/5 dark:via-transparent dark:to-indigo-900/5" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-rose-200/20 dark:bg-rose-500/10 blur-3xl animate-float" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-200/20 dark:bg-indigo-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <CardHeader className="relative pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Swords className="h-5 w-5 text-rose-500" />
            Partner Challenge ⚔️
          </CardTitle>
          {data.overallWinner && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm animate-bounce-in",
                data.overallWinner === "you"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                  : data.overallWinner === "partner"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              )}
            >
              {data.overallWinner === "tie"
                ? "🤝 Tied!"
                : data.overallWinner === "you"
                ? "👑 You're Winning!"
                : "👑 Partner's Winning!"}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* ─── Overall Score Face-off ─── */}
        <div className="rounded-xl bg-gradient-to-br from-rose-50/80 to-indigo-50/80 dark:from-rose-950/20 dark:to-indigo-950/20 border border-border/40 p-4">
          <div className="flex items-center justify-between mb-3">
            {/* You */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-lg transition-all duration-500",
                  data.overallWinner === "you"
                    ? "bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-rose-300/50 animate-bounce-in"
                    : "bg-secondary/80 text-muted-foreground"
                )}
              >
                {myName.charAt(0).toUpperCase()}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium max-w-[60px] truncate",
                  data.overallWinner === "you" ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"
                )}
              >
                {myName}
              </span>
              <span className="text-lg font-black tabular-nums">
                {data.overallYourScore}%
              </span>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-indigo-500 shadow-lg shadow-rose-300/30 dark:shadow-rose-800/30 animate-pulse-soft">
                <Swords className="h-5 w-5 text-white" />
              </div>
              <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                VS
              </span>
            </div>

            {/* Partner */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-lg transition-all duration-500",
                  data.overallWinner === "partner"
                    ? "bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-indigo-300/50 animate-bounce-in"
                    : "bg-secondary/80 text-muted-foreground"
                )}
              >
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium max-w-[60px] truncate",
                  data.overallWinner === "partner" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-muted-foreground"
                )}
              >
                {partnerName}
              </span>
              <span className="text-lg font-black tabular-nums">
                {data.overallPartnerScore}%
              </span>
            </div>
          </div>

          {/* Overall bar */}
          <div className="relative flex items-center gap-1">
            <div className="flex-1 h-3 rounded-full bg-secondary/60 overflow-hidden relative">
              <div
                className={cn(
                  "absolute inset-y-0 right-0 rounded-full transition-all duration-1000 ease-out",
                  data.overallWinner === "you"
                    ? "bg-gradient-to-l from-rose-400 to-rose-300"
                    : "bg-gradient-to-l from-rose-200 to-rose-100 dark:from-rose-800/20 dark:to-rose-700/10"
                )}
                style={{ width: `${yourBarWidth}%` }}
              />
              {data.overallWinner === "you" && (
                <Trophy className="absolute top-1/2 -translate-y-1/2 h-3 w-3 text-yellow-400 animate-bounce" style={{ left: `calc(${yourBarWidth}% - 8px)` }} />
              )}
            </div>
            <span className="text-[9px] font-bold text-muted-foreground/40 w-4 text-center shrink-0">⚡</span>
            <div className="flex-1 h-3 rounded-full bg-secondary/60 overflow-hidden relative">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
                  data.overallWinner === "partner"
                    ? "bg-gradient-to-r from-indigo-400 to-indigo-300"
                    : "bg-gradient-to-r from-indigo-200 to-indigo-100 dark:from-indigo-800/20 dark:to-indigo-700/10"
                )}
                style={{ width: `${partnerBarWidth}%` }}
              />
              {data.overallWinner === "partner" && (
                <Trophy className="absolute top-1/2 -translate-y-1/2 h-3 w-3 text-yellow-400 animate-bounce" style={{ left: `calc(${partnerBarWidth}% - 8px)` }} />
              )}
            </div>
          </div>

          {/* Mood comparison */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
            <div className="flex-1">
              <MoodDisplay mood={data.you.today.mood} side="left" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Mood</span>
              <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
            </div>
            <div className="flex-1">
              <MoodDisplay mood={data.partner.today.mood} side="right" />
            </div>
          </div>
        </div>

        {/* ─── Trash Talk ─── */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-100/80 to-indigo-100/80 dark:from-rose-900/20 dark:to-indigo-900/20 px-3 py-1.5 text-[11px] font-medium text-foreground/80 shadow-sm animate-bounce-in">
            <Zap className="h-3 w-3 text-amber-500" />
            {trashTalk}
          </span>
        </div>

        {/* ─── Category Breakdown ─── */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Target className="h-3 w-3" />
            Category Showdown
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {data.categories.map((cat) => {
              const { key, ...rowProps } = cat;
              return <CategoryRow key={key} {...rowProps} />;
            })}
          </div>
        </div>

        {/* ─── Streak / Achievements comparison ─── */}
        <div className="flex items-center justify-center gap-4 rounded-xl border border-border/40 bg-card/30 p-3">
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[10px] font-medium text-muted-foreground">
              Daily champ:{" "}
              <span className="text-foreground font-semibold">
                {data.overallWinner === "you"
                  ? myName
                  : data.overallWinner === "partner"
                  ? partnerName
                  : "Nobody (tie!)"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-medium text-muted-foreground">
              Categories won:{" "}
              <span className="text-foreground font-semibold">
                {data.categories.filter((c) => c.winner === "you").length} -{" "}
                {data.categories.filter((c) => c.winner === "partner").length}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
