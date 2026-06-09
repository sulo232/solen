"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";

interface RecentSearchesProps {
  onSelect: (term: string) => void;
}
interface RecentTerm {
  term: string;
  thumb: string | null;
}

/**
 * RecentSearches — the dropdown empty-state history (V3-D413), the Pinterest "thumbnail · term · remove" pattern
 * in Solen's skin. Reads /api/discovery/recent-searches (per-user, already logged). Renders NOTHING when there's
 * no history (logged-out or no searches yet) → the dropdown then shows only Trending: the fallback ladder.
 * A null thumb → a neutral search-tile (never a wrong/random photo). X removes one; "Clear all" wipes the list.
 *
 * NOTE: the two micro-labels are hardcoded de for the prototype pass — move to next-intl (discover namespace)
 * before this ships to en/fr/it.
 */
export default function RecentSearches({ onSelect }: RecentSearchesProps) {
  const [terms, setTerms] = useState<RecentTerm[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/discovery/recent-searches");
        const data = await res.json();
        if (!cancelled) setTerms(Array.isArray(data.terms) ? data.terms : []);
      } catch (err) {
        console.error("[RecentSearches] fetch failed:", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const remove = useCallback(async (term: string) => {
    setTerms((prev) => prev.filter((t) => t.term !== term)); // optimistic
    try {
      await fetch(`/api/discovery/recent-searches?term=${encodeURIComponent(term)}`, { method: "DELETE" });
    } catch (err) {
      console.error("[RecentSearches] remove failed:", err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setTerms([]);
    try {
      await fetch("/api/discovery/recent-searches?all=1", { method: "DELETE" });
    } catch (err) {
      console.error("[RecentSearches] clear-all failed:", err);
    }
  }, []);

  if (!loaded || terms.length === 0) return null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-1.5 pb-1">
        <span className="text-[12px] font-heading font-semibold uppercase tracking-[0.04em] text-s-ink-3">Zuletzt gesucht</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearAll}
          className="text-[13px] font-body text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
        >
          Alle löschen
        </button>
      </div>
      <ul className="flex flex-col">
        {terms.map(({ term, thumb }) => (
          <li key={term} className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(term)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-2 text-left transition-colors duration-150 hover:bg-s-bg-sunken"
            >
              {thumb ? (
                <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[14px] bg-s-bg-sunken">
                  <Image src={thumb} alt="" fill className="object-cover" sizes="52px" />
                </span>
              ) : (
                <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-s-bg-sunken text-s-ink-3">
                  <Search size={18} aria-hidden />
                </span>
              )}
              <span className="truncate font-heading text-[16px] font-semibold text-s-ink">{term}</span>
            </button>
            <button
              type="button"
              aria-label={`„${term}" entfernen`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => remove(term)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-s-ink-3 transition-colors duration-150 hover:text-s-ink"
            >
              <X size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
