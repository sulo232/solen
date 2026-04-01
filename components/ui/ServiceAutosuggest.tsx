"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Star } from "lucide-react";

interface ServiceSuggestion {
  id: string;
  name_de: string;
  name_en?: string;
  category: string;
  price?: number;
}

interface SalonSuggestion {
  id: string;
  name: string;
  slug: string;
  average_rating?: number;
  cover_image?: string;
}

interface SuggestResponse {
  services: ServiceSuggestion[];
  salons: SalonSuggestion[];
}

interface ServiceAutosuggestProps {
  query: string;
  locale: string;
  city: string;
  onSelect: (item: {
    type: "service" | "salon";
    category?: string;
    name: string;
    slug?: string;
  }) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ServiceAutosuggest({
  query,
  locale,
  city,
  onSelect,
}: ServiceAutosuggestProps) {
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setData(null);
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ q: debouncedQuery });
    if (city && city !== "all") params.set("city", city);

    setLoading(true);
    fetch(`/api/search/suggest?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`suggest ${r.status}`);
        return r.json() as Promise<SuggestResponse>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[ServiceAutosuggest] fetch error:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, city]);

  const hasServices = (data?.services?.length ?? 0) > 0;
  const hasSalons = (data?.salons?.length ?? 0) > 0;
  const isEmpty = data !== null && !hasServices && !hasSalons;

  // Inline locale labels (no new translation keys needed)
  const labelServices =
    locale === "de"
      ? "Services"
      : locale === "fr"
      ? "Services"
      : locale === "it"
      ? "Servizi"
      : "Services";

  const labelSalons =
    locale === "de"
      ? "Salons"
      : locale === "fr"
      ? "Salons"
      : locale === "it"
      ? "Saloni"
      : "Salons";

  const labelNoResults =
    locale === "de"
      ? `Keine Treffer für „${query}"`
      : locale === "fr"
      ? `Aucun résultat pour « ${query} »`
      : locale === "it"
      ? `Nessun risultato per «${query}»`
      : `No results for "${query}"`;

  return (
    <div className="min-w-[320px] max-h-[360px] overflow-y-auto">
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 px-3 py-3">
          <Loader2
            size={14}
            className="animate-spin text-s-coral shrink-0"
          />
          <span className="text-[12px] font-body text-s-ink/50">
            {locale === "de"
              ? "Suche…"
              : locale === "fr"
              ? "Recherche…"
              : locale === "it"
              ? "Ricerca…"
              : "Searching…"}
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <p className="text-[12px] font-body text-s-ink/50 px-3 py-4 text-center">
          {labelNoResults}
        </p>
      )}

      {/* Services section */}
      {!loading && hasServices && (
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 px-3 py-2">
            {labelServices}
          </p>
          {data!.services.map((item) => {
            const displayName =
              locale === "de"
                ? item.name_de
                : item.name_en ?? item.name_de;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={displayName}
                onClick={() =>
                  onSelect({
                    type: "service",
                    category: item.category,
                    name: item.name_de,
                  })
                }
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-s-ink/[0.04] cursor-pointer rounded-lg transition-colors duration-100 text-left"
              >
                <span className="text-[13px] font-body font-medium text-s-ink truncate flex-1">
                  {displayName}
                </span>
                <span className="text-[9px] font-heading font-bold uppercase tracking-[.06em] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral shrink-0">
                  {item.category}
                </span>
                {item.price != null && (
                  <span className="text-[11px] font-body text-s-ink/50 shrink-0 ml-1">
                    {locale === "de" ? "ab" : locale === "fr" ? "dès" : "from"} CHF {item.price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Salons section */}
      {!loading && hasSalons && (
        <div className={hasServices ? "border-t border-s-ink/[0.06] mt-1 pt-1" : ""}>
          <p className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 px-3 py-2">
            {labelSalons}
          </p>
          {data!.salons.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.name}
              onClick={() =>
                onSelect({ type: "salon", name: item.name, slug: item.slug })
              }
              className="group flex items-center gap-2 w-full px-3 py-2.5 hover:bg-s-ink/[0.04] cursor-pointer rounded-lg transition-colors duration-100 text-left"
            >
              <span className="text-[13px] font-body font-medium text-s-ink truncate flex-1">
                {item.name}
              </span>
              {item.average_rating != null && (
                <span className="flex items-center gap-0.5 text-[11px] font-body text-s-ink/50 shrink-0">
                  <Star size={10} className="fill-s-amber text-s-amber" />
                  {item.average_rating.toFixed(1)}
                </span>
              )}
              <span className="text-[13px] text-s-ink/30 group-hover:text-s-coral transition-colors duration-100 shrink-0">
                →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
