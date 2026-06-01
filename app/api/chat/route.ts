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
  const db = prisma;

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

    // 1. Fetch recent meal logs for context (last 20)
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

    // 2. Fetch today's mood
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

    // 3. NEW: Fetch Love Plant & Snapshot Data for Gamified AI Context
    let lovePlantContext = "No Love Plant data found. Tell them to connect with a partner!";
    if (db) {
      try {
        // Find current user's partner info
        const currentUser = await db.user.findUnique({
          where: { id: userId },
          select: { partnerId: true, name: true }
        });

        if (currentUser?.partnerId) {
          // Generate the unique couple key lexicographically
          const coupleKey = [userId, currentUser.partnerId].sort().join("_");
          
          // Get the latest snapshot history
          const latestSnapshot = await db.lovePlantDailySnapshot.findFirst({
            where: { coupleKey },
            orderBy: { date: "desc" }
          });

          if (latestSnapshot) {
            const isUser1 = latestSnapshot.coupleKey.startsWith(userId);
            const myWater = isUser1 ? latestSnapshot.user1Water : latestSnapshot.user2Water;
            const myMeals = isUser1 ? latestSnapshot.user1Meals : latestSnapshot.user2Meals;
            const partnerWater = isUser1 ? latestSnapshot.user2Water : latestSnapshot.user1Water;
            const partnerMeals = isUser1 ? latestSnapshot.user2Meals : latestSnapshot.user1Meals;

            lovePlantContext = `
              - Combined Love Plant Health Score: ${latestSnapshot.health}/100
              - Current User (${currentUser.name}) Progress: ${myWater} glasses of water, ${myMeals} meals logged today.
              - Partner Progress: ${partnerWater} glasses of water, ${partnerMeals} meals logged today.
            `.trim();
          } else {
            lovePlantContext = "Love Plant is active but no snapshot has been generated for today yet.";
          }
        }
      } catch (err) {
        console.error("Error generating Love Plant context for AI:", err);
      }
    }

    // 4. Build meal context with detailed ingredient history
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

    // 5. Refined System Prompt with Love Plant Guidelines
    const systemPrompt = `Tum My Bunny AI ho 💕 — ek caring, witty, aur loving personal AI chef for a very special person.

🚨 **IMPORTANT — LANGUAGE RULES (FOLLOW STRICTLY):**
1. **SPEAK NATURAL HINGLISH:** Tumhara response 70% Hindi aur 30% English mix hona chahiye. 
2. **SIRF YEH CHEEZEIN ENGLISH MEIN RAHEIN:** Recipe names, Ingredient names, Technical terms (budget, calories, health score).
3. **BAKI SAB HINDI MEIN:** Flow naturally like: "Aaj kya khane ka man hai baby? Main kuch healthy suggest karta hoon!"

USER CONTEXT:
${moodContext}

LOVE PLANT (CO-OP HEALTH QUEST) STATUS:
${lovePlantContext}

INVENTORY CONTEXT (Based on past home-cooked meals):
${inventoryContext}

RECENT MEAL HISTORY:
${mealContext}

CRITICAL RULES:
1. Be loving and caring — you're talking to someone's girlfriend! Call her "baby", "meri jaan", "sweetheart" occasionally.
2. **LOVE PLANT AWARENESS:** Agar tumhara common "Love Plant" health score kam hai (< 70%), ya agar user ne pani kam piya hai, toh unhe halka sa tease ya motivate karo pani peene ke liye ya home-cooked meal log karne ke liye taaki unka pyara pauda murjhane se bach jaye! 🌱
3. Suggest recipes based on INVENTORY CONTEXT when possible (e.g., if she used Paneer yesterday, suggest using the leftovers today).
4. If spending on outside food is high (>₹1000 recently), gently encourage a budget-friendly home-cooked meal to save money and boost the plant's health.
5. Keep responses concise and warm (2-4 paragraphs max).
6. If the user mentions ingredients, create step-by-step recipes using ONLY those ingredients.

FORMAT YOUR RESPONSES:
- Bullet points ke liye (-) use karo
- Recipe names ke liye **bold** use karo
- Mazaa karo! Emojis dalna mat bhoolna! 🌿💧`;

    // 6. Save the user message to database
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user" && lastMessage.content && db) {
      await db.chatMessage.create({
        data: {
          senderId: userId,
          receiverId: null, // AI chat setup
          role: "user",
          content:
            typeof lastMessage.content === "string"
              ? lastMessage.content
              : JSON.stringify(lastMessage.content),
        },
      }).catch((err: Error) => console.error("Failed to save user msg:", err));
    }

    // 7. Stream text response and log assistant response safely on finish
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        if (db) {
          await db.chatMessage.create({
            data: {
              senderId: null,      // AI is the sender
              receiverId: userId,  // FIXED BUG: Now maps properly to the current user
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