export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;   // meters
  speed: number | null;      // m/s
  heading: number | null;    // degrees
  timestamp: number;
}

export type GeoWatchCallback = (position: GeoPosition) => void;
export type GeoErrorCallback = (error: GeolocationPositionError) => void;

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,   // Accept positions up to 10 seconds old
  timeout: 15000,       // Time out after 15 seconds
};

/**
 * Start watching the user's position via the Geolocation API.
 * Returns the watch ID (use with clearWatch to stop).
 * Returns -1 if Geolocation is not supported.
 */
export function startWatchingPosition(
  onSuccess: GeoWatchCallback,
  onError?: GeoErrorCallback,
  options: Partial<PositionOptions> = {}
): number {
  if (typeof window === "undefined" || !navigator.geolocation) {
    console.error("Geolocation API is not available");
    return -1;
  }

  const mergedOptions: PositionOptions = { ...DEFAULT_OPTIONS, ...options };

  return navigator.geolocation.watchPosition(
    (pos) => {
      onSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp,
      });
    },
    (err) => {
      console.error("Geolocation error:", err.code, err.message);
      onError?.(err);
    },
    mergedOptions
  );
}

/**
 * Stop watching the user's position.
 */
export function stopWatchingPosition(watchId: number): void {
  if (watchId !== -1 && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Get the user's current position once (one-shot).
 */
export function getCurrentPosition(
  options: Partial<PositionOptions> = {}
): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation API not available"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        }),
      (err) => reject(err),
      { ...DEFAULT_OPTIONS, ...options }
    );
  });
}
