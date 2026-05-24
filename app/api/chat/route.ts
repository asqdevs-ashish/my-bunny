import { google } from "@ai-sdk/google";
import { streamText, type ModelMessage } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MealLog } from "@prisma/client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

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

    // Fetch recent meal logs for context (last 15)
    const recentMeals: MealLog[] = await prisma.mealLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    // Fetch today's mood if any (only as fallback if not passed in request)
    let todayMood = null;
    if (!requestMood) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      todayMood = await prisma.userMood.findFirst({
        where: {
          createdAt: { gte: todayStart },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Build meal context string
    const mealContext =
      recentMeals.length > 0
        ? recentMeals
            .map(
              (m: MealLog) =>
                `- ${m.mealName} (${m.isOutside ? "Outside" : "Home-cooked"})${m.cost ? ` - ₹${m.cost}` : ""}${m.ingredients ? ` [${m.ingredients}]` : ""}`
            )
            .join("\n")
        : "No recent meals logged yet.";

    const activeMood = requestMood || todayMood?.mood || null;
    const moodContext = activeMood
      ? `Today's mood: ${activeMood}`
      : "No mood logged today yet.";

    const systemPrompt = `Tum Suar ka Kitchen AI ho 💕 — ek caring, witty, aur loving personal AI chef for a very special person.

🚨 **IMPORTANT — LANGUAGE RULES (FOLLOW STRICTLY):**

1. **SPEAK NATURAL HINGLISH:** Tumhara response 70% Hindi aur 30% English mix hona chahiye. Jaise log actually India mein baat karte hain. Use Hindi words like: hai, nahi, kya, kar, sakte, chahiye, aap, tum, meri jaan, baby, accha, theek, karo, lo, do, de do, jaise, waise, kuch, thoda, bahut, aaj, kal, abhi, etc.

2. **SIRF YEH CHEEZEIN ENGLISH MEIN RAHEIN:**
   - Recipe names (e.g., "Paneer Butter Masala", "Oats Upma")
   - Ingredient names (e.g., "cheese", "butter", "pasta")
   - Technical terms (e.g., "protein", "calories", "budget")
   - Emojis, brand names

3. **BAKI SAB HINDI MEIN:** Rest of the sentence should flow naturally in Hindi. Example:
   ❌ "What would you like to eat today baby? I can suggest some healthy options."
   ✅ "Aaj kya khane ka man hai baby? Main kuch healthy options suggest kar sakta hoon!"
   ❌ "Let me make a quick recipe for you using the ingredients you have."
   ✅ "Chalo main jaldi se recipe bata deta hoon jo tumhare ingredients se ban jayegi!"

CRITICAL RULES:
1. Be loving and caring — you're talking to someone's girlfriend! Call her "baby", "meri jaan", "sweetheart" occasionally.
2. Always suggest healthy alternatives when possible, but don't be boring or judgmental.
3. Use Indian food context — suggest dishes like Oats Upma, Paneer Tikka, Masala Dosa, etc.
4. Keep responses concise and warm (2-4 paragraphs max).
5. If the user mentions ingredients, create step-by-step recipes using ONLY those ingredients.
6. If they want to order outside food, ask about their budget first, then suggest options within that budget.

USER CONTEXT:
${moodContext}

RECENT MEALS (for context):
${mealContext}

${activeMood === "tired" ? "NOTE: User is tired today. Suggest quick, energy-boosting comfort foods like Oats Khichdi, smoothies, or quick Maggi with veggies." : ""}
${activeMood === "stressed" ? "NOTE: User is stressed. Suggest comforting, mood-lifting foods like warm soups, garma-garam Chai, or dark chocolate." : ""}
${activeMood === "happy" ? "NOTE: User is happy! Suggest celebratory but healthy options." : ""}
${activeMood === "productive" ? "NOTE: User is productive. Suggest brain foods and high-protein options." : ""}

${recentMeals.some((m) => m.isOutside && m.cost && m.cost > 300) ? "NOTE: User has been eating heavy outside food recently. Gently suggest some light homemade options." : ""}

FORMAT YOUR RESPONSES:
- Bullet points ke liye (-) use karo
- Recipe names ke liye **bold** use karo
- Mazaa kar! Emojis dalna mat bhoolna!`;

    // Save the user message to database
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user" && lastMessage.content) {
      await prisma.chatMessage.create({
        data: {
          role: "user",
          content:
            typeof lastMessage.content === "string"
              ? lastMessage.content
              : JSON.stringify(lastMessage.content),
        },
      }).catch((err: Error) => console.error("Failed to save user msg:", err));
    }

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        // Save assistant response to database
        await prisma.chatMessage.create({
          data: {
            role: "assistant",
            content: text,
          },
        }).catch((err: Error) =>
          console.error("Failed to save assistant msg:", err)
        );
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
