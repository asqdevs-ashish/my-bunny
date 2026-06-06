import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const userData = await getApiUser(request);
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

    // Fetch partner's location
    const partnerLocation = await db.location.findUnique({
      where: { userId: currentUser.partnerId },
    });

    if (!partnerLocation) {
      return Response.json({
        location: null,
        userId: currentUser.partnerId,
        isSharing: false,
      });
    }

    return Response.json({
      location: {
        latitude: partnerLocation.latitude,
        longitude: partnerLocation.longitude,
        accuracy: partnerLocation.accuracy,
        speed: partnerLocation.speed,
        heading: partnerLocation.heading,
        isSharing: partnerLocation.isSharing,
        updatedAt: partnerLocation.updatedAt.toISOString(),
      },
      userId: currentUser.partnerId,
    });
  } catch (error) {
    console.error("Failed to get partner location:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
