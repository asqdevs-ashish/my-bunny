"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationSettingsWrapper } from "@/components/notification-settings-wrapper";
import {
  User,
  Heart,
  Settings,
  Moon,
  Sun,
  LogOut,
  Camera,
  Trash2,
  Loader2,
  Mail,
  Calendar,
  Link2,
  Sparkles,
  ArrowLeft,
  LayoutDashboard,
  Shield,
  Bell,
  Palette,
  Smartphone,
  Check,
  X,
  Copy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileClient() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Partner info
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerSince, setPartnerSince] = useState<string | null>(null);

  // PFP management
  const [pfpUploading, setPfpUploading] = useState(false);
  const [pfpDeleting, setPfpDeleting] = useState(false);

  // Partner linking
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    setMounted(true);
    fetch("/api/partner/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.linked && data.partner) {
          setPartnerName(data.partner.name);
          setPartnerId(data.partner.id);
          setPartnerSince(data.partnerSince || null);
        }
      })
      .catch(() => {});
  }, []);

  const userImage = session?.user?.image ?? undefined;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  // ─── PFP Update ─────────────────────────────────────────────
  const handlePfpUpdate = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;

      setPfpUploading(true);
      try {
        let imageUrl: string | null = null;
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
          const reader = new FileReader();
          imageUrl = await new Promise<string>((resolve) => {
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        const res = await fetch("/api/user/profile-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });

        if (res.ok) {
          await updateSession();
          router.refresh();
        }
      } catch {} finally {
        setPfpUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [updateSession, router]
  );

  const handlePfpDelete = useCallback(async () => {
    setPfpDeleting(true);
    try {
      const res = await fetch("/api/user/profile-image", { method: "DELETE" });
      if (res.ok) {
        await updateSession();
        router.refresh();
      }
    } catch {} finally {
      setPfpDeleting(false);
    }
  }, [updateSession, router]);

  // ─── Partner Linking ────────────────────────────────────────
  async function handleGenerateCode() {
    try {
      const res = await fetch("/api/partner/code", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setPartnerCode(json.code);
        setLinkError("");
      } else {
        setLinkError("Failed to generate code");
      }
    } catch {
      setLinkError("Something went wrong");
    }
  }

  async function handleLinkPartner() {
    if (!codeInput.trim()) return;
    setLinking(true);
    setLinkError("");
    try {
      const res = await fetch("/api/partner/code", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      if (res.ok) {
        setShowLinkDialog(false);
        setCodeInput("");
        router.refresh();
      } else {
        const text = await res.text();
        setLinkError(text || "Failed to link");
      }
    } catch {
      setLinkError("Something went wrong");
    } finally {
      setLinking(false);
    }
  }

  async function handleCopyCode() {
    if (partnerCode) {
      await navigator.clipboard.writeText(partnerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const profileFallback = "/icon-192.png";

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handlePfpUpdate}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 dark:from-[#1a1a2e] dark:via-[#1a1a2e] dark:to-[#121212] shadow-xl shadow-rose-200/30 dark:shadow-amber-900/10">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-200/10 via-transparent to-amber-200/10 dark:from-amber-500/5 dark:via-transparent dark:to-rose-500/5 animate-gradient" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full bg-rose-200/40 dark:bg-amber-500/10 blur-3xl animate-float" />
          <div className="absolute -bottom-10 -left-10 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-amber-200/40 dark:bg-rose-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>
        <CardContent className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative group/pfp shrink-0">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full overflow-hidden ring-4 ring-rose-200 dark:ring-amber-800/50 shadow-lg">
                <Image
                  src={userImage || profileFallback}
                  alt={userName}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/pfp:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pfpUploading}
                  className="p-1.5 text-white hover:bg-white/20 rounded-full transition-colors"
                  title="Update photo"
                >
                  {pfpUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                {userImage && (
                  <button
                    onClick={handlePfpDelete}
                    disabled={pfpDeleting}
                    className="p-1.5 text-white hover:bg-white/20 rounded-full transition-colors"
                    title="Remove photo"
                  >
                    {pfpDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{userName}</h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {userEmail}
              </p>
              {partnerName && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-900/30 px-3 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  <Heart className="h-3 w-3 fill-current" />
                  Linked with {partnerName}
                  {partnerSince && (
                    <span className="text-[9px] text-rose-400/70 ml-1">
                      since {new Date(partnerSince).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick action */}
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* ─── Account Settings ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-rose-500" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">Email</p>
                  <p className="text-[11px] text-muted-foreground">{userEmail}</p>
                </div>
              </div>
              <Check className="h-4 w-4 text-green-500" />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">Member Since</p>
                  <p className="text-[11px] text-muted-foreground">
                    {session?.user?.email ? "Active" : "New"}
                  </p>
                </div>
              </div>
            </div>

            {/* Partner Linking */}
            {!partnerName ? (
              <div className="rounded-xl border border-dashed border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-rose-400" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Link Partner</p>
                      <p className="text-[10px] text-muted-foreground">Connect with your loved one</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowLinkDialog(true)}
                    size="sm"
                    className="gap-1.5 text-xs bg-rose-500 hover:bg-rose-600"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-rose-500 fill-current" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{partnerName}</p>
                      <p className="text-[10px] text-muted-foreground">Your partner</p>
                    </div>
                  </div>
                  {partnerId && (
                    <Link href={`/partner/${partnerId}`}>
                      <Button variant="ghost" size="sm" className="text-xs gap-1">
                        View <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Appearance ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-purple-500" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                  mounted && theme === "light"
                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20 shadow-md"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Sun className={cn(
                  "h-6 w-6",
                  mounted && theme === "light" ? "text-amber-500" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  mounted && theme === "light" ? "text-foreground" : "text-muted-foreground"
                )}>Light</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                  mounted && theme === "dark"
                    ? "border-amber-400 bg-amber-950/20 shadow-md"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Moon className={cn(
                  "h-6 w-6",
                  mounted && theme === "dark" ? "text-amber-400" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  mounted && theme === "dark" ? "text-foreground" : "text-muted-foreground"
                )}>Dark</span>
              </button>
            </div>

            <div className="rounded-xl bg-secondary/30 p-3">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">System Theme</p>
                  <p className="text-[10px] text-muted-foreground">Follow your device settings</p>
                </div>
                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "ml-auto rounded-full px-3 py-1 text-[10px] font-medium transition-all",
                    mounted && theme === "system"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  Auto
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Notifications ─── */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-amber-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationSettingsWrapper />
          </CardContent>
        </Card>

        {/* ─── Danger Zone ─── */}
        <Card className="border-red-200/50 dark:border-red-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-red-500" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => signOut({ callbackUrl: "/login" })}
              variant="outline"
              className="w-full gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ─── Partner Link Dialog ─── */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-3 overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-semibold">Link with Partner</h3>
              </div>
              <button
                onClick={() => { setShowLinkDialog(false); setLinkError(""); }}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-xl border border-border p-3 space-y-3">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Step 1: Generate your code and share with your partner
                </p>
                {partnerCode ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-secondary/50 px-3 py-2 text-center font-mono text-lg font-bold tracking-widest text-foreground">
                      {partnerCode}
                    </div>
                    <Button onClick={handleCopyCode} variant="outline" size="icon" className="shrink-0">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleGenerateCode} variant="outline" size="sm" className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate My Code
                  </Button>
                )}
              </div>
              <div className="rounded-xl border border-border p-3 space-y-3">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Step 2: Enter your partner&apos;s code
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    maxLength={6}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-center font-mono text-lg tracking-widest outline-none focus:border-rose-300 dark:focus:border-rose-700 focus:ring-1 focus:ring-rose-300/30"
                  />
                  <Button
                    onClick={handleLinkPartner}
                    disabled={codeInput.length !== 6 || linking}
                    className="gap-2 bg-rose-500 hover:bg-rose-600"
                  >
                    {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Link
                  </Button>
                </div>
              </div>
              {linkError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-600 dark:text-red-400 text-center">
                  {linkError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom decoration */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50">
        <Sparkles className="h-3 w-3 text-rose-400" />
        <span>My Bunny 💕 v1.0</span>
        <Sparkles className="h-3 w-3 text-rose-400" />
      </div>
    </div>
  );
}
