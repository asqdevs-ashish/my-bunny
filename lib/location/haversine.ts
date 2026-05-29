/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 * @returns distance in kilometers (rounded to 2 decimal places)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 2 decimal places
}

/**
 * Format a distance in kilometers for display.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Estimate travel time by walking (~5 km/h) and driving (~40 km/h).
 */
export function estimateTravelTime(km: number): {
  walking: string;
  driving: string;
} {
  const walkingMin = Math.round((km / 5) * 60);
  const drivingMin = Math.round((km / 40) * 60);

  const fmt = (min: number) => {
    if (min < 1) return "< 1 min";
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return {
    walking: fmt(walkingMin),
    driving: fmt(drivingMin),
  };
}
