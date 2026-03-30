"use client";

/**
 * CategorySkeleton — pulse skeleton matching CityCarouselSection dimensions.
 * Prevents CLS: card aspect-[20/19] at 240px wide, exact heading height.
 */
export default function CategorySkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-4" aria-hidden="true">
      {/* Section heading row */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-36 bg-s-ink/[0.07] dark:bg-white/[0.07] rounded-lg animate-pulse" />
        <div className="h-4 w-20 bg-s-ink/[0.05] dark:bg-white/[0.05] rounded-full animate-pulse" />
      </div>

      {/* Horizontal card strip */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{ width: 240 }}
          >
            {/* Image area — aspect-[20/19] = 240 × 228 */}
            <div
              className="w-full rounded-xl bg-s-ink/[0.07] dark:bg-white/[0.07] animate-pulse"
              style={{ aspectRatio: "20/19" }}
            />
            {/* Name line */}
            <div className="mt-3 h-4 w-3/4 bg-s-ink/[0.07] dark:bg-white/[0.07] rounded-md animate-pulse" />
            {/* Sub line */}
            <div className="mt-1.5 h-3 w-1/2 bg-s-ink/[0.05] dark:bg-white/[0.05] rounded-md animate-pulse" />
            {/* Price tier line */}
            <div className="mt-1.5 h-3 w-1/3 bg-s-ink/[0.05] dark:bg-white/[0.05] rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
