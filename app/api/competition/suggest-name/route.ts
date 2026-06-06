import { NextRequest } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { pusherServer, getPartnerChannel, triggerCompetitionEvent } from "@/lib/pusher-server";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const FALLBACK_NAMES = [
  "Love Blossoms 🌸",
  "Power Couple ⚡",
  "Heart & Soul 💕",
  "Forever Together 💑",
  "Soulmates United 💞",
  "Sweethearts 🍯",
  "Two Hearts 💖",
  "Endless Love ♾️",
];

function getFallbackName(): string {
  return FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
}

async function generateAIName(): Promise<string> {
  if (!process.env.GROQ_API_KEY) return getFallbackName();

  try {
    const { text } = await generateText({
      model: groq("mixtral-8x7b-32768"),
      system:
        "You are a creative romantic. Generate ONE cute, unique team name for a couple in a love competition. " +
        "The name should be short (max 3 words + optional emoji), sweet, and unique. " +
        "Examples: 'Love Warriors 💪', 'Sweethearts United 💕', 'Heartbeat Heroes 💓'. " +
        "Return ONLY the name, no explanation, no quotes.",
      prompt: "Suggest a cute couple team name for a love plant competition leaderboard.",
      temperature: 0.9,
      maxRetries: 2,
    });

    const name = text.trim().replace(/^["']|["']$/g, "");
    return name || "Love Team ❤️";
  } catch (error) {
    console.error("AI name suggestion error:", error);
    return getFallbackName();
  }
}

export async function POST(req: NextRequest) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return Response.json({ error: "User not found" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user?.partnerId || !user?.partner) {
      return Response.json({ error: "Link with a partner first" }, { status: 400 });
    }

    const [a, b] = [currentUser.id, user.partnerId].sort();
    const coupleKey = `${a}_${b}`;
    const isUser1 = currentUser.id === a;

    let coupleEntry = await db.competitionCouple.findUnique({
      where: { coupleKey },
    });

    if (!coupleEntry) {
      return Response.json({ error: "Join the competition first" }, { status: 400 });
    }

    // If a name was already suggested by either partner, return it (don't generate new)
    const existingName = coupleEntry.nameSuggestedByUser1 || coupleEntry.nameSuggestedByUser2;
    if (existingName) {
      return Response.json({ name: existingName });
    }

    // Generate name and store it
    const name = await generateAIName();

    if (isUser1) {
      coupleEntry = await db.competitionCouple.update({
        where: { id: coupleEntry.id },
        data: { nameSuggestedByUser1: name },
      });
    } else {
      coupleEntry = await db.competitionCouple.update({
        where: { id: coupleEntry.id },
        data: { nameSuggestedByUser2: name },
      });
    }

    // Notify partner via Pusher
    if (pusherServer) {
      const channel = getPartnerChannel(currentUser.id, user.partnerId);
      await pusherServer
        .trigger(channel, "competition-update", {
          type: "name-suggested",
          userId: currentUser.id,
          name,
        })
        .catch(() => {});
    }

    // Broadcast to public competition channel for live leaderboard updates
    await triggerCompetitionEvent("competition-update", {
      type: "name-suggested",
    });

    return Response.json({ name });
  } catch (error) {
    console.error("Competition suggest-name error:", error);
    return Response.json({ name: getFallbackName() });
  }
}
