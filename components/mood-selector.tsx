"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { useMood, MOODS } from "@/lib/use-mood";

export function MoodSelector() {
  const { selectedMood, setSelectedMood, currentMood, mounted } = useMood();

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          How are you feeling today?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;

            return (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all duration-300",
                  mood.bgColor,
                  mood.darkBgColor,
                  isSelected && [
                    "ring-2 ring-offset-2 ring-offset-background shadow-lg animate-bounce-in",
                    mood.selectedBorder,
                    "scale-[1.03]",
                  ].join(' '),
                  !isSelected && "hover:scale-[1.04] active:scale-[0.97] hover:shadow-md"
                )}
                title={mood.description}
              >
                <span className={cn(
                  "text-2xl transition-transform duration-300",
                  isSelected && "scale-110"
                )}>
                  {mood.emoji}
                </span>
                <span className={cn(
                  "text-xs font-medium transition-all",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}>
                  {mood.label}
                </span>
                {isSelected && (
                  <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className={cn(
          "mt-3 rounded-xl border p-3.5 text-center shadow-sm transition-all duration-300",
          selectedMood
            ? "animate-bounce-in border-border/60 bg-gradient-to-br from-white/50 to-secondary/50 dark:from-card dark:to-secondary/30"
            : "border-dashed border-muted-foreground/20 bg-muted/30 dark:bg-muted/10"
        )}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className={cn(
              "h-3 w-3",
              selectedMood ? "text-amber-400" : "text-muted-foreground/40"
            )} />
            <span className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              selectedMood ? "text-muted-foreground/70" : "text-muted-foreground/40"
            )}>
              Vibes Check
            </span>
            <Sparkles className={cn(
              "h-3 w-3",
              selectedMood ? "text-amber-400" : "text-muted-foreground/40"
            )} />
          </div>
          {selectedMood && currentMood ? (
            <p className="text-sm font-medium text-foreground animate-fade-in">
              {currentMood.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 animate-pulse-soft">
              Select how's your day going... ✨
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
