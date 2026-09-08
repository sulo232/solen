"use client";

import * as React from "react";
import { useLocale } from "next-intl";

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
 * fix, and a new `stylists` group). `category` is sent too, see below.
 *
 * S6 (2026-08-03): `category` was the one param the route already read
 * (`app/api/search/suggest/route.ts` passes it to the `search_suggest` RPC as
 * `p_category`, which gates all three groups: `services.category = p_category`,
 * `salons.categories @> array[p_category]`, and stylists via their salon's
 * categories) and this hook never sent. That is why the SearchOverlay category
 * pill row changed nothing but its own fill. Same salon-category taxonomy on
 * both ends (coiffeur / barbershop / nails / spa, `SALON_CATEGORY_SLUGS`), NOT
 * the discovery taxonomy, and measured discriminating before wiring.
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
  // Nullable: the RPC orders by `average_rating desc nulls last`, so a salon with no
  // reviews returns null (AVG of empty set), not 0. Callers null-guard before .toFixed.
  average_rating: number | null;
  cover_photo_url: string | null;
  address: string;
  city_id: string;
  latitude: number;
  longitude: number;
  // Entry price: min active service price at the salon. Powers the "from CHF X"
  // on the rich-search salon cards. Nullable when the salon has no priced service.
  from_price: number | null;
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
  opts?: { city?: string; category?: string; debounceMs?: number }
): SearchSuggestState {
  const [state, setState] = React.useState<SearchSuggestState>({
    results: EMPTY,
    loading: false,
    error: null,
  });
  // The route only needs the extra service translations for locales other than de/en.
  const locale = useLocale();

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
        const params = new URLSearchParams({ q: trimmed, locale });
        if (opts?.city) params.set("city", opts.city);
        if (opts?.category) params.set("category", opts.category);
        const res = await fetch(`/api/search/suggest?${params.toString()}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const raw = (await res.json()) as Partial<SearchResults>;
        // Normalize: the suggest route omits keys on some fallback paths (e.g. no `stylists`),
        // so default every group to [] , else `results.stylists.length` throws downstream.
        const data: SearchResults = {
          services: raw.services ?? [],
          salons: raw.salons ?? [],
          stylists: raw.stylists ?? [],
        };
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
  }, [query, locale, opts?.city, opts?.category, opts?.debounceMs]);

  return state;
}
