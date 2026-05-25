"use client";

import { useState, useEffect, useCallback } from "react";

export const MOOD_STORAGE_KEY = "chef-cupid-mood";
export const MOOD_CHANGE_EVENT = "mood-change";

export interface MoodInfo {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  description: string;
  selectedBorder: string;
}

export const MOODS: MoodInfo[] = [
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 hover:bg-green-100",
    darkBgColor: "dark:bg-green-900/20 dark:hover:bg-green-900/30",
    selectedBorder: "border-green-300 dark:border-green-700",
    description: "Feeling great! Let's celebrate with good food!",
  },
  {
    id: "stressed",
    label: "Stressed",
    emoji: "😰",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    darkBgColor: "dark:bg-orange-900/20 dark:hover:bg-orange-900/30",
    selectedBorder: "border-orange-300 dark:border-orange-700",
    description: "Take a deep breath. Let's find comfort food!",
  },
  {
    id: "tired",
    label: "Tired",
    emoji: "😴",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    darkBgColor: "dark:bg-purple-900/20 dark:hover:bg-purple-900/30",
    selectedBorder: "border-purple-300 dark:border-purple-700",
    description: "Need energy? Let's whip up something quick!",
  },
  {
    id: "productive",
    label: "Productive",
    emoji: "💪",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 hover:bg-amber-100",
    darkBgColor: "dark:bg-amber-900/20 dark:hover:bg-amber-900/30",
    selectedBorder: "border-amber-300 dark:border-amber-700",
    description: "Let's fuel this momentum with good nutrition!",
  },
];

export function useMood() {
  const [selectedMood, setSelectedMoodState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // On mount — restore mood from sessionStorage (per-tab, cleared on close)
  // This allows mood to sync across page navigations within the same tab
  // but prevents auto-selection when coming back hours later or in a new tab
  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem(MOOD_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Only restore if within the same session (sessionStorage auto-clears on tab close)
        if (data.mood && data.timestamp) {
          const elapsed = Date.now() - data.timestamp;
          // Restore only if within 30 minutes (covers SPA navigation)
          if (elapsed < 30 * 60 * 1000) {
            setSelectedMoodState(data.mood);
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Listen for mood changes from other components/pages (e.g. dashboard -> chat)
  useEffect(() => {
    function handleMoodChange(e: Event) {
      const customEvent = e as CustomEvent<{ mood: string }>;
      setSelectedMoodState(customEvent.detail.mood);
    }

    window.addEventListener(
      MOOD_CHANGE_EVENT,
      handleMoodChange as EventListener
    );
    return () =>
      window.removeEventListener(
        MOOD_CHANGE_EVENT,
        handleMoodChange as EventListener
      );
  }, []);

  const setSelectedMood = useCallback(
    (moodId: string | null) => {
      setSelectedMoodState(moodId);

      if (moodId) {
        // Save to sessionStorage (per-tab, cleared on close) + localStorage (backup)
        const payload = JSON.stringify({
          timestamp: Date.now(),
          date: new Date().toDateString(),
          mood: moodId,
        });
        sessionStorage.setItem(MOOD_STORAGE_KEY, payload);
        localStorage.setItem(MOOD_STORAGE_KEY, payload);

        // Save to DB (fire-and-forget)
        fetch("/api/mood", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood: moodId }),
        }).catch(() => {});

        // Dispatch event so other components sync
        window.dispatchEvent(
          new CustomEvent(MOOD_CHANGE_EVENT, { detail: { mood: moodId } })
        );
      }
    },
    []
  );

  const currentMood = MOODS.find((m) => m.id === selectedMood) ?? null;

  return { selectedMood, setSelectedMood, currentMood, mounted, moods: MOODS };
}
