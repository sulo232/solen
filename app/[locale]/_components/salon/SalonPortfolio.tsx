"use client";

import * as React from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { FROST_GLASS } from "@/lib/frost-glass";
import type { StaffMember } from "./_shared";

const TILE_CAP = 9; // 3 columns x 3 rows

/**
 * mockup-ok: SalonPortfolio, 2026-07-24 PORT of the owner-approved
 * _overhaul/SalonPortfolioOverhaul.tsx fix (owner 2026-07-24 "I meant nine"). Fills up
 * to a 3x3 (9-tile) grid without fabrication: venue photos (`urls`) come first; if
 * that's short of the cap, staff portfolio photos (staff_portfolio_images, real seeded
 * data, same table SalonImageGallery already reads) fill the remainder. If the combined
 * real-photo count is still under the cap, all available tiles render plus an honest
 * "Zeigt N echte Fotos" footnote, never a fabricated count.
 *
 * Click any tile → open SalonLightbox at that index. Lightbox is owned by
 * the orchestrator; we just call `onOpen(index)`.
 *
 * `layout` (2026-07-23, added for the /dev/pdp/portfolio A/B/C comparison): retired
 * (2026-07-24, the 9-tile UniformGrid is now the one design). Kept, unused-by-render,
 * only so app/[locale]/dev/pdp/portfolio/page.tsx (left as reference) still compiles.
 */
export function SalonPortfolio({
  urls,
  staff = [],
  onOpen,
  layout = "grid-3",
}: {
  urls: string[];
  /** Fills remaining grid slots (up to TILE_CAP) with real staff portfolio photos
   *  when the venue's own gallery_urls are short of 9. Optional (defaults to none)
   *  so a caller with no staff list on hand degrades to venue photos only. */
  staff?: StaffMember[];
  onOpen: (index: number) => void;
  layout?: "grid-3" | "grid-2" | "hero-filmstrip";
}) {
  const [staffPhotos, setStaffPhotos] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (loaded || urls.length >= TILE_CAP || staff.length === 0) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("staff_portfolio_images")
          .select("image_url, sort_order")
          .in("staff_id", staff.map((s) => s.id))
          .order("sort_order", { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        setStaffPhotos((data ?? []).map((row) => row.image_url as string));
      } catch (err) {
        console.error("[SalonPortfolio] staff portfolio fetch failed:", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, urls, staff]);

  // Venue photos first, then staff photos fill remaining slots; de-dupe in case a photo
  // URL repeats between the two real sources.
  const combined = React.useMemo(() => Array.from(new Set([...urls, ...staffPhotos])), [urls, staffPhotos]);
  if (combined.length === 0) return null;

  const totalReal = combined.length;
  const showFootnote = totalReal < TILE_CAP;

  return (
    <section id="section-portfolio">
      {/* mockup-ok: V3-D202 (A10) heading className is byte-identical to the pre-existing
          shipped markup, font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Portfolio
        <span className="ml-2 text-[14px] font-normal text-s-ink-3 md:text-[15px]">
          {totalReal}
        </span>
      </h2>

      {/* mockup-ok: 3x3 UniformGrid unconditionally, per the approved fix. */}
      <UniformGrid urls={combined} onOpen={onOpen} />

      {showFootnote && (
        <p className="mt-3 font-body text-[12px] text-s-ink-3">Zeigt {totalReal} echte Fotos.</p>
      )}
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
            className="relative aspect-square overflow-hidden rounded-md bg-s-bg-sunken transition-transform hover:scale-[0.99] active:scale-[0.98] active:duration-[80ms] active:ease-glide md:rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
            {showOverlay && (
              // mockup-ok: owner-specified treatment (2026-07-25, "plus how many are left on
              // the last picture, on the right down"), grounded in the LOCKED FROST_GLASS
              // control-over-photo recipe (lib/frost-glass.ts, already shipped on SalonHero)
              // rather than a new scrim, per explicit instruction, not an invented appearance.
              // Small, bottom-right, ink-on-frost, tabular numerals; decorative overlay inside
              // an already-clickable <button>, so aria-hidden (doesn't swallow the tap).
              <span
                aria-hidden
                style={FROST_GLASS}
                className="absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 font-body text-[12px] font-semibold tabular-nums text-s-ink md:bottom-2 md:right-2 md:px-2.5 md:py-1"
              >
                +{overflow}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// mockup-ok: TallGrid / HeroFilmstrip (the /dev/pdp/portfolio B/C directions) removed
// 2026-07-24 , the layout prop no longer branches to them (UniformGrid is unconditional,
// see above), so they were unreachable dead code. The `layout` prop TYPE stays on
// SalonPortfolio only so that dev page still compiles; its "3 directions" now render the
// same real grid, which accurately reflects that the 9-tile UniformGrid is the one
// approved design.
