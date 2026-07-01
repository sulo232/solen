"use client";

// exists-check: net-new vs siblings useSearchSuggest.ts / useStyleLooks.ts because it
// targets /api/discovery/feed (the RICH search_discovery FTS feed, ~200 looks for "fade")
// with its own item shape. Same debounce+abort pattern, reused. Powers the search overlay's
// Looks strip with REAL inspo looks instead of the thin style-suggest thumbnails.
import * as React from "react";

export type InspoLook = { id: string; image: string; title: string };
export type InspoLooksState = { looks: InspoLook[]; total: number; loading: boolean };

const EMPTY: InspoLooksState = { looks: [], total: 0, loading: false };

type FeedItem = {
  id: string;
  tiktok_url: string | null;
  image_url: string | null;
  tiktok_thumbnail_url: string | null;
  style_name: string | null;
};

export function useInspoLooks(
  query: string,
  opts?: { limit?: number; debounceMs?: number },
): InspoLooksState {
  const [state, setState] = React.useState<InspoLooksState>(EMPTY);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setState(EMPTY);
      return;
    }

    const debounce = opts?.debounceMs ?? 300;
    const limit = opts?.limit ?? 12;
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true }));

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: trimmed, limit: String(limit) });
        const res = await fetch(`/api/discovery/feed?${params.toString()}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`discovery feed failed: ${res.status}`);
        const raw = (await res.json()) as { items?: FeedItem[]; total?: number };
        const looks = (raw.items ?? [])
          .map((it) => ({
            id: it.id,
            // TikTok thumbnails are signed + expire; route through the server proxy that
            // re-signs + caches (matches Entdecken.tsx). Non-tiktok items use the raw image.
            image: it.tiktok_url ? `/api/discovery/thumb/${it.id}` : it.image_url || it.tiktok_thumbnail_url || "",
            title: it.style_name || "Look",
          }))
          .filter((l) => l.image);
        setState({ looks, total: raw.total ?? looks.length, loading: false });
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("[useInspoLooks] error:", err);
        setState(EMPTY);
      }
    }, debounce);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [query, opts?.limit, opts?.debounceMs]);

  return state;
}
