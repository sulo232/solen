"use client";

// exists-check (I5, 2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html):
// ran `npm run exists usePopularLooks` (0 hits, genuinely new) and `npm run exists homepage` (33
// existing homepage components, none matching). Sibling of useForYouLooks.ts / useInspoLooks.ts
// (same file, same /api/discovery/feed endpoint, same debounce-free single-fetch shape as
// useForYouLooks), the ONE thing neither sibling hook returns is `price_min`, which this section's
// "from n CHF" tile line needs (task instruction: "Source the images and prices from the same
// place the Inspiration section on the home already pulls from" , Entdecken.tsx's own inline fetch
// already reads price_min, this hook just extracts that same fetch into a reusable shape instead of
// duplicating Entdecken's inline effect a third time).
import * as React from "react";

export type PopularLook = { id: string; image: string; title: string; priceFromCHF: number };
export type PopularLooksState = { looks: PopularLook[]; loading: boolean };

const EMPTY: PopularLooksState = { looks: [], loading: false };
// Initial state starts "loading" (SSR + first client paint both hit this, before the effect below
// ever runs), so the caller shows its Skeleton grammar from the first paint instead of a
// null -> skeleton -> content double-flash.
const INITIAL: PopularLooksState = { looks: [], loading: true };

type FeedItem = {
  id: string;
  tiktok_url: string | null;
  image_url: string | null;
  tiktok_thumbnail_url: string | null;
  style_name: string | null;
  price_min: number | null;
};

/**
 * Real seeded discovery looks with a real starting price, for the homepage's "Popular looks"
 * 4-across tile row (I5). Same endpoint + category Entdecken.tsx already pulls from
 * (/api/discovery/feed?category=hair), same image resolution (the /api/discovery/thumb proxy for
 * TikTok items, since raw thumbnail URLs are signed + expire). A look with no price_min is dropped
 * entirely rather than shown with an invented or omitted price , this row's whole point is a real
 * starting price under a real photo.
 */
export function usePopularLooks(opts?: { limit?: number }): PopularLooksState {
  const [state, setState] = React.useState<PopularLooksState>(INITIAL);
  const limit = opts?.limit ?? 8;

  React.useEffect(() => {
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true }));

    (async () => {
      try {
        const res = await fetch(`/api/discovery/feed?category=hair&limit=${limit}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`discovery feed failed: ${res.status}`);
        const raw = (await res.json()) as { items?: FeedItem[] };
        const looks = (raw.items ?? [])
          .map((it) => ({
            id: it.id,
            image: it.tiktok_url ? `/api/discovery/thumb/${it.id}` : it.image_url || it.tiktok_thumbnail_url || "",
            title: it.style_name || "Look",
            priceFromCHF: it.price_min,
          }))
          // No image, or no real price , never a placeholder tile.
          .filter((l): l is PopularLook => Boolean(l.image) && typeof l.priceFromCHF === "number");
        setState({ looks, loading: false });
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("[usePopularLooks] error:", err);
        setState(EMPTY);
      }
    })();

    return () => ac.abort();
  }, [limit]);

  return state;
}
