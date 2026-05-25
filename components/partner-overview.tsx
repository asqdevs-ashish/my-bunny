"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Heart,
  Users,
  Droplets,
  UtensilsCrossed,
  Link2,
  Copy,
  Check,
  Loader2,
  Sparkles,
  ExternalLink,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerData {
  linked: boolean;
  partnerSince: string | null;
  partner: {
    id: string;
    name: string;
    email: string;
    today: {
      meals: Array<{
        id: string;
        mealName: string;
        isOutside: boolean;
        cost: number | null;
        createdAt: string;
      }>;
      mood: { mood: string; note: string | null } | null;
      waterGlasses: number;
    };
  } | null;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊",
  stressed: "😰",
  tired: "😴",
  productive: "💪",
};

const MOOD_LABEL: Record<string, string> = {
  happy: "Happy",
  stressed: "Stressed",
  tired: "Tired",
  productive: "Productive",
};

export function PartnerOverview() {
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchPartnerOverview();

    // Auto-refresh every 30 seconds for live feel
    const interval = setInterval(fetchPartnerOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPartnerOverview() {
    try {
      const res = await fetch("/api/partner/overview");
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

  async function handleGenerateCode() {
    try {
      const res = await fetch("/api/partner/code", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setPartnerCode(json.code);
        setError("");
      } else {
        setError("Failed to generate code");
      }
    } catch {
      setError("Something went wrong");
    }
  }

  async function handleLinkPartner() {
    if (!codeInput.trim()) return;
    setLinking(true);
    setError("");

    try {
      const res = await fetch("/api/partner/code", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });

      if (res.ok) {
        setShowLinkDialog(false);
        setCodeInput("");
        fetchPartnerOverview();
      } else {
        const text = await res.text();
        setError(text || "Failed to link");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLinking(false);
    }
  }

  async function handleCopyCode() {
    if (partnerCode) {
      await navigator.clipboard.writeText(partnerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-rose-500" />
            Partner Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not linked state
  if (!data?.linked || !data?.partner) {
    return (
      <Card className="relative overflow-hidden group/card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-rose-500" />
            Partner Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showLinkDialog ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20">
                <Heart className="h-6 w-6 text-rose-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Link with your partner to see each other&apos;s daily updates! 💕
              </p>
              <Button
                onClick={() => setShowLinkDialog(true)}
                size="sm"
                className="gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-md"
              >
                <Link2 className="h-4 w-4" />
                Link with Partner
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-slide-up">
              {/* Generate Code Option */}
              <div className="rounded-xl border border-border p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Step 1: Generate your code and share with your partner
                </p>
                {partnerCode ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-secondary/50 px-3 py-2 text-center font-mono text-lg font-bold tracking-widest text-foreground">
                      {partnerCode}
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleGenerateCode}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate My Code
                  </Button>
                )}
              </div>

              {/* Enter Partner Code */}
              <div className="rounded-xl border border-border p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Step 2: Enter your partner&apos;s code
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    maxLength={6}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-rose-300 dark:focus:border-rose-700 focus:ring-1 focus:ring-rose-300/30"
                  />
                  <Button
                    onClick={handleLinkPartner}
                    disabled={codeInput.length !== 6 || linking}
                    size="sm"
                    className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    {linking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    Link
                  </Button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-600 dark:text-red-400 text-center">
                  {error}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLinkDialog(false);
                  setError("");
                }}
                className="w-full text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Linked — show partner overview
  const partner = data.partner;
  const { today } = partner;
  const mealCount = today.meals.length;

  return (
    <Card className="relative overflow-hidden group/card hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/partner/${partner.id}`)}
    >
      {/* Gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-500" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 animate-pulse-soft">
              <Heart className="h-3.5 w-3.5 text-rose-500" fill="currentColor" />
            </div>
            {partner.name || "Partner"}
          </CardTitle>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity" />
        </div>
        <p className="text-[11px] text-muted-foreground">
          <Clock className="inline h-3 w-3 mr-0.5" />
          Today&apos;s Update
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          {/* Mood */}
          <div className={cn(
            "flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all",
            today.mood
              ? "bg-purple-50 dark:bg-purple-900/10 border border-purple-200/50 dark:border-purple-800/30"
              : "bg-muted/30"
          )}>
            <span className="text-lg">
              {today.mood ? (MOOD_EMOJI[today.mood.mood] || "🥰") : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              {today.mood ? MOOD_LABEL[today.mood.mood] || today.mood.mood : "No mood"}
            </span>
          </div>

          {/* Water */}
          <div className={cn(
            "flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all",
            today.waterGlasses > 0
              ? "bg-blue-50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30"
              : "bg-muted/30"
          )}>
            <Droplets className={cn(
              "h-5 w-5",
              today.waterGlasses > 0 ? "text-blue-500" : "text-muted-foreground/50"
            )} />
            <span className="text-[10px] text-muted-foreground text-center">
              {today.waterGlasses}/8 glasses
            </span>
          </div>

          {/* Meals */}
          <div className={cn(
            "flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all",
            mealCount > 0
              ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30"
              : "bg-muted/30"
          )}>
            <UtensilsCrossed className={cn(
              "h-5 w-5",
              mealCount > 0 ? "text-amber-500" : "text-muted-foreground/50"
            )} />
            <span className="text-[10px] text-muted-foreground text-center">
              {mealCount} meal{mealCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Today's Meals List */}
        {today.meals.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Aaj kya khaya:
            </p>
            {today.meals.slice(0, 3).map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  meal.isOutside ? "bg-orange-400" : "bg-green-400"
                )} />
                <span className="truncate">{meal.mealName}</span>
                {meal.cost && (
                  <span className="shrink-0 text-[10px] text-muted-foreground/60">
                    ₹{meal.cost}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View Profile Link */}
        <div className="flex items-center justify-center gap-1 pt-1">
          <Sparkles className="h-3 w-3 text-rose-400" />
          <span className="text-[10px] text-muted-foreground">
            Click to see full profile
          </span>
          <Sparkles className="h-3 w-3 text-rose-400" />
        </div>
      </CardContent>
    </Card>
  );
}
