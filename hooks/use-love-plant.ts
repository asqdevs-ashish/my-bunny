"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";

// ─── Types ────────────────────────────────────────────────────
export interface PartnerProgress {
  water: { current: number; goal: number };
  meals: { current: number; goal: number };
  score: number;
}

export type PlantStage = "SEED" | "SPROUT" | "PLANT" | "FLOWER";

export type AchievementType =
  | "first_bloom"
  | "three_day_streak"
  | "seven_day_streak"
  | "perfect_week"
  | "water_warriors"
  | "meal_masters";

export interface Achievement {
  type: AchievementType;
  awardedAt: string;
}

export interface LovePlantData {
  stage: PlantStage;
  health: number;
  userProgress: PartnerProgress;
  partnerProgress: PartnerProgress;
  combinedScore: number;
  coupleKey: string | null;
  streak: number;
  achievements: Achievement[];
  newAchievements: AchievementType[];
  updatedAt: string;
}

export interface UseLovePlantOptions {
  partnerId: string | null;
  myId: string | null;
}

// ─── Plant stage metadata ─────────────────────────────────────
export const STAGE_META: Record<
  PlantStage,
  { label: string; emoji: string; description: string; color: string }
> = {
  SEED: {
    label: "Seed 🌱",
    emoji: "🌱",
    description: "Your love plant is just a seed. Nurture it together!",
    color: "from-amber-600 to-yellow-500",
  },
  SPROUT: {
    label: "Sprout 🌿",
    emoji: "🌿",
    description: "A tiny sprout is showing! Keep up the teamwork!",
    color: "from-green-500 to-emerald-400",
  },
  PLANT: {
    label: "Plant 🌻",
    emoji: "🌻",
    description: "Your love plant is growing strong! Beautiful!",
    color: "from-emerald-500 to-green-400",
  },
  FLOWER: {
    label: "Flower 🌸",
    emoji: "🌸",
    description: "Full bloom! Your love is thriving! ✨",
    color: "from-pink-400 to-rose-300",
  },
};

// ─── Achievement metadata ─────────────────────────────────────
export const ACHIEVEMENT_META: Record<
  AchievementType,
  { label: string; emoji: string; description: string }
> = {
  first_bloom: {
    label: "First Bloom",
    emoji: "🌸",
    description: "Your love plant bloomed for the first time!",
  },
  three_day_streak: {
    label: "3-Day Streak",
    emoji: "🔥",
    description: "3 days of caring together!",
  },
  seven_day_streak: {
    label: "7-Day Streak",
    emoji: "💫",
    description: "A whole week of love and care!",
  },
  perfect_week: {
    label: "Perfect Week",
    emoji: "🌟",
    description: "Perfect health for 7 days straight!",
  },
  water_warriors: {
    label: "Water Warriors",
    emoji: "💧",
    description: "100 glasses of water logged together!",
  },
  meal_masters: {
    label: "Meal Masters",
    emoji: "🍽️",
    description: "50 meals logged together!",
  },
};

const INITIAL_DATA: LovePlantData = {
  stage: "SEED",
  health: 0,
  userProgress: { water: { current: 0, goal: 8 }, meals: { current: 0, goal: 3 }, score: 0 },
  partnerProgress: { water: { current: 0, goal: 8 }, meals: { current: 0, goal: 3 }, score: 0 },
  combinedScore: 0,
  coupleKey: null,
  streak: 0,
  achievements: [],
  newAchievements: [],
  updatedAt: new Date().toISOString(),
};

// ─── Hook ─────────────────────────────────────────────────────
export function useLovePlant({ partnerId, myId }: UseLovePlantOptions) {
  const [data, setData] = useState<LovePlantData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getPusherClient>>["subscribe"]> | null>(null);

  const fetchPlant = useCallback(async () => {
    try {
      const res = await fetch("/api/love-plant");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        const text = await res.text();
        setError(text || "Failed to fetch plant data");
      }
    } catch (err) {
      console.error("Failed to fetch love plant:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPlant();
  }, [fetchPlant]);

  // Subscribe to Pusher for real-time updates (reusing lib's singleton)
  useEffect(() => {
    if (!partnerId || !myId) return;

    const client = getPusherClient();
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    if (!client) {
      // Fallback: poll every 10s
      pollInterval = setInterval(fetchPlant, 10000);
    } else {
      const [a, b] = [myId, partnerId].sort();
      const channelName = `private-partner-${a}-${b}`;
      const channel = client.subscribe(channelName);
      channelRef.current = channel;

      channel.bind("pusher:subscription_error", () => {
        if (!pollInterval) {
          pollInterval = setInterval(fetchPlant, 10000);
        }
      });

      channel.bind("love-plant-update", () => {
        fetchPlant();
      });
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channelRef.current) {
        const [a, b] = [myId, partnerId].sort();
        const channelName = `private-partner-${a}-${b}`;
        client?.unsubscribe(channelName);
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
    };
  }, [partnerId, myId, fetchPlant]);

  return { data, loading, error, refetch: fetchPlant };
}
