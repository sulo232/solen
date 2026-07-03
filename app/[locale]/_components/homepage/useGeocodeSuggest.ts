"use client";

// exists-check: `npm run exists geocode` -> only the API endpoint exists
// (app/api/search/geocode/route.ts, B3.1/B3.2). No frontend hook for it yet. This
// EXTENDS the existing debounce+abort pattern from useSearchSuggest.ts (same directory,
// same shape) rather than inventing a new one , the only net-new code is wiring it to
// the geocode endpoint's { candidates: [...] } response shape.

import * as React from "react";

/**
 * Debounced geocode-suggest hook for the search overlay (B3.3, _plans/SEARCH_MAP_OVERHAUL.md).
 *
 * Same shape as useSearchSuggest.ts (debounce + AbortController + loading state) , reused
 * convention, not a new pattern. Hits `/api/search/geocode?q=X`, which is RESTRICTED to
 * Solen's served (is_active) cities and returns EVERY matching candidate (no server-side
 * auto-select) so genuine street-name ambiguity across cities (e.g. Bahnhofstrasse in both
 * Basel and Zuerich) surfaces as a real pick-list, never a silent single guess.
 */

export type GeocodeCandidate = {
  type: "street" | "place" | "city";
  label: string;
  street: string | null;
  city_name: string;
  city_slug: string;
  latitude: number;
  longitude: number;
};

export type GeocodeSuggestState = {
  candidates: GeocodeCandidate[];
  loading: boolean;
  error: Error | null;
};

const EMPTY: GeocodeCandidate[] = [];

export function useGeocodeSuggest(
  query: string,
  opts?: { debounceMs?: number }
): GeocodeSuggestState {
  const [state, setState] = React.useState<GeocodeSuggestState>({
    candidates: EMPTY,
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setState({ candidates: EMPTY, loading: false, error: null });
      return;
    }

    const debounce = opts?.debounceMs ?? 250;
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        const res = await fetch(`/api/search/geocode?${params.toString()}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
        const raw = (await res.json()) as { candidates?: GeocodeCandidate[] };
        setState({ candidates: raw.candidates ?? [], loading: false, error: null });
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.error("[useGeocodeSuggest] error:", err);
        setState({ candidates: EMPTY, loading: false, error: err as Error });
      }
    }, debounce);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [query, opts?.debounceMs]);

  return state;
}
