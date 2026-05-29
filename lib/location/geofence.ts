/**
 * Geofence helpers — check if a point is inside a circular zone.
 */
import { haversineDistance } from "./haversine";

export interface GeofenceZone {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  color: string;
  enabled: boolean;
  createdAt: string;
}

export interface GeofenceAlert {
  id: string;
  zoneId: string;
  zoneName?: string;
  zoneColor?: string;
  ownerId: string;
  partnerUserId: string;
  eventType: "ENTERED" | "EXITED";
  latitude: number;
  longitude: number;
  createdAt: string;
}

/**
 * Check if a point (lat,lng) is inside a circular geofence zone.
 * Uses Haversine distance internally.
 */
export function isInsideZone(
  pointLat: number,
  pointLng: number,
  zoneLat: number,
  zoneLng: number,
  zoneRadiusMeters: number
): boolean {
  const distanceKm = haversineDistance(pointLat, pointLng, zoneLat, zoneLng);
  return distanceKm * 1000 <= zoneRadiusMeters;
}


