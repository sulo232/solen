"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Search, X, Star, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type { SalonCategory } from "@/lib/types";

interface SuggestService {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  price: number;
}

interface SuggestSalon {
  id: string;
  name: string;
  slug: string;
  quartier: string;
  average_rating: number;
  cover_image: string | null;
}

interface SmartResult {
  entity_type: string;
  entity_id: string;
  salon_id: string;
  name: string;
  category: string;
  similarity: number;
}

const categoryLabels: Record<SalonCategory, string> = {
  coiffeur: "Coiffeur",
  barbershop: "Barbershop",
  nails: "Nails",
  spa: "Spa & Massage",
  makeup: "Makeup",
  waxing: "Waxing",
};

interface SearchAutocompleteProps {
  category?: SalonCategory;
  onServiceSelect?: (service: SuggestService) => void;
}

export default function SearchAutocomplete({ category, onServiceSelect }: SearchAutocompleteProps) {
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<SuggestService[]>([]);
  const [salons, setSalons] = useState<SuggestSalon[]>([]);
  const [smartResults, setSmartResults] = useState<SmartResult[]>([]);
  const [suggestedCategory, setSuggestedCategory] = useState<SalonCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const smartDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);

  const totalItems = services.length + salons.length + smartResults.length;

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setServices([]);
      setSalons([]);
      setSmartResults([]);
      setSuggestedCategory(null);
      setOpen(false);
      return;
    }
    try {
      const categoryParam = category ? `&category=${category}` : "";
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}${categoryParam}`);
      const data = await res.json();
      setServices(data.services ?? []);
      setSalons(data.salons ?? []);
      setOpen(true);
      setActiveIndex(-1);

      // If few ILIKE results, fire smart search after a short delay
      const ilikCount = (data.services?.length ?? 0) + (data.salons?.length ?? 0);
      if (ilikCount < 2 && q.length >= 3) {
        if (smartDebounceRef.current) clearTimeout(smartDebounceRef.current);
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        smartDebounceRef.current = setTimeout(async () => {
          try {
            const smartRes = await fetch(
              `/api/search/smart?q=${encodeURIComponent(q)}${categoryParam}`,
              { signal: controller.signal }
            );
            const smartData = await smartRes.json();
            setSmartResults(smartData.results ?? []);
            if (smartData.suggested_category && smartData.suggested_category !== category) {
              setSuggestedCategory(smartData.suggested_category);
            } else {
              setSuggestedCategory(null);
            }
            setOpen(true);
          } catch {
            // Aborted or failed — ignore
          }
        }, 300);
      } else {
        setSmartResults([]);
        setSuggestedCategory(null);
      }
    } catch {
      setServices([]);
      setSalons([]);
    }
  }, [category]);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleServiceClick = (service: SuggestService) => {
    setOpen(false);
    setQuery(service.name_de);
    onServiceSelect?.(service);
  };

  const handleSalonClick = (salon: SuggestSalon) => {
    setOpen(false);
    setQuery("");
    router.push(`/${locale}/salon/${salon.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex < services.length) {
        handleServiceClick(services[activeIndex]);
      } else {
        handleSalonClick(salons[activeIndex - services.length]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (services.length || salons.length) setOpen(true); }}
          placeholder="Service oder Salon suchen…"
          className="w-full pl-9 pr-8 py-2.5 rounded-button bg-white/80 backdrop-blur-sm border border-s-ink/10 text-sm text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral/50 focus:ring-1 focus:ring-s-coral/20 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); setServices([]); setSalons([]); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-s-ink/30 hover:text-s-ink/60"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && totalItems > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-lg rounded-card shadow-glass border border-s-ink/5 overflow-hidden z-50">
          {services.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-s-ink/30 uppercase tracking-widest px-3 pt-2.5 pb-1">
                Behandlungen
              </p>
              {services.map((service, i) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                    activeIndex === i ? "bg-s-coral/10 text-s-coral" : "text-s-ink/80 hover:bg-s-bg-surface"
                  }`}
                >
                  <span className="font-medium truncate">{service.name_de}</span>
                  <span className="text-xs text-s-ink/40 data-text shrink-0 ml-2">
                    {formatCurrency(service.price, locale)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {salons.length > 0 && (
            <div>
              {services.length > 0 && <div className="border-t border-s-ink/5" />}
              <p className="text-[10px] font-bold text-s-ink/30 uppercase tracking-widest px-3 pt-2.5 pb-1">
                Salons
              </p>
              {salons.map((salon, i) => {
                const idx = services.length + i;
                return (
                  <button
                    key={salon.id}
                    onClick={() => handleSalonClick(salon)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                      activeIndex === idx ? "bg-s-coral/10 text-s-coral" : "text-s-ink/80 hover:bg-s-bg-surface"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-s-bg-sunken overflow-hidden shrink-0">
                      {salon.cover_image && (
                        <img src={salon.cover_image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{salon.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-s-ink/40">
                        <span>{salon.quartier}</span>
                        {salon.average_rating > 0 && (
                          <>
                            <span>·</span>
                            <Star size={10} className="fill-s-amber text-s-amber" />
                            <span>{salon.average_rating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* AI-powered smart results */}
          {smartResults.length > 0 && (
            <div>
              {(services.length > 0 || salons.length > 0) && <div className="border-t border-s-ink/5" />}
              <p className="text-[10px] font-bold text-s-ink/30 uppercase tracking-widest px-3 pt-2.5 pb-1 flex items-center gap-1">
                <Sparkles size={10} className="text-s-coral" />
                KI-Vorschläge
              </p>
              {smartResults.map((result, i) => {
                const idx = services.length + salons.length + i;
                return (
                  <button
                    key={`${result.entity_type}-${result.entity_id}`}
                    onClick={() => {
                      setOpen(false);
                      if (result.entity_type === "service") {
                        onServiceSelect?.({
                          id: result.entity_id,
                          name_de: result.name,
                          name_en: "",
                          category: result.category,
                          price: 0,
                        });
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                      activeIndex === idx ? "bg-s-coral/10 text-s-coral" : "text-s-ink/80 hover:bg-s-bg-surface"
                    }`}
                  >
                    <span className="font-medium truncate">{result.name}</span>
                    <span className="text-[10px] text-s-ink/30 shrink-0 ml-2 uppercase">
                      {result.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cross-category suggestion */}
          {suggestedCategory && suggestedCategory !== category && (
            <div className="px-3 py-2.5 flex items-center gap-2 bg-s-coral/5 border-t border-s-ink/5">
              <Search size={14} className="text-s-coral shrink-0" />
              <span className="text-xs text-s-ink/60 dark:text-s-dm-text/60 font-body">
                Meintest du <strong>{categoryLabels[suggestedCategory]}</strong>?
              </span>
              <Link
                href={`/${locale}/${suggestedCategory}?q=${encodeURIComponent(query)}`}
                className="ml-auto px-3 py-1 rounded-pill bg-s-coral text-white text-xs font-medium hover:bg-s-coral/90 transition-colors shrink-0"
                onClick={() => setOpen(false)}
              >
                Wechseln
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
