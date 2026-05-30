"use client";

import { MapPin, Footprints, Car } from "lucide-react";
import { estimateTravelTime, formatDistance } from "@/lib/location/haversine";
import { cn } from "@/lib/utils";

interface DistanceBadgeProps {
  distanceKm: number | null;
  partnerIsSharing: boolean;
  partnerName?: string;
}

export function DistanceBadge({
  distanceKm,
  partnerIsSharing,
  partnerName = "Bachha",
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

  const travel = estimateTravelTime(distanceKm);
  const isClose = distanceKm < 0.1; // less than 100m
  const isNearby = distanceKm < 1; // less than 1km

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
        <p className="text-2xl font-bold mt-1 tabular-nums">
          {formatDistance(distanceKm)}
        </p>
        {isClose && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
            You&apos;re very close! 🥰
          </p>
        )}
      </div>

      {/* Travel Time Estimates */}
      {distanceKm >= 0.1 && (
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
