"use client";

import * as React from "react";

/**
 * Recently-viewed salons for the SearchOverlay "Zuletzt" state (V2-D51 / Path C).
 *
 * Reads the same `solen.recently-viewed` localStorage the homepage RecentlyViewed
 * section writes (on /salon/[slug] visits). Returns the photo-rich venues the
 * approved search mockup (solen-search-screens.html, screen A1) shows under
 * "Zuletzt". Non-prod demo fallback so the resting state looks alive in dev
 * without real visit history; in prod, only real history shows.
 */

export type RecentlyViewedSalon = {
  id?: string;
  slug: string;
  name: string;
  category: string;
  photoUrl?: string;
};

const STORAGE_KEY = "solen.recently-viewed";

// live-data-ok: id/slug/name/category/photoUrl are the identity fields this
// dev-only (NODE_ENV-gated) resting-state fallback needs. `address`/`rating`
// were dropped 2026-07-16: they were stale/wrong hardcoded literals, and
// unused by both consumers (RecentlyViewedClient.tsx only reads `.slug` off
// these raw items, then re-fetches real name/rating/address/photo from
// /api/salons/by-slugs; SearchOverlay's `_recentlyViewed` binding is unused).
const DEMO: RecentlyViewedSalon[] = [
  { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", category: "coiffeur", photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=160&h=160&fit=crop&q=80" },
  { id: "599bb853-c713-4dae-a3c4-96c6216139c4", slug: "old-town-barbers", name: "Old Town Barbers", category: "barbershop", photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=160&h=160&fit=crop&q=80" },
  { id: "ca037638-362a-491b-ada2-238e20d9d4a9", slug: "nail-studio-bliss", name: "Nail Studio Bliss", category: "nails", photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=160&h=160&fit=crop&q=80" },
];

function isValid(e: unknown): e is RecentlyViewedSalon {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.slug === "string" && o.slug.length > 0 &&
    typeof o.name === "string" && o.name.trim().length > 0
  );
}

export function useRecentlyViewed(limit = 4): { items: RecentlyViewedSalon[]; clear: () => void } {
  const [items, setItems] = React.useState<RecentlyViewedSalon[]>([]);

  React.useEffect(() => {
    let real: RecentlyViewedSalon[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) real = parsed.filter(isValid).slice(0, limit);
    } catch (err) {
      console.error("[useRecentlyViewed] localStorage read failed:", err);
    }
    setItems(
      real.length > 0
        ? real
        : process.env.NODE_ENV !== "production"
          ? DEMO.slice(0, limit)
          : [],
    );
  }, [limit]);

  const clear = React.useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setItems([]);
  }, []);

  return { items, clear };
}
