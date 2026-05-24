import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const meals = await prisma.mealLog.findMany({
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

    const meal = await prisma.mealLog.create({
      data: {
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
