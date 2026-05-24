"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function FloatingChatButton() {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-slide-up">
      <Link
        href="/chat"
        className="group relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-500 shadow-lg shadow-rose-300/40 dark:shadow-amber-900/40 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-rose-300/50 dark:hover:shadow-amber-800/50 active:scale-95"
      >
        {/* Pulse ring - behind icon */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 opacity-30 animate-pulse-soft" />
        <MessageCircle className="relative z-10 h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </Link>
      {/* Label - appear to the left so it never clips on mobile */}
      <span className="absolute right-full mr-2 sm:mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background/90 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-foreground shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Chat with AI 🥰
      </span>
    </div>
  );
}
