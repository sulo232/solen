"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Search, X, Star } from "lucide-react";

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

interface SearchAutocompleteProps {
  onServiceSelect?: (service: SuggestService) => void;
}

export default function SearchAutocomplete({ onServiceSelect }: SearchAutocompleteProps) {
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<SuggestService[]>([]);
  const [salons, setSalons] = useState<SuggestSalon[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const totalItems = services.length + salons.length;

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setServices([]);
      setSalons([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setServices(data.services ?? []);
      setSalons(data.salons ?? []);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setServices([]);
      setSalons([]);
    }
  }, []);

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
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (services.length || salons.length) setOpen(true); }}
          placeholder="Service oder Salon suchen…"
          className="w-full pl-9 pr-8 py-2.5 rounded-button bg-white/80 backdrop-blur-sm border border-gray-200 text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); setServices([]); setSalons([]); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && totalItems > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-lg rounded-card shadow-glass border border-gray-100 overflow-hidden z-50">
          {services.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-dark/30 uppercase tracking-widest px-3 pt-2.5 pb-1">
                Behandlungen
              </p>
              {services.map((service, i) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                    activeIndex === i ? "bg-teal/10 text-teal" : "text-dark/80 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium truncate">{service.name_de}</span>
                  <span className="text-xs text-dark/40 font-data shrink-0 ml-2">
                    CHF {service.price}
                  </span>
                </button>
              ))}
            </div>
          )}

          {salons.length > 0 && (
            <div>
              {services.length > 0 && <div className="border-t border-gray-100" />}
              <p className="text-[10px] font-bold text-dark/30 uppercase tracking-widest px-3 pt-2.5 pb-1">
                Salons
              </p>
              {salons.map((salon, i) => {
                const idx = services.length + i;
                return (
                  <button
                    key={salon.id}
                    onClick={() => handleSalonClick(salon)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                      activeIndex === idx ? "bg-teal/10 text-teal" : "text-dark/80 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {salon.cover_image && (
                        <img src={salon.cover_image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{salon.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-dark/40">
                        <span>{salon.quartier}</span>
                        {salon.average_rating > 0 && (
                          <>
                            <span>·</span>
                            <Star size={10} className="fill-amber-400 text-amber-400" />
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
        </div>
      )}
    </div>
  );
}
