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
 *
 * `layout` (2026-07-23, added for the /dev/pdp/portfolio A/B/C comparison —
 * owner wants the REAL shipping component rendered per direction, not a
 * forked copy): optional grid treatment. Default `"grid-3"` is the CURRENT
 * shipped behaviour above, byte-identical for every existing caller
 * (SalonDetailV3 passes no `layout`, so nothing changes there).
 */
export function SalonPortfolio({
  urls,
  onOpen,
  layout = "grid-3",
}: {
  urls: string[];
  onOpen: (index: number) => void;
  /** "grid-3" (default, shipped) · "grid-2" taller 2-col cards · "hero-filmstrip" hero + scroll strip. */
  layout?: "grid-3" | "grid-2" | "hero-filmstrip";
}) {
  if (urls.length === 0) return null;

  const total = urls.length;

  return (
    <section id="section-portfolio">
      {/* V3-D202 (A10): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Portfolio
        <span className="ml-2 text-[14px] font-normal text-s-ink-3 md:text-[15px]">
          {total}
        </span>
      </h2>

      {/* V2-D53.3 fix #5 — Per Fresha spec "strict 3-column square grid",
          unify mobile + desktop on a single 3-col square layout. Earlier
          desktop variant (irregular 4×3 Fresha-pattern) violated the
          literal spec wording. This stays the DEFAULT; `layout` picks one
          of the two alternates below only when explicitly passed. */}
      {layout === "grid-3" && <UniformGrid urls={urls} onOpen={onOpen} />}
      {layout === "grid-2" && <TallGrid urls={urls} onOpen={onOpen} />}
      {layout === "hero-filmstrip" && <HeroFilmstrip urls={urls} onOpen={onOpen} />}
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
              <div className="absolute inset-0 grid place-items-center bg-black/55 font-display text-[24px] font-semibold text-white md:text-[32px]">
                +{overflow}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Direction B (2026-07-23, /dev/pdp/portfolio) - 2-column TALLER cards.
 * Same tap-to-open contract as UniformGrid; only the column count + aspect
 * ratio change (portrait 3:4 instead of square), so a photo with more
 * headroom/detail reads bigger per tap. Caps at 6 visible (3 rows of 2) -
 * fewer, larger tiles than the 9-tile 3-col grid by design.
 */
function TallGrid({ urls, onOpen }: { urls: string[]; onOpen: (i: number) => void }) {
  const visible = urls.slice(0, 6);
  const overflow = urls.length - visible.length;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 md:mt-5 md:gap-3">
      {visible.map((u, i) => {
        const isLast = i === visible.length - 1;
        const showOverlay = isLast && overflow > 0;
        return (
          <button
            key={u}
            type="button"
            onClick={() => onOpen(i)}
            className="relative aspect-[3/4] overflow-hidden rounded-lg bg-s-bg-sunken transition-transform hover:scale-[0.99] active:scale-[0.98] md:rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
            {showOverlay && (
              <div className="absolute inset-0 grid place-items-center bg-black/55 font-display text-[24px] font-semibold text-white md:text-[32px]">
                +{overflow}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Direction C (2026-07-23, /dev/pdp/portfolio) - hero + horizontal filmstrip.
 * Photo 0 renders large (4:3, full width); the rest scroll horizontally
 * below as square thumbnails. Tapping the hero or any thumbnail opens the
 * same SalonLightbox at that photo real index - no overlay/count chrome,
 * the scroll affordance itself communicates "more photos".
 */
function HeroFilmstrip({ urls, onOpen }: { urls: string[]; onOpen: (i: number) => void }) {
  const [hero, ...rest] = urls;
  if (!hero) return null;

  return (
    <div className="mt-4 md:mt-5">
      <button
        type="button"
        onClick={() => onOpen(0)}
        className="block w-full overflow-hidden rounded-xl bg-s-bg-sunken transition-transform active:scale-[0.99]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
      </button>

      {rest.length > 0 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
          {rest.map((u, i) => (
            <button
              key={u}
              type="button"
              onClick={() => onOpen(i + 1)}
              className="aspect-square w-20 shrink-0 overflow-hidden rounded-md bg-s-bg-sunken transition-transform active:scale-[0.97] md:w-24 md:rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
