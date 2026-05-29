"use client";

import {
  MapPin,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingStatusProps {
  isSharing: boolean;
  partnerIsSharing: boolean;
  wakeLockActive: boolean;
  partnerName?: string;
  userName?: string;
}

export function TrackingStatus({
  isSharing,
  partnerIsSharing,
  wakeLockActive,
  partnerName = "Partner",
  userName = "You",
}: TrackingStatusProps) {
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
        <span className="flex-1">
          {userName}: {isSharing ? "Location shared" : "Not sharing"}
        </span>
        {isSharing && (
          <span className="flex items-center gap-1 text-[10px] font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>

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
        <span className="flex-1">
          {partnerName}: {partnerIsSharing ? "Location shared" : "Not sharing"}
        </span>
        {partnerIsSharing && (
          <span className="flex items-center gap-1 text-[10px] font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* Wake lock status */}
      {wakeLockActive && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30">
          <Smartphone className="h-3 w-3 shrink-0" />
          <span>Screen will stay on while tracking</span>
        </div>
      )}
    </div>
  );
}
