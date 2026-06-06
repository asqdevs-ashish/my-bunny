"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PusherJS from "pusher-js";

// Singleton pusher client across the app
let pusherClient: PusherJS | null = null;

export function getPusherClient(): PusherJS | null {
  if (typeof window === "undefined") return null;

  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

    if (!key) {
      console.warn("Pusher client: Missing NEXT_PUBLIC_PUSHER_KEY. Real-time chat disabled.");
      return null;
    }

    pusherClient = new PusherJS(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
      enabledTransports: ["ws", "wss"],
    });
  }

  return pusherClient;
}

export interface PartnerChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  role: "partner" | "user" | "assistant";
  createdAt: string;
  readAt?: string | null;
}

interface UsePartnerChatOptions {
  partnerId: string | null;
  myId: string | null;
}

export function usePartnerChat({ partnerId, myId }: UsePartnerChatOptions) {
  const [messages, setMessages] = useState<PartnerChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<typeof pusherClient>["subscribe"]> | null>(null);

  // Fetch chat history
  const fetchHistory = useCallback(async () => {
    if (!partnerId) return;
    try {
      const res = await fetch("/api/partner-chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  // Load initial history
  useEffect(() => {
    if (partnerId) {
      fetchHistory();
    }
  }, [partnerId, fetchHistory]);

  // Subscribe to Pusher channel (with Polling Fallback)
  useEffect(() => {
    if (!partnerId || !myId) return;

    const client = getPusherClient();
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    if (!client) {
      // Pusher not configured — use polling fallback
      console.log("Pusher not configured. Using polling fallback for chat.");
      pollInterval = setInterval(fetchHistory, 5000); // Check every 5s
    } else {
      const [a, b] = [myId, partnerId].sort();
      const channelName = `private-partner-${a}-${b}`;

      const channel = client.subscribe(channelName);
      channelRef.current = channel;

      channel.bind("pusher:subscription_error", (err: unknown) => {
        console.error("Pusher subscription error:", err);
        // Fallback to polling on error
        if (!pollInterval) {
          console.log("Switching to polling fallback due to subscription error.");
          pollInterval = setInterval(fetchHistory, 5000);
        }
      });

      channel.bind("new-message", (data: { message: PartnerChatMessage }) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      });

      channel.bind("messages-read", (data: { readAt: string; messageIds: string[] }) => {
        setMessages((prev) =>
          prev.map((m) =>
            data.messageIds.includes(m.id)
              ? { ...m, readAt: data.readAt }
              : m
          )
        );
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
  }, [partnerId, myId, fetchHistory]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim() || !partnerId || sending) return false;

      setSending(true);
      setError(null);

      // Optimistic message
      const optimisticId = `opt-${Date.now()}`;
      const optimisticMsg: PartnerChatMessage = {
        id: optimisticId,
        senderId: myId || "",
        receiverId: partnerId,
        content: content.trim(),
        role: "partner",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await fetch("/api/partner-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Failed to send message");
        }

        const saved = await res.json();

        // Replace optimistic message with real one.
        // Edge case: if Pusher already delivered the real message,
        // just remove the optimistic one to avoid duplicate keys.
        setMessages((prev) => {
          const realAlreadyExists = prev.some((m) => m.id === saved.message.id);
          if (realAlreadyExists) {
            return prev.filter((m) => m.id !== optimisticId);
          }
          return prev.map((m) => (m.id === optimisticId ? saved.message : m));
        });

        return true;
      } catch (err) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        const msg = err instanceof Error ? err.message : "Failed to send";
        setError(msg);
        return false;
      } finally {
        setSending(false);
      }
    },
    [partnerId, myId, sending]
  );

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    setError,
  };
}
