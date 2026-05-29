import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = prisma;
  if (!db) {
    return new Response("Database not available", { status: 503 });
  }

  try {
    const currentUser = await resolveCurrentUser(session.user);
    if (!currentUser || !currentUser.partnerId) {
      return Response.json({ alerts: [] });
    }

    // Fetch alerts for zones OWNED by the current user (incoming alerts about partner)
    // and also alerts where current user is the partner (outgoing alerts about self)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const alerts = await db.geofenceAlert.findMany({
      where: {
        OR: [
          { ownerId: currentUser.id },
          { partnerUserId: currentUser.id },
        ],
        createdAt: { gte: twentyFourHoursAgo },
      },
      include: {
        zone: {
          select: { name: true, color: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Map to include zone name/color
    const mappedAlerts = alerts.map((a) => ({
      id: a.id,
      zoneId: a.zoneId,
      zoneName: a.zone.name,
      zoneColor: a.zone.color,
      ownerId: a.ownerId,
      partnerUserId: a.partnerUserId,
      eventType: a.eventType,
      latitude: a.latitude,
      longitude: a.longitude,
      createdAt: a.createdAt.toISOString(),
    }));

    return Response.json({ alerts: mappedAlerts });
  } catch (error) {
    console.error("Failed to fetch geofence alerts:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
