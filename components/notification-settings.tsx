"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Droplets, Heart, UtensilsCrossed, Smile, Sparkles, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/use-notifications";

interface NotificationSettingsProps {
  permission: NotificationPermission | "loading";
  preferences: Record<NotificationType, boolean>;
  requestPermission: () => Promise<boolean>;
  updatePreference: (type: NotificationType, value: boolean) => void;
  webPushSubscribed?: boolean;
  testAllNotifications?: () => Promise<{ type: string; local: boolean; server: boolean }[]>;
}

const notifItems: {
  type: NotificationType;
  label: string;
  description: string;
  icon: any;
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
  testAllNotifications,
}: NotificationSettingsProps) {
  const [mounted, setMounted] = useState(false);
  const [silentHours, setSilentHours] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{ type: string; local: boolean; server: boolean }[] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const needsPermission = permission === "default" || permission === "loading";

  const handleTestAll = async () => {
    if (!testAllNotifications || testing) return;
    setTesting(true);
    setTestResults(null);
    try {
      const results = await testAllNotifications();
      setTestResults(results);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-purple-100 dark:border-purple-900/20 shadow-md">
      <CardHeader className="pb-2 sm:pb-3 border-b border-purple-50 dark:border-purple-900/10">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-purple-600 dark:text-purple-400">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="min-w-0 truncate font-bold">App Reminders</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 px-3 sm:px-6">
        {permission === "denied" && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400 text-center border border-amber-100 dark:border-amber-900/30">
            Notifications are blocked. Enable them in your browser settings to get reminders! 🔔
          </div>
        )}

        {needsPermission && (
          <Button
            onClick={requestPermission}
            size="sm"
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-md py-5"
          >
            <Bell className="h-4 w-4" />
            Enable Notifications 💕
          </Button>
        )}

        {permission === "granted" && (
          <div className="space-y-3">
            {/* Web Push status badge */}
            <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30 px-3 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 leading-none">
                  Smart Reminders Active
                </p>
                <p className="text-[10px] text-green-600/70 dark:text-green-500/70 mt-1">
                  You&apos;ll get alerts while the app is open
                </p>
              </div>
            </div>

            {/* Silent Hours Toggle */}
            <button
              onClick={() => setSilentHours(!silentHours)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-300 active:scale-[0.98]",
                silentHours 
                  ? "border-amber-200 bg-amber-50/40 dark:bg-amber-900/10 shadow-sm" 
                  : "border-border bg-transparent opacity-60 hover:opacity-80"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                silentHours ? "bg-amber-100 dark:bg-amber-900/30 shadow-sm" : "bg-muted"
              )}>
                <Moon className={cn("h-4 w-4", silentHours ? "text-amber-600" : "text-muted-foreground")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight">Silent Hours (10PM - 8AM)</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">No pings during sleep time 😴</p>
              </div>
              <div className={cn("h-5 w-10 rounded-full relative transition-colors duration-300", silentHours ? "bg-amber-500" : "bg-muted-foreground/30")}>
                <div className={cn("h-4 w-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300", silentHours ? "left-[22px]" : "left-0.5")} />
              </div>
            </button>

            <div className="h-px bg-border/50 my-2" />

            {/* Notification Items List */}
            {notifItems.map((item) => {
              const Icon = item.icon;
              const isEnabled = preferences[item.type];

              return (
                <button
                  key={item.type}
                  onClick={() => updatePreference(item.type, !isEnabled)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.98]",
                    isEnabled
                      ? "border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 shadow-sm"
                      : "border-border bg-transparent opacity-60 hover:opacity-80"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                      isEnabled ? "bg-purple-100 dark:bg-purple-900/30 shadow-sm" : "bg-muted"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-tight">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-10 shrink-0 items-center rounded-full transition-all duration-300",
                      isEnabled
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm"
                        : "bg-muted-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
                        isEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
                      )}
                    />
                  </div>
                </button>
              );
            })}

            {/* Test All Notifications Button */}
            <div className="pt-1">
              <Button
                onClick={handleTestAll}
                disabled={testing}
                size="sm"
                variant="outline"
                className="w-full gap-2 rounded-xl border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
              >
                {testing ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                    Sending All 4...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Test All Notifications 🔔
                  </>
                )}
              </Button>

              {/* Test Results */}
              {testResults && (
                <div className="mt-2 rounded-xl bg-gray-50 dark:bg-gray-900/20 border border-gray-200/50 dark:border-gray-800/30 p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Results</p>
                  {testResults.map((r) => (
                    <div key={r.type} className="flex items-center justify-between text-xs">
                      <span className="capitalize">{r.type}</span>
                      <div className="flex items-center gap-2">
                        <span className={r.local ? "text-green-500" : "text-red-500"}>
                          {r.local ? "✓ Local" : "✗ Local"}
                        </span>
                        <span className={r.server ? "text-green-500" : "text-red-500"}>
                          {r.server ? "✓ Server" : "✗ Server"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60 pt-2 text-center leading-relaxed">
          <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
          <span>Reminders keep your health & love on track!</span>
          <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
        </div>
      </CardContent>
    </Card>
  );
}