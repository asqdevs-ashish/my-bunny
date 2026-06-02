"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X,
  Camera,
  Trash2,
  Loader2,
  Check,
  User,
  Save,
  Upload,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProfileSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSettings({ open, onClose }: ProfileSettingsProps) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [pfpUploading, setPfpUploading] = useState(false);
  const [pfpDeleting, setPfpDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userImage = session?.user?.image ?? undefined;
  const profileFallback = "/icon-192.png";

  // Reset form when session loads or modal opens
  useEffect(() => {
    if (open) {
      setName(session?.user?.name || "");
      setSuccessMsg("");
      setErrorMsg("");
    }
  }, [open, session]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  // Close on backdrop click
  useEffect(() => {
    function handleBackdrop(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleBackdrop);
      return () => document.removeEventListener("mousedown", handleBackdrop);
    }
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ─── Save Name ──────────────────────────────────────────────
  const handleSaveName = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === session?.user?.name) return;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/user/profile-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update name");
      }

      await updateSession();
      router.refresh();
      setSuccessMsg("Name updated! ✨");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [name, session, updateSession, router]);

  // ─── Update PFP ─────────────────────────────────────────────
  const handlePfpUpdate = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setPfpUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let imageUrl: string | null = null;

      // Try Cloudinary
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

      if (!res.ok) throw new Error("Failed to save image");

      await updateSession();
      router.refresh();
      setSuccessMsg("Profile picture updated! 📸");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setErrorMsg("Failed to update profile picture");
    } finally {
      setPfpUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [updateSession, router]);

  // ─── Delete PFP ─────────────────────────────────────────────
  const handlePfpDelete = useCallback(async () => {
    setPfpDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/user/profile-image", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete image");

      await updateSession();
      router.refresh();
      setSuccessMsg("Profile picture removed");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch {
      setErrorMsg("Failed to remove profile picture");
    } finally {
      setPfpDeleting(false);
    }
  }, [updateSession, router]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-slide-up"
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30">
                <User className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Profile Settings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage your profile
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* ── Profile Picture Section ── */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group/pfp">
                <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-rose-200/50 dark:ring-rose-800/30 shadow-lg">
                  <Image
                    src={userImage || profileFallback}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/pfp:opacity-100 transition-opacity flex items-center justify-center gap-2">
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

              <input
                ref={fileInputRef}
                type="file"
                onChange={handlePfpUpdate}
                accept="image/*"
                className="hidden"
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pfpUploading}
                  className="gap-1.5"
                >
                  {pfpUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload Photo
                </Button>
                {userImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePfpDelete}
                    disabled={pfpDeleting}
                    className="gap-1.5 text-rose-500 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:border-rose-800/50"
                  >
                    {pfpDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground/60">Account Info</span>
              </div>
            </div>

            {/* ── Name Field ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-rose-400" />
                Display Name
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-secondary/30"
                  maxLength={50}
                />
                <Button
                  onClick={handleSaveName}
                  disabled={saving || !name.trim() || name.trim() === session?.user?.name}
                  className="gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-md"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>

            {/* ── Email (Read-only) ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-muted-foreground">
                <span className="truncate">{session?.user?.email}</span>
                <span className="shrink-0 flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">
                  <Check className="h-2.5 w-2.5" />
                  Verified
                </span>
              </div>
            </div>

            {/* Success / Error Messages */}
            {successMsg && (
              <div className="animate-fade-in rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="animate-fade-in rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-600 dark:text-rose-400 text-center">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
