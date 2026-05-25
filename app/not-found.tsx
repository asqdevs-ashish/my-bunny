import Link from "next/link";
import { Heart, Home, SearchX, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="relative mx-auto max-w-md text-center">
        {/* Decorative background icon */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-8xl opacity-5 select-none pointer-events-none">
          🔍
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 shadow-lg">
          <SearchX className="h-10 w-10 text-rose-500 dark:text-rose-400" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Yeh page nahi mila 😕
        </h1>

        {/* Description */}
        <p className="mb-8 text-muted-foreground leading-relaxed">
          Jo page tum dhundh rahe ho, woh exist nahi karta ya shayad kabhi tha
          hi nahi. Chalo wapas chalein aur kuch accha karte hain! 🥰
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-300/30 hover:shadow-xl hover:shadow-rose-300/40 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Home className="h-4 w-4" />
            Ghar chalein
          </Link>

          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Chat karein
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
