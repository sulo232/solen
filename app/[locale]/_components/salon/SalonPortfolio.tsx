"use client";

import * as React from "react";

/**
 * SalonPortfolio — V2-D53.3 (2026-05-11).
 *
 * Photo grid with count badge in title and "+N" overlay on the last visible
 * tile when there are more photos than slots.
 *
 * Layout:
 *   • Mobile: uniform 3-col square grid, 9 visible max (`+N` on last)
 *   • Desktop: irregular Fresha-style grid (1 large left + 5 smaller right)
 *     - 4-col grid, 3-row tall
 *     - Image 1: col-span-2 row-span-3 (large left ⅔ × full height)
 *     - Images 2-3: top-right (single tiles)
 *     - Image 4: middle right wide (col-span-2)
 *     - Images 5-6: bottom right (last has +N)
 *
 * Click any tile → open SalonLightbox at that index. Lightbox is owned by
 * the orchestrator; we just call `onOpen(index)`.
 */
export function SalonPortfolio({
  urls,
  onOpen,
}: {
  urls: string[];
  onOpen: (index: number) => void;
}) {
  if (urls.length === 0) return null;

  const total = urls.length;

  return (
    <section id="section-portfolio">
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
        Portfolio
        <span className="ml-2 text-[14px] font-normal text-s-ink-3 md:text-[15px]">
          {total}
        </span>
      </h2>

      {/* V2-D53.3 fix #5 — Per Fresha spec "strict 3-column square grid",
          unify mobile + desktop on a single 3-col square layout. Earlier
          desktop variant (irregular 4×3 Fresha-pattern) violated the
          literal spec wording. */}
      <UniformGrid urls={urls} onOpen={onOpen} />
    </section>
  );
}

/**
 * Strict 3-column square grid per Fresha spec. Up to 9 visible tiles.
 * Last visible tile gets a "+N" overlay if there are more photos beyond.
 *
 * Same layout for mobile and desktop — only the gap and tile rounding scale.
 */
function UniformGrid({ urls, onOpen }: { urls: string[]; onOpen: (i: number) => void }) {
  const visible = urls.slice(0, 9);
  const overflow = urls.length - visible.length;

  return (
    <div className="mt-4 grid grid-cols-3 gap-1.5 md:mt-5 md:gap-2.5">
      {visible.map((u, i) => {
        const isLast = i === visible.length - 1;
        const showOverlay = isLast && overflow > 0;
        return (
          <button
            key={u}
            type="button"
            onClick={() => onOpen(i)}
            className="relative aspect-square overflow-hidden rounded-md bg-s-bg-sunken transition-transform hover:scale-[0.99] active:scale-[0.98] md:rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
            {showOverlay && (
              <div className="absolute inset-0 grid place-items-center bg-black/55 font-display text-[24px] font-black text-white md:text-[32px]">
                +{overflow}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
