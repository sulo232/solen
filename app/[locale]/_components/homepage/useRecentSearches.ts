"use client";

import * as React from "react";

/**
 * Recent-searches state, persisted to localStorage (V2-D51 Phase 4).
 *
 * - Stores last 5 unique searches per browser.
 * - Dedupes by the entry's primary identifier (query → service → city).
 * - Pushes happen on submit (handleSubmit) — typed-but-not-submitted state
 *   is NOT recorded. Per plan D4: pill click restores all stored fields +
 *   auto-submits. Repeat-search shortcut.
 * - SSR-safe: initial state empty, hydrate in useEffect.
 *
 * NOTE: localStorage key chosen to avoid collisions with other Solen
 * features. Search before adding more entries to localStorage.
 */

const STORAGE_KEY = "solen.recentSearches";
const MAX = 5;

export type RecentSearch = {
  query?: string;
  service?: string;
  city?: string;
  date?: string; // ISO yyyy-mm-dd
  period?: string;
  ts: number; // last-touched timestamp, used for sort + dedup
};

export function useRecentSearches() {
  const [recent, setRecent] = React.useState<RecentSearch[]>([]);

  // Hydrate from localStorage on mount (SSR-safe)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Coerce + cap. Drop malformed entries silently.
          const clean = parsed
            .filter((e: any) => e && typeof e === "object")
            .map((e: any) => ({ ...e, ts: e.ts ?? 0 }))
            .slice(0, MAX);
          setRecent(clean);
        }
      }
    } catch {
      // Ignore parse errors — start fresh
    }
  }, []);

  const persist = React.useCallback((list: RecentSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore quota errors / disabled storage
    }
  }, []);

  const push = React.useCallback(
    (entry: Omit<RecentSearch, "ts">) => {
      // Skip empty entries — no point storing "user opened picker, did nothing"
      if (!entry.query && !entry.service && !entry.city) return;

      const dedupeKey = entry.query || entry.service || entry.city;

      setRecent((prev) => {
        const filtered = prev.filter((r) => {
          const k = r.query || r.service || r.city;
          return k !== dedupeKey;
        });
        const updated = [{ ...entry, ts: Date.now() }, ...filtered].slice(0, MAX);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const clear = React.useCallback(() => {
    setRecent([]);
    persist([]);
  }, [persist]);

  return { recent, push, clear };
}

/** Display label for a recent entry — shows the most distinctive value. */
export function recentLabel(r: RecentSearch): string {
  return r.query || r.service || r.city || "Suche";
}
