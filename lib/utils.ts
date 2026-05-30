import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get a time-of-day greeting based on the hour (0-23).
 */
export function getTimeOfDay(hour: number): {
  greeting: string;
  period: "morning" | "afternoon" | "evening" | "night";
} {
  if (hour >= 5 && hour < 12) {
    return { greeting: "morning", period: "morning" };
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: "afternoon", period: "afternoon" };
  }
  if (hour >= 17 && hour < 21) {
    return { greeting: "evening", period: "evening" };
  }
  return { greeting: "night", period: "night" };
}

/**
 * Generate a mood check notification body that matches the current time of day.
 */
export function getMoodCheckBody(hour: number): string {
  const { greeting } = getTimeOfDay(hour);
  const greetings: Record<string, string> = {
    morning: "Good morning baby! How are you feeling today? 🌅",
    afternoon: "How are you feeling this afternoon, baby? Tap to tell me!",
    evening: "How's your evening going, baby? Tap to share! 🌆",
    night: "How was your day, baby? Tap to tell me about it! 🌙",
  };
  return greetings[greeting];
}


