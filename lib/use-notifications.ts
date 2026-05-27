"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type NotificationType = "water" | "meal" | "love" | "mood";

export interface NotificationPreferences {
  water: boolean;
  meal: boolean;
  love: boolean;
  mood: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  water: true,
  meal: true,
  love: true,
  mood: false,
};

const PREFS_KEY = "chef-cupid-notification-prefs";
const LAST_WATER_KEY = "chef-cupid-last-water-notif";
const LAST_LOVE_KEY = "chef-cupid-last-love-notif";
const LAST_MEAL_KEY = "chef-cupid-last-meal-notif";
const LAST_MOOD_KEY = "chef-cupid-last-mood-notif";

const LOVE_NOTIFICATIONS = [
  "Hey baby! Just a reminder — you're amazing! 💕",
  "Smile meri jaan! You're the best thing that happened to me 😊",
  "Don't forget — you're loved more than you know! ❤️",
  "Time for a self-care break! You deserve it ✨",
  "Just a reminder: You're beautiful inside and out! 🌸",
];

const WATER_NOTIFICATIONS = [
  "Time to hydrate, baby! 💧",
  "Drink up, beautiful! Your skin will thank you! ✨",
  "Water break! 8 glasses a day keeps the glow going! 🥤",
  "Psst... drink some water! 🤍",
  "Hydration queen! Time for a glass 💦",
];

// ─── Send Server-Side Push (for background delivery) ──────────
/**
 * Call the API to send a server-side push notification.
 * This ensures the notification arrives via Web Push even when
 * the app is backgrounded or closed on mobile (Android).
 * 
 * Also sends the browser's push subscription so the server can
 * save it on-the-fly if it wasn't previously stored in the DB.
 */
/**
 * Try to get an existing push subscription, or create one on the fly
 * if none exists. Returns the subscription JSON, or undefined if unavailable.
 */
async function getOrCreatePushSubscription(): Promise<PushSubscriptionJSON | undefined> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Try existing subscription first
    let sub = await reg.pushManager.getSubscription();

    // If no subscription exists, try to create one on the fly
    // This handles the case where the user granted permission but
    // registerWebPush() failed (e.g., missing VAPID key at the time)
    if (!sub) {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (publicKey) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }
    }

    if (sub) {
      return sub.toJSON();
    }
  } catch (e) {
    console.warn("Could not get/create push subscription:", e);
  }
}

async function sendServerPush(type: string, delay?: number): Promise<{ ok: boolean; error?: string }> {
  try {
    // Get (or create) the browser's push subscription to send along
    const subscription = await getOrCreatePushSubscription();

    const res = await fetch("/api/push/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, subscription, ...(delay ? { delay } : {}) }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error || `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Network error";
    console.warn("Server push failed (background notification may not arrive):", msg);
    return { ok: false, error: msg };
  }
}

// ─── Web Push Subscription ──────────────────────────────────
/**
 * Register the service worker and subscribe to push notifications.
 * Saves the subscription to the server so we can send push from the backend.
 */
async function registerWebPush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported in this browser");
    return false;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY. Push not registered.");
    return false;
  }

  try {
    // Register service worker if not already
    const registration = await navigator.serviceWorker.register("/sw.js");

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    // Save subscription to server
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to register web push:", error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications and remove from server.
 */
async function unregisterWebPush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from server
    await fetch("/api/push/unsubscribe", { method: "POST" });
    return true;
  } catch (error) {
    console.error("Failed to unregister web push:", error);
    return false;
  }
}

/**
 * Convert a Base64 URL-encoded string to a Uint8Array.
 * Required by the Push API for the applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "loading">("loading");
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [swRegistered, setSwRegistered] = useState(false);
  const [webPushSubscribed, setWebPushSubscribed] = useState(false);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      } catch {
        // use defaults
      }
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("denied");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Register service worker for notifications
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => setSwRegistered(true))
      .catch(() => {});
  }, [permission]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      // Also register for web push (background notifications)
      const pushOk = await registerWebPush();
      setWebPushSubscribed(pushOk);
    }

    return result === "granted";
  }, []);

  // Update preferences
  const updatePreference = useCallback(
    (type: NotificationType, value: boolean) => {
      const newPrefs = { ...preferences, [type]: value };
      setPreferences(newPrefs);
      localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));

      // If user disables all notifications, unsubscribe from web push
      const anyEnabled = Object.values(newPrefs).some(Boolean);
      if (!anyEnabled && webPushSubscribed) {
        unregisterWebPush().then(() => setWebPushSubscribed(false));
      }
    },
    [preferences, webPushSubscribed]
  );

  // Show a notification
  const showNotification = useCallback(
    async (title: string, body: string, tag?: string) => {
      if (!("Notification" in window) || Notification.permission !== "granted") return false;

      // Try service worker first (works even when app is backgrounded)
      if (swRegistered && "serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: "/icon-192.jpeg",
            badge: "/icon-192.jpeg",
            tag: tag || "chef-cupid",
            // @ts-expect-error vibrate is supported in browsers but not in TS types
            vibrate: [100, 50, 100],
          });
          return true;
        } catch {
          // Fallback to regular notification
        }
      }

      // Fallback to regular Notification API
      try {
        const notif = new Notification(title, {
          body,
          icon: "/icon-192.jpeg",
          tag: tag || "chef-cupid",
          // @ts-expect-error vibrate is supported in browsers but not in TS types
          vibrate: [100, 50, 100],
        });
        setTimeout(() => notif.close(), 5000);
        return true;
      } catch {
        return false;
      }
    },
    [swRegistered]
  );

  // Start periodic reminders
  const startReminders = useCallback(() => {
    // Clear existing intervals
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Water reminder every 2 hours (if enabled)
    if (preferences.water) {
      const waterInterval = setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        // Only between 8 AM and 10 PM
        if (hour >= 8 && hour <= 22) {
          const lastWater = localStorage.getItem(LAST_WATER_KEY);
          const lastDate = lastWater ? new Date(lastWater).toDateString() : "";
          if (lastDate !== now.toDateString()) {
            const msg = WATER_NOTIFICATIONS[Math.floor(Math.random() * WATER_NOTIFICATIONS.length)];
            showNotification("💧 Water Reminder", msg, "water-reminder");
            void sendServerPush("water"); // Also send via server for background delivery
            localStorage.setItem(LAST_WATER_KEY, now.toISOString());
          }
        }
      }, 2 * 60 * 60 * 1000); // Every 2 hours
      intervalsRef.current.push(waterInterval);
    }

    // Love note every 4 hours (if enabled)
    if (preferences.love) {
      const loveInterval = setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 9 && hour <= 21) {
          const lastLove = localStorage.getItem(LAST_LOVE_KEY);
          const lastDate = lastLove ? new Date(lastLove).toDateString() : "";
          if (lastDate !== now.toDateString()) {
            const msg = LOVE_NOTIFICATIONS[Math.floor(Math.random() * LOVE_NOTIFICATIONS.length)];
            showNotification("💕 Love Note for You", msg, "love-note");
            void sendServerPush("love"); // Also send via server for background delivery
            localStorage.setItem(LAST_LOVE_KEY, now.toISOString());
          }
        }
      }, 4 * 60 * 60 * 1000); // Every 4 hours
      intervalsRef.current.push(loveInterval);
    }

    // Meal reminder at 9 AM, 1 PM, 8 PM (if enabled)
    if (preferences.meal) {
      const mealInterval = setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        const mealTimes: Record<number, { name: string; tag: string }> = {
          9: { name: "breakfast 🥞", tag: "breakfast-time" },
          13: { name: "lunch 🍛", tag: "lunch-time" },
          20: { name: "dinner 🍜", tag: "dinner-time" },
        };
        const mealNow = mealTimes[hour];
        if (mealNow) {
          const lastMealData = localStorage.getItem(LAST_MEAL_KEY);
          const today = now.toDateString();
          const alreadyShown = lastMealData
            ? JSON.parse(lastMealData)
            : {};
          if (alreadyShown[today] !== mealNow.tag) {
            showNotification(
              "🍽️ Time to Eat!",
              `Baby, it's ${mealNow.name} time! What should I suggest today?`,
              mealNow.tag
            );
            void sendServerPush("meal"); // Also send via server for background delivery
            alreadyShown[today] = mealNow.tag;
            localStorage.setItem(LAST_MEAL_KEY, JSON.stringify(alreadyShown));
          }
        }
      }, 60 * 60 * 1000); // Check every hour
      intervalsRef.current.push(mealInterval);
    }

    // Mood check at 3 PM (if enabled)
    if (preferences.mood) {
      const moodInterval = setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        if (hour === 15) {
          const lastMoodData = localStorage.getItem(LAST_MOOD_KEY);
          const today = now.toDateString();
          if (lastMoodData !== today) {
            showNotification(
              "🥰 Mood Check",
              "How are you feeling this afternoon, baby? Tap to tell me!",
              "mood-check"
            );
            void sendServerPush("mood"); // Also send via server for background delivery
            localStorage.setItem(LAST_MOOD_KEY, today);
          }
        }
      }, 60 * 60 * 1000); // Check every hour
      intervalsRef.current.push(moodInterval);
    }
  }, [preferences, showNotification]);

  // Start/stop reminders based on preferences
  useEffect(() => {
    if (permission === "granted") {
      startReminders();
    }
    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  }, [permission, startReminders]);

  // Test a notification immediately (local + server push)
  const testNotification = useCallback(async () => {
    const local = await showNotification(
      "🔔 Notification Test",
      "If you can see this, notifications are working baby! 💕",
      "test-notif"
    );
    void sendServerPush("water"); // Also test server-side push pipeline
    return local;
  }, [showNotification]);

  /**
   * Test delayed notifications — sends ALL 4 types from the server after `delayMs`.
   * Close the app within the delay window to verify background delivery works!
   * Each type is sent with a small stagger (300ms) to avoid overwhelming the server.
   */
  const testDelayedNotification = useCallback(async (delayMs: number = 7000) => {
    const types: NotificationType[] = ["water", "meal", "love", "mood"];
    const results: { type: string; server: boolean; delayMs: number; error?: string }[] = [];

    for (const type of types) {
      const result = await sendServerPush(type, delayMs);
      results.push({ type, server: result.ok, delayMs, error: result.error });
      // Small stagger between requests so server timers don't all fire at once
      await new Promise((r) => setTimeout(r, 300));
    }

    return results;
  }, []);

  /**
   * Send ALL 4 types of test notifications one by one.
   * This lets you verify that every scheduled reminder works end-to-end.
   */
  const testAllNotifications = useCallback(async () => {
    const results: { type: string; local: boolean; server: boolean }[] = [];

    // Helper: send a notification with a small delay between each
    const sendWithDelay = async (
      type: NotificationType,
      title: string,
      body: string,
      tag: string,
      delayMs: number
    ) => {
      await new Promise((r) => setTimeout(r, delayMs));
      const local = await showNotification(title, body, tag);
      const serverResult = await sendServerPush(type);
      results.push({ type, local, server: serverResult.ok });
    };

    // 1. Water Reminder
    await sendWithDelay(
      "water",
      "💧 Water Reminder",
      "[TEST] Time to hydrate, baby! 💧",
      "test-water",
      0
    );

    // 2. Meal Time
    await sendWithDelay(
      "meal",
      "🍽️ Time to Eat!",
      "[TEST] Baby, it's time to eat! 🍽️",
      "test-meal",
      1500
    );

    // 3. Love Note
    await sendWithDelay(
      "love",
      "💕 Love Note for You",
      "[TEST] Hey baby! Just a reminder — you're amazing! 💕",
      "test-love",
      1500
    );

    // 4. Mood Check
    await sendWithDelay(
      "mood",
      "🥰 Mood Check",
      "[TEST] How are you feeling this afternoon, baby? Tap to tell me!",
      "test-mood",
      1500
    );

    // Show a summary notification after all 4
    const allLocalOk = results.every((r) => r.local);
    const allServerOk = results.every((r) => r.server);
    const summaryBody = allLocalOk && allServerOk
      ? "All 4 notifications sent successfully! ✅"
      : `Local: ${results.filter((r) => r.local).length}/4, Server: ${results.filter((r) => r.server).length}/4`;
    await showNotification("📋 Test Complete", summaryBody, "test-summary");

    return results;
  }, [showNotification]);

  return {
    permission,
    preferences,
    requestPermission,
    updatePreference,
    showNotification,
    testNotification,
    testAllNotifications,
    testDelayedNotification,
    webPushSubscribed,
  };
}
