import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const moods = await prisma.userMood.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return Response.json(moods);
  } catch (error) {
    console.error("Failed to fetch moods:", error);
    return new Response("Failed to fetch moods", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { mood, note } = await req.json();

    const validMoods = ["happy", "stressed", "tired", "productive"];
    if (!validMoods.includes(mood)) {
      return new Response("Invalid mood", { status: 400 });
    }

    const moodEntry = await prisma.userMood.create({
      data: {
        mood,
        note: note || null,
      },
    });

    return Response.json(moodEntry, { status: 201 });
  } catch (error) {
    console.error("Failed to log mood:", error);
    return new Response("Failed to log mood", { status: 500 });
  }
}
