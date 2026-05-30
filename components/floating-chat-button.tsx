"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingChatButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isChatPage = pathname === "/chat" || pathname === "/partner-chat";

  useEffect(() => {
    fetchPartnerStatus();
  }, []);

  async function fetchPartnerStatus() {
    try {
      const res = await fetch("/api/partner/status");
      if (res.ok) {
        const data = await res.json();
        if (data.linked && data.partner) {
          setPartnerId(data.partner.id);
        }
      }
    } catch {
      // Silently fail
    }
  }

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 animate-slide-up" ref={menuRef}>
      {/* Menu items */}
      {isOpen && !isChatPage && (
        <div className="absolute bottom-full right-0 mb-3 flex flex-col gap-2">
          {/* AI Chef Chat */}
          <Link
            href="/chat"
            onClick={() => setIsOpen(false)}
            className="group relative flex items-center gap-3 rounded-2xl bg-card border border-border/60 px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 dark:from-amber-500 dark:to-yellow-500 shadow-sm">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">AI Chef 🥰</p>
              <p className="text-[11px] text-muted-foreground">Recipe ideas &amp; tips</p>
            </div>
          </Link>

          {/* Partner Chat */}
          {partnerId && (
            <Link
              href="/partner-chat"
              onClick={() => setIsOpen(false)}
              className="group relative flex items-center gap-3 rounded-2xl bg-card border border-border/60 px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-sm">
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Partner 💕</p>
                <p className="text-[11px] text-muted-foreground">Private chat</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => {
          if (isChatPage) {
            router.push("/dashboard");
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full shadow-xl transition-all duration-300 active:scale-90",
          isOpen || isChatPage
            ? "bg-rose-500 rotate-90 hover:shadow-rose-400/40"
            : "bg-gradient-to-br from-rose-500 to-amber-500 shadow-rose-300/40 dark:shadow-amber-900/40 hover:shadow-rose-300/60 dark:hover:shadow-amber-800/60 hover:scale-110 hover:ring-4 hover:ring-rose-300/30 dark:hover:ring-amber-700/30"
        )}
      >
        {isOpen || isChatPage ? (
          <X className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        ) : (
          <>
            {/* Glow ring */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 opacity-30 animate-pulse-soft scale-110 blur-sm" />
            {/* Inner glow */}
            <span className="absolute inset-2 rounded-full bg-white/20 blur-[2px]" />
            <MessageCircle className="relative z-10 h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-sm" />
          </>
        )}

        {/* Label (only when closed) */}
        {!isOpen && !isChatPage && (
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Chat
          </span>
        )}
      </button>
    </div>
  );
}
