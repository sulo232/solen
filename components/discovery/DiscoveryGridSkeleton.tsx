"use client";

export default function DiscoveryGridSkeleton({ count = 8 }: { count?: number }) {
  // Match masonry layout: 2 cols mobile, 3 tablet, 4 desktop, 12px gap
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid mb-3 rounded-[16px] overflow-hidden"
          style={{
            // Alternate heights to fake masonry appearance
            aspectRatio: i % 3 === 0 ? "9/16" : i % 2 === 0 ? "1/1" : "3/4",
          }}
        >
          <div className="w-full h-full relative bg-s-ink/5 dark:bg-white/5 overflow-hidden">
            <div className="absolute inset-0 shimmer" />
            {/* Fake top-left badge */}
            <div className="absolute top-2 left-2">
              <div className="h-3.5 w-16 bg-s-ink/10 dark:bg-white/10 rounded-pill overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
            {/* Fake top-right buttons */}
            <div className="absolute top-2 right-2">
              <div className="h-6 w-14 bg-s-ink/10 dark:bg-white/10 rounded-pill overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
