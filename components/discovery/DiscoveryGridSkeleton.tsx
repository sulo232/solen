"use client";

export default function DiscoveryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5">
          <div className="aspect-[3/4] bg-s-ink/5 dark:bg-white/5 animate-pulse" />
          <div className="p-2.5 space-y-2">
            <div className="h-3 bg-s-ink/5 dark:bg-white/5 rounded-pill w-3/4 animate-pulse" />
            <div className="h-2.5 bg-s-ink/5 dark:bg-white/5 rounded-pill w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
