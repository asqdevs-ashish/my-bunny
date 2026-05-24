"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Sparkles, Trophy } from "lucide-react";
import { MAX_WATER_GLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CIRCUMFERENCE = 2 * Math.PI * 80; // 502.65
const STORAGE_KEY = "chef-cupid-water-glasses";

export function WaterTracker() {
  const [glasses, setGlasses] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();
    const savedData = saved ? JSON.parse(saved) : {};

    if (savedData.date === today) {
      setGlasses(savedData.count || 0);
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, count: 0 })
      );
    }
  }, []);

  function addGlass() {
    const newCount = Math.min(glasses + 1, MAX_WATER_GLASSES);
    setGlasses(newCount);

    const today = new Date().toDateString();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: newCount })
    );

    if (newCount === MAX_WATER_GLASSES) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
    }
  }

  function resetGlasses() {
    setGlasses(0);
    const today = new Date().toDateString();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: 0 })
    );
  }

  const progress = glasses / MAX_WATER_GLASSES;
  const strokeDashoffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  if (!mounted) return null;

  return (
    <Card className="relative overflow-hidden group/card">
      {/* Water ripple decoration */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-900/5" />

      <CardHeader className="relative pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="h-5 w-5 text-blue-500" />
          Hydration Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="relative flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          {/* Water background drops */}
          {glasses > 0 && glasses < MAX_WATER_GLASSES && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Droplets
                className="h-32 w-32 text-blue-500/[0.03] animate-float"
                style={{ animationDuration: '6s' }}
              />
            </div>
          )}
          <svg
            width={200}
            height={200}
            className="-rotate-90 drop-shadow-lg"
            viewBox="0 0 200 200"
          >
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="currentColor"
              className="text-blue-100 dark:text-blue-900/30"
              strokeWidth="12"
            />
            {/* Glow filter */}
            {glasses > 0 && (
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="rgba(59,130,246,0.15)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                className="water-progress"
                style={{ filter: 'blur(4px)', transitionDelay: '0.1s' }}
              />
            )}
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#waterGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="water-progress"
            />
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={cn(
              "text-3xl sm:text-4xl font-bold transition-all duration-500",
              glasses > 0 ? "text-blue-600 dark:text-blue-400" : "text-foreground"
            )}>
              {glasses}
            </span>
            <span className="text-xs text-muted-foreground">
              of {MAX_WATER_GLASSES} glasses
            </span>
          </div>
        </div>

        <Button
          onClick={addGlass}
          disabled={glasses >= MAX_WATER_GLASSES}
          variant="outline"
          size="sm"
          className={cn(
            "w-full gap-2 transition-all duration-300 active:scale-95",
            glasses < MAX_WATER_GLASSES
              ? "border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30"
              : "opacity-50"
          )}
        >
          <Droplets className={cn(
            "h-4 w-4 transition-all",
            glasses < MAX_WATER_GLASSES && "text-blue-500 group-hover/card:animate-float"
          )} />
          +1 Glass
        </Button>

        {glasses > 0 && glasses < MAX_WATER_GLASSES && (
          <div className="animate-fade-in w-full rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-xs text-muted-foreground">
                {MAX_WATER_GLASSES - glasses} glass{MAX_WATER_GLASSES - glasses > 1 ? 'es' : ''} to go! Keep going 💪
              </p>
            </div>
          </div>
        )}

        {glasses >= MAX_WATER_GLASSES && (
          <div className="animate-bounce-in w-full text-center">
            {celebrating && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                <Trophy className="h-5 w-5 text-yellow-500 animate-bounce" />
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
            )}
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 p-3">
              <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                🎉 You crushed it! Hydration queen! 👑
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGlasses}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset for tomorrow
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
