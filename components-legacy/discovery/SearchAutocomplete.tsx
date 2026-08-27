"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, ChevronRight } from "lucide-react";
import { RatingStars } from "@/app/[locale]/_components/primitives";

/**
 * SearchAutocomplete — connected typed-query dropdown (V3-D413). Replaces the old static POOL. Typing fetches:
 *  • /api/discovery/style-suggest → matching STYLE terms, each with a representative photo (or a neutral tile)
 *  • /api/search/suggest          → SALONS from the main search base that match (the inspiration→booking bridge)
 * Hard caps (≤4 styles, ≤3 salons); the "Salons" section only renders when there's a real match (no empty
 * header). A style row runs a discovery search; a salon row navigates to that salon. Raw query is always
 * searchable (footer). Fails soft → just the raw-query row.
 *
 * NOTE: the section labels + footer copy are hardcoded de for the prototype pass — move to next-intl before
 * shipping to en/fr/it.
 */
interface StyleTerm { term: string; thumb: string | null; }
// B15: review_count is optional because /api/search/suggest (search_suggest RPC) does not
// currently return it, so the gate below hides the star until the backend threads it through.
interface SalonHit { id: string; name: string; slug: string; average_rating: number | null; review_count?: number | null; cover_image: string | null; }

interface SearchAutocompleteProps {
  query: string;
  onSelect: (term: string) => void;
  onSalonSelect: (slug: string) => void;
}

export default function SearchAutocomplete({ query, onSelect, onSalonSelect }: SearchAutocompleteProps) {
  const q = query.trim();
  const [styles, setStyles] = useState<StyleTerm[]>([]);
  const [salons, setSalons] = useState<SalonHit[]>([]);

  useEffect(() => {
    if (q.length < 2) { setStyles([]); setSalons([]); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [styleRes, mainRes] = await Promise.all([
          fetch(`/api/discovery/style-suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal }),
          fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal }),
        ]);
        const styleData = await styleRes.json();
        const mainData = await mainRes.json();
        setStyles(Array.isArray(styleData.terms) ? styleData.terms.slice(0, 4) : []);
        setSalons(Array.isArray(mainData.salons) ? mainData.salons.slice(0, 3) : []);
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") console.error("[SearchAutocomplete] suggest failed:", err);
      }
    }, 180);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);

  return (
    <div className="flex flex-col">
      {styles.length > 0 && (
        <>
          <span className="px-1.5 pb-1 pt-0.5 text-[12px] font-heading font-semibold uppercase tracking-[0.04em] text-s-ink-2">Styles</span>
          {styles.map(({ term, thumb }) => (
            <button
              key={term}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(term)}
              className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left transition-[colors,transform] duration-150 hover:bg-s-bg-sunken active:scale-[0.98] active:duration-[80ms]"
            >
              {thumb ? (
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-s-bg-sunken">
                  <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                </span>
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-2"><Search size={16} strokeWidth={1.9} aria-hidden /></span>
              )}
              <span className="min-w-0 flex-1 truncate font-heading text-[15px] font-semibold text-s-ink">{term}</span>
              <span className="shrink-0 rounded-pill border border-s-border bg-s-bg-sunken px-2 py-0.5 text-[12px] font-heading font-medium text-s-ink-2">Look</span>
            </button>
          ))}
        </>
      )}

      {salons.length > 0 && (
        <>
          <span className="px-1.5 pb-1 pt-2 text-[12px] font-heading font-semibold uppercase tracking-[0.04em] text-s-ink-2">Salons</span>
          {salons.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSalonSelect(s.slug)}
              className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left transition-[colors,transform] duration-150 hover:bg-s-bg-sunken active:scale-[0.98] active:duration-[80ms]"
            >
              {s.cover_image ? (
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-s-bg-sunken">
                  <Image src={s.cover_image} alt="" fill className="object-cover" sizes="48px" />
                </span>
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken font-heading text-[15px] font-semibold text-s-ink-2">{s.name.charAt(0)}</span>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-heading text-[15px] font-semibold text-s-ink">{s.name}</span>
                {s.average_rating != null && s.review_count != null && s.review_count > 0 && (
                  <RatingStars
                    value={Number(s.average_rating)}
                    count={s.review_count}
                    size="sm"
                    className="font-body text-[12.5px] text-s-ink-2"
                  />
                )}
              </span>
              <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
            </button>
          ))}
        </>
      )}

      {/* raw query — always searchable (footer) */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSelect(q)}
        className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-1.5 py-2.5 text-left transition-[colors,transform] duration-150 hover:bg-s-bg-sunken active:scale-[0.98] active:duration-[80ms]"
      >
        <Search size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
        <span className="truncate text-[15px] text-s-ink-2">Suche nach „<span className="font-semibold text-s-ink">{q}</span>"</span>
      </button>
    </div>
  );
}
