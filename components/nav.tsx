"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Heart, MessageCircle, LogOut, User, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export function Nav() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function fetchPartnerStatus() {
    try {
      const res = await fetch("/api/partner/status");
      if (res.ok) {
        const data = await res.json();
        if (data.linked && data.partner) {
          setPartnerName(data.partner.name);
          setPartnerId(data.partner.id);
        }
      }
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    setMounted(true);
    fetchPartnerStatus();
  }, []);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  const userName = session?.user?.name || "U";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-rose-400/20 blur-md rounded-full group-hover:bg-rose-400/30 transition-all" />
            <Image
              src="/logo.png"
              alt="Logo"
              width={34}
              height={34}
              className="relative rounded-xl shadow-sm group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="text-sm font-bold tracking-tight">Suar&apos;s Care</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Partner Name Badge (Now visible on mobile too) */}
          {partnerName && partnerId && (
            <Link
              href={`/partner/${partnerId}`}
              className="flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all hover:shadow-sm active:scale-95"
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              <span className="truncate max-w-[70px] sm:max-w-[120px]">{partnerName}</span>
            </Link>
          )}

          {/* Partner Chat Button */}
          {partnerId && (
            <Link
              href="/partner-chat"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all hover:scale-105 active:scale-95 border border-border/50"
            >
              <MessageCircle className="h-4.5 w-4.5" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
            </Link>
          )}

          {/* Profile Menu Wrapper */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full overflow-hidden transition-all duration-200 ring-2 ring-offset-2 ring-offset-background",
                isMenuOpen ? "ring-rose-400" : "ring-transparent hover:ring-primary/20"
              )}
            >
              <Image
                src="/profile.png"
                alt={userName}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-2xl border border-border bg-card p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {mounted && theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-rose-500" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>

                {/* Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
