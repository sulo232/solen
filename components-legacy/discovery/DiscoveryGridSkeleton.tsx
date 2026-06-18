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

export default function DiscoveryGridSkeleton({ fixed2col = false }: { fixed2col?: boolean }) {
  return (
    // fixed2col: the "More like this" masonry is ALWAYS 2 columns (page capped at 480px), so its skeleton must match,
    // else it flashes 4 columns on desktop then snaps to 2. Feed default keeps the responsive masonry.
    <div className={fixed2col ? "-mx-[18px] px-1.5" : "-mx-4 px-1.5"} aria-hidden="true">
      <div className={`${fixed2col ? "columns-2" : "columns-2 md:columns-3 lg:columns-4"} gap-1.5 [column-fill:balance]`}>
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
