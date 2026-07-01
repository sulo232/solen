"use client";

// exists-check: net-new vs siblings useSearchSuggest / useStyleLooks / useInspoLooks because
// it fetches the NO-QUERY for-you feed (/api/discovery/feed, which routes to
// discovery_feed_for_you = DNA/style-affinity order for signed-in users, and the default
// popular order for logged-out , graceful). Powers the overlay's "Für dich" section that
// replaces the old Trending chips. Fetched once when the overlay opens, not per keystroke.
import * as React from "react";

export type ForYouLook = { id: string; image: string; title: string };
export type ForYouState = { looks: ForYouLook[]; loading: boolean };

const EMPTY: ForYouState = { looks: [], loading: false };

type FeedItem = {
  id: string;
  tiktok_url: string | null;
  image_url: string | null;
  tiktok_thumbnail_url: string | null;
  style_name: string | null;
};

export function useForYouLooks(enabled: boolean, opts?: { limit?: number }): ForYouState {
  const [state, setState] = React.useState<ForYouState>(EMPTY);

  React.useEffect(() => {
    if (!enabled) return;
    const limit = opts?.limit ?? 8;
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true }));

    (async () => {
      try {
        const res = await fetch(`/api/discovery/feed?limit=${limit}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`for-you feed failed: ${res.status}`);
        const raw = (await res.json()) as { items?: FeedItem[] };
        const looks = (raw.items ?? [])
          .map((it) => ({
            id: it.id,
            image: it.tiktok_url ? `/api/discovery/thumb/${it.id}` : it.image_url || it.tiktok_thumbnail_url || "",
            title: it.style_name || "Look",
          }))
          .filter((l) => l.image);
        setState({ looks, loading: false });
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("[useForYouLooks] error:", err);
        setState(EMPTY);
      }
    })();

    return () => ac.abort();
  }, [enabled, opts?.limit]);

  return state;
}
