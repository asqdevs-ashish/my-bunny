"use client";

import { useState, useRef, useEffect } from "react";
import { usePartnerChat, type PartnerChatMessage } from "@/lib/pusher-client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Send,
  Heart,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCheck,
  X,
  MessageCircle,
  ChefHat,
} from "lucide-react";
import Link from "next/link";

// ─── Time formatter ──────────────────────────────────────────
function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Date Separator ──────────────────────────────────────────
function DateSeparator({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (date.toDateString() === today.toDateString()) {
    label = "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  } else {
    label = date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-full bg-muted/80 px-3 py-1 text-[11px] font-medium text-muted-foreground/80 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────
function ChatBubble({
  message,
  isOwn,
}: {
  message: PartnerChatMessage;
  isOwn: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full mb-1",
        isOwn ? "justify-end" : "justify-start",
        "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[70%] px-3 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]",
          isOwn
            ? "bg-[#dcf8c6] dark:bg-[#056162] text-[#303030] dark:text-white rounded-l-lg rounded-br-lg rounded-tr-none"
            : "bg-white dark:bg-[#262d31] text-[#303030] dark:text-white rounded-r-lg rounded-bl-lg rounded-tl-none"
        )}
      >
        {/* Tail decoration */}
        <div 
          className={cn(
            "absolute top-0 w-3 h-3",
            isOwn 
              ? "-right-2 bg-[#dcf8c6] dark:bg-[#056162]" 
              : "-left-2 bg-white dark:bg-[#262d31]"
          )}
          style={{ 
            clipPath: isOwn 
              ? "polygon(0 0, 0% 100%, 100% 0)" 
              : "polygon(100% 0, 100% 100%, 0 0)" 
          }}
        />

        <p className="text-[14.2px] sm:text-[15px] leading-[1.4] whitespace-pre-wrap break-words">
          {message.content}
        </p>

        <div className="mt-0.5 flex items-center justify-end gap-1 select-none">
          <span className="text-[10px] opacity-60 tabular-nums">
            {formatMessageTime(message.createdAt)}
          </span>
          {isOwn && (
            <div className="flex -space-x-1">
              <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyChat({ partnerName }: { partnerName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 shadow-inner">
        <Heart className="h-7 w-7 text-rose-400" fill="currentColor" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-card" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Chat with {partnerName} 💕
      </h3>
      <p className="mt-1.5 max-w-xs text-center text-sm text-muted-foreground leading-relaxed">
        Send a sweet message, share what you&apos;re eating, or just say hi!
        Everything is private between you two.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PARTNER CHAT INTERFACE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface PartnerChatInterfaceProps {
  onBack?: () => void;
  fullScreen?: boolean;
}

export function PartnerChatInterface({
  onBack,
  fullScreen = false,
}: PartnerChatInterfaceProps) {
  const { data: session } = useSession();
  const [partnerInfo, setPartnerInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const myId = session?.user?.id || null;

  const {
    messages,
    loading: chatLoading,
    sending,
    error,
    sendMessage,
    setError,
  } = usePartnerChat({
    partnerId: partnerInfo?.id || null,
    myId,
  });

  // Fetch partner info
  useEffect(() => {
    async function fetchPartner() {
      try {
        const res = await fetch("/api/partner/status");
        if (res.ok) {
          const data = await res.json();
          if (data.linked && data.partner) {
            setPartnerInfo(data.partner);
          }
        }
      } catch {
        // Silently fail
      } finally {
        setStatusLoading(false);
      }
    }
    fetchPartner();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const text = input;
    setInput("");
    const success = await sendMessage(text);
    if (!success) {
      setInput(text); // Restore on failure
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  // Group messages by date
  function groupMessagesByDate(msgs: PartnerChatMessage[]) {
    const groups: { date: string; messages: PartnerChatMessage[] }[] = [];
    let currentDate = "";

    for (const msg of msgs) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }

    return groups;
  }

  if (statusLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!partnerInfo) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20">
          <MessageCircle className="h-7 w-7 text-rose-400" />
        </div>
        <h3 className="text-lg font-semibold">No Partner Linked</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Link your partner on the dashboard first to start chatting! 💕
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
        >
          <Heart className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden",
        fullScreen
          ? "flex-1 min-h-0 rounded-none border-0"
          : "h-[calc(100vh-8rem)] min-h-[450px] rounded-2xl border border-border bg-card shadow-md"
      )}
    >
      {/* ═══ Header ═══ */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-md px-3 py-3 sm:px-4 z-10 shadow-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Partner Avatar */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-amber-400 dark:from-rose-500 dark:to-amber-500 shadow-sm">
          <span className="text-sm font-bold text-white">
            {partnerInfo.name.charAt(0).toUpperCase()}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-400" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {partnerInfo.name}
          </h2>
          <p className="flex items-center gap-1 text-[11px] text-green-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Online
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Link to AI Chef Chat */}
          {fullScreen && (
            <Link
              href="/chat"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-sm active:scale-95"
            >
              <ChefHat className="h-3.5 w-3.5" />
              AI Chef
            </Link>
          )}

          {/* Close Button */}
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            title="Close Chat"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ═══ Messages ═══ */}
      <div 
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 space-y-2 relative no-scrollbar"
        style={{
          backgroundColor: "var(--chat-bg, #efe7de)",
          backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
          backgroundRepeat: "repeat",
          backgroundSize: "400px",
          backgroundBlendMode: "soft-light",
          scrollBehavior: "smooth"
        }}
      >
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <style jsx>{`
          .dark {
            --chat-bg: #0b141a;
          }
        `}</style>
        {chatLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyChat partnerName={partnerInfo.name} />
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              <DateSeparator dateStr={group.date} />
              {group.messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === myId}
                />
              ))}
            </div>
          ))
        )}

        {/* Error toast */}
        {error && (
          <div className="mx-auto flex max-w-xs items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 shadow-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto shrink-0 rounded-full p-0.5 text-red-400 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══ Input ═══ */}
      <div className="shrink-0 bg-[#f0f2f5] dark:bg-[#111b21] px-2 py-2 sm:px-4 sm:py-3 border-t border-border/10">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 max-w-5xl mx-auto pb-[env(safe-area-inset-bottom)]"
        >
          <div className="relative flex-1 flex items-center bg-white dark:bg-[#2a3942] rounded-[24px] px-3 py-1.5 shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... 💕"
              rows={1}
              disabled={sending}
              className="flex-1 resize-none bg-transparent px-2 py-1 text-[15px] text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50 min-h-[24px] max-h-[120px]"
            />
          </div>

          <Button
            type="submit"
            disabled={!input.trim() || sending}
            className={cn(
              "shrink-0 rounded-full h-[45px] w-[45px] p-0 flex items-center justify-center transition-all duration-200",
              input.trim() && !sending
                ? "bg-[#00a884] hover:bg-[#06cf9c] text-white shadow-md"
                : "bg-muted text-muted-foreground",
              "active:scale-95"
            )}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
