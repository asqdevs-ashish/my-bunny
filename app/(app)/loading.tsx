// ─── Loading Skeleton for My Bunny ────────────────────────
// Shows shimmer-animated skeleton cards while pages load.
// The Nav (from layout) stays visible during loading.

export default function AppLoading() {
  return (
    <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6 animate-fade-in">
      {/* ── Header Skeleton ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50/60 via-amber-50/40 to-orange-50/60 dark:from-[#1a1a2e]/80 dark:via-[#1a1a2e]/60 dark:to-[#121212]/80 shadow-xl shadow-rose-200/20 dark:shadow-amber-900/5">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer" />
          <div className="absolute -top-10 -right-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full bg-rose-200/30 dark:bg-amber-500/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-amber-200/30 dark:bg-rose-500/5 blur-3xl" />
        </div>
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              {/* Title skeleton */}
              <div className="h-7 sm:h-8 w-48 sm:w-64 rounded-lg bg-rose-200/50 dark:bg-rose-800/30 animate-pulse" />
              {/* Subtitle skeleton */}
              <div className="h-4 sm:h-5 w-full max-w-md rounded-md bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
              <div className="h-4 sm:h-5 w-3/4 max-w-sm rounded-md bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
            </div>
            {/* Icon skeleton */}
            <div className="hidden md:block h-14 w-14 lg:h-16 lg:w-16 shrink-0 rounded-2xl bg-rose-200/40 dark:bg-amber-800/30 animate-pulse" />
          </div>
          {/* Badges skeleton */}
          <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-3">
            <div className="h-6 sm:h-7 w-24 rounded-full bg-rose-100/60 dark:bg-rose-900/20 animate-pulse" />
            <div className="h-6 sm:h-7 w-28 rounded-full bg-amber-100/60 dark:bg-amber-900/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Section Dividers Skeleton ── */}
      <div className="mt-6 sm:mt-8 flex items-center gap-3">
        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-rose-200/40 dark:bg-rose-800/30 animate-pulse" />
        <div className="h-3 w-32 rounded bg-rose-200/30 dark:bg-rose-800/20 animate-pulse" />
        <div className="flex-1 h-px bg-gradient-to-r from-rose-200/30 to-transparent dark:from-rose-800/20" />
      </div>

      {/* ── Grid Skeletons ── */}
      <div className="mt-4 grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Large card (2 cols) */}
        <div className="lg:col-span-2">
          <SkeletonCard size="large" />
        </div>
        {/* Small card (1 col) */}
        <div>
          <SkeletonCard size="small" />
        </div>
      </div>

      {/* ── Second Section Divider ── */}
      <div className="mt-6 sm:mt-8 flex items-center gap-3">
        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-emerald-200/40 dark:bg-emerald-800/30 animate-pulse" />
        <div className="h-3 w-28 rounded bg-emerald-200/30 dark:bg-emerald-800/20 animate-pulse" />
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-200/30 to-transparent dark:from-emerald-800/20" />
      </div>

      <div className="mt-4 grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Small card */}
        <div>
          <SkeletonCard size="small" />
        </div>
        {/* Large card */}
        <div className="lg:col-span-2">
          <SkeletonCard size="large" />
        </div>
      </div>

      {/* ── Third Section Divider ── */}
      <div className="mt-6 sm:mt-8 flex items-center gap-3">
        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-purple-200/40 dark:bg-purple-800/30 animate-pulse" />
        <div className="h-3 w-24 rounded bg-purple-200/30 dark:bg-purple-800/20 animate-pulse" />
        <div className="flex-1 h-px bg-gradient-to-r from-purple-200/30 to-transparent dark:from-purple-800/20" />
      </div>

      {/* Full width skeleton */}
      <div className="mt-4">
        <SkeletonCard size="full" />
      </div>
    </main>
  );
}

// ─── Skeleton Card Component ─────────────────────────────────

function SkeletonCard({ size = "small" }: { size: "small" | "large" | "full" }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-100/30 dark:border-rose-900/20 bg-card shadow-sm">
      {/* Shimmer line overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-100/30 dark:via-rose-800/10 to-transparent animate-shimmer" />
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {/* Card header skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-lg bg-rose-200/40 dark:bg-rose-800/30 animate-pulse" />
          <div className={`h-4 rounded-md bg-rose-200/40 dark:bg-rose-800/30 animate-pulse ${size === "small" ? "w-24" : "w-32"}`} />
        </div>

        {/* Card body skeletons */}
        {size === "large" && (
          <>
            <div className="flex items-center gap-4 pt-2">
              <div className="h-16 w-16 rounded-full bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full rounded bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
              </div>
            </div>
            {/* Row of small pills */}
            <div className="flex gap-2 pt-1">
              <div className="h-8 flex-1 rounded-lg bg-rose-100/40 dark:bg-rose-900/15 animate-pulse" />
              <div className="h-8 flex-1 rounded-lg bg-rose-100/40 dark:bg-rose-900/15 animate-pulse" />
              <div className="h-8 flex-1 rounded-lg bg-rose-100/40 dark:bg-rose-900/15 animate-pulse" />
            </div>
          </>
        )}

        {size === "full" && (
          <>
            <div className="h-3 w-full rounded bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-16 rounded-lg bg-rose-100/40 dark:bg-rose-900/15 animate-pulse" />
              <div className="h-16 rounded-lg bg-rose-100/40 dark:bg-rose-900/15 animate-pulse" />
              <div className="h-16 rounded-lg bg-rose-100/40 dark:bg-rose-900/15 animate-pulse" />
            </div>
          </>
        )}

        {size === "small" && (
          <>
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="h-20 w-20 rounded-full bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
              <div className="h-3 w-24 rounded bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
              <div className="h-3 w-32 rounded bg-rose-100/50 dark:bg-rose-900/20 animate-pulse" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
