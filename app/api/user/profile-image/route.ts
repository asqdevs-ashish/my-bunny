import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

/**
 * POST /api/user/profile-image
 * Update the user's profile picture.
 * Expects: { imageUrl: string }
 */
export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return Response.json({ error: "Image URL is required" }, { status: 400 });
    }

    const db = prisma;
    if (!db) {
      return Response.json({ error: "Database not available" }, { status: 500 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    });

    return Response.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Failed to update profile image:", error);
    return Response.json({ error: "Failed to update profile image" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/profile-image
 * Remove the user's profile picture (reset to default).
 */
export async function DELETE(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) {
      return Response.json({ error: "Database not available" }, { status: 500 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { image: null },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete profile image:", error);
    return Response.json({ error: "Failed to delete profile image" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
