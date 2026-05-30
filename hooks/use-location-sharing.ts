"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import PusherJS from "pusher-js";
import {
  startWatchingPosition,
  stopWatchingPosition,
  type GeoPosition,
} from "@/lib/location/geolocation";
import {
  requestWakeLock,
  releaseWakeLock,
  setupWakeLockAutoReacquire,
} from "@/lib/location/wake-lock";
import { haversineDistance, formatDistance, getRouteDistance } from "@/lib/location/haversine";

// ─── Battery Optimization Constants ────────────────────────────

const HIGH_ACCURACY_OPTS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10_000,
  timeout: 15_000,
};

const LOW_ACCURACY_OPTS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 30_000,
  timeout: 30_000,
};

const HIGH_ACC_THROTTLE_MS = 5_000;
const LOW_ACC_THROTTLE_MS = 30_000;

const STATIONARY_SPEED_THRESHOLD = 0.5; // m/s
const STATIONARY_MS = 30_000; // 30s of being still → switch to low power
const MOVEMENT_SPEED_THRESHOLD = 1.0; // m/s — wake up if moving this fast

// ─── Types ────────────────────────────────────────────────────

export type BatteryMode = "high" | "low";

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

export interface SharingState {
  /** Whether the current user is sharing their location */
  isSharing: boolean;
  /** Whether the partner is sharing their location */
  partnerIsSharing: boolean;
  /** The current user's last known position */
  myLocation: GeoPosition | null;
  /** The partner's live position */
  partnerLocation: LocationUpdate | null;
  /** Distance between the two users in km (straight-line / haversine) */
  distanceKm: number | null;
  /** Formatted distance string like "2.5 km" */
  distanceText: string | null;
  /** Route-based distance (actual road/cycling/walking path) in km */
  routeDistanceKm: number | null;
  /** Route duration in seconds */
  routeDurationSec: number | null;
  /** Whether the displayed distance is route-based (true) or straight-line (false) */
  isRouteDistance: boolean;
  /** Whether geolocation is supported */
  isSupported: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether the wake lock is active */
  wakeLockActive: boolean;
  /** Loading state for initial partner location fetch */
  loading: boolean;
  /** Timestamp (ms) of last successful location send to server */
  lastUpdatedAt: number | null;
  /** Current battery optimization mode */
  batteryMode: BatteryMode;
}

// ─── Hook ──────────────────────────────────────────────────────

export function useLocationSharing() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [state, setState] = useState<SharingState>({
    isSharing: false,
    partnerIsSharing: false,
    myLocation: null,
    partnerLocation: null,
    distanceKm: null,
    distanceText: null,
    routeDistanceKm: null,
    routeDurationSec: null,
    isRouteDistance: false,
    isSupported: false,
    error: null,
    wakeLockActive: false,
    loading: true,
    lastUpdatedAt: null,
    batteryMode: "high",
  });

  const watchIdRef = useRef<number>(-1);
  const cleanupWakeRef = useRef<(() => void) | null>(null);
  const channelRef = useRef<ReturnType<
    NonNullable<typeof PusherJS>["prototype"]["subscribe"]
  > | null>(null);
  const pusherClientRef = useRef<PusherJS | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const lastSentRef = useRef<number>(0);
  const lastSentPositionRef = useRef<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
  } | null>(null);
  const partnerLocationRef = useRef<LocationUpdate | null>(null);
  const myLocationRef = useRef<GeoPosition | null>(null);

  // ── Battery optimisation refs ─────────────────────────────────
  const batteryModeRef = useRef<BatteryMode>("high");
  const lastPositionsRef = useRef<
    Array<{ speed: number | null; timestamp: number }>
  >([]);
  const stationarySinceRef = useRef<number | null>(null);

  // ─── Debounce ref for route distance API calls ───────────────
  const routeDistanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch route distance via OSRM API ──────────────────────
  const fetchRouteDistance = useCallback(
    async (myLat: number, myLng: number, partnerLat: number, partnerLng: number) => {
      const result = await getRouteDistance(myLat, myLng, partnerLat, partnerLng);
      setState((prev) => ({
        ...prev,
        distanceKm: result.distanceKm,
        distanceText: formatDistance(result.distanceKm),
        routeDistanceKm: result.isRoute ? result.distanceKm : null,
        routeDurationSec: result.durationSec,
        isRouteDistance: result.isRoute,
      }));
    },
    []
  );

  // ─── Compute distance between users ──────────────────────────

  const updateDistance = useCallback(
    (
      myLat: number | null,
      myLng: number | null,
      partnerLat: number | null,
      partnerLng: number | null
    ) => {
      if (
        myLat !== null &&
        myLng !== null &&
        partnerLat !== null &&
        partnerLng !== null
      ) {
        // Show haversine immediately (fast), then fetch route distance
        const km = haversineDistance(myLat, myLng, partnerLat, partnerLng);
        setState((prev) => ({
          ...prev,
          distanceKm: km,
          distanceText: formatDistance(km),
        }));

        // Debounce route distance fetch (don't spam API on every position update)
        if (routeDistanceTimeoutRef.current) {
          clearTimeout(routeDistanceTimeoutRef.current);
        }
        routeDistanceTimeoutRef.current = setTimeout(() => {
          fetchRouteDistance(myLat, myLng, partnerLat, partnerLng);
        }, 2000); // Wait 2s after last position update before hitting OSRM
      }
    },
    [fetchRouteDistance]
  );

  // ─── Fetch partner's last known location ─────────────────────

  const fetchPartnerLocation = useCallback(async () => {
    try {
      const res = await fetch("/api/location/get");
      if (res.ok) {
        const data = await res.json();
        if (data.location) {
          const loc: LocationUpdate = {
            userId: data.userId,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            accuracy: data.location.accuracy,
            speed: data.location.speed,
            heading: data.location.heading,
            timestamp: data.location.updatedAt || new Date().toISOString(),
          };
          partnerLocationRef.current = loc;

          // Trigger route distance outside setState (avoid side-effects in setState callback)
          const currentMyLocation = myLocationRef.current;
          if (currentMyLocation) {
            if (routeDistanceTimeoutRef.current) {
              clearTimeout(routeDistanceTimeoutRef.current);
            }
            routeDistanceTimeoutRef.current = setTimeout(() => {
              fetchRouteDistance(
                currentMyLocation.latitude,
                currentMyLocation.longitude,
                loc.latitude,
                loc.longitude
              );
            }, 500);
          }

          setState((prev) => ({
            ...prev,
            partnerLocation: loc,
            partnerIsSharing: data.location.isSharing ?? false,
            loading: false,
          }));
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Failed to fetch partner location:", err);
      setState((prev) => ({ ...prev, loading: false, error: "Failed to fetch partner location" }));
    }
  }, [fetchRouteDistance]);

  // ─── Send location to server (mode-aware throttle) ────────────

  const sendLocation = useCallback(
    async (position: GeoPosition) => {
      // Store position for beforeunload/visibility sendBeacon
      lastSentPositionRef.current = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        speed: position.speed,
        heading: position.heading,
      };

      // Throttle depends on battery mode (5s high / 30s low)
      const throttleMs =
        batteryModeRef.current === "high"
          ? HIGH_ACC_THROTTLE_MS
          : LOW_ACC_THROTTLE_MS;
      const now = Date.now();
      if (now - lastSentRef.current < throttleMs) return;
      lastSentRef.current = now;

      try {
        await fetch("/api/location/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lastSentPositionRef.current),
        });
        setState((prev) => ({ ...prev, lastUpdatedAt: Date.now() }));
      } catch (err) {
        console.error("Failed to send location:", err);
      }
    },
    []
  );

  // ─── Restart the Geolocation watch with a given accuracy mode ─

  const restartWatch = useCallback(
    (mode: BatteryMode) => {
      // Clean up previous watch
      stopWatchingPosition(watchIdRef.current);
      batteryModeRef.current = mode;

      const opts = mode === "high" ? HIGH_ACCURACY_OPTS : LOW_ACCURACY_OPTS;

      const watchId = startWatchingPosition(
        (position) => {
          // ── Update ref (always fresh — avoids stale closures) ──
          myLocationRef.current = position;

          // ── Update state ──
          setState((prev) => ({
            ...prev,
            myLocation: position,
            isSharing: true,
            error: null,
          }));

          // ── Send to server (throttled internally) ──
          sendLocation(position);

          // ── Update distance ──
          const partner = partnerLocationRef.current;
          updateDistance(
            position.latitude,
            position.longitude,
            partner?.latitude ?? null,
            partner?.longitude ?? null
          );

          // ── Motion detection + adaptive accuracy ──
          const { speed, timestamp: ts } = position;
          const history = lastPositionsRef.current;
          history.push({ speed, timestamp: ts });
          if (history.length > 5) history.shift();

          const currentMode = batteryModeRef.current;

          if (currentMode === "high") {
            // Check if we should switch to low power
            const isStationary =
              speed !== null && speed < STATIONARY_SPEED_THRESHOLD;

            if (isStationary) {
              if (stationarySinceRef.current === null) {
                stationarySinceRef.current = ts;
              }
              const stillMs = ts - stationarySinceRef.current;
              if (stillMs >= STATIONARY_MS) {
                console.log("🔋 Battery Saver: switching to low-accuracy mode");
                setState((prev) => ({ ...prev, batteryMode: "low" }));
                restartWatch("low");
              }
            } else {
              // Not stationary — reset timer
              stationarySinceRef.current = null;
            }
          } else {
            // current mode is "low" — check if we should wake up
            const isMoving =
              (speed !== null && speed >= MOVEMENT_SPEED_THRESHOLD);

            if (isMoving) {
              console.log("🔋 Battery Saver: movement detected, switching to high-accuracy mode");
              setState((prev) => ({ ...prev, batteryMode: "high" }));
              stationarySinceRef.current = null;
              restartWatch("high");
            }
          }
        },
        (err) => {
          const msg =
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. Please enable it in your browser settings."
              : err.code === err.TIMEOUT
              ? "Location request timed out. Please try again."
              : "Failed to get location. Please check your GPS is enabled.";
          setState((prev) => ({ ...prev, error: msg }));
        },
        opts
      );

      watchIdRef.current = watchId;
    },
    [sendLocation, updateDistance]
  );

  // ─── Start sharing ───────────────────────────────────────────

  const startSharing = useCallback(async () => {
    if (watchIdRef.current !== -1) return; // Already watching

    // Reset battery state
    batteryModeRef.current = "high";
    lastPositionsRef.current = [];
    stationarySinceRef.current = null;

    // Acquire wake lock to keep screen on
    const wakeOk = await requestWakeLock();
    if (wakeOk) {
      cleanupWakeRef.current = setupWakeLockAutoReacquire();
    }

    setState((prev) => ({
      ...prev,
      wakeLockActive: wakeOk,
      error: null,
      batteryMode: "high",
    }));

    restartWatch("high");
  }, [restartWatch]);

  // ─── Stop sharing ────────────────────────────────────────────

  const stopSharing = useCallback(async () => {
    stopWatchingPosition(watchIdRef.current);
    watchIdRef.current = -1;

    // Reset battery-tracking refs
    batteryModeRef.current = "high";
    lastPositionsRef.current = [];
    stationarySinceRef.current = null;

    // Release wake lock
    await releaseWakeLock();
    if (cleanupWakeRef.current) {
      cleanupWakeRef.current();
      cleanupWakeRef.current = null;
    }

    // Notify server
    try {
      await fetch("/api/location/stop", { method: "POST" });
    } catch {
      // Silently fail
    }

    setState((prev) => ({
      ...prev,
      isSharing: false,
      wakeLockActive: false,
      batteryMode: "high",
    }));
  }, []);

  // ─── Toggle sharing ──────────────────────────────────────────

  const toggleSharing = useCallback(async () => {
    if (state.isSharing) {
      await stopSharing();
    } else {
      await startSharing();
    }
  }, [state.isSharing, startSharing, stopSharing]);

  // ─── Send last location via sendBeacon on tab close ────

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastSentPositionRef.current) {
        navigator.sendBeacon(
          "/api/location/share",
          new Blob([JSON.stringify(lastSentPositionRef.current)], {
            type: "application/json",
          })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ─── Handle visibility change (background/foreground) ──

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // App going to background — send last known location immediately
        if (lastSentPositionRef.current) {
          navigator.sendBeacon(
            "/api/location/share",
            new Blob([JSON.stringify(lastSentPositionRef.current)], {
              type: "application/json",
            })
          );
        }
      } else if (document.visibilityState === "visible") {
        // App coming back to foreground — re-acquire wake lock
        if (watchIdRef.current !== -1) {
          requestWakeLock();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ─── Check geolocation support on mount ──────────────────────

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isSupported:
        typeof window !== "undefined" && "geolocation" in navigator,
    }));
  }, []);

  // ─── Subscribe to Pusher & fetch partner's live updates ─────

  useEffect(() => {
    if (!userId) return;

    // Fetch partner's current location from DB
    fetchPartnerLocation();

    // Set up Pusher
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

    if (!key) {
      // Polling fallback: refresh every 10 seconds
      const interval = setInterval(fetchPartnerLocation, 10000);
      return () => clearInterval(interval);
    }

    const client = new PusherJS(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
      enabledTransports: ["ws", "wss"],
    });

    // Fetch partner info and subscribe to the right channel
    let currentChannel: ReturnType<typeof client.subscribe> | null = null;

    fetch("/api/partner/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.linked && data.partner?.id) {
          const partnerId = data.partner.id;
          partnerIdRef.current = partnerId;

          const [a, b] = [userId, partnerId].sort();
          const channelName = `private-partner-${a}-${b}`;

          const channel = client.subscribe(channelName);
          currentChannel = channel;
          channelRef.current = channel;

          channel.bind(
            "location-update",
            (pusherData: { location: LocationUpdate }) => {
              const loc = pusherData.location;

              // 🐛 CRITICAL: Ignore our own location echoed back via Pusher!
              // The partner channel is shared by both users, so both receive
              // events when either user updates. We must only update partnerLocation
              // if the update is actually from our partner (different userId).
              if (loc.userId === userId) {
                return;
              }

              // Update ref for latest partner location
              partnerLocationRef.current = loc;

              // Fetch route distance using REF (not closure state — avoids stale closure!)
              const myLoc = myLocationRef.current;
              if (myLoc) {
                if (routeDistanceTimeoutRef.current) {
                  clearTimeout(routeDistanceTimeoutRef.current);
                }
                routeDistanceTimeoutRef.current = setTimeout(() => {
                  fetchRouteDistance(
                    myLoc.latitude,
                    myLoc.longitude,
                    loc.latitude,
                    loc.longitude
                  );
                }, 2000);
              }

              setState((prev) => {
                // Show haversine immediately
                const km =
                  prev.myLocation
                    ? haversineDistance(
                        prev.myLocation.latitude,
                        prev.myLocation.longitude,
                        loc.latitude,
                        loc.longitude
                      )
                    : null;
                return {
                  ...prev,
                  partnerLocation: loc,
                  partnerIsSharing: true,
                  distanceKm: km,
                  distanceText: km ? formatDistance(km) : null,
                  routeDistanceKm: null,
                  routeDurationSec: null,
                  isRouteDistance: false,
                };
              });
            }
          );

          channel.bind("location-stop", () => {
            setState((prev) => ({
              ...prev,
              partnerIsSharing: false,
            }));
          });
        }
      })
      .catch((err) => console.error("Failed to get partner info:", err));

    return () => {
      if (currentChannel) {
        currentChannel.unbind_all();
        client.unsubscribe(currentChannel.name);
      }
      if (channelRef.current) {
        try {
          channelRef.current.unbind_all();
          client.unsubscribe(channelRef.current.name);
        } catch {}
        channelRef.current = null;
      }
      client.disconnect();
    };
  }, [userId, fetchPartnerLocation]);

  // Cleanup route distance timeout on unmount
  useEffect(() => {
    return () => {
      if (routeDistanceTimeoutRef.current) {
        clearTimeout(routeDistanceTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startSharing,
    stopSharing,
    toggleSharing,
    refresh: fetchPartnerLocation,
    lastUpdatedAt: state.lastUpdatedAt,
    batteryMode: state.batteryMode,
  };
}
