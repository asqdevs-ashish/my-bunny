"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Droplets, Heart, UtensilsCrossed, Smile, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/use-notifications";

interface NotificationSettingsProps {
  permission: NotificationPermission | "loading";
  preferences: Record<NotificationType, boolean>;
  requestPermission: () => Promise<boolean>;
  updatePreference: (type: NotificationType, value: boolean) => void;
}

const notifItems: {
  type: NotificationType;
  label: string;
  description: string;
  icon: typeof Bell;
  color: string;
}[] = [
  {
    type: "water",
    label: "Water Reminder",
    description: "Every 2 hours — stay hydrated baby! 💧",
    icon: Droplets,
    color: "text-blue-500",
  },
  {
    type: "meal",
    label: "Meal Time",
    description: "Breakfast, lunch & dinner reminders 🍽️",
    icon: UtensilsCrossed,
    color: "text-amber-500",
  },
  {
    type: "love",
    label: "Love Notes",
    description: "Random cute messages throughout the day 💕",
    icon: Heart,
    color: "text-rose-500",
  },
  {
    type: "mood",
    label: "Mood Check",
    description: "Afternoon check-in — \"How are you feeling?\" 🥰",
    icon: Smile,
    color: "text-purple-500",
  },
];

export function NotificationSettings({
  permission,
  preferences,
  requestPermission,
  updatePreference,
}: NotificationSettingsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const needsPermission = permission === "default" || permission === "loading";

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-purple-500" />
          <span className="min-w-0 truncate">Reminders</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6">
        {permission === "denied" && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400 text-center">
            Notifications are blocked. Enable them in your browser settings to get reminders! 🔔
          </div>
        )}

        {needsPermission && (
          <Button
            onClick={requestPermission}
            size="sm"
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Bell className="h-4 w-4" />
            Enable Notifications 💕
          </Button>
        )}

        {permission === "granted" && (
          <div className="space-y-2">
            {notifItems.map((item) => {
              const Icon = item.icon;
              const isEnabled = preferences[item.type];

              return (
                <button
                  key={item.type}
                  onClick={() => updatePreference(item.type, !isEnabled)}
                  className={cn(
                    "flex w-full items-center gap-2 sm:gap-3 rounded-xl border p-2.5 sm:p-3 text-left transition-all duration-200 active:scale-[0.99]",
                    isEnabled
                      ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 shadow-sm"
                      : "border-border bg-transparent opacity-60 hover:opacity-80"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-all",
                      isEnabled ? "bg-purple-100 dark:bg-purple-900/30 shadow-sm" : "bg-muted"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium leading-tight">{item.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 items-center rounded-full transition-all duration-300",
                      isEnabled
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm"
                        : "bg-muted-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white shadow-md transition-all duration-300",
                        isEnabled ? "translate-x-[18px] sm:translate-x-[22px]" : "translate-x-[2px]"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground pt-1">
          <Sparkles className="h-3 w-3" />
          <span>Reminders work while the app is open</span>
          <Sparkles className="h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  );
}
