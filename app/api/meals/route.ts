import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOrCreateCurrentUser } from "@/lib/current-user";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

    const meals = await db.mealLog.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json(meals);
  } catch (error) {
    console.error("Failed to fetch meals:", error);
    return new Response("Failed to fetch meals", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { mealName, ingredients, isOutside, cost, notes } =
      await req.json();

    if (!mealName) {
      return new Response("Meal name is required", { status: 400 });
    }

    const db = prisma;
    if (!db) throw new Error("Database not available");
    const currentUser = await resolveOrCreateCurrentUser(session.user);

    const meal = await db.mealLog.create({
      data: {
        userId: currentUser.id,
        mealName,
        ingredients: ingredients || "",
        isOutside: isOutside || false,
        cost: cost || null,
        notes: notes || null,
      },
    });

    return Response.json(meal, { status: 201 });
  } catch (error) {
    console.error("Failed to log meal:", error);
    return new Response("Failed to log meal", { status: 500 });
  }
}
