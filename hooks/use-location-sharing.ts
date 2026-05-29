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
import { haversineDistance, formatDistance } from "@/lib/location/haversine";

// ─── Types ────────────────────────────────────────────────────

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
  /** Distance between the two users in km */
  distanceKm: number | null;
  /** Formatted distance string like "2.5 km" */
  distanceText: string | null;
  /** Whether geolocation is supported */
  isSupported: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether the wake lock is active */
  wakeLockActive: boolean;
  /** Loading state for initial partner location fetch */
  loading: boolean;
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
    isSupported: false,
    error: null,
    wakeLockActive: false,
    loading: true,
  });

  const watchIdRef = useRef<number>(-1);
  const cleanupWakeRef = useRef<(() => void) | null>(null);
  const channelRef = useRef<ReturnType<
    NonNullable<typeof PusherJS>["prototype"]["subscribe"]
  > | null>(null);
  const pusherClientRef = useRef<PusherJS | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const lastSentRef = useRef<number>(0);
  const partnerLocationRef = useRef<LocationUpdate | null>(null);

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
        const km = haversineDistance(myLat, myLng, partnerLat, partnerLng);
        setState((prev) => ({
          ...prev,
          distanceKm: km,
          distanceText: formatDistance(km),
        }));
      }
    },
    []
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
  }, []);

  // ─── Send location to server ─────────────────────────────────

  const sendLocation = useCallback(
    async (position: GeoPosition) => {
      // Throttle to once every 20 seconds
      const now = Date.now();
      if (now - lastSentRef.current < 20000) return;
      lastSentRef.current = now;

      try {
        await fetch("/api/location/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            speed: position.speed,
            heading: position.heading,
          }),
        });
      } catch (err) {
        console.error("Failed to send location:", err);
      }
    },
    []
  );

  // ─── Start sharing ───────────────────────────────────────────

  const startSharing = useCallback(async () => {
    if (watchIdRef.current !== -1) return; // Already watching

    // Acquire wake lock to keep screen on
    const wakeOk = await requestWakeLock();
    if (wakeOk) {
      cleanupWakeRef.current = setupWakeLockAutoReacquire();
    }

    setState((prev) => ({ ...prev, wakeLockActive: wakeOk, error: null }));

    const watchId = startWatchingPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          myLocation: position,
          isSharing: true,
          error: null,
        }));

        // Send to server (throttled internally)
        sendLocation(position);

        // Use ref for latest partner location to avoid stale closure
        const partner = partnerLocationRef.current;
        updateDistance(
          position.latitude,
          position.longitude,
          partner?.latitude ?? null,
          partner?.longitude ?? null
        );
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please enable it in your browser settings."
            : err.code === err.TIMEOUT
            ? "Location request timed out. Please try again."
            : "Failed to get location. Please check your GPS is enabled.";
        setState((prev) => ({ ...prev, error: msg }));
      }
    );

    watchIdRef.current = watchId;
  }, [sendLocation, updateDistance]);

  // ─── Stop sharing ────────────────────────────────────────────

  const stopSharing = useCallback(async () => {
    stopWatchingPosition(watchIdRef.current);
    watchIdRef.current = -1;

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
              // Update ref for latest partner location
              partnerLocationRef.current = loc;
              setState((prev) => {
                // Recompute distance using latest state
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

  return {
    ...state,
    startSharing,
    stopSharing,
    toggleSharing,
    refresh: fetchPartnerLocation,
  };
}
