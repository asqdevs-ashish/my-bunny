import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const memories = await db.memory.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { user: { partneredUsers: { some: { id: session.user.id } } } },
          { user: { partnerId: session.user.id } }
        ]
      },
      orderBy: { date: "desc" },
      include: { user: { select: { name: true } } }
    });

    return Response.json(memories);
  } catch (error) {
    console.error("Failed to fetch memories:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch memories" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const { imageUrl, caption, date } = await req.json();
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const memory = await db.memory.create({
      data: {
        userId: session.user.id,
        imageUrl,
        caption,
        date: date ? new Date(date) : new Date(),
      }
    });

    return Response.json(memory, { status: 201 });
  } catch (error) {
    console.error("Failed to create memory:", error);
    return new Response(JSON.stringify({ error: "Failed to create memory" }), { status: 500 });
  }
}
