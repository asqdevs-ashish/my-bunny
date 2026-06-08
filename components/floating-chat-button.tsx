"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingChatButton() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/partner/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.linked && data.partner) {
          setPartnerId(data.partner.id);
          setPartnerName(data.partner.name);
        }
      })
      .catch(() => {});
  }, []);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (!partnerId) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-40 transition-all duration-300 md:bottom-6",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      )}
    >
      {/* Tooltip */}
      <div
        className={cn(
          "absolute bottom-full right-0 mb-3 transition-all duration-200",
          isHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        <div className="relative bg-card border border-border/50 rounded-xl shadow-xl p-2.5 min-w-[180px] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-amber-400">
              <Heart className="h-3.5 w-3.5 text-white" fill="white" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-foreground">Chat with {partnerName}</p>
              <p className="text-[9px] text-muted-foreground">Send a sweet message 💕</p>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 bg-card border-r border-b border-border/50" />
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => router.push("/partner-chat")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300",
          "bg-gradient-to-br from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600",
          "dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600",
          "active:scale-90 hover:scale-105",
          "shadow-rose-300/40 dark:shadow-amber-800/40",
          "animate-bounce-in"
        )}
        aria-label="Chat with partner"
      >
        {/* Ripple glow */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" style={{ animationDuration: "3s" }} />
        
        {/* Inner glow */}
        <span className="absolute inset-1 rounded-full bg-white/10" />

        <MessageCircle className="h-6 w-6 text-white relative z-10" />
        
        {/* Pulse dot */}
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-green-400 animate-pulse" />

        {/* Sparkle decoration */}
        <Sparkles className="absolute -top-2 -left-1 h-3 w-3 text-yellow-300 animate-pulse-soft" style={{ animationDelay: "0.5s" }} />
      </button>
    </div>
  );
}
