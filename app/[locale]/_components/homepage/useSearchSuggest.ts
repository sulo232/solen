"use client";

import * as React from "react";

/**
 * Debounced search-suggest hook for the hero SearchBar (V2-D51 Path C).
 *
 * - 300ms debounce on query change.
 * - AbortController cancels in-flight requests when query changes again.
 * - Skips the fetch entirely when query.length < 2.
 * - Returns loading state for skeleton UI.
 *
 * Hits `/api/search/suggest?q=X[&city=Y]` (which was already shipping —
 * V2-D51 Phase 1 augmented its response with `address`, `cover_photo_url`
 * fix, and a new `stylists` group).
 */

export type ServiceResult = {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  price: number | null;
};

export type SalonResult = {
  id: string;
  name: string;
  slug: string;
  average_rating: number;
  cover_photo_url: string | null;
  address: string;
  city_id: string;
  latitude: number;
  longitude: number;
};

export type StylistResult = {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
  salon_id: string;
  salon_name: string;
  salon_slug: string;
};

export type SearchResults = {
  services: ServiceResult[];
  salons: SalonResult[];
  stylists: StylistResult[];
};

const EMPTY: SearchResults = { services: [], salons: [], stylists: [] };

export type SearchSuggestState = {
  results: SearchResults;
  loading: boolean;
  error: Error | null;
};

export function useSearchSuggest(
  query: string,
  opts?: { city?: string; debounceMs?: number }
): SearchSuggestState {
  const [state, setState] = React.useState<SearchSuggestState>({
    results: EMPTY,
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setState({ results: EMPTY, loading: false, error: null });
      return;
    }

    const debounce = opts?.debounceMs ?? 300;
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (opts?.city) params.set("city", opts.city);
        const res = await fetch(`/api/search/suggest?${params.toString()}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = (await res.json()) as SearchResults;
        setState({ results: data, loading: false, error: null });
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.error("[useSearchSuggest] error:", err);
        setState({ results: EMPTY, loading: false, error: err as Error });
      }
    }, debounce);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [query, opts?.city, opts?.debounceMs]);

  return state;
}
