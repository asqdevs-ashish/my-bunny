import { prisma } from "@/lib/prisma";
import { loveNotes as defaultNotes } from "@/lib/constants";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    // Fetch today's note or the most recent one
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const note = await db.loveNote.findFirst({
      where: {
        displayAt: { lte: new Date() },
      },
      orderBy: { displayAt: "desc" },
    });

    // Fallback: If no notes in DB, return one from constants
    if (!note) {
      const dayIndex = new Date().getDate();
      const noteIndex = dayIndex % defaultNotes.length;
      return Response.json({ content: defaultNotes[noteIndex] });
    }

    return Response.json({ content: note.content });
  } catch (error) {
    console.error("Failed to fetch love note:", error);
    // Fallback on error
    const dayIndex = new Date().getDate();
    const noteIndex = dayIndex % defaultNotes.length;
    return Response.json({ content: defaultNotes[noteIndex] });
  }
}
