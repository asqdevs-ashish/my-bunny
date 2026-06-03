"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Heart, Loader2, MessageSquareHeart, Sparkles, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher-client";
import { useSession } from "next-auth/react";

interface SecretNote {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { name: string; id: string };
  receiver: { name: string };
}

export function SecretNoteExchange() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<SecretNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getPusherClient>>["subscribe"]> | null>(null);

  useEffect(() => {
    fetchNotes();

    // Subscribe to Pusher for real-time secret note updates
    const client = getPusherClient();
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    if (!client) {
      // Pusher not configured — poll every 10s
      pollInterval = setInterval(fetchNotes, 10000);
    } else {
      fetch("/api/partner/status")
        .then((r) => r.json())
        .then((status) => {
          if (!status.linked || !status.partner?.id) return;
          const myId = session?.user?.id;
          if (!myId) return;

          const [a, b] = [myId, status.partner.id].sort();
          const channelName = `private-partner-${a}-${b}`;
          const channel = client.subscribe(channelName);
          channelRef.current = channel;

          channel.bind("partner-update", (data: { type?: string }) => {
            // Refresh when partner sends a secret note
            if (!data.type || data.type === "secret-note") {
              fetchNotes();
            }
          });
        })
        .catch(() => {});
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
    };
  }, [session?.user?.id]);

  async function fetchNotes() {
    try {
      const res = await fetch("/api/secret-notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);

    try {
      const res = await fetch("/api/secret-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setContent("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Failed to send note:", error);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="relative overflow-hidden group/card border-amber-200 dark:border-amber-900/20 shadow-md bg-gradient-to-br from-white to-amber-50/30 dark:from-black dark:to-amber-900/5">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Lock className="h-10 w-10 text-amber-500 rotate-12" />
      </div>
      
      <CardHeader className="pb-3 border-b border-amber-100/50 dark:border-amber-900/10">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <MessageSquareHeart className="h-4 w-4 text-rose-500" />
          </div>
          Private Love Notes 💌
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* Send Note Input */}
        <form onSubmit={handleSendNote} className="relative group/input">
          <textarea
            placeholder="Leave a secret message for later... 💕"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[90px] rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-black/40 p-4 pr-12 text-[13.5px] outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none italic shadow-inner"
          />
          <Button
            type="submit"
            disabled={sending || !content.trim()}
            size="icon"
            className={cn(
              "absolute bottom-3 right-3 h-9 w-9 rounded-full transition-all active:scale-90",
              content.trim() 
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-none" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        {/* Notes List */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-amber-400" /></div>
          ) : notes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground/50 italic text-xs flex flex-col items-center gap-2">
              <Sparkles className="h-5 w-5 opacity-20" />
              <span>Leave a sweet message for later... ✨</span>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "relative p-4 rounded-2xl text-sm group/note transition-all duration-300 border border-amber-100/50 dark:border-amber-900/10",
                  "bg-white dark:bg-[#1a1a2e]/40 shadow-sm hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="leading-relaxed text-foreground/85 font-medium italic selection:bg-rose-100 selection:text-rose-900">
                      &quot;{note.content}&quot;
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground/60">
                      <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                        {note.sender.name}
                      </span>
                      <span className="flex items-center gap-1 opacity-70">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(note.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <Heart className="h-4 w-4 text-rose-200 group-hover/note:text-rose-500 group-hover/note:scale-110 transition-all duration-300" fill={note.isRead ? "currentColor" : "none"} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
