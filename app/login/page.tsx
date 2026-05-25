"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, UtensilsCrossed, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again, baby! 💕");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again!");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 via-amber-50 to-orange-50 px-4 dark:from-[#121212] dark:via-[#1a1a2e] dark:to-[#121212] overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 h-40 w-40 sm:h-64 sm:w-64 rounded-full bg-rose-200/30 dark:bg-amber-500/5 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 sm:h-64 sm:w-64 rounded-full bg-amber-200/30 dark:bg-rose-500/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 left-1/4 h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-pink-200/20 dark:bg-yellow-500/5 blur-2xl animate-pulse-soft" />
      </div>

      <Card className="relative w-full max-w-md animate-slide-up border-0 bg-white/80 backdrop-blur-xl dark:bg-[#1a1a2e]/80 shadow-2xl shadow-rose-200/50 dark:shadow-amber-900/20">
        <CardHeader className="text-center pb-2 pt-6 sm:pt-8">
          <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-amber-400 dark:from-amber-500 dark:to-yellow-500 shadow-lg animate-float">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
            Suar's Care
          </CardTitle>
          <CardDescription className="text-base mt-2 text-muted-foreground">
            <span className="flex items-center justify-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Your Personal Suar & Wellness Companion
              <Sparkles className="h-4 w-4" />
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Email
              </label>
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
              <label className="text-sm font-medium text-foreground/80">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              disabled={loading}
              className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 dark:from-amber-500 dark:to-yellow-500 dark:hover:from-amber-600 dark:hover:to-yellow-600 text-white dark:text-black font-semibold shadow-lg shadow-rose-200/50 dark:shadow-amber-900/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Heart className="h-5 w-5" fill="currentColor" />
                  Let Me In, Baby! 💕
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="relative mt-8 text-sm text-muted-foreground/60 animate-fade-in text-center px-4">
        Made with ❤️ just for you
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fffbf5] dark:bg-[#121212]" />
    }>
      <LoginForm />
    </Suspense>
  );
}
