"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Camera,
  Check,
  Mail,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";

type Step = "details" | "avatar" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCloudUrl, setImageCloudUrl] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // State
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // ─── Step 1: Validate details and move to avatar ─────────
  function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Please fill all fields correctly");
      return;
    }
    setStep("avatar");
  }

  // ─── Step 2: Handle image selection ───────────────────────
  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }

      setError("");
      setUploading(true);

      try {
        // Upload to Cloudinary (single upload, no re-upload later)
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
            setImagePreview(data.secure_url);
            setImageCloudUrl(data.secure_url);
          } else {
            setError("Failed to upload photo. You can skip and add later.");
          }
        } else {
          // No Cloudinary — use local base64 preview only (not stored in DB)
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
          // Note: without Cloudinary, we won't store the image in DB to avoid large base64 strings
        }
      } catch {
        setError("Failed to process image. You can skip and add later.");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  // ─── Step 2: Send OTP and move to verification ────────────
  async function handleSendOTP() {
    setError("");
    setOtpSending(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code");
        setOtpSending(false);
        return;
      }

      setStep("otp");
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setOtpSending(false);
    }
  }

  // ─── Step 3: Handle OTP input ─────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every((d) => d !== "")) {
      verifyOtp(newOtp.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      verifyOtp(pasted);
    }
  }

  // ─── Verify OTP ───────────────────────────────────────────
  async function verifyOtp(code: string) {
    setError("");
    setOtpVerifying(true);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        return;
      }

      setOtpVerified(true);
      // Auto-register after verification
      await completeRegistration();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  }

  // ─── Complete Registration ────────────────────────────────
  async function completeRegistration() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          image: imageCloudUrl, // Already uploaded to Cloudinary (or null)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again!");
      setLoading(false);
    }
  }

  const stepNumber = step === "details" ? 1 : step === "avatar" ? 2 : 3;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 via-amber-50 to-orange-50 px-4 dark:from-[#121212] dark:via-[#1a1a2e] dark:to-[#121212] overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 h-40 w-40 sm:h-64 sm:w-64 lg:h-96 lg:w-96 rounded-full bg-rose-200/30 dark:bg-amber-500/5 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 sm:h-64 sm:w-64 lg:h-96 lg:w-96 rounded-full bg-amber-200/30 dark:bg-rose-500/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 left-1/4 h-24 w-24 sm:h-32 sm:w-32 lg:h-48 lg:w-48 rounded-full bg-pink-200/20 dark:bg-yellow-500/5 blur-2xl animate-pulse-soft" />
      </div>

      <Card className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl animate-slide-up border-0 bg-white/80 backdrop-blur-xl dark:bg-[#1a1a2e]/80 shadow-2xl shadow-rose-200/50 dark:shadow-amber-900/20 rounded-2xl xl:rounded-3xl">
        <CardHeader className="text-center pb-2 pt-6 sm:pt-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    stepNumber >= s
                      ? "bg-gradient-to-br from-rose-400 to-amber-400 text-white shadow-md"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}
                >
                  {stepNumber > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 transition-all duration-300 ${
                      stepNumber > s
                        ? "bg-gradient-to-r from-rose-400 to-amber-400"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
            {step === "details" && "Create Account"}
            {step === "avatar" && "Pick Your DP"}
            {step === "otp" && "Verify Email"}
          </CardTitle>
          <CardDescription className="text-base mt-2 text-muted-foreground">
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              {step === "details" && "Join My Bunny"}
              {step === "avatar" && "Choose a profile picture"}
              {step === "otp" && `Code sent to ${email}`}
              <UtensilsCrossed className="h-4 w-4" />
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 pt-4 space-y-4">
          {/* ═══ STEP 1: Details ═══ */}
          {step === "details" && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Your Name</label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={1}
                  className="bg-white/50 dark:bg-black/20 border-rose-200/50 dark:border-amber-900/30 focus:border-rose-400 dark:focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/50 dark:bg-black/20 border-rose-200/50 dark:border-amber-900/30 focus:border-rose-400 dark:focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/50 dark:bg-black/20 border-rose-200/50 dark:border-amber-900/30 focus:border-rose-400 dark:focus:border-amber-500"
                />
              </div>

              {error && (
                <div className="animate-fade-in rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-600 dark:text-rose-400 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600 text-white dark:text-black font-semibold shadow-lg shadow-rose-200/50 dark:shadow-amber-900/30"
              >
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </form>
          )}

          {/* ═══ STEP 2: Avatar ═══ */}
          {step === "avatar" && (
            <div className="space-y-5">
              {/* Avatar preview */}
              <div className="flex justify-center">
                <div
                  className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden border-4 border-dashed border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setImageCloudUrl(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                      <Camera className="h-10 w-10 text-rose-300 dark:text-rose-700" />
                      <span className="text-xs text-rose-400 dark:text-rose-600 font-medium">Add Photo</span>
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              {error && (
                <div className="animate-fade-in rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-600 dark:text-rose-400 text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpSending}
                  className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600 text-white dark:text-black font-semibold shadow-lg shadow-rose-200/50 dark:shadow-amber-900/30"
                >
                  {otpSending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Send OTP
                    </span>
                  )}
                </Button>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpSending}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip photo & continue →
              </button>
            </div>
          )}

          {/* ═══ STEP 3: OTP Verification ═══ */}
          {step === "otp" && (
            <div className="space-y-5">
              {otpVerified ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">Email Verified! ✨</p>
                  <p className="text-sm text-muted-foreground mt-1">Setting up your account...</p>
                  <Loader2 className="h-6 w-6 animate-spin text-rose-400 mx-auto mt-4" />
                </div>
              ) : (
                <>
                  {/* OTP Input */}
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="h-12 w-11 sm:h-14 sm:w-13 text-center text-xl font-bold rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-white/50 dark:bg-black/20 focus:border-rose-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-amber-800 outline-none transition-all"
                        disabled={otpVerifying || otpVerified}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="animate-fade-in rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-600 dark:text-rose-400 text-center">
                      {error}
                    </div>
                  )}

                  {otpVerifying && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep("avatar");
                        setOtp(["", "", "", "", "", ""]);
                        setError("");
                      }}
                      className="flex-1 h-12"
                      disabled={otpVerifying}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSendOTP()}
                      disabled={otpSending}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      {otpSending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Resending...
                        </span>
                      ) : (
                        "Resend Code"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Register Link (only on step 1) */}
          {step === "details" && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-rose-500 hover:text-rose-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                >
                  Sign in
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="relative mt-8 text-sm text-muted-foreground/60 animate-fade-in text-center px-4">
        Made with ❤️ just for you
      </p>
    </div>
  );
}
