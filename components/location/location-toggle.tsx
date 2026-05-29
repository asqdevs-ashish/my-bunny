"use client";

import { Button } from "@/components/ui/button";
import { MapPin, MapPinOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationToggleProps {
  isSharing: boolean;
  isSupported: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function LocationToggle({
  isSharing,
  isSupported,
  onToggle,
  disabled,
}: LocationToggleProps) {
  if (!isSupported) {
    return (
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 p-3 text-center">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          Geolocation is not supported on this device
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={onToggle}
      disabled={disabled}
      size="lg"
      className={cn(
        "w-full gap-2 transition-all duration-300 text-sm font-semibold shadow-lg",
        isSharing
          ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200/50 dark:shadow-rose-900/30"
          : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-emerald-200/50 dark:shadow-emerald-900/30"
      )}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSharing ? (
        <MapPinOff className="h-4 w-4" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      {isSharing ? "Stop Sharing Location" : "Start Sharing Location"}
    </Button>
  );
}
