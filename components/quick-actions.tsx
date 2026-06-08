"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Droplets,
  UtensilsCrossed,
  Smile,
  Lock,
  Heart,
  Camera,
  MessageCircle,
  Sprout,
  Trophy,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface QuickAction {
  emoji: string;
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  requiresPartner?: boolean;
  description?: string;
}

const ACTIONS: QuickAction[] = [
  {
    emoji: "💧",
    label: "Water",
    href: "/dashboard#water",
    icon: Droplets,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/30",
    description: "Log your water intake",
  },
  {
    emoji: "🍽️",
    label: "Meals",
    href: "/dashboard#meals",
    icon: UtensilsCrossed,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30",
    description: "Log what you ate",
  },
  {
    emoji: "😊",
    label: "Mood",
    href: "/dashboard#mood",
    icon: Smile,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-800/30",
    description: "Check in your mood",
  },
  {
    emoji: "🤫",
    label: "Secret Notes",
    href: "/dashboard#secret",
    icon: Lock,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/30",
    description: "Send a secret note",
  },
  {
    emoji: "💌",
    label: "Love Notes",
    href: "/dashboard#love-notes",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30",
    description: "Read today's love note",
  },
  {
    emoji: "📸",
    label: "Memories",
    href: "/dashboard#memories",
    icon: Camera,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/30 border-pink-200/50 dark:border-pink-800/30",
    description: "View your memories",
  },
  {
    emoji: "🌱",
    label: "Love Plant",
    href: "/love-plant",
    icon: Sprout,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30",
    description: "Grow your love plant",
  },
  {
    emoji: "💬",
    label: "Partner Chat",
    href: "/partner-chat",
    icon: MessageCircle,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/30",
    requiresPartner: true,
    description: "Chat with your partner",
  },
  {
    emoji: "📍",
    label: "Live Location",
    href: "/location",
    icon: MapPin,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/30",
    requiresPartner: true,
    description: "Share live location",
  },
  {
    emoji: "🏆",
    label: "Leaderboard",
    href: "/competition",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30",
    requiresPartner: true,
    description: "Compete with other couples",
  },
];

export function QuickActions() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/partner/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.linked && data.partner) {
          setPartnerId(data.partner.id);
        }
      })
      .catch(() => {});
  }, []);

  const visibleActions = ACTIONS.filter(
    (action) => !action.requiresPartner || partnerId
  );

  return (
    <div className="relative">
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          const isHovered = hoveredIndex === index;
          return (
            <Link
              key={action.label}
              href={action.href}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 sm:p-4 transition-all duration-200",
                action.bgColor,
                isHovered
                  ? "shadow-lg scale-105 -translate-y-0.5"
                  : "shadow-sm hover:shadow-md"
              )}
            >
              {/* Hover glow */}
              {isHovered && (
                <span className={cn(
                  "absolute inset-0 rounded-xl opacity-20 blur-xl transition-opacity",
                  action.color.replace("text-", "bg-")
                )} />
              )}
              
              {/* Emoji + Icon */}
              <div className="relative">
                <div className={cn(
                  "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg transition-all duration-200",
                  isHovered ? "scale-110" : "",
                  action.color
                )}>
                  <span className="text-lg sm:text-xl">{action.emoji}</span>
                </div>
                {/* Sparkle on hover */}
                {isHovered && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 animate-pulse-soft" />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-[10px] sm:text-xs font-medium text-center transition-colors duration-200",
                isHovered ? "text-foreground" : "text-muted-foreground"
              )}>
                {action.label}
              </span>                  {/* Description tooltip (below the card) */}
                  <div className={cn(
                    "absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border/50 rounded-lg px-2 py-1 shadow-lg whitespace-nowrap transition-all duration-200 z-10",
                    isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                  )}>
                    <span className="text-[9px] text-muted-foreground">{action.description}</span>
                  </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom text */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground/60">
        <Sparkles className="h-3 w-3 text-rose-400" />
        <span>Quick access to all your favorite features</span>
        <Sparkles className="h-3 w-3 text-rose-400" />
      </div>
    </div>
  );
}
