import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { getApiUser } from "@/lib/api-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const zone = await db.geofenceZone.findUnique({
      where: { id },
    });

    if (!zone) {
      return new Response("Zone not found", { status: 404 });
    }

    if (zone.userId !== currentUser.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Name cannot be empty" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.latitude !== undefined) {
      if (typeof body.latitude !== "number" || body.latitude < -90 || body.latitude > 90) {
        return new Response(
          JSON.stringify({ error: "Invalid latitude" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.latitude = body.latitude;
    }

    if (body.longitude !== undefined) {
      if (typeof body.longitude !== "number" || body.longitude < -180 || body.longitude > 180) {
        return new Response(
          JSON.stringify({ error: "Invalid longitude" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.longitude = body.longitude;
    }

    if (body.radius !== undefined) {
      if (typeof body.radius !== "number" || body.radius <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid radius" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.radius = body.radius;
    }

    if (body.enabled !== undefined) {
      updateData.enabled = Boolean(body.enabled);
    }

    if (body.color !== undefined) {
      if (typeof body.color !== "string" || !body.color.startsWith("#")) {
        return new Response(
          JSON.stringify({ error: "Invalid color" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.color = body.color;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid fields to update" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updated = await db.geofenceZone.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ zone: updated });
  } catch (error) {
    console.error("Failed to update geofence zone:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const zone = await db.geofenceZone.findUnique({
      where: { id },
    });

    if (!zone) {
      return new Response("Zone not found", { status: 404 });
    }

    if (zone.userId !== currentUser.id) {
      return new Response("Forbidden", { status: 403 });
    }

    await db.geofenceZone.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete geofence zone:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
