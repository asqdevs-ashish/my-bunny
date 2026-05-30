"use client";

import { MapPin, Footprints, Car, Route, Navigation } from "lucide-react";
import { estimateTravelTime, formatDistance } from "@/lib/location/haversine";
import { cn } from "@/lib/utils";

interface DistanceBadgeProps {
  distanceKm: number | null;
  partnerIsSharing: boolean;
  partnerName?: string;
  /** Route-based distance (actual road/path) in km — more accurate */
  routeDistanceKm?: number | null;
  /** Route duration in seconds */
  routeDurationSec?: number | null;
  /** Whether the main distance displayed is route-based */
  isRouteDistance?: boolean;
}

export function DistanceBadge({
  distanceKm,
  partnerIsSharing,
  partnerName = "Bachha",
  routeDistanceKm,
  routeDurationSec,
  isRouteDistance = false,
}: DistanceBadgeProps) {
  if (distanceKm === null) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border/50 p-4 text-center">
        <MapPin className="h-5 w-5 mx-auto text-muted-foreground/50 mb-1" />
        <p className="text-xs text-muted-foreground">
          {partnerIsSharing
            ? "Calculating distance..."
            : "Enable sharing to see distance"}
        </p>
      </div>
    );
  }

  // Use route distance if available, otherwise fall back to haversine
  const displayKm = routeDistanceKm ?? distanceKm;
  const showingRoute = routeDistanceKm !== null;
  const travel = estimateTravelTime(displayKm);
  const isClose = displayKm < 0.1; // less than 100m
  const isNearby = displayKm < 1; // less than 1km

  // Format route duration if available
  const formatDuration = (sec: number | null): string | null => {
    if (sec === null) return null;
    const min = Math.round(sec / 60);
    if (min < 1) return "< 1 min";
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const durationText = routeDurationSec ? formatDuration(routeDurationSec) : null;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2 transition-all",
        isClose
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30"
          : isNearby
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30"
          : "bg-card border-border"
      )}
    >
      {/* Distance */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Distance from {partnerName}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          {showingRoute && (
            <Route className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <p className="text-2xl font-bold tabular-nums">
            {formatDistance(displayKm)}
          </p>
        </div>
        {showingRoute && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center justify-center gap-1">
            <Navigation className="h-3 w-3" />
            Route distance{durationText ? ` · ${durationText}` : ""}
          </p>
        )}
        {!showingRoute && isRouteDistance && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Calculating route...
          </p>
        )}
        {isClose && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
            You&apos;re very close! 🥰
          </p>
        )}
      </div>

      {/* Travel Time Estimates */}
      {displayKm >= 0.1 && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 px-2.5 py-2">
            <Footprints className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">
              {travel.walking} walk
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 px-2.5 py-2">
            <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">
              {travel.driving} drive
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
