import { resolveCurrentUser } from "@/lib/current-user";
import { getApiUser } from "@/lib/api-auth";

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

// ─── Profiles ordered by preference for shortest route ─────────
const PROFILES = ["driving", "cycling", "walking"] as const;

interface OSRMResponse {
  code: string;
  routes: Array<{
    distance: number; // distance in meters
    duration: number; // duration in seconds
  }>;
}

async function fetchRoute(
  profile: string,
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): Promise<{ distanceKm: number; durationSec: number } | null> {
  const url = `${OSRM_BASE}/${profile}/${lng1},${lat1};${lng2},${lat2}?overview=false&geometries=geojson`;
  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data: OSRMResponse = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationSec: route.duration,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const userData = await getApiUser(req);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return new Response("User not found", { status: 400 });
    }

    const url = new URL(req.url);
    const lat1 = parseFloat(url.searchParams.get("lat1") ?? "");
    const lng1 = parseFloat(url.searchParams.get("lng1") ?? "");
    const lat2 = parseFloat(url.searchParams.get("lat2") ?? "");
    const lng2 = parseFloat(url.searchParams.get("lng2") ?? "");

    if (
      isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2) ||
      lat1 < -90 || lat1 > 90 || lng1 < -180 || lng1 > 180 ||
      lat2 < -90 || lat2 > 90 || lng2 < -180 || lng2 > 180
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try each profile until we get a successful result
    // "driving" is most reliable, but "cycling" may give shorter routes
    let bestRoute: { distanceKm: number; durationSec: number; profile: string } | null = null;

    for (const profile of PROFILES) {
      const result = await fetchRoute(profile, lng1, lat1, lng2, lat2);
      if (result) {
        if (!bestRoute || result.distanceKm < bestRoute.distanceKm) {
          bestRoute = { ...result, profile };
        }
      }
    }

    if (!bestRoute) {
      return Response.json({
        routeDistanceKm: null,
        routeDurationSec: null,
        profile: null,
      });
    }

    return Response.json({
      routeDistanceKm: bestRoute.distanceKm,
      routeDurationSec: bestRoute.durationSec,
      profile: bestRoute.profile,
    });
  } catch (error) {
    console.error("Route distance failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to calculate route distance" }),
      { status: 500 }
    );
  }
}
