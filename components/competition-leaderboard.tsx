"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";
import {
  Trophy,
  Swords,
  Heart,
  Loader2,
  Sparkles,
  Crown,
  Flame,
  Check,
  CheckCircle,
  Zap,
  Target,
  RefreshCw,
  Medal,
  MoreHorizontal,
  X,
  Edit3,
  Image as ImageIcon,
  Send,
  ThumbsUp,
  ThumbsDown,
  UserX,
  UserCheck,
  AlertCircle,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/app/api/competition/leaderboard/route";

const STAGE_EMOJI: Record<string, string> = {
  SEED: "🌱",
  SPROUT: "🌿",
  PLANT: "🌻",
  FLOWER: "🌸",
};

const RANK_META: Record<number, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  1: { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Gold" },
  2: { icon: Medal, color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800/40", label: "Silver" },
  3: { icon: Medal, color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Bronze" },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const meta = RANK_META[rank];
    const Icon = meta!.icon;
    return (
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shadow-lg animate-bounce-in", meta!.bg)}>
        <Icon className={cn("h-4 w-4", meta!.color)} fill="currentColor" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-xs font-bold tabular-nums text-muted-foreground">
      {rank}
    </div>
  );
}

function HealthBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "from-green-500 to-emerald-400" :
    value >= 50 ? "from-yellow-500 to-amber-400" :
    value >= 25 ? "from-orange-500 to-amber-500" :
    "from-red-500 to-rose-500";

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/30">
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── Team Avatar ─────────────────────────────────────────
function TeamAvatar({ teamImage, teamName, size = "md" }: { teamImage?: string | null; teamName?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  
  if (teamImage) {
    return (
      <img
        src={teamImage}
        alt={teamName || "Team"}
        className={cn("rounded-full object-cover border-2 border-amber-200 dark:border-amber-800/50", sizeClasses)}
      />
    );
  }

  const initials = teamName
    ? teamName.replace(/[^a-zA-Z0-9\s]/g, "").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "❤️";

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-white font-bold shadow-lg",
      sizeClasses
    )}>
      {initials.length <= 2 ? initials : "❤️"}
    </div>
  );
}

// ─── Edit Request Modal ──────────────────────────────────
function EditRequestModal({
  field,
  currentValue,
  partnerName,
  onConfirm,
  onCancel,
  loading,
}: {
  field: "teamName" | "teamImage";
  currentValue?: string | null;
  partnerName: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [value, setValue] = useState(field === "teamName" ? currentValue || "" : "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isImage = field === "teamImage";

  // Upload image to Cloudinary
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
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

      // Fallback: base64 data URL
      if (!imageUrl) {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      setValue(imageUrl);
    } catch {
      // Keep existing value
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              {isImage ? <ImageIcon className="h-4 w-4 text-amber-500" /> : <Edit3 className="h-4 w-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Edit {isImage ? "Team Avatar" : "Team Name"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {partnerName} will need to approve this change
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="h-8 w-8 rounded-full hover:bg-secondary/50 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isImage ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2 px-8 py-6 text-sm border-2 border-dashed border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded-xl"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                ) : (
                  <Camera className="h-6 w-6 text-amber-400" />
                )}
                <div className="text-left">
                  <p className="font-semibold text-foreground">{uploading ? "Uploading..." : "Choose Photo"}</p>
                  <p className="text-[10px] text-muted-foreground font-normal">Tap to select from your device</p>
                </div>
              </Button>
            </div>
            {value && (
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={value}
                    alt="Preview"
                    className="h-24 w-24 rounded-full object-cover border-4 border-amber-200 dark:border-amber-800/50 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 h-5 w-5 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Enter a new name for your team:</p>
            <Input
              placeholder="My Awesome Team ❤️"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={50}
            />
            <p className="text-[9px] text-muted-foreground text-right">{value.length}/50</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(value.trim())}
            disabled={loading || uploading || !value}
            className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send for Approval
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Approval Request UI ─────────────────────────────────
function PendingApprovalBanner({
  pendingEdit,
  partnerName,
  onApprove,
  onReject,
  loading,
}: {
  pendingEdit: {
    field: string;
    value: string;
    requestedByName: string;
    requestedByMe: boolean;
  };
  partnerName: string;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  if (pendingEdit.requestedByMe) {
    return (
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
        <Loader2 className="h-4 w-4 animate-spin inline mr-1.5 text-amber-500" />
        <p className="text-xs text-amber-700 dark:text-amber-400 inline">
          Waiting for {partnerName} to approve your edit...
        </p>
      </div>
    );
  }

  const fieldLabel = pendingEdit.field === "teamName" ? "team name" : "team avatar";

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800/50 p-4 space-y-3 animate-bounce-in">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {pendingEdit.requestedByName} wants to edit {fieldLabel}
          </p>
          {pendingEdit.field === "teamName" ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Proposed name: <span className="font-semibold text-foreground">&quot;{pendingEdit.value}&quot;</span>
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">New avatar:</span>
              <img
                src={pendingEdit.value}
                alt="Preview"
                className="h-8 w-8 rounded-full object-cover border border-amber-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <a href={pendingEdit.value} target="_blank" rel="noopener noreferrer" className="text-[9px] text-amber-500 underline truncate max-w-[120px]">
                {pendingEdit.value}
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onReject}
          disabled={loading}
          variant="outline"
          className="flex-1 gap-1.5 text-xs border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsDown className="h-3 w-3" />}
          Reject
        </Button>
        <Button
          onClick={onApprove}
          disabled={loading}
          variant="outline"
          className="flex-1 gap-1.5 text-xs border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
          Approve
        </Button>
      </div>
    </div>
  );
}

// ─── Join Flow Component ────────────────────────────────────
function JoinFlow({
  myStatus,
  onRefresh,
}: {
  myStatus: any;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Invite Partner (initiator) ──
  const handleInvitePartner = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competition/join", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to send invite");
      onRefresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Respond Yes ──
  const handleRespondYes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competition/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: "yes" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to respond");
      }
      onRefresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Respond No ──
  const handleRespondNo = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/competition/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: "no" }),
      });
      onRefresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Success — joined
  if (myStatus?.status === "joined" || myStatus?.status === "naming") {
    return (
      <div className="text-center py-4 space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-bounce-in">
          <CheckCircle className="h-7 w-7 text-green-500" />
        </div>
        <p className="text-sm font-bold text-foreground">
          🎉 You&apos;re in the competition!
        </p>
        {myStatus?.teamName && (
          <div className="flex items-center justify-center gap-2">
            <TeamAvatar teamImage={myStatus.teamImage} teamName={myStatus.teamName} size="sm" />
            <p className="text-xs text-muted-foreground">
              Team: <span className="font-semibold text-foreground">{myStatus.teamName}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  // Partner declined
  if (myStatus?.status === "partner_declined") {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 animate-bounce-in">
          <UserX className="h-7 w-7 text-rose-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{myStatus.partnerName} declined 🙁</p>
          <p className="text-xs text-muted-foreground mt-1">Ask them to join when they&apos;re ready!</p>
        </div>
        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-rose-600 dark:text-rose-400">{error}</div>
        )}
        <Button
          onClick={handleInvitePartner}
          disabled={loading}
          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Try Again 🔄
        </Button>
      </div>
    );
  }

  // I declined — can join again
  if (myStatus?.status === "i_declined") {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 animate-bounce-in">
          <UserCheck className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Changed your mind? 🤔</p>
          <p className="text-xs text-muted-foreground mt-1">You can still join the competition!</p>
        </div>
        <Button
          onClick={handleRespondYes}
          disabled={loading}
          className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Yes, Let&apos;s Join! 🎮
        </Button>
      </div>
    );
  }

  // Invite sent — waiting for partner
  if (myStatus?.status === "invite_sent") {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 animate-bounce-in">
          <Send className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Invitation Sent! 💌</p>
          <p className="text-xs text-muted-foreground mt-1">
            Waiting for <span className="font-semibold text-foreground">{myStatus.partnerName}</span> to respond...
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          <span className="text-xs text-muted-foreground">Waiting for response</span>
        </div>
        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-rose-600 dark:text-rose-400">{error}</div>
        )}
      </div>
    );
  }

  // I'm invited — show Yes/No
  if (myStatus?.status === "invited") {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 animate-bounce-in">
          <Swords className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {myStatus.partnerName} wants to compete! 🏆
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Join the Love Plant League together and climb the leaderboard!
          </p>
        </div>
        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-rose-600 dark:text-rose-400">{error}</div>
        )}
        <div className="flex gap-3">
          <Button
            onClick={handleRespondNo}
            disabled={loading}
            variant="outline"
            className="flex-1 gap-1.5 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            No 🙅
          </Button>
          <Button
            onClick={handleRespondYes}
            disabled={loading}
            className="flex-1 gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Yes! 🎉
          </Button>
        </div>
      </div>
    );
  }

  // Default — show invite button
  return (
    <div className="text-center space-y-4 py-2">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 animate-bounce-in">
        <Swords className="h-7 w-7 text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">Join the Love Plant League! 🏆</p>
        <p className="text-xs text-muted-foreground mt-1">
          Compete with other couples to see who has the healthiest love plant!
          Invite your partner and join together! 💪
        </p>
      </div>
      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-rose-600 dark:text-rose-400">{error}</div>
      )}
      <Button
        onClick={handleInvitePartner}
        disabled={loading}
        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-lg"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Invite Partner 💌
      </Button>
    </div>
  );
}

// ─── Three Dot Menu ──────────────────────────────────────
function ThreeDotMenu({
  onEditName,
  onEditImage,
  isOpen,
  onToggle,
}: {
  onEditName: () => void;
  onEditImage: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
          isOpen
            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-40 w-48 rounded-xl border border-border bg-card shadow-xl animate-bounce-in overflow-hidden">
          <button
            onClick={onEditName}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-500" />
            Edit Team Name
          </button>
          <div className="border-t border-border/40" />
          <button
            onClick={onEditImage}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
            Edit Team Avatar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Leaderboard Component ────────────────────────────
export function CompetitionLeaderboard() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStatus, setMyStatus] = useState<any>(null);
  const [badges, setBadges] = useState<Array<{ rank: number; title: string; color: string; weekOf: string; coupleKey: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [awardingBadges, setAwardingBadges] = useState(false);
  const [currentUserCoupleKey, setCurrentUserCoupleKey] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getPusherClient>>["subscribe"]> | null>(null);
  const competitionChannelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getPusherClient>>["subscribe"]> | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState<"teamName" | "teamImage" | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/competition/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchMyStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/competition/my-status");
      if (res.ok) {
        const data = await res.json();
        setMyStatus(data);
        if (data?.coupleKey) setCurrentUserCoupleKey(data.coupleKey);
      }
    } catch {} finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/competition/badges");
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    fetchMyStatus();
    fetchBadges();
  }, [fetchLeaderboard, fetchMyStatus, fetchBadges]);

  // 🎉 Celebrate when NEW badges appear
  const prevBadgeCount = useRef(0);
  useEffect(() => {
    if (badges.length > prevBadgeCount.current) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { x: 0.2, y: 0.4 },
          colors: ["#f59e0b", "#f97316", "#eab308", "#fbbf24"],
          ticks: 200,
        });
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { x: 0.8, y: 0.4 },
          colors: ["#f59e0b", "#f97316", "#eab308", "#fbbf24"],
          ticks: 200,
        });
        setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 100,
            origin: { x: 0.5, y: 0.3 },
            colors: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"],
            shapes: ["star"],
            ticks: 150,
          });
        }, 500);
      }, 500);
      return () => clearTimeout(timer);
    }
    prevBadgeCount.current = badges.length;
  }, [badges.length]);

  // Pusher subscription
  useEffect(() => {
    const client = getPusherClient();
    if (!client) return;

    try {
      const compChannel = client.subscribe("competition-leaderboard");
      competitionChannelRef.current = compChannel;
      compChannel.bind("competition-update", () => {
        fetchLeaderboard();
      });
      compChannel.bind("badges-updated", () => {
        fetchBadges();
        fetchLeaderboard();
      });
    } catch {}

    const myId = session?.user?.id;
    if (myId) {
      fetch("/api/partner/status")
        .then((r) => r.json())
        .then((status) => {
          if (!status.linked || !status.partner?.id) return;
          const [a, b] = [myId, status.partner.id].sort();
          const channelName = `private-partner-${a}-${b}`;
          const channel = client.subscribe(channelName);
          channelRef.current = channel;

          channel.bind("competition-update", () => {
            fetchLeaderboard();
            fetchMyStatus();
            fetchBadges();
          });
        })
        .catch(() => {});
    }

    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchMyStatus();
      fetchBadges();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
      if (competitionChannelRef.current) {
        competitionChannelRef.current.unbind_all();
        competitionChannelRef.current = null;
      }
    };
  }, [session?.user?.id, fetchLeaderboard, fetchMyStatus, fetchBadges]);

  const handleAwardBadges = async () => {
    setAwardingBadges(true);
    try {
      await fetch("/api/competition/badges", { method: "POST" });
      await fetchBadges();
      await fetchLeaderboard();
    } catch {} finally {
      setAwardingBadges(false);
    }
  };

  // ── Edit: send request ──
  const handleEditRequest = async (field: "teamName" | "teamImage", value: string) => {
    if (!value) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/competition/request-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Edit request failed:", data.error);
      }
      setEditModalOpen(null);
      setMenuOpen(false);
      await fetchMyStatus();
    } catch {} finally {
      setEditLoading(false);
    }
  };

  // ── Edit: approve ──
  const handleApproveEdit = async () => {
    setApproveLoading(true);
    try {
      const res = await fetch("/api/competition/approve-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      await fetchMyStatus();
      await fetchLeaderboard();
    } catch {} finally {
      setApproveLoading(false);
    }
  };

  // ── Edit: reject ──
  const handleRejectEdit = async () => {
    setApproveLoading(true);
    try {
      const res = await fetch("/api/competition/approve-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false }),
      });
      await fetchMyStatus();
    } catch {} finally {
      setApproveLoading(false);
    }
  };

  if (loading || statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-muted-foreground">Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canJoin = myStatus?.status === "not_joined" || myStatus?.status === "no_competition" || myStatus?.status === "joined_pending";
  const isJoined = myStatus?.status === "joined" || myStatus?.status === "naming";
  const hasPendingEdit = myStatus?.pendingEdit && !myStatus?.pendingEdit?.approvedByMe;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Join/Invite Card ─── */}
      {myStatus?.status !== "no_partner" && !isJoined && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-[#1a1a0a] dark:via-[#1a1a0a] dark:to-[#121212] shadow-xl shadow-amber-200/20 dark:shadow-amber-900/10">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200/10 via-transparent to-yellow-200/10 dark:from-amber-500/5 dark:via-transparent dark:to-yellow-500/5 animate-gradient" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-3xl animate-float" />
            <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-yellow-200/30 dark:bg-yellow-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>
          <CardContent className="relative p-4 sm:p-6">
            <JoinFlow myStatus={myStatus} onRefresh={fetchMyStatus} />
          </CardContent>
        </Card>
      )}

      {/* ─── Pending Edit Approval Banner ─── */}
      {hasPendingEdit && myStatus?.pendingEdit && (
        <PendingApprovalBanner
          pendingEdit={myStatus.pendingEdit}
          partnerName={myStatus.partnerName}
          onApprove={handleApproveEdit}
          onReject={handleRejectEdit}
          loading={approveLoading}
        />
      )}

      {/* ─── Weekly Badges Section ─── */}
      {badges.length > 0 && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 shadow-lg">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-yellow-200/40 dark:bg-yellow-500/10 blur-2xl animate-float" />
          </div>
          <CardContent className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-bold text-foreground">🏆 This Week&apos;s Champions</p>
              </div>
              <button
                onClick={handleAwardBadges}
                disabled={awardingBadges}
                className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {awardingBadges ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {badges.map((badge) => {
                const entry = entries.find((e) => e.coupleKey === badge.coupleKey);
                return (
                  <div
                    key={badge.coupleKey}
                    className={cn(
                      "rounded-xl p-3 text-center animate-bounce-in border",
                      badge.rank === 1
                        ? "bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800/50"
                        : badge.rank === 2
                        ? "bg-gradient-to-b from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/20 border-gray-200 dark:border-gray-700/50"
                        : "bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50"
                    )}
                  >
                    <p className="text-lg font-black">{badge.title}</p>
                    {entry && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {entry.teamName || `${entry.user1Name} & ${entry.user2Name}`}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Sparkles className={cn(
                        "h-3 w-3",
                        badge.rank === 1 ? "text-yellow-500" : badge.rank === 2 ? "text-gray-400" : "text-amber-700"
                      )} />
                      <span className="text-[8px] text-muted-foreground">Weekly Champions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Leaderboard ─── */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/20 via-transparent to-rose-50/20 dark:from-amber-900/5 dark:via-transparent dark:to-rose-900/5" />

        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 shadow-lg">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Love Plant League 🏆</CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  {entries.length} couple{entries.length !== 1 ? "s" : ""} competing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleAwardBadges}
                disabled={awardingBadges}
                className="text-[9px] text-muted-foreground hover:text-amber-500 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                {awardingBadges ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "🏅 Award Badges"
                )}
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { fetchLeaderboard(); fetchMyStatus(); fetchBadges(); }}
                className="h-8 w-8"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
                <Heart className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-sm font-medium text-foreground">No teams yet!</p>
              <p className="text-xs text-muted-foreground">
                Be the first couple to join the competition! 🎮
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry, idx) => {
                const isMe = entry.coupleKey === currentUserCoupleKey;
                const top3 = idx < 3;
                const badge = badges.find((b) => b.coupleKey === entry.coupleKey);

                return (
                  <div
                    key={entry.coupleKey}
                    className={cn(
                      "group relative rounded-xl p-3 transition-all duration-300",
                      isMe
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800/50 shadow-md"
                        : top3
                        ? "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10 dark:to-transparent border border-border/40 hover:border-border/80"
                        : "border border-transparent hover:border-border/40 hover:bg-secondary/20"
                    )}
                  >
                    {top3 && (
                      <div className={cn(
                        "absolute -inset-px rounded-xl opacity-30 blur-sm pointer-events-none",
                        idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-300" : "bg-amber-600"
                      )} />
                    )}

                    <div className="relative flex items-center gap-3">
                      {/* PFP */}
                      <div className="shrink-0">
                        {entry.teamImage ? (
                          <img
                            src={entry.teamImage}
                            alt={entry.teamName || "Team"}
                            className="h-8 w-8 rounded-full object-cover border-2 border-amber-200 dark:border-amber-800/50"
                          />
                        ) : (
                          <TeamAvatar teamImage={null} teamName={entry.teamName || entry.user1Name} size="sm" />
                        )}
                      </div>

                      {/* Rank */}
                      <RankBadge rank={entry.rank} />

                      {/* Team Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground truncate">
                            {entry.teamName || `${entry.user1Name} & ${entry.user2Name}`}
                          </span>
                          {isMe && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              You
                            </span>
                          )}
                          {entry.rank === 1 && (
                            <Crown className="h-3.5 w-3.5 text-yellow-500 animate-bounce" fill="currentColor" />
                          )}
                          {badge && (
                            <span className={cn(
                              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                              badge.rank === 1
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : badge.rank === 2
                                ? "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                              🏅 W{new Date(badge.weekOf).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Names */}
                        <p className="text-[10px] text-muted-foreground truncate">
                          {entry.user1Name} 💕 {entry.user2Name}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <HealthBar value={entry.health} />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-lg font-black tabular-nums">{entry.health}</span>
                            <span className="text-[9px] text-muted-foreground">pts</span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            {entry.streak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-orange-500">
                                <Flame className="h-2.5 w-2.5" />
                                {entry.streak}
                              </span>
                            )}
                            <span className="text-[9px] text-muted-foreground">
                              {STAGE_EMOJI[entry.stage] || "🌱"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {idx === 0 && (
                      <div className="absolute top-1 right-2">
                        <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[9px] text-muted-foreground/60">
            <Zap className="h-2.5 w-2.5" />
            Rankings based on love plant health, streak & achievements
            <Target className="h-2.5 w-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* ─── My Team Card (if joined) ─── */}
      {isJoined && (
        <Card className="relative border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-900/10 dark:to-yellow-900/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TeamAvatar teamImage={myStatus?.teamImage} teamName={myStatus?.teamName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Your Team</p>
                  {myStatus?.teamName && (
                    <span className="truncate text-sm font-bold text-foreground">{myStatus.teamName}</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Partner: {myStatus?.partnerName}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Pending edit indicator */}
                {myStatus?.pendingEdit?.requestedByMe && (
                  <div className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1">
                    <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                    <span className="text-[9px] text-amber-600 dark:text-amber-400">Pending</span>
                  </div>
                )}
                <ThreeDotMenu
                  onEditName={() => setEditModalOpen("teamName")}
                  onEditImage={() => setEditModalOpen("teamImage")}
                  isOpen={menuOpen}
                  onToggle={toggleMenu}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Edit Request Modal ─── */}
      {editModalOpen && myStatus && (
        <EditRequestModal
          field={editModalOpen}
          currentValue={editModalOpen === "teamName" ? myStatus.teamName : myStatus.teamImage}
          partnerName={myStatus.partnerName}
          onConfirm={(value) => handleEditRequest(editModalOpen, value)}
          onCancel={() => setEditModalOpen(null)}
          loading={editLoading}
        />
      )}
    </div>
  );
}
