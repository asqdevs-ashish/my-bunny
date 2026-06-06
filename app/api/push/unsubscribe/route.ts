import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getApiUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  const userData = await getApiUser(request);
  if (!userData?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    // Remove the push subscription
    await db.user.update({
      where: { id: userData.id },
      data: { pushSubscription: Prisma.DbNull },
    });

    return Response.json({
      message: "Push subscription removed",
    });
  } catch (error) {
    console.error("Failed to remove push subscription:", error);
    return new Response(
      JSON.stringify({ error: "Failed to remove subscription" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
