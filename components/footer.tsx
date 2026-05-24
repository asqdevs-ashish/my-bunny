"use client";

import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-4 sm:py-5">
        <span className="text-xs sm:text-sm text-muted-foreground/60 flex items-center gap-1.5">
          Made with
          <Heart className="h-3.5 w-3.5 text-rose-400" fill="currentColor" />
          by
          <span className="font-medium bg-gradient-to-r from-rose-400 to-amber-400 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
            Suar's Kitchen
          </span>
          <span className="hidden sm:inline">🍳</span>
        </span>
      </div>
    </footer>
  );
}

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on login page
  if (pathname === "/login") {
    return null;
  }

  return <Footer />;
}
