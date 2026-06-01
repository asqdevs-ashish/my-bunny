import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Image URL is required" }), { status: 400 });
    }

    const db = prisma;
    if (db) {
      await (db as any).user.update({
        where: { id: user.id },
        data: { image: imageUrl },
      });
    }

    return Response.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Failed to update profile image:", error);
    return new Response(JSON.stringify({ error: "Failed to update profile image" }), { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
