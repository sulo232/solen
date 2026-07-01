"use client";

// exists-check: net-new vs sibling useSearchSuggest.ts because it targets a
// DIFFERENT endpoint (/api/discovery/style-suggest, discovery-flag-gated) with
// its own fail-soft path and return shape. Same debounce+abort pattern, reused.
import * as React from "react";

/**
 * Debounced hook for the rich-search overlay's style layer. Hits the existing
 * `/api/discovery/style-suggest?q=X` (V3-D413) which returns distinct style/tag
 * terms CONTAINING the typed string, each with a representative photo (thumb) OR
 * null when there's no confident content. One call powers TWO things in the
 * overlay:
 *   - autocomplete completions (the `term` strings, e.g. "buzzcut fade")
 *   - the small Looks strip (the non-null `thumb` photos)
 *
 * Fails soft to an empty list (the endpoint is gated behind the `discovery`
 * feature flag and returns {terms:[]} when off), so the overlay degrades to
 * just the salon/service suggestions.
 */

export type StyleTerm = { term: string; thumb: string | null };

export type StyleLooksState = { terms: StyleTerm[]; loading: boolean };

const EMPTY: StyleLooksState = { terms: [], loading: false };

export function useStyleLooks(
  query: string,
  opts?: { debounceMs?: number },
): StyleLooksState {
  const [state, setState] = React.useState<StyleLooksState>(EMPTY);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setState(EMPTY);
      return;
    }

    const debounce = opts?.debounceMs ?? 300;
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true }));

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        const res = await fetch(`/api/discovery/style-suggest?${params.toString()}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`style-suggest failed: ${res.status}`);
        const raw = (await res.json()) as { terms?: StyleTerm[] };
        setState({ terms: raw.terms ?? [], loading: false });
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("[useStyleLooks] error:", err);
        setState(EMPTY);
      }
    }, debounce);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [query, opts?.debounceMs]);

  return state;
}
