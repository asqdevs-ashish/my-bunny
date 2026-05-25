import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
      return new Response(
        JSON.stringify({ error: "Invalid subscription object" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");

    // Save the push subscription JSON to the user's record
    await db.user.update({
      where: { id: session.user.id },
      data: { pushSubscription: subscription },
    });

    return Response.json({
      message: "Push subscription saved successfully",
    });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save subscription" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
