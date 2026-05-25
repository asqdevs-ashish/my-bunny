"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="relative mx-auto max-w-md text-center">
        {/* Decorative background icon */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-8xl opacity-5 select-none pointer-events-none">
          💔
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 shadow-lg">
          <AlertTriangle className="h-10 w-10 text-rose-500 dark:text-rose-400" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Oops! Kuch to gaya galat 😅
        </h1>

        {/* Description */}
        <p className="mb-8 text-muted-foreground leading-relaxed">
          Kuch unexpected ho gaya. Chinta mat karo — main already isko dekh raha
          hoon! Thodi der mein waapas aao ya neeche diya hua try karo.
        </p>

        {/* Error digest */}
        {error.digest && (
          <p className="mb-6 text-[11px] text-muted-foreground/40 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-300/30 hover:shadow-xl hover:shadow-rose-300/40 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            Phir se try karo
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard par jao
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
          Made with <Heart className="h-3 w-3 text-rose-400" fill="currentColor" /> by Suar
        </div>
      </div>
    </div>
  );
}
