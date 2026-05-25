"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Sparkles } from "lucide-react";

export function LoveNotes() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch("/api/love-notes");
        if (res.ok) {
          const data = await res.json();
          setNote(data.content);
        }
      } catch (error) {
        console.error("Failed to fetch love note:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, []);

  return (
    <Card className="relative overflow-hidden group/card">
      {/* Gradient decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 via-pink-50/30 to-amber-100/50 dark:from-rose-900/10 dark:via-pink-900/5 dark:to-amber-900/10" />

      {/* Floating hearts decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08]">
        <Heart className="absolute top-3 right-6 h-4 w-4 animate-float text-rose-500" fill="currentColor" style={{ animationDelay: '0.5s' }} />
        <Heart className="absolute bottom-8 left-4 h-3 w-3 animate-float text-rose-500" fill="currentColor" style={{ animationDelay: '1.5s' }} />
        <Heart className="absolute top-10 left-1/3 h-2.5 w-2.5 animate-float text-amber-500" fill="currentColor" style={{ animationDelay: '1s' }} />
      </div>

      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 animate-pulse-soft">
            <Heart className="h-3.5 w-3.5 text-rose-500" fill="currentColor" />
          </div>
          Love Note for You 💌
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="animate-scale-in rounded-xl border border-rose-200/50 dark:border-rose-800/30 bg-white/70 dark:bg-black/30 p-4 shadow-sm backdrop-blur-sm">
          {loading ? (
            <div className="h-5 w-full animate-pulse rounded bg-rose-100 dark:bg-rose-900/20" />
          ) : (
            <p className="text-sm leading-relaxed text-foreground/80 italic">
              “{note || "You are loved! ❤️"}”
            </p>
          )}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Sparkles className="h-3 w-3 text-rose-400" />
          <span>A little love, delivered fresh daily</span>
          <Sparkles className="h-3 w-3 text-rose-400" />
        </div>
      </CardContent>
    </Card>
  );
}
