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
    if (!currentUser) {
      return Response.json({ zones: [] });
    }

    const zones = await db.geofenceZone.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ zones });
  } catch (error) {
    console.error("Failed to fetch geofence zones:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const { name, latitude, longitude, radius, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      typeof latitude !== "number" || typeof longitude !== "number" ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const zone = await db.geofenceZone.create({
      data: {
        userId: currentUser.id,
        name: name.trim(),
        latitude,
        longitude,
        radius: typeof radius === "number" && radius > 0 ? radius : 200,
        color: typeof color === "string" && color.startsWith("#") ? color : "#f43f5e",
      },
    });

    return Response.json({ zone }, { status: 201 });
  } catch (error) {
    console.error("Failed to create geofence zone:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
