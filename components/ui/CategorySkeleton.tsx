"use client";

/**
 * CategorySkeleton — pulse skeleton matching CityCarouselSection dimensions.
 * Strict parity: w-[280px] md:w-[320px], aspect-[20/19] md:aspect-square.
 * Prevents CLS when category carousels hydrate.
 */
export default function CategorySkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-4" aria-hidden="true">
      {/* Section heading skeleton — mirrors clamp(24px,3.5vw,42px) heading */}
      <div className="flex items-end justify-between mb-4">
        <div className="h-8 w-40 bg-s-ink/[0.07] rounded-lg animate-pulse" />
        <div className="h-4 w-20 bg-s-ink/[0.05] rounded-full animate-pulse" />
      </div>

      {/* Horizontal card strip */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px]">
            {/* Image — aspect-[20/19] mobile, aspect-square desktop */}
            <div className="w-full aspect-[20/19] md:aspect-square bg-s-ink/[0.07] animate-pulse rounded-xl mb-3" />
            {/* Name line */}
            <div className="h-5 w-3/4 bg-s-ink/[0.07] rounded-md animate-pulse mb-2" />
            {/* Sub line */}
            <div className="h-4 w-1/2 bg-s-ink/[0.05] rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
