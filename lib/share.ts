/**
 * Share utilities for "Share with Partner" feature.
 * Generates formatted text summaries that can be copied to clipboard
 * or shared via WhatsApp / other messaging apps.
 */

interface ShareMealData {
  mealName: string;
  ingredients: string;
  isOutside: boolean;
  cost: number | null;
  notes: string | null;
  createdAt: string;
}

interface ShareWeeklyData {
  period: { from: string; to: string };
  meals: {
    total: number;
    home: number;
    outside: number;
    totalSpent: number;
    uniqueMealsCount: number;
    mealsByDay: Record<string, number>;
  };
  moods: {
    total: number;
    counts: Record<string, number>;
    topMood: string;
    topMoodCount: number;
  };
}

/** Format a meal entry as a shareable text */
export function formatMealForShare(meal: ShareMealData): string {
  const type = meal.isOutside ? "🍽️ Outside" : "🏠 Home";
  const costStr = meal.cost ? `₹${meal.cost}` : "";
  const date = new Date(meal.createdAt).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = `🍳 *${meal.mealName}*\n`;
  text += `📅 ${date}\n`;
  text += `${type}`;
  if (costStr) text += ` | ${costStr}`;
  text += "\n";

  if (meal.ingredients) {
    const ingList = meal.ingredients
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => `  • ${i}`)
      .join("\n");
    text += `🥘 Ingredients:\n${ingList}\n`;
  }

  if (meal.notes) {
    text += `💬 ${meal.notes}\n`;
  }

  return text;
}

/** Format weekly summary as a shareable text */
export function formatWeeklyForShare(data: ShareWeeklyData): string {
  const now = new Date();
  const weekEnd = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let text = `📊 *Suar's Kitchen — Weekly Summary*\n`;
  text += `📅 Week ending: ${weekEnd}\n`;
  text += `━━━━━━━━━━━━━━━━━\n\n`;

  // Meal stats
  text += `🍽️ *Meals*: ${data.meals.total} total\n`;
  text += `  🏠 Home: ${data.meals.home}\n`;
  text += `  🏪 Outside: ${data.meals.outside}\n`;
  text += `  💰 Total Spent: ₹${data.meals.totalSpent}\n`;
  text += `  🆕 Unique Dishes: ${data.meals.uniqueMealsCount}\n\n`;

  // Meals per day
  const dayNames: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  if (Object.keys(data.meals.mealsByDay).length > 0) {
    text += `📆 *Meals Per Day*:\n`;
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    dayOrder.forEach((day) => {
      const count = data.meals.mealsByDay[day];
      if (count !== undefined) {
        const bar = "█".repeat(Math.min(count, 10));
        text += `  ${dayNames[day] || day}: ${bar} ${count}\n`;
      }
    });
    text += "\n";
  }

  // Moods
  if (data.moods.total > 0) {
    const moodEmojis: Record<string, string> = {
      happy: "😊",
      stressed: "😰",
      tired: "😴",
      productive: "💪",
    };
    text += `🥰 *Moods*: ${data.moods.total} check-ins\n`;
    Object.entries(data.moods.counts).forEach(([mood, count]) => {
      const emoji = moodEmojis[mood] || "🥰";
      text += `  ${emoji} ${mood}: ${count}\n`;
    });
    text += `  Top mood: ${moodEmojis[data.moods.topMood] || "🥰"} ${data.moods.topMood}\n\n`;
  }

  text += `━━━━━━━━━━━━━━━━━\n`;
  text += `Made with ❤️ by Suar's Kitchen 🍳\n`;

  return text;
}

/** Format app sharing text */
export function formatShareAppText(): string {
  return `👩‍👧 *Suar's Kitchen — Share with You!*\n\nHey baby! I've been using Suar's Kitchen to track my meals, mood, and wellness journey. Come check it out! 🍳💕\n\nFeatures:\n🍽️ Meal & Mood Tracking\n💧 Hydration Reminders\n🥘 AI Recipe Suggestions\n📊 Weekly Summaries\n\nIt's made just for us! 🥰`;
}

/** Data for daily overview */
export interface DailyOverviewMeal {
  mealName: string;
  ingredients: string;
  isOutside: boolean;
  cost: number | null;
  notes: string | null;
  createdAt: string;
}

export interface DailyOverviewData {
  meals: DailyOverviewMeal[];
  waterGlasses: number;
  mood: string | null;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊",
  stressed: "😰",
  tired: "😴",
  productive: "💪",
};

const MOOD_LABELS: Record<string, string> = {
  happy: "Happy",
  stressed: "Stressed",
  tired: "Tired",
  productive: "Productive",
};

/** Format a daily overview in Hinglish for sharing with partner */
export function formatDailyOverview(data: DailyOverviewData): string {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let text = `💕 *Suar's Kitchen — Daily Update*\n`;
  text += `📅 ${today}\n`;
  text += `━━━━━━━━━━━━━━━━━\n\n`;

  // Mood section
  if (data.mood) {
    const emoji = MOOD_EMOJIS[data.mood] || "🥰";
    const label = MOOD_LABELS[data.mood] || data.mood;
    text += `🥰 *Mood*: ${emoji} ${label}\n\n`;
  }

  // Meals section
  if (data.meals.length > 0) {
    text += `🍽️ *Aaj kya khaya:*\n`;
    data.meals.forEach((meal, i) => {
      const time = new Date(meal.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const type = meal.isOutside ? "🏪 Outside" : "🏠 Ghar ka";
      text += `  ${i + 1}. *${meal.mealName}* — ${time} (${type})`;
      if (meal.cost) text += ` — ₹${meal.cost}`;
      text += "\n";
      if (meal.ingredients) {
        const ings = meal.ingredients.split(",").map(i => i.trim()).filter(Boolean).join(", ");
        text += `     🥘 ${ings}\n`;
      }
      if (meal.notes) {
        text += `     💬 ${meal.notes}\n`;
      }
    });
    text += "\n";
  } else {
    text += `🍽️ *Aaj kuch khaya nahi?* Baby, khaana mat bhoolna! 😘\n\n`;
  }

  // Water section
  const waterEmoji = data.waterGlasses >= 8 ? "💪" : data.waterGlasses >= 4 ? "👍" : "💧";
  text += `💧 *Paani*: ${data.waterGlasses}/8 glasses ${waterEmoji}\n`;
  if (data.waterGlasses < 8) {
    text += `   ${8 - data.waterGlasses} glass aur piyo, glow ke liye! ✨\n`;
  } else {
    text += `   Hydration queen! 👑\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━\n`;
  text += `Made with ❤️ by Suar's Kitchen 🍳`;

  return text;
}

/** Copy text to clipboard and return success status */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/** Open WhatsApp share with pre-filled text */
export function shareViaWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  // Web WhatsApp
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
