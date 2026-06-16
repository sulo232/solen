/**
 * DiscoveryGridSkeleton — loading state for the discovery feed.
 *
 * Was an empty `<div/>` stub (caused a blank flash on load). Now a shimmer
 * skeleton that SHAPE-MATCHES MasonryGrid (same CSS-columns + 6px gutters +
 * rounded-2xl cards + varied aspect ratios), so real looks swap in without a
 * layout jump. Shimmer grammar = the Skeleton primitive's tokens
 * (s-bg-sunken → white → s-bg-sunken, `animate-shimmer`); `prefers-reduced-motion`
 * handled globally in globals.css. Server component (no client JS).
 */

// Varied ratios so it reads like the Pinterest masonry, not a rigid grid.
const RATIOS = [
  "3 / 4", "9 / 16", "1 / 1", "9 / 16",
  "4 / 5", "1 / 1", "3 / 4", "9 / 16",
  "9 / 16", "3 / 4", "1 / 1", "4 / 5",
];

const SHIMMER =
  "bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken bg-[length:200%_100%] animate-shimmer";

export default function DiscoveryGridSkeleton() {
  return (
    // -mx-4 px-1.5 mirrors the real feed's edge-to-edge masonry (discover/page.tsx).
    <div className="-mx-4 px-1.5" aria-hidden="true">
      <div className="columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:balance]">
        {RATIOS.map((ratio, i) => (
          <div key={i} className="mb-1.5 break-inside-avoid">
            <div className={`w-full rounded-2xl ${SHIMMER}`} style={{ aspectRatio: ratio }} />
            <div className={`mt-1.5 h-3 w-2/3 rounded-full ${SHIMMER}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
