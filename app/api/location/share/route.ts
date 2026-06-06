import { prisma } from "@/lib/prisma";
import { pusherServer, getPartnerChannel } from "@/lib/pusher-server";
import { resolveCurrentUser } from "@/lib/current-user";
import { sendPushNotification } from "@/lib/web-push";
import { isInsideZone } from "@/lib/location/geofence";
import { getApiUser } from "@/lib/api-auth";

export async function POST(req: Request) {
  const userData = await getApiUser(req);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = prisma;
  if (!db) {
    return new Response("Database not available", { status: 503 });
  }

  try {
    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return new Response("User not found", { status: 400 });
    }

    if (!currentUser.partnerId) {
      return new Response("No partner linked", { status: 400 });
    }

    const { latitude, longitude, accuracy, speed, heading } = await req.json();

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Upsert location in database (current position)
    const location = await db.location.upsert({
      where: { userId: currentUser.id },
      update: {
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        speed: speed ?? null,
        heading: heading ?? null,
        isSharing: true,
      },
      create: {
        userId: currentUser.id,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        speed: speed ?? null,
        heading: heading ?? null,
        isSharing: true,
      },
    });

    // Save to location history (for movement trail)
    await db.locationHistory.create({
      data: {
        userId: currentUser.id,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        speed: speed ?? null,
        heading: heading ?? null,
      },
    }).catch((err: Error) => {
      console.error("Failed to save location history:", err);
    });

    // Keep history clean: delete entries older than 48 hours
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    db.locationHistory.deleteMany({
      where: { userId: currentUser.id, createdAt: { lt: twoDaysAgo } },
    }).catch(() => {});

    // ─── Geofence check: notify partner when they enter/exit a zone ─────
    checkGeofenceZones(
      db,
      latitude,
      longitude,
      currentUser.id,
      currentUser.name || "Your partner",
      currentUser.partnerId
    ).catch((err: Error) => {
      console.error("Geofence check failed:", err);
    });

    // Trigger Pusher event to partner
    const channel = getPartnerChannel(currentUser.id, currentUser.partnerId);
    if (pusherServer) {
      await pusherServer
        .trigger(channel, "location-update", {
          location: {
            userId: currentUser.id,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            speed: location.speed,
            heading: location.heading,
            timestamp: new Date().toISOString(),
          },
        })
        .catch((err: Error) => {
          console.error("Pusher trigger failed:", err);
        });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to share location:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// ─── Geofence Zone Checker ────────────────────────────────────

async function checkGeofenceZones(
  db: NonNullable<typeof prisma>,
  latitude: number,
  longitude: number,
  currentUserId: string,
  currentUserName: string,
  partnerId: string | null
) {
  if (!partnerId) return;

  // Fetch the partner user (who owns the zones)
  const partnerUser = await db.user.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, pushSubscription: true },
  });

  if (!partnerUser) return;

  // Fetch all enabled geofence zones owned by the partner
  const zones = await db.geofenceZone.findMany({
    where: { userId: partnerUser.id, enabled: true },
  });

  if (zones.length === 0) return;

  for (const zone of zones) {
    const isInside = isInsideZone(
      latitude,
      longitude,
      zone.latitude,
      zone.longitude,
      zone.radius
    );

    // Get the most recent alert for this zone+currentUser
    const lastAlert = await db.geofenceAlert.findFirst({
      where: { zoneId: zone.id, partnerUserId: currentUserId },
      orderBy: { createdAt: "desc" },
    });

    const wasInside = lastAlert?.eventType === "ENTERED";

    // No state change — skip
    if ((isInside && wasInside) || (!isInside && !wasInside)) continue;

    // Determine event type
    const eventType = isInside ? "ENTERED" : "EXITED";

    // Create alert record
    await db.geofenceAlert.create({
      data: {
        zoneId: zone.id,
        ownerId: partnerUser.id,
        partnerUserId: currentUserId,
        eventType,
        latitude,
        longitude,
      },
    });

    // Send push notification to the zone owner (partner)
    if (partnerUser.pushSubscription) {
      const title = isInside
        ? `📍 Entered ${zone.name}`
        : `📍 Left ${zone.name}`;
      const body = isInside
        ? `${currentUserName} has arrived at ${zone.name}!`
        : `${currentUserName} has left ${zone.name}.`;

      sendPushNotification(partnerUser.pushSubscription, {
        title,
        body,
        url: "/location",
        tag: `geofence-${zone.id}-${Date.now()}`,
      }).catch(() => {});
    }

    // Send Pusher event so partner's in-app UI updates
    const channel = getPartnerChannel(currentUserId, partnerId);
    if (pusherServer) {
      pusherServer
        .trigger(channel, "geofence-alert", {
          zoneId: zone.id,
          zoneName: zone.name,
          zoneColor: zone.color,
          eventType,
          partnerUserId: currentUserId,
          partnerName: currentUserName,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        })
        .catch(() => {});
    }
  }
}

