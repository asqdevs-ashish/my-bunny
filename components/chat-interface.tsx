"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Send,
  ChefHat,
  Heart,
  Copy,
  Check,
  IndianRupee,
  ClipboardList,
  X,
  Sparkles,
  ArrowDown,
  Smile,
  Brain,
  Frown,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMood, MOODS } from "@/lib/use-mood";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

// ─── SimpleMarkdown renderer ──────────────────────────────────
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Heading (###)
        if (line.startsWith("### ")) {
          return (
            <p key={i} className="font-bold text-sm pt-1">
              {line.slice(4)}
            </p>
          );
        }
        // Bullet points
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-2 pl-0">
              <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
              <span>{line.substring(2)}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\.\s/)?.[1];
          const text = line.replace(/^\d+\.\s/, "");
          return (
            <div key={i} className="flex items-start gap-2 pl-0">
              <span className="mt-0 min-w-[18px] text-xs font-medium opacity-60">
                {num}.
              </span>
              <span>{text}</span>
            </div>
          );
        }
        if (line.trim() === "") return <br key={i} />;
        // Bold within line
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── Extract ingredients ──────────────────────────────────────
function extractIngredients(content: string): string[] {
  return content
    .split("\n")
    .filter((line) => line.startsWith("- ") || line.startsWith("* "))
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((item) => item.length > 2);
}

const BUDGET_OPTIONS = [100, 200, 300, 500, 1000];
const SUGGESTIONS = [
  "Ghar me kya hai? 🏠",
  "Healthy breakfast 🥗",
  "Comfort food 🥰",
  "Quick dinner ⚡",
];

// ─── Suggestion Chip ──────────────────────────────────────────
function SuggestionChip({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "budget";
}) {
  if (variant === "budget") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 dark:border-amber-700/40 bg-amber-50/70 dark:bg-amber-900/15 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:shadow-sm active:scale-95"
      >
        <IndianRupee className="h-3 w-3" />
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-border/60 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-sm active:scale-95"
    >
      {label}
    </button>
  );
}

// ─── Typing Dots ──────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 dark:bg-amber-500 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 dark:bg-amber-500 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 dark:bg-amber-500 [animation-delay:300ms]" />
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────
function ActionBtn({
  icon: Icon,
  label,
  active,
  onClick,
  className,
}: {
  icon: typeof Copy;
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all hover:shadow-sm active:scale-95",
        active
          ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
          : "bg-black/5 dark:bg-white/10 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/15",
        className
      )}
    >
      <Icon className={cn("h-3 w-3", active && "text-green-500")} />
      {label}
    </button>
  );
}

// ─── Floating Scroll Button ───────────────────────────────────
function ScrollToBottom({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-card border border-border shadow-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all animate-fade-in hover:shadow-xl active:scale-95"
    >
      <ArrowDown className="h-3 w-3" />
      New messages
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHAT INTERFACE COMPONENT
// ═══════════════════════════════════════════════════════════════

const moodIconMap: Record<string, typeof Smile> = {
  happy: Smile,
  stressed: Brain,
  tired: Frown,
  productive: Zap,
};

export function ChatInterface() {
  const router = useRouter();
  const { selectedMood, setSelectedMood, currentMood, mounted } = useMood();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Auto-resize textarea ──────────────────────────────────
  function autoResizeTextarea() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  // ── Scroll management ─────────────────────────────────────
  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }

  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distFromBottom < 80;
    setIsNearBottom(near);
    setShowScrollBtn(!near && messages.length > 3);
  }

  useEffect(() => {
    if (isNearBottom) scrollToBottom("smooth");
  }, [messages, isNearBottom]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ── Clipboard ─────────────────────────────────────────────
  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCopyShoppingList() {
    const allIngredients = new Set<string>();
    for (const msg of messages) {
      if (msg.role === "assistant" && msg.content) {
        extractIngredients(msg.content).forEach((ing) => allIngredients.add(ing));
      }
    }
    if (allIngredients.size === 0) return;
    const list = Array.from(allIngredients).map((i) => `☐ ${i}`).join("\n");
    await navigator.clipboard.writeText(list);
    setCopiedId("shopping-list");
    setTimeout(() => setCopiedId(null), 2000);
  }

  // ── Send message ──────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      abortRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },          body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mood: selectedMood, // pass current mood for instant AI context
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
          const parsed = JSON.parse(errorBody);
          errorBody = parsed.error || errorBody;
        } catch {
          // ignore
        }
        throw new Error(errorBody || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;

      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Chat fetch error:", errorMsg);

      const isHttpError = errorMsg.includes("HTTP");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: isHttpError
                  ? "⚠️ **Server Error** — Check your API key or try again later."
                  : `😅 ${errorMsg}`,
              }
            : msg
        )
      );
      setError(
        isHttpError
          ? "Server returned an error. Check your Google Gemini API key in .env!"
          : `Error: ${errorMsg}`
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion);
    setTimeout(() => sendMessage(suggestion), 50);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex flex-1 min-h-[400px] sm:flex-none sm:h-[calc(100vh-8rem)] sm:min-h-[400px] flex-col overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-border bg-card shadow-sm sm:shadow-md">
      {/* ── Gradient top accent ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-500" />

      {/* ═══ HEADER ═══ */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border/60 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 dark:from-amber-500 dark:to-yellow-500 shadow-sm">
          <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold sm:text-base">
              My Bunny AI
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            Your personal AI chef &amp; wellness buddy
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Shopping List (desktop) */}
          {hasMessages && (
            <button
              onClick={handleCopyShoppingList}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-sm active:scale-95"
            >
              {copiedId === "shopping-list" ? (
                <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
              ) : (
                <><ClipboardList className="h-3.5 w-3.5" /> List</>
              )}
            </button>
          )}

          {/* Shopping List (mobile icon) */}
          {hasMessages && (
            <button
              onClick={handleCopyShoppingList}
              className="sm:hidden inline-flex items-center justify-center rounded-full border border-border/60 bg-secondary/50 p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
            >
              {copiedId === "shopping-list" ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ClipboardList className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Close */}
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center rounded-full border border-border/60 bg-secondary/50 p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95 sm:px-3 sm:py-1.5"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1 text-[11px] font-medium">Close</span>
          </button>
        </div>
      </div>

      {/* ═══ MESSAGES ═══ */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 space-y-4 scroll-smooth"
      >
        <ScrollToBottom visible={showScrollBtn} onClick={() => scrollToBottom()} />

        {/* ── Empty State — Mood Picker if no mood selected ── */}
        {!hasMessages && (!selectedMood || !mounted) && (
          <div className="relative flex h-full flex-col items-center justify-center px-3 py-6">
            {/* Animated hearts background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04] dark:opacity-[0.06]">
              {Array.from({ length: 6 }).map((_, i) => (
                <Heart
                  key={i}
                  className="absolute animate-float text-rose-500"
                  fill="currentColor"
                  style={{
                    left: `${10 + (i * 15) % 80}%`,
                    top: `${5 + (i * 15) % 80}%`,
                    width: `${16 + (i * 8) % 24}px`,
                    height: `${16 + (i * 8) % 24}px`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: `${3 + (i % 3)}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 shadow-inner">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-rose-500 dark:text-amber-400 animate-pulse-soft" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Pehle batao... 🥰
            </h3>
            <p className="mt-1 max-w-xs text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Aaj kaisa feel kar rahi ho? Apna mood select karo, phir main
              perfect recipe suggest karunga! ✨
            </p>

            {/* Mood options */}
            <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-2.5">
              {MOODS.map((mood) => {
                const MoodIcon = moodIconMap[mood.id] || Smile;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl p-3.5 transition-all duration-300",
                      mood.bgColor,
                      mood.darkBgColor,
                      "hover:scale-[1.04] active:scale-[0.97] hover:shadow-md"
                    )}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty State — Chat ready (mood selected, no messages yet) ── */}
        {!hasMessages && selectedMood && mounted && (
          <div className="relative flex h-full flex-col items-center justify-center px-3 py-8">
            {/* Animated hearts background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04] dark:opacity-[0.06]">
              {Array.from({ length: 8 }).map((_, i) => (
                <Heart
                  key={i}
                  className="absolute animate-float text-rose-500"
                  fill="currentColor"
                  style={{
                    left: `${10 + (i * 12) % 80}%`,
                    top: `${5 + (i * 15) % 80}%`,
                    width: `${16 + (i * 8) % 24}px`,
                    height: `${16 + (i * 8) % 24}px`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: `${3 + (i % 3)}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 shadow-inner">
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-rose-500 dark:text-amber-400 animate-pulse-soft" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Hey baby! 🥰
            </h3>
            <p className="mt-1.5 max-w-xs text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {currentMood?.description || "Kya banaun aaj? Tell me what you&apos;re craving and I&apos;ll whip up the perfect recipe for you! ✨"}
            </p>

            {/* Suggestion chips */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <SuggestionChip
                  key={s}
                  label={s}
                  onClick={() => handleSuggestionClick(s)}
                />
              ))}
            </div>

            {/* Budget */}
            <div className="mt-5 w-full max-w-xs">
              <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                <IndianRupee className="mr-1 inline h-3 w-3" />
                Budget
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {BUDGET_OPTIONS.map((b) => (
                  <SuggestionChip
                    key={b}
                    variant="budget"
                    label={`₹${b}`}
                    onClick={() =>
                      handleSuggestionClick(`My budget is ₹${b}. Suggest something good!`)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Message list ── */}
        {messages.map((message, idx) => {
          const isUser = message.role === "user";
          const ingredients =
            !isUser && message.content
              ? extractIngredients(message.content)
              : [];

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-2.5 sm:gap-3",
                isUser ? "flex-row-reverse" : "flex-row",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              {/* Avatar */}
              <div className="shrink-0 mt-0.5">
                <Image
                  src={isUser ? "/profile.png" : "/ai.profile.png"}
                  alt={isUser ? "You" : "AI Chef"}
                  width={32}
                  height={32}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl object-cover ring-2 ring-border/60"
                />
              </div>

              {/* Bubble */}
              <div className={cn("group min-w-0 max-w-[88%] sm:max-w-[78%] space-y-1")}>
                <div
                  className={cn(
                    "relative rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "bg-gradient-to-br from-rose-500 to-amber-500 text-white rounded-br-sm"
                      : "bg-secondary/80 text-secondary-foreground rounded-bl-sm border border-border/30"
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  ) : message.content ? (
                    <SimpleMarkdown content={message.content} />
                  ) : (
                    <TypingDots />
                  )}
                </div>

                {/* Action buttons (AI messages only) */}
                {!isUser && message.content && (
                  <div className="flex flex-wrap items-center gap-1.5 px-1">
                    {/* Copy */}
                    <ActionBtn
                      icon={copiedId === message.id ? Check : Copy}
                      label={copiedId === message.id ? "Copied" : "Copy"}
                      active={copiedId === message.id}
                      onClick={() => handleCopy(message.content, message.id)}
                    />

                    {/* Shopping list from this message */}
                    {ingredients.length > 0 && (
                      <ActionBtn
                        icon={copiedId === `shop-${message.id}` ? Check : ClipboardList}
                        label={copiedId === `shop-${message.id}` ? "Copied!" : `${ingredients.length} items`}
                        active={copiedId === `shop-${message.id}`}
                        onClick={() => {
                          const list = ingredients.map((i) => `☐ ${i}`).join("\n");
                          handleCopy(list, `shop-${message.id}`);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Error */}
        {error && (
          <div className="animate-fade-in mx-auto max-w-md rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 text-center text-xs sm:text-sm text-red-600 dark:text-red-400 shadow-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══ INPUT ═══ */}
      <div className="shrink-0 border-t border-border/60 bg-card/95 backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 px-3 py-2.5 sm:px-4 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Kya khane ka man hai? 💭"
              rows={1}
              disabled={isLoading}
              className="w-full resize-none overflow-y-auto rounded-xl border border-border/70 bg-secondary/50 px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none ring-0 transition-all focus:border-amber-300 dark:focus:border-amber-700 focus:bg-secondary focus:ring-1 focus:ring-amber-300/30 dark:focus:ring-amber-700/30 disabled:opacity-50"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
            {/* Char count (optional, subtle) */}
            {input.length > 200 && (
              <span className="absolute right-3 bottom-2.5 text-[10px] text-muted-foreground/50">
                {input.length}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className={cn(
              "shrink-0 rounded-xl h-[42px] w-[42px] transition-all duration-200 shadow-sm",
              input.trim() && !isLoading
                ? "bg-gradient-to-br from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600 shadow-rose-300/30 dark:shadow-amber-800/30"
                : "bg-muted text-muted-foreground",
              "active:scale-90"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
