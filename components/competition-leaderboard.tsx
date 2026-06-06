"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import {
  Trophy,
  Swords,
  Heart,
  Loader2,
  Sparkles,
  Crown,
  Flame,
  Check,
  CheckCircle,
  Zap,
  Target,
  RefreshCw,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/app/api/competition/leaderboard/route";

const STAGE_EMOJI: Record<string, string> = {
  SEED: "🌱",
  SPROUT: "🌿",
  PLANT: "🌻",
  FLOWER: "🌸",
};

const RANK_META: Record<number, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  1: { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Gold" },
  2: { icon: Medal, color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800/40", label: "Silver" },
  3: { icon: Medal, color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Bronze" },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const meta = RANK_META[rank];
    const Icon = meta!.icon;
    return (
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shadow-lg animate-bounce-in", meta!.bg)}>
        <Icon className={cn("h-4 w-4", meta!.color)} fill="currentColor" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-xs font-bold tabular-nums text-muted-foreground">
      {rank}
    </div>
  );
}

function HealthBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "from-green-500 to-emerald-400" :
    value >= 50 ? "from-yellow-500 to-amber-400" :
    value >= 25 ? "from-orange-500 to-amber-500" :
    "from-red-500 to-rose-500";

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/30">
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── Join Flow Component ────────────────────────────────────
function JoinFlow({
  myStatus,
  onRefresh,
}: {
  myStatus: any;
  onRefresh: () => void;
}) {
  const [step, setStep] = useState<"interest" | "naming" | "done">("interest");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (myStatus?.status === "naming") setStep("naming");
    if (myStatus?.status === "joined") setStep("done");
  }, [myStatus]);

  // ── Step 1: Join the competition ──
  const handleJoin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competition/join", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStep("naming");
        onRefresh();
      } else {
        setError(data.error || "Failed to join");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: AI suggest name (stored in DB for both to see) ──
  const handleSuggestName = async () => {
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competition/suggest-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.name) setError("Failed to generate name");
      onRefresh();
    } catch {
      setError("Failed to generate name");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Step 3: Approve the name ──
  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competition/agree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isComplete) {
          setSuccessMsg("🎉 Team name locked! You're in the competition!");
          setStep("done");
        }
        onRefresh();
      } else {
        setError(data.error || "Failed to approve");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Get the current suggested name (from either partner)
  const suggestedName = myStatus?.nameSuggestedByUser1 || myStatus?.nameSuggestedByUser2 || null;
  const myApproved = myStatus?.myAgreed;
  const partnerApproved = myStatus?.partnerAgreed;

  if (step === "done") {
    return (
      <div className="text-center py-4 space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-bounce-in">
          <CheckCircle className="h-7 w-7 text-green-500" />
        </div>
        <p className="text-sm font-bold text-foreground">
          {successMsg || "You're in the competition! 🎉"}
        </p>
        {myStatus?.teamName && (
          <p className="text-xs text-muted-foreground">
            Team: <span className="font-semibold text-foreground">{myStatus.teamName}</span>
          </p>
        )}
      </div>
    );
  }

  if (step === "interest") {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 animate-bounce-in">
          <Swords className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Join the Love Plant League! 🏆</p>
          <p className="text-xs text-muted-foreground mt-1">
            Compete with other couples to see who has the healthiest love plant!
            You and your partner both need to agree to join.
          </p>
        </div>

        {myStatus?.myAgreed && !myStatus?.partnerAgreed && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
            Waiting for {myStatus.partnerName} to agree... 🕐
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-rose-600 dark:text-rose-400">{error}</div>
        )}

        <Button
          onClick={handleJoin}
          disabled={loading || myStatus?.myAgreed}
          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : myStatus?.myAgreed ? (
            <>
              <Check className="h-4 w-4" />
              Agreed ✅
            </>
          ) : (
            <>
              <Swords className="h-4 w-4" />
              Count Me In! 🎮
            </>
          )}
        </Button>
      </div>
    );
  }

  // Naming step — AI suggest + approve
  const bothApproved = myApproved && partnerApproved;
  const nameFromPartner = myStatus?.partnerNameSuggestion;
  const nameFromMe = myStatus?.myNameSuggestion;

  return (
    <div className="space-y-4 py-2">
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">Name Your Team! 🏷️</p>
        <p className="text-xs text-muted-foreground mt-1">
          {suggestedName
            ? `You and ${myStatus?.partnerName} need to approve the team name.`
            : `Use AI to suggest a team name for you and ${myStatus?.partnerName}!`}
        </p>
      </div>

      {/* AI Suggested Name Display */}
      {suggestedName && !bothApproved && (
        <div className="rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 p-4 text-center animate-bounce-in">
          <p className="text-[10px] text-muted-foreground mb-1">✨ AI Suggested Team Name</p>
          <p className="text-xl font-black text-foreground tracking-wide">{suggestedName}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {myApproved && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[9px] font-medium text-green-600 dark:text-green-400">
                <Check className="h-2.5 w-2.5" /> You approved
              </span>
            )}
            {partnerApproved && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[9px] font-medium text-blue-600 dark:text-blue-400">
                <Check className="h-2.5 w-2.5" /> {myStatus?.partnerName} approved
              </span>
            )}
          </div>
        </div>
      )}

      {/* Both approved — just waiting animation */}
      {bothApproved && !myStatus?.teamName && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4 text-center animate-bounce-in">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
            <Loader2 className="h-5 w-5 animate-spin text-green-500" />
          </div>
          <p className="text-sm font-bold text-green-700 dark:text-green-400">
            Both approved! Locking team name... ⏳
          </p>
        </div>
      )}

      {/* Waiting for partner */}
      {myApproved && !partnerApproved && suggestedName && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center text-xs text-amber-700 dark:text-amber-400 animate-slide-up">
          <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />
          Waiting for {myStatus?.partnerName} to approve the name...
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {!suggestedName ? (
          <Button
            onClick={handleSuggestName}
            disabled={aiLoading}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiLoading ? "AI is Thinking..." : "AI Suggest Name ✨"}
          </Button>
        ) : !myApproved ? (
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve Name ✓
          </Button>
        ) : !bothApproved ? (
          <div className="text-center text-xs text-muted-foreground py-1">
            ✅ You approved! Waiting for {myStatus?.partnerName}...
          </div>
        ) : null}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-rose-600 dark:text-rose-400 text-center">{error}</div>
      )}
    </div>
  );
}

// ─── Main Leaderboard Component ────────────────────────────
export function CompetitionLeaderboard() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStatus, setMyStatus] = useState<any>(null);
  const [badges, setBadges] = useState<Array<{ rank: number; title: string; color: string; weekOf: string; coupleKey: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [awardingBadges, setAwardingBadges] = useState(false);
  const [currentUserCoupleKey, setCurrentUserCoupleKey] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getPusherClient>>["subscribe"]> | null>(null);
  const competitionChannelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getPusherClient>>["subscribe"]> | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/competition/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchMyStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/competition/my-status");
      if (res.ok) {
        const data = await res.json();
        setMyStatus(data);
        if (data?.coupleKey) setCurrentUserCoupleKey(data.coupleKey);
      }
    } catch {} finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/competition/badges");
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    fetchMyStatus();
    fetchBadges();
  }, [fetchLeaderboard, fetchMyStatus, fetchBadges]);

  // 🎉 Celebrate when NEW badges appear with confetti (not on initial load)
  const prevBadgeCount = useRef(0);
  useEffect(() => {
    if (badges.length > prevBadgeCount.current) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { x: 0.2, y: 0.4 },
          colors: ["#f59e0b", "#f97316", "#eab308", "#fbbf24"],
          ticks: 200,
        });
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { x: 0.8, y: 0.4 },
          colors: ["#f59e0b", "#f97316", "#eab308", "#fbbf24"],
          ticks: 200,
        });
        setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 100,
            origin: { x: 0.5, y: 0.3 },
            colors: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"],
            shapes: ["star"],
            ticks: 150,
          });
        }, 500);
      }, 500);
      return () => clearTimeout(timer);
    }
    prevBadgeCount.current = badges.length;
  }, [badges.length]);

  // Pusher subscription for real-time updates (partner + public competition channel)
  useEffect(() => {
    const client = getPusherClient();
    if (!client) return;

    // Subscribe to the public competition channel (all couples see these updates)
    try {
      const compChannel = client.subscribe("competition-leaderboard");
      competitionChannelRef.current = compChannel;
      compChannel.bind("competition-update", () => {
        fetchLeaderboard();
      });
      compChannel.bind("badges-updated", () => {
        fetchBadges();
        fetchLeaderboard();
      });
    } catch {}

    const myId = session?.user?.id;
    if (myId) {
      // Partner channel (for partner-specific updates)
      fetch("/api/partner/status")
        .then((r) => r.json())
        .then((status) => {
          if (!status.linked || !status.partner?.id) return;
          const [a, b] = [myId, status.partner.id].sort();
          const channelName = `private-partner-${a}-${b}`;
          const channel = client.subscribe(channelName);
          channelRef.current = channel;

          channel.bind("competition-update", () => {
            fetchLeaderboard();
            fetchMyStatus();
            fetchBadges();
          });
        })
        .catch(() => {});
    }

    // Auto refresh every 30s
    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchMyStatus();
      fetchBadges();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
      if (competitionChannelRef.current) {
        competitionChannelRef.current.unbind_all();
        competitionChannelRef.current = null;
      }
    };
  }, [session?.user?.id, fetchLeaderboard, fetchMyStatus, fetchBadges]);

  const handleAwardBadges = async () => {
    setAwardingBadges(true);
    try {
      await fetch("/api/competition/badges", { method: "POST" });
      await fetchBadges();
      await fetchLeaderboard();
    } catch {} finally {
      setAwardingBadges(false);
    }
  };

  if (loading || statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-muted-foreground">Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canJoin = myStatus?.status === "not_joined" || myStatus?.status === "naming" || myStatus?.status === "no_competition";
  const isJoined = myStatus?.status === "joined";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Join Card ─── */}
      {myStatus?.status !== "no_partner" && canJoin && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-[#1a1a0a] dark:via-[#1a1a0a] dark:to-[#121212] shadow-xl shadow-amber-200/20 dark:shadow-amber-900/10">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200/10 via-transparent to-yellow-200/10 dark:from-amber-500/5 dark:via-transparent dark:to-yellow-500/5 animate-gradient" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-3xl animate-float" />
            <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-yellow-200/30 dark:bg-yellow-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>
          <CardContent className="relative p-4 sm:p-6">
            <JoinFlow myStatus={myStatus} onRefresh={fetchMyStatus} />
          </CardContent>
        </Card>
      )}

      {/* ─── Joined Confirmation ─── */}
      {myStatus?.status === "naming" && (
        <Card className="border-amber-200 dark:border-amber-800/50">
          <CardContent className="p-4">
            <JoinFlow myStatus={myStatus} onRefresh={fetchMyStatus} />
          </CardContent>
        </Card>
      )}

      {/* ─── Weekly Badges Section ─── */}
      {badges.length > 0 && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 shadow-lg">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-yellow-200/40 dark:bg-yellow-500/10 blur-2xl animate-float" />
          </div>
          <CardContent className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-bold text-foreground">🏆 This Week&apos;s Champions</p>
              </div>
              <button
                onClick={handleAwardBadges}
                disabled={awardingBadges}
                className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {awardingBadges ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {badges.map((badge) => {
                const entry = entries.find((e) => e.coupleKey === badge.coupleKey);
                return (
                  <div
                    key={badge.coupleKey}
                    className={cn(
                      "rounded-xl p-3 text-center animate-bounce-in border",
                      badge.rank === 1
                        ? "bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800/50"
                        : badge.rank === 2
                        ? "bg-gradient-to-b from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/20 border-gray-200 dark:border-gray-700/50"
                        : "bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50"
                    )}
                  >
                    <p className="text-lg font-black">{badge.title}</p>
                    {entry && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {entry.teamName || `${entry.user1Name} & ${entry.user2Name}`}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Sparkles className={cn(
                        "h-3 w-3",
                        badge.rank === 1 ? "text-yellow-500" : badge.rank === 2 ? "text-gray-400" : "text-amber-700"
                      )} />
                      <span className="text-[8px] text-muted-foreground">Weekly Champions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Leaderboard ─── */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/20 via-transparent to-rose-50/20 dark:from-amber-900/5 dark:via-transparent dark:to-rose-900/5" />

        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 shadow-lg">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Love Plant League 🏆</CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  {entries.length} couple{entries.length !== 1 ? "s" : ""} competing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleAwardBadges}
                disabled={awardingBadges}
                className="text-[9px] text-muted-foreground hover:text-amber-500 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                {awardingBadges ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "🏅 Award Badges"
                )}
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { fetchLeaderboard(); fetchMyStatus(); fetchBadges(); }}
                className="h-8 w-8"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
                <Heart className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-sm font-medium text-foreground">No teams yet!</p>
              <p className="text-xs text-muted-foreground">
                Be the first couple to join the competition! 🎮
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry, idx) => {
                const isMe = entry.coupleKey === currentUserCoupleKey;
                const top3 = idx < 3;
                const badge = badges.find((b) => b.coupleKey === entry.coupleKey);

                return (
                  <div
                    key={entry.coupleKey}
                    className={cn(
                      "group relative rounded-xl p-3 transition-all duration-300",
                      isMe
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800/50 shadow-md"
                        : top3
                        ? "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10 dark:to-transparent border border-border/40 hover:border-border/80"
                        : "border border-transparent hover:border-border/40 hover:bg-secondary/20"
                    )}
                  >
                    {/* Rank glow for top 3 */}
                    {top3 && (
                      <div className={cn(
                        "absolute -inset-px rounded-xl opacity-30 blur-sm pointer-events-none",
                        idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-300" : "bg-amber-600"
                      )} />
                    )}

                    <div className="relative flex items-center gap-3">
                      {/* Rank */}
                      <RankBadge rank={entry.rank} />

                      {/* Team Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground truncate">
                            {entry.teamName || `${entry.user1Name} & ${entry.user2Name}`}
                          </span>
                          {isMe && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              You
                            </span>
                          )}
                          {entry.rank === 1 && (
                            <Crown className="h-3.5 w-3.5 text-yellow-500 animate-bounce" fill="currentColor" />
                          )}
                          {badge && (
                            <span className={cn(
                              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                              badge.rank === 1
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : badge.rank === 2
                                ? "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                              🏅 W{new Date(badge.weekOf).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Names */}
                        <p className="text-[10px] text-muted-foreground truncate">
                          {entry.user1Name} 💕 {entry.user2Name}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <HealthBar value={entry.health} />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-lg font-black tabular-nums">{entry.health}</span>
                            <span className="text-[9px] text-muted-foreground">pts</span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            {entry.streak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-orange-500">
                                <Flame className="h-2.5 w-2.5" />
                                {entry.streak}
                              </span>
                            )}
                            <span className="text-[9px] text-muted-foreground">
                              {STAGE_EMOJI[entry.stage] || "🌱"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Animated rank indicator for top 3 */}
                    {idx === 0 && (
                      <div className="absolute top-1 right-2">
                        <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info footer */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-[9px] text-muted-foreground/60">
            <Zap className="h-2.5 w-2.5" />
            Rankings based on love plant health, streak & achievements
            <Target className="h-2.5 w-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* ─── My Team Card (if joined) ─── */}
      {isJoined && myStatus?.teamName && (
        <Card className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-900/10 dark:to-yellow-900/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 shadow-lg animate-bounce-in">
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Your Team</p>
                <p className="text-sm font-bold text-foreground">{myStatus.teamName}</p>
                <p className="text-[10px] text-muted-foreground">
                  Partner: {myStatus.partnerName}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchLeaderboard(); fetchMyStatus(); }}
                className="gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
