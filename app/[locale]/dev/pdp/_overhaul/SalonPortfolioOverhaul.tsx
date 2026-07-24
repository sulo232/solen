"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonPortfolio.tsx (real, unmodified,
// default `UniformGrid` already caps at 9 visible tiles with a "+N" overlay when overflow
// exists). `npm run exists` (2026-07-24) found no separate "fill portfolio to 9" surface. The
// fixture salon only has 6 `gallery_urls`, so the real component renders 6 tiles (not a bug,
// just data-limited). This copy fills the remaining slots with REAL photos already fetched
// elsewhere on this page (staff_portfolio_images, same table + query SalonImageGalleryOverhaul
// already reads for the categorized gallery) instead of fabricating anything; if fewer than the
// cap real photos exist across venue + staff, it shows all available and adds a one-line
// footnote.
// ROUND 3 (S3, owner verbatim "three by three, so six images instead of whatever we have right
// now"): cap dropped from 9 (3x3) to 6 (3x2). Supersedes R1's 9-tile fill.

import * as React from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { StaffMember } from "../../../_components/salon/_shared";

const TILE_CAP = 6; // 3 columns x 2 rows (S1, owner "three by three, so six images")

/**
 * SalonPortfolioOverhaul , S3: render a 3x2 (up to 6) grid without fabrication. Venue photos
 * (`urls`) come first; if that's short of the cap, staff portfolio photos (staff_portfolio_images,
 * real seeded data) fill the remainder. If the combined real-photo count is still under the cap,
 * all available tiles render and a small English footnote states the real count (mockup chrome).
 */
export function SalonPortfolioOverhaul({
  urls,
  staff,
  onOpen,
}: {
  urls: string[];
  staff: StaffMember[];
  onOpen: (index: number) => void;
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
        console.error("[SalonPortfolioOverhaul] staff portfolio fetch failed:", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, urls, staff]);

  // Venue photos first, then staff photos fill remaining slots; de-dupe in case a photo URL
  // repeats between the two real sources.
  const combined = Array.from(new Set([...urls, ...staffPhotos]));
  if (combined.length === 0) return null;

  const totalReal = combined.length;
  const visible = combined.slice(0, TILE_CAP);
  const overflow = totalReal - visible.length;
  const showFootnote = totalReal < TILE_CAP;

  return (
    <section id="section-portfolio">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Portfolio
        <span className="ml-2 text-[14px] font-normal text-s-ink-3 md:text-[15px]">
          {totalReal}
        </span>
      </h2>

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

      {showFootnote && (
        <p className="mt-3 text-[12px] text-s-ink-3">Showing {totalReal} real photos.</p>
      )}
    </section>
  );
}
