"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Eye,
  EyeOff,
  Smartphone,
  Clock,
  AlertTriangle,
  Crosshair,
  Zap,
  Battery,
  BatteryCharging,
  Footprints,
  Car,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingStatusProps {
  isSharing: boolean;
  partnerIsSharing: boolean;
  wakeLockActive: boolean;
  partnerName?: string;
  userName?: string;
  /** Timestamp (ms) of last successful location send */
  lastUpdatedAt?: number | null;
  /** Timestamp string of partner's last location update */
  partnerLocationTimestamp?: string | null;
  /** My location accuracy in meters */
  myAccuracy?: number | null;
  /** Partner's location accuracy in meters */
  partnerAccuracy?: number | null;
  /** Partner's speed in m/s */
  partnerSpeed?: number | null;
  /** Battery optimisation mode ('high' | 'low') */
  batteryMode?: "high" | "low";
}

function timeAgo(timestamp: number | string | null | undefined): string | null {
  if (!timestamp) return null;
  const now = Date.now();
  const then = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  const diffMs = now - then;
  if (diffMs < 0) return "just now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

/** Get accuracy color and label */
function getAccuracyInfo(accuracy: number | null | undefined): {
  color: string;
  label: string;
  bgClass: string;
  dotClass: string;
} {
  if (accuracy === null || accuracy === undefined) {
    return { color: "#9ca3af", label: "Unavailable", bgClass: "bg-gray-100 dark:bg-gray-800/40", dotClass: "bg-gray-400" };
  }
  if (accuracy < 15) {
    return { color: "#22c55e", label: "High", bgClass: "bg-emerald-50 dark:bg-emerald-900/20", dotClass: "bg-emerald-500" };
  }
  if (accuracy < 50) {
    return { color: "#eab308", label: "Medium", bgClass: "bg-amber-50 dark:bg-amber-900/20", dotClass: "bg-amber-500" };
  }
  if (accuracy < 150) {
    return { color: "#f97316", label: "Low", bgClass: "bg-orange-50 dark:bg-orange-900/20", dotClass: "bg-orange-500" };
  }
  return { color: "#ef4444", label: "Poor", bgClass: "bg-red-50 dark:bg-red-900/20", dotClass: "bg-red-500" };
}

/** Format speed from m/s to human-readable */
function formatSpeed(speed: number | null | undefined): { text: string; icon: typeof Zap } | null {
  if (speed === null || speed === undefined) return null;
  if (speed < 0.5) return { text: "Stationary", icon: Zap };
  if (speed < 1.5) return { text: `${(speed * 3.6).toFixed(0)} km/h · Walking`, icon: Footprints };
  if (speed < 5) return { text: `${(speed * 3.6).toFixed(0)} km/h · Running`, icon: Navigation };
  return { text: `${(speed * 3.6).toFixed(0)} km/h · Driving`, icon: Car };
}

export function TrackingStatus({
  isSharing,
  partnerIsSharing,
  wakeLockActive,
  partnerName = "Bachha",
  userName = "You",
  lastUpdatedAt,
  partnerLocationTimestamp,
  myAccuracy,
  partnerAccuracy,
  partnerSpeed,
  batteryMode = "high",
}: TrackingStatusProps) {
  const [now, setNow] = useState(Date.now());

  // Refresh time-ago labels every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const myTimeAgo = timeAgo(lastUpdatedAt);
  const partnerTimeAgo = timeAgo(partnerLocationTimestamp);

  // Partner is stale if no update in 5+ minutes
  const partnerStale =
    partnerLocationTimestamp &&
    now - new Date(partnerLocationTimestamp).getTime() > 5 * 60 * 1000;

  const myAccuracyInfo = getAccuracyInfo(myAccuracy);
  const partnerAccuracyInfo = getAccuracyInfo(partnerAccuracy);
  const speedInfo = formatSpeed(partnerSpeed);

  return (
    <div className="space-y-1.5">
      {/* My status */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all",
          isSharing
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
            : "bg-muted/50 text-muted-foreground"
        )}
      >
        {isSharing ? (
          <Eye className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="flex-1 min-w-0">
          <span className="font-medium">{userName}:</span>{" "}
          {isSharing ? "Sharing" : "Not sharing"}
          {myTimeAgo && isSharing && (
            <span className="text-[10px] opacity-60 ml-1">({myTimeAgo})</span>
          )}
        </span>
        {isSharing && (
          <span className="flex items-center gap-1 text-[10px] font-medium shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* My accuracy indicator */}
      {isSharing && myAccuracy !== null && myAccuracy !== undefined && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30">
          <Crosshair className="h-3 w-3 shrink-0" />
          <span className="flex-1">
            Accuracy:{" "}
            <span className="font-medium" style={{ color: myAccuracyInfo.color }}>
              ±{Math.round(myAccuracy)}m
            </span>
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[9px] font-medium",
              myAccuracyInfo.bgClass
            )}
            style={{ color: myAccuracyInfo.color }}
          >
            {myAccuracyInfo.label}
          </span>
        </div>
      )}

      {/* Partner status */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all",
          partnerIsSharing
            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
            : "bg-muted/50 text-muted-foreground"
        )}
      >
        {partnerIsSharing ? (
          <MapPin className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <MapPin className="h-3.5 w-3.5 shrink-0 opacity-40" />
        )}
        <span className="flex-1 min-w-0">
          <span className="font-medium">{partnerName}:</span>{" "}
          {partnerIsSharing ? "Sharing" : "Not sharing"}
          {partnerTimeAgo && partnerIsSharing && (
            <span className="text-[10px] opacity-60 ml-1">
              ({partnerTimeAgo})
            </span>
          )}
        </span>
        {partnerIsSharing && !partnerStale && (
          <span className="flex items-center gap-1 text-[10px] font-medium shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Live
          </span>
        )}
        {partnerIsSharing && partnerStale && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-3 w-3" />
            Stale
          </span>
        )}
      </div>

      {/* Partner accuracy indicator */}
      {partnerIsSharing && partnerAccuracy !== null && partnerAccuracy !== undefined && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30">
          <Crosshair className="h-3 w-3 shrink-0" />
          <span className="flex-1">
            {partnerName}&apos;s accuracy:{" "}
            <span className="font-medium" style={{ color: partnerAccuracyInfo.color }}>
              ±{Math.round(partnerAccuracy)}m
            </span>
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[9px] font-medium",
              partnerAccuracyInfo.bgClass
            )}
            style={{ color: partnerAccuracyInfo.color }}
          >
            {partnerAccuracyInfo.label}
          </span>
        </div>
      )}

      {/* Partner speed display */}
      {partnerIsSharing && speedInfo && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30">
          <speedInfo.icon className="h-3 w-3 shrink-0" />
          <span>{partnerName}: {speedInfo.text}</span>
        </div>
      )}

      {/* Stale warning */}
      {partnerIsSharing && partnerStale && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            {partnerName} may have closed the app. Last update{" "}
            {partnerTimeAgo}.
          </span>
        </div>
      )}

      {/* Battery mode indicator */}
      {isSharing && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px]",
            batteryMode === "low"
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
              : "bg-muted/30 text-muted-foreground"
          )}
        >
          {batteryMode === "low" ? (
            <Battery className="h-3 w-3 shrink-0" />
          ) : (
            <BatteryCharging className="h-3 w-3 shrink-0" />
          )}
          <span>
            {batteryMode === "low"
              ? "Battery Saver: low accuracy, updates every 30s"
              : "High Accuracy: precise updates every 5s"}
          </span>
        </div>
      )}

      {/* Wake lock status */}
      {wakeLockActive && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30">
          <Smartphone className="h-3 w-3 shrink-0" />
          <span>Screen will stay on while tracking</span>
        </div>
      )}

      {/* Location off warning */}
      {!isSharing && lastUpdatedAt && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Last shared {myTimeAgo}</span>
        </div>
      )}
    </div>
  );
}
