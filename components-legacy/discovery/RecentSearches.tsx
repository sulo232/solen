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

const LS_KEY = "inspo:recent-searches";

// localStorage layer so recent searches work logged-OUT (the DB history is per-user/logged-in only). Terms are
// plain strings (no thumb); SSR-guarded; dedup is the writer's job (commitSearch in the inspo page).
const readLocal = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((t): t is string => typeof t === "string") : [];
  } catch (err) {
    console.error("[RecentSearches] localStorage read failed:", err);
    return [];
  }
};
const writeLocal = (terms: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(terms));
  } catch (err) {
    console.error("[RecentSearches] localStorage write failed:", err);
  }
};

/**
 * RecentSearches — the dropdown empty-state history (V3-D413), the Pinterest "thumbnail · term · remove" pattern
 * in Solen's skin. Reads localStorage ("inspo:recent-searches", ALWAYS, works logged-out) AND
 * /api/discovery/recent-searches (per-user, logged-in only), then MERGES: localStorage terms first, then DB terms
 * not already present (case-insensitive), dedup, cap 8. Renders NOTHING when there's no history → the dropdown then
 * shows only Trending: the fallback ladder. A null thumb → a neutral search-tile (never a wrong/random photo); the
 * localStorage terms have no thumb. X removes one (from both DB + localStorage); "Clear all" wipes both.
 *
 * NOTE: the two micro-labels are hardcoded de for the prototype pass — move to next-intl (discover namespace)
 * before this ships to en/fr/it.
 */
export default function RecentSearches({ onSelect }: RecentSearchesProps) {
  const [terms, setTerms] = useState<RecentTerm[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Seed from localStorage immediately (logged-out gets history with no network round-trip).
    const local: RecentTerm[] = readLocal().map((term) => ({ term, thumb: null }));
    // Show localStorage history immediately (logged-out path never waits on the DB fetch to flip `loaded`).
    if (!cancelled) { setTerms(local); if (local.length > 0) setLoaded(true); }
    (async () => {
      try {
        const res = await fetch("/api/discovery/recent-searches");
        const data = await res.json();
        const db: RecentTerm[] = Array.isArray(data.terms) ? data.terms : [];
        if (!cancelled) {
          // Merge: localStorage terms first, then DB terms not already present (case-insensitive), cap 8.
          const seen = new Set(local.map((t) => t.term.toLowerCase()));
          const merged = [...local];
          for (const d of db) {
            if (seen.has(d.term.toLowerCase())) continue;
            seen.add(d.term.toLowerCase());
            merged.push(d);
          }
          setTerms(merged.slice(0, 8));
        }
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
    writeLocal(readLocal().filter((t) => t.toLowerCase() !== term.toLowerCase()));
    try {
      await fetch(`/api/discovery/recent-searches?term=${encodeURIComponent(term)}`, { method: "DELETE" });
    } catch (err) {
      console.error("[RecentSearches] remove failed:", err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setTerms([]);
    writeLocal([]);
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
        <span className="text-[13px] font-heading font-bold text-s-ink">Zuletzt gesucht</span>
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
                <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-s-bg-sunken text-s-ink-2">
                  <Search size={18} strokeWidth={1.9} aria-hidden />
                </span>
              )}
              <span className="truncate font-heading text-[16px] font-semibold text-s-ink">{term}</span>
            </button>
            <button
              type="button"
              aria-label={`„${term}" entfernen`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => remove(term)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
            >
              <X size={18} strokeWidth={1.9} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
