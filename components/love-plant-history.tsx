"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, Flower2, Loader2, TrendingUp, TrendingDown, Minus, Calendar, Heart, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  date: string;
  health: number;
  user1Water: number;
  user1Meals: number;
  user2Water: number;
  user2Meals: number;
  stage: "SEED" | "SPROUT" | "PLANT" | "FLOWER";
}

// ─── Tooltip component ────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const health = payload.find((p) => p.dataKey === "health")?.value ?? 0;
  const stage =
    health >= 76 ? "Flower 🌸" : health >= 51 ? "Plant 🌻" : health >= 26 ? "Sprout 🌿" : "Seed 🌱";

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-md shadow-xl p-3 min-w-[160px]">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5">
        <Calendar className="h-3 w-3" />
        {label && new Date(label + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Health</span>
          <span className="text-sm font-bold" style={{ color: health >= 75 ? "#22c55e" : health >= 50 ? "#eab308" : health >= 25 ? "#f97316" : "#ef4444" }}>
            {health}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Stage</span>
          <span className="text-xs font-medium">{stage}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Customized Dot ───────────────────────────────────────────
function CustomDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: HistoryEntry }) {
  if (!cx || !cy || !payload) return null;
  const isToday = payload.date === new Date().toISOString().split("T")[0];
  const radius = isToday ? 6 : 4;

  const dotColor =
    payload.health >= 75
      ? "#22c55e"
      : payload.health >= 50
      ? "#eab308"
      : payload.health >= 25
      ? "#f97316"
      : "#ef4444";

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={dotColor} stroke="white" strokeWidth={2} className="transition-all duration-300" />
      {isToday && (
        <circle cx={cx} cy={cy} r={10} fill="none" stroke={dotColor} strokeWidth={2} opacity={0.3} className="animate-ping" />
      )}
    </g>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function LovePlantHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("You");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/love-plant/history")
      .then((r) => r.json())
      .then((data) => {
        setHistory(data.history || []);
        setPartnerName(data.partnerName);
        setMyName(data.myName || "You");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute stats
  const latestHealth = history.length > 0 ? history[history.length - 1].health : 0;
  const earliestHealth = history.length >= 30 ? history[0].health : null;
  const trend = earliestHealth !== null ? latestHealth - earliestHealth : 0;
  const avgHealth = history.length > 0 ? Math.round(history.reduce((s, h) => s + h.health, 0) / history.length) : 0;
  const totalWater1 = history.reduce((s, h) => s + h.user1Water, 0);
  const totalWater2 = history.reduce((s, h) => s + h.user2Water, 0);
  const totalMeals1 = history.reduce((s, h) => s + h.user1Meals, 0);
  const totalMeals2 = history.reduce((s, h) => s + h.user2Meals, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-200/20 dark:shadow-emerald-900/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-3.5 w-3.5 text-green-500" fill="currentColor" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Current</span>
            </div>
            <p className={cn(
              "text-lg sm:text-xl font-bold tabular-nums",
              latestHealth >= 75 ? "text-green-500" : latestHealth >= 50 ? "text-yellow-500" : latestHealth >= 25 ? "text-orange-500" : "text-red-500"
            )}>
              {latestHealth}%
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg shadow-amber-200/20 dark:shadow-amber-900/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Trend</span>
            </div>
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : trend < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <p className={cn(
                "text-lg sm:text-xl font-bold tabular-nums",
                trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {trend > 0 ? "+" : ""}{trend}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg shadow-indigo-200/20 dark:shadow-indigo-900/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg Health</span>
            </div>
            <p className="text-lg sm:text-xl font-bold tabular-nums text-indigo-500">{avgHealth}%</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg shadow-rose-200/20 dark:shadow-rose-900/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Days</span>
            </div>
            <p className="text-lg sm:text-xl font-bold tabular-nums text-rose-500">{history.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Card */}
      <Card className="relative overflow-hidden border-0 shadow-xl shadow-emerald-200/20 dark:shadow-emerald-900/10 bg-gradient-to-b from-card to-card/50">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/20 via-transparent to-transparent dark:from-emerald-900/5" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              30-Day Health Trend
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="relative">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Sprout className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No history data yet. Start logging to see your trend!</p>
            </div>
          ) : (
            <>
              {/* Stage color legend */}
              <div className="flex flex-wrap items-center gap-3 mb-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Seed (0-25)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Sprout (26-50)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Plant (51-75)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  Flower (76-100)
                </span>
              </div>

              {/* Chart */}
              <div className="w-full h-[280px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#eab308" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.5 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={40}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4", strokeOpacity: 0.3 }} />
                    <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.3} />
                    <ReferenceLine y={50} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.3} />
                    <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.3} />
                    <Area
                      type="monotone"
                      dataKey="health"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      fill="url(#healthGradient)"
                      dot={<CustomDot />}
                      activeDot={{ r: 6, stroke: "white", strokeWidth: 2, fill: "#22c55e" }}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Stats */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/40">
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{myName}</p>
                  <p className="text-xs font-medium text-blue-500 tabular-nums">💧 {totalWater1}</p>
                  <p className="text-xs font-medium text-amber-500 tabular-nums">🍽️ {totalMeals1}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{partnerName || "Partner"}</p>
                  <p className="text-xs font-medium text-blue-500 tabular-nums">💧 {totalWater2}</p>
                  <p className="text-xs font-medium text-amber-500 tabular-nums">🍽️ {totalMeals2}</p>
                </div>
                <div className="text-center col-span-2 sm:col-span-2 flex items-center justify-center gap-2">
                  <Flower2 className="h-4 w-4 text-pink-400" />
                  <p className="text-[10px] text-muted-foreground">
                    {trend > 0
                      ? `Improving! +${trend}% over 30 days ✨`
                      : trend < 0
                      ? `Declining ${trend}% — time to nurture! 🌱`
                      : "Steady as she grows! 🌿"}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
