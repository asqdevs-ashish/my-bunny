"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  Navigation,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  createdAt: string;
}

interface LocationTimelineProps {
  partnerName?: string;
  /** If true, auto-refresh the history periodically */
  autoRefresh?: boolean;
}

// ─── Component ────────────────────────────────────────────────

export function LocationTimeline({
  partnerName = "Partner",
  autoRefresh = false,
}: LocationTimelineProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/location/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setHasMore((data.history?.length || 0) > 5);
      }
    } catch (err) {
      console.error("Failed to fetch location history:", err);
      setError("Could not load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const displayEntries = expanded ? history : history.slice(-5);
  const isEmpty = !loading && history.length === 0;

  // ─── Format time ───────────────────────────────────────────

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSpeed = (speed: number | null) => {
    if (speed === null) return null;
    const kmh = (speed * 3.6).toFixed(0);
    return `${kmh} km/h`;
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-3 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Movement History
            {!loading && (
              <span className="text-xs text-muted-foreground font-normal ml-1.5">
                ({history.length} {history.length === 1 ? "point" : "points"})
              </span>
            )}
          </span>
        </div>
        {!loading && !isEmpty && (
          <div className="text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          expanded ? "max-h-[500px]" : history.length > 5 ? "max-h-[300px]" : "max-h-[400px]"
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center px-4">
            <MapPin className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              No location history yet. Start sharing to build a movement trail.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {displayEntries.map((entry, i) => {
              const isLatest = i === displayEntries.length - 1;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors",
                    isLatest && "bg-rose-50/50 dark:bg-rose-900/10"
                  )}
                >
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full border-2 shrink-0",
                        isLatest
                          ? "border-rose-400 bg-rose-400"
                          : "border-muted-foreground/30 bg-background"
                      )}
                    />
                    {i < displayEntries.length - 1 && (
                      <div className="w-px flex-1 min-h-[20px] bg-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">
                        {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.speed !== null && entry.speed > 0.5 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                          <Navigation className="h-2.5 w-2.5" />
                          {formatSpeed(entry.speed)}
                        </span>
                      )}
                      {entry.accuracy !== null && entry.accuracy < 100 && (
                        <span className="text-[10px] text-green-600 dark:text-green-400">
                          ±{Math.round(entry.accuracy)}m
                        </span>
                      )}
                      {entry.accuracy !== null && entry.accuracy >= 100 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          ±{Math.round(entry.accuracy)}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show more / less toggle */}
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
              >
                {expanded
                  ? "Show less"
                  : `Show ${history.length - 5} more...`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
