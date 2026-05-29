import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";

export async function GET(req: Request) {
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
    if (!currentUser) {
      return new Response("User not found", { status: 400 });
    }

    if (!currentUser.partnerId) {
      return new Response("No partner linked", { status: 400 });
    }

    // Get the last 24 hours of partner's location history
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const history = await db.locationHistory.findMany({
      where: {
        userId: currentUser.partnerId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        speed: true,
        heading: true,
        createdAt: true,
      },
    });

    return Response.json({
      history: history.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      })),
      userId: currentUser.partnerId,
    });
  } catch (error) {
    console.error("Failed to fetch location history:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
