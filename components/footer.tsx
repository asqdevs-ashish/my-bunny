"use client";

import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border/50 bg-gradient-to-b from-background to-background/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-4 sm:py-5">
        <span className="text-xs sm:text-sm text-muted-foreground/60 flex items-center gap-1.5">
          Made with
          <Heart className="h-3.5 w-3.5 text-black dark:text-black" fill="currentColor" />
          by
          <span className="font-semibold bg-gradient-to-r from-rose-400 to-amber-400 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
            Suar Man
          </span>
          <span className="hidden sm:inline">🍳</span>
        </span>
      </div>
    </footer>
  );
}

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on mobile (bottom nav covers it), on login, and on chat pages
  const hideFooterPaths = ["/login", "/chat", "/partner-chat"];
  if (hideFooterPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return null;
  }

  // Only show on md+ screens (bottom nav is hidden on md+)
  return (
    <div className="hidden md:block">
      <Footer />
    </div>
  );
}
