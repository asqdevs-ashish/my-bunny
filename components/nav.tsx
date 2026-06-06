"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Moon,
  Sun,
  Heart,
  MessageCircle,
  LogOut,
  MapPin,
  Sprout,
  LayoutDashboard,
  Home,
  Menu,
  X,
  Camera,
  Trash2,
  Loader2,
  Settings,
  Trophy,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProfileSettings } from "@/components/profile-settings";

// ─── Helpers ─────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiresPartner?: boolean;
  color?: string;
}

function isPathActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

const TOP_NAV_ITEMS: NavItem[] = [
  { href: "/love-plant", label: "Love Plant", icon: Sprout, color: "text-emerald-500" },
  { href: "/competition", label: "Competition", icon: Trophy, color: "text-amber-500" },
  { href: "/location", label: "Location", icon: MapPin, requiresPartner: true, color: "text-emerald-500" },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, color: "text-rose-500" },
  { href: "/love-plant", label: "Plant", icon: Sprout, color: "text-emerald-500" },
  { href: "/competition", label: "Leaderboard", icon: Trophy, requiresPartner: true, color: "text-amber-500" },
  { href: "/location", label: "Map", icon: MapPin, requiresPartner: true, color: "text-blue-500" },
  { href: "/partner-chat", label: "Chat", icon: MessageCircle, requiresPartner: true, color: "text-rose-500" },
];

// ─── Desktop Icon Button ──────────────────────────────────────
function DesktopIconButton({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 border",
        isActive
          ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
          : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/50 hover:border-border hover:shadow-sm",
        "active:scale-90"
      )}
      title={item.label}
    >
      <Icon className="h-4 w-4" />
      {isActive && (
        <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-current" />
      )}
    </Link>
  );
}

// ─── Mobile Bottom Nav (uses pathname prop instead of hook) ───
function MobileBottomNav({
  partnerId,
  pathname,
}: {
  partnerId: string | null;
  pathname: string;
}) {
  const visibleItems = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.requiresPartner || partnerId
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-2xl md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      {/* Gradient top line with glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-500" />
      <div className="absolute top-0 left-1/4 right-1/4 h-4 bg-gradient-to-b from-rose-400/5 to-transparent dark:from-amber-400/5 pointer-events-none" />
      <div
        className={cn(
          "relative grid",
          visibleItems.length === 4 ? "grid-cols-4" : "grid-cols-5"
        )}
      >
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all duration-300 relative group active:scale-95",
                active
                  ? "text-foreground"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              {/* Active glow behind icon */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-b from-primary/20 via-primary/10 to-transparent blur-xl animate-pulse-soft" />
              )}
              <div
                className={cn(
                  "flex items-center justify-center rounded-2xl p-1.5 transition-all duration-300 relative",
                  active
                    ? "bg-gradient-to-b from-primary/15 to-primary/5 scale-110 shadow-sm"
                    : "group-hover:bg-secondary/40 group-hover:scale-105"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    active ? "scale-110 drop-shadow-sm" : "",
                    active && item.color ? item.color : ""
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium transition-all duration-300",
                  active
                    ? "opacity-100 translate-y-0 font-semibold"
                    : "opacity-60 translate-y-px group-hover:opacity-80"
                )}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute -top-[1px] left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-400 to-amber-400 dark:from-amber-500 dark:to-yellow-500 shadow-sm shadow-rose-400/30 animate-pulse-soft" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Main Nav Component ───────────────────────────────────────
export function Nav() {
  const { theme, setTheme } = useTheme();
  const { data: session, update: updateSession } = useSession();
  const pathname = usePathname();
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile image management
  const [pfpUploading, setPfpUploading] = useState(false);
  const [pfpDeleting, setPfpDeleting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const userImage = session?.user?.image ?? undefined;

  useEffect(() => {
    setMounted(true);
    fetch("/api/partner/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.linked && data.partner) {
          setPartnerName(data.partner.name);
          setPartnerId(data.partner.id);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on click outside
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

  // Close drawers on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMobileDrawerOpen(false);
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  // ─── PFP Update Handler ─────────────────────────────────────
  const handlePfpUpdate = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) return;

      setPfpUploading(true);

      try {
        let imageUrl: string | null = null;

        // Try Cloudinary upload
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (cloudName && uploadPreset) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: formData }
          );

          if (uploadRes.ok) {
            const data = await uploadRes.json();
            imageUrl = data.secure_url;
          }
        }

        if (!imageUrl) {
          // Fallback: use base64 data URL (for small avatars)
          const reader = new FileReader();
          imageUrl = await new Promise<string>((resolve) => {
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        // Save to server
        const res = await fetch("/api/user/profile-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });

        if (res.ok) {
          // Refresh session to get new image
          await updateSession();
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to update profile picture:", error);
      } finally {
        setPfpUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [updateSession]
  );

  // ─── PFP Delete Handler ─────────────────────────────────────
  const handlePfpDelete = useCallback(async () => {
    setPfpDeleting(true);
    try {
      const res = await fetch("/api/user/profile-image", {
        method: "DELETE",
      });

      if (res.ok) {
        await updateSession();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete profile picture:", error);
    } finally {
      setPfpDeleting(false);
    }
  }, [updateSession]);

  const userName = session?.user?.name || "U";
  const isDashboard = isPathActive(pathname, "/dashboard");
  const isLogin = pathname === "/login";

  // Don't render nav on login page
  if (isLogin) return null;

  // Compute nav item active states at top level (not inside .map)
  const lovePlantActive = isPathActive(pathname, "/love-plant");
  const locationActive = isPathActive(pathname, "/location");
  const partnerChatActive = isPathActive(pathname, "/partner-chat");

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsMobileDrawerOpen(false);
  };

  const profileFallback = "/icon-192.png";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handlePfpUpdate}
        accept="image/*"
        className="hidden"
      />

      {/* ─── TOP NAV BAR ─── */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl xl:max-w-[90rem] items-center justify-between px-3 sm:px-4 lg:px-6">
          {/* ── Left: Logo ── */}
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-rose-400/20 blur-md rounded-full group-hover:bg-rose-400/30 transition-all" />
              <Image
                src="/icon-192.png"
                alt="Logo"
                width={30}
                height={30}
                className="relative rounded-xl shadow-sm group-hover:scale-105 transition-transform sm:w-[34px] sm:h-[34px]"
              />
            </div>
            <span className="text-sm font-bold tracking-tight inline sm:text-base lg:text-lg">
              My Bunny
            </span>
          </Link>

          {/* ── Center: Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {[
              {
                href: "/dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
                color: "text-rose-500",
                isActive: isDashboard,
              } satisfies { href: string; label: string; icon: React.ElementType; color: string; isActive: boolean },
              {
                href: "/love-plant",
                label: "Love Plant",
                icon: Sprout,
                color: "text-emerald-500",
                isActive: lovePlantActive,
              },
              ...(partnerId
                ? [
                    {
                      href: "/location",
                      label: "Location",
                      icon: MapPin,
                      color: "text-emerald-500",
                      isActive: locationActive,
                    },
                  ]
                : []),
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs lg:text-sm font-medium transition-all duration-200",
                    item.isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", item.color)} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Partner Badge */}
            {partnerName && partnerId && (
              <Link
                href={`/partner/${partnerId}`}
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-900/30 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all hover:shadow-sm active:scale-95"
              >
                <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                <span className="truncate max-w-[60px] sm:max-w-[100px]">{partnerName}</span>
              </Link>
            )}

            {/* Desktop Quick Icons */}
            <div className="hidden md:flex items-center gap-1.5">
              <DesktopIconButton
                item={TOP_NAV_ITEMS[0]}
                isActive={lovePlantActive}
              />
              {partnerId && (
                <DesktopIconButton
                  item={TOP_NAV_ITEMS[1]}
                  isActive={locationActive}
                />
              )}
            </div>

            {/* Theme Toggle (desktop) */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90 border border-border/50"
              title={mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-rose-500" />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90 border border-border/50"
              aria-label={isMobileDrawerOpen ? "Close menu" : "Open menu"}
            >
              {isMobileDrawerOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full overflow-hidden transition-all duration-200 ring-2 ring-offset-2 ring-offset-background",
                  isMenuOpen ? "ring-rose-400" : "ring-transparent hover:ring-primary/20"
                )}
              >
                <Image
                  src={userImage || profileFallback}
                  alt={userName}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </button>

              {/* ── Dropdown Menu ── */}
              {isMenuOpen && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-card p-2 shadow-xl nav-dropdown-enter">
                    {/* User Info + PFP */}
                    <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                      <div className="flex items-center gap-3">
                        <div className="relative group/pfp shrink-0">
                          <Image
                            src={userImage || profileFallback}
                            alt={userName}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-rose-200 dark:ring-rose-800"
                            unoptimized
                          />
                          {/* Hover overlay for PFP actions */}
                          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/pfp:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              disabled={pfpUploading}
                              className="p-1 text-white hover:bg-white/20 rounded-full transition-colors"
                              title="Update photo"
                            >
                              {pfpUploading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Camera className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {userImage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePfpDelete();
                                }}
                                disabled={pfpDeleting}
                                className="p-1 text-white hover:bg-white/20 rounded-full transition-colors"
                                title="Remove photo"
                              >
                                {pfpDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {userName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {session?.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={closeMenu}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-rose-400" />
                        <span>Dashboard</span>
                      </Link>

                      {partnerId && (
                        <Link
                          href="/partner-chat"
                          onClick={closeMenu}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 text-rose-500" />
                          <span>Partner Chat</span>
                        </Link>
                      )}
                    </div>

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSettingsOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Settings</span>
                    </button>

                    <div className="my-1 border-t border-border/50" />

                    {/* Theme Toggle */}
                    <button
                      onClick={() => {
                        setTheme(theme === "dark" ? "light" : "dark");
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
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
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors mt-0.5"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── MOBILE DRAWER OVERLAY ─── */}
      {isMobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-14 right-0 bottom-0 z-50 w-72 max-w-[85vw] bg-card border-l border-border shadow-2xl md:hidden nav-drawer-enter">
            <div className="flex flex-col h-full overflow-y-auto">
              {/* User Header + PFP */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
                <div className="relative group/drawer-pfp shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden ring-2 ring-rose-300/50">
                    <Image
                      src={userImage || profileFallback}
                      alt={userName}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                  {/* Hover overlay for PFP actions */}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/drawer-pfp:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      disabled={pfpUploading}
                      className="p-1 text-white hover:bg-white/20 rounded-full transition-colors"
                      title="Update photo"
                    >
                      {pfpUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {userImage && (
                      <button
                        onClick={() => {
                          handlePfpDelete();
                        }}
                        disabled={pfpDeleting}
                        className="p-1 text-white hover:bg-white/20 rounded-full transition-colors"
                        title="Remove photo"
                      >
                        {pfpDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {userName}
                  </p>
                  {partnerName && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1">
                      <Heart className="h-3 w-3 fill-current" />
                      <span className="truncate">{partnerName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 px-3 py-3 space-y-0.5">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Navigation
                </p>

                {[
                  {
                    href: "/dashboard",
                    label: "Dashboard",
                    icon: LayoutDashboard,
                    color: "text-rose-500",
                    isActive: isDashboard,
                  },
                  {
                    href: "/love-plant",
                    label: "Love Plant",
                    icon: Sprout,
                    color: "text-emerald-500",
                    isActive: lovePlantActive,
                  },
                  ...(partnerId
                    ? [
                        {
                          href: "/location",
                          label: "Live Location",
                          icon: MapPin,
                          color: "text-blue-500",
                          isActive: locationActive,
                        },
                      ]
                    : []),
                  ...(partnerId
                    ? [
                        {
                          href: "/partner-chat",
                          label: "Partner Chat",
                          icon: MessageCircle,
                          color: "text-rose-500",
                          isActive: partnerChatActive,
                        },
                      ]
                    : []),
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        item.isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", item.color)} />
                      <span>{item.label}</span>
                      {item.isActive && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}

                {/* Theme Toggle inline in nav */}
                <div className="mt-2 pt-2 border-t border-border/30">
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-all"
                  >
                    {mounted && theme === "dark" ? (
                      <Sun className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Moon className="h-4 w-4 text-rose-500" />
                    )}
                    <span className="flex-1 text-left">
                      {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </span>
                    <div className={cn(
                      "h-5 w-9 rounded-full transition-all duration-300 relative",
                      theme === "dark" ? "bg-amber-400" : "bg-rose-300"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300",
                        theme === "dark" ? "translate-x-4" : "translate-x-0"
                      )} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-3 py-4 border-t border-border/50">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-transparent hover:border-rose-200/30 dark:hover:border-rose-800/20"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <MobileBottomNav partnerId={partnerId} pathname={pathname} />

      {/* Profile Settings Modal */}
      <ProfileSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
