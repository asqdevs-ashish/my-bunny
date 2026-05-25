import { createGroq } from "@ai-sdk/groq";
import { streamText, type ModelMessage } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MealLog } from "@prisma/client";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    let messages: ModelMessage[];
    let requestMood: string | null = null;
    try {
      const body = await req.json();
      messages = body.messages;
      requestMood = body.mood || null;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = prisma;

    // Fetch recent meal logs for context (last 20)
    let recentMeals: MealLog[] = [];
    if (db) {
      try {
        recentMeals = await db.mealLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
      } catch { /* ignore */ }
    }

    // Fetch today's mood
    let todayMood = null;
    if (!requestMood && db) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        todayMood = await db.userMood.findFirst({
          where: {
            userId,
            createdAt: { gte: todayStart },
          },
          orderBy: { createdAt: "desc" },
        });
      } catch { /* ignore */ }
    }

    // Build meal context with detailed ingredient history
    const mealContext =
      recentMeals.length > 0
        ? recentMeals
            .map((m: MealLog) => `- ${m.mealName}: ${m.ingredients || "No ingredients listed"} (${m.isOutside ? "Outside" : "Home"})${m.cost ? ` [₹${m.cost}]` : ""}`)
            .join("\n")
        : "No recent meals logged.";

    // Inventory Analysis for AI
    const allIngredients = recentMeals
      .filter(m => !m.isOutside)
      .map(m => m.ingredients)
      .join(", ")
      .toLowerCase();

    const inventoryContext = allIngredients 
      ? `Recent ingredients used (inventory): ${allIngredients}` 
      : "No inventory history.";

    const activeMood = requestMood || todayMood?.mood || null;
    const moodContext = activeMood
      ? `Today's mood: ${activeMood}`
      : "No mood logged today yet.";

    const systemPrompt = `Tum Suar ka Kitchen AI ho 💕 — ek caring, witty, aur loving personal AI chef for a very special person.

🚨 **IMPORTANT — LANGUAGE RULES (FOLLOW STRICTLY):**
1. **SPEAK NATURAL HINGLISH:** Tumhara response 70% Hindi aur 30% English mix hona chahiye. 
2. **SIRF YEH CHEEZEIN ENGLISH MEIN RAHEIN:** Recipe names, Ingredient names, Technical terms (budget, calories).
3. **BAKI SAB HINDI MEIN:** Flow naturally like: "Aaj kya khane ka man hai baby? Main kuch healthy suggest karta hoon!"

USER CONTEXT:
${moodContext}

INVENTORY CONTEXT (Based on past home-cooked meals):
${inventoryContext}

RECENT MEAL HISTORY:
${mealContext}

CRITICAL RULES:
1. Be loving and caring — you're talking to someone's girlfriend! Call her "baby", "meri jaan", "sweetheart" occasionally.
2. Suggest recipes based on INVENTORY CONTEXT when possible (e.g., if she used Paneer yesterday, suggest using the leftovers today).
3. If spending on outside food is high (>₹1000 recently), gently encourage a budget-friendly home-cooked meal.
4. Keep responses concise and warm (2-4 paragraphs max).
5. If the user mentions ingredients, create step-by-step recipes using ONLY those ingredients.

FORMAT YOUR RESPONSES:
- Bullet points ke liye (-) use karo
- Recipe names ke liye **bold** use karo
- Mazaa kar! Emojis dalna mat bhoolna!`;

    // Save the user message to database
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user" && lastMessage.content && db) {
      await db.chatMessage.create({
        data: {
          senderId: userId,
          role: "user",
          content:
            typeof lastMessage.content === "string"
              ? lastMessage.content
              : JSON.stringify(lastMessage.content),
        },
      }).catch((err: Error) => console.error("Failed to save user msg:", err));
    }

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        if (db) {
          await db.chatMessage.create({
            data: {
              senderId: null as unknown as string,
              receiverId: null as unknown as string,
              role: "assistant",
              content: text,
            },
          }).catch((err: Error) =>
            console.error("Failed to save assistant msg:", err)
          );
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API error:", message, error);
    return new Response(
      JSON.stringify({ error: `Failed to process chat: ${message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
