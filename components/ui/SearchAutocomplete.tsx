"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
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
  const params = useParams();
  const rawCity = params?.city as string | undefined;
  const t = useTranslations("ui.search") as any;
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<SuggestService[]>([]);
  const [salons, setSalons] = useState<SuggestSalon[]>([]);
  const [smartResults, setSmartResults] = useState<SmartResult[]>([]);
  const [suggestedCategory, setSuggestedCategory] = useState<SalonCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const smartDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalItems = services.length + salons.length + smartResults.length;

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) {
      setServices([]);
      setSalons([]);
      setSmartResults([]);
      setSuggestedCategory(null);
      setOpen(false);
      return;
    }
    try {
      const categoryParam = category ? `&category=${category}` : "";
      const cityParam = rawCity ? `&city=${rawCity}` : "";
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}${categoryParam}${cityParam}`);
      if (!res.ok) { setServices([]); setSalons([]); return; }
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
              `/api/search/smart?q=${encodeURIComponent(q)}${categoryParam}${cityParam}`,
              { signal: controller.signal }
            );
            if (!smartRes.ok) return;
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

  const noResultsMsg = t("noResults", { query: query });

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative glass-search rounded-input">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (services.length || salons.length) setOpen(true); }}
          placeholder={t("placeholder")}
          className="w-full pl-9 pr-8 py-2.5 bg-transparent text-sm text-s-ink dark:text-s-dm-text placeholder:italic placeholder:text-s-ink/35 dark:placeholder:text-s-dm-text/30 focus:outline-none focus-visible:shadow-none focus-visible:border-transparent transition-colors duration-150"
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

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {open && totalItems > 0 && `${totalItems} ${totalItems === 1 ? "result" : "results"} found`}
        {open && totalItems === 0 && query.length >= 1 && "No results found"}
      </div>
      <AnimatePresence>
        {open && totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 mt-1.5 glass-frost rounded-[12px] shadow-v5-float overflow-hidden z-50">
          {services.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-s-ink/30 uppercase tracking-widest px-3 pt-2.5 pb-1">
                {t("treatments")}
              </p>
              {services.map((service, i) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors duration-150 ${
                    activeIndex === i ? "bg-s-coral/[0.06] text-s-coral" : "text-s-ink/80 hover:bg-s-bg-surface"
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
                {t("salons")}
              </p>
              {salons.map((salon, i) => {
                const idx = services.length + i;
                return (
                  <button
                    key={salon.id}
                    onClick={() => handleSalonClick(salon)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors duration-150 ${
                      activeIndex === idx ? "bg-s-coral/[0.06] text-s-coral" : "text-s-ink/80 hover:bg-s-bg-surface"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-s-bg-sunken overflow-hidden shrink-0">
                      {salon.cover_image && (
                        <Image src={salon.cover_image} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{salon.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-s-ink/40">
                        {salon.average_rating > 0 && (
                          <>
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
                {t("aiSuggestions")}
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
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors duration-150 ${
                      activeIndex === idx ? "bg-s-coral/[0.06] text-s-coral" : "text-s-ink/80 hover:bg-s-bg-surface"
                    }`}
                  >
                    <span className="font-medium truncate">{result.name}</span>
                    <span className="text-[10px] text-s-ink/30 shrink-0 ml-2 uppercase tracking-[.08em]">
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
                {t("didYouMean")} <strong>{categoryLabels[suggestedCategory]}</strong>?
              </span>
              <Link
                href={`/${locale}/${suggestedCategory}?q=${encodeURIComponent(query)}`}
                className="ml-auto px-3 py-1 rounded-pill bg-s-coral text-white text-xs font-medium hover:brightness-[1.06] transition-colors shrink-0"
                onClick={() => setOpen(false)}
              >
                {t("switch")}
              </Link>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && totalItems === 0 && query.length >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 mt-1.5 glass-frost rounded-[12px] shadow-v5-float z-50 px-4 py-5 text-center"
          >
            <p className="text-sm font-body text-s-ink/40 dark:text-s-dm-text/40">{noResultsMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
