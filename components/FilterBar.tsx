"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X, CreditCard } from "lucide-react";
import PriceSlider from "@/components/ui/PriceSlider";
import type { Quartier } from "@/lib/types";

const QUARTIERS: { value: Quartier; label: string }[] = [
  { value: "grossbasel", label: "Grossbasel" },
  { value: "kleinbasel", label: "Kleinbasel" },
  { value: "gundeli", label: "Gundeli" },
  { value: "st_johann", label: "St. Johann" },
  { value: "iselin", label: "Iselin" },
  { value: "bruderholz", label: "Bruderholz" },
  { value: "breite", label: "Breite" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Beliebt" },
  { value: "rating", label: "Beste Bewertung" },
  { value: "price_asc", label: "Preis ↑" },
  { value: "price_desc", label: "Preis ↓" },
  { value: "newest", label: "Neueste" },
];

const RATING_OPTIONS = [
  { value: "4", label: "4+ ★" },
  { value: "4.5", label: "4.5+ ★" },
];

// Shared pill classes
const pillBase =
  "px-3 py-1.5 rounded-pill text-xs font-body font-medium whitespace-nowrap transition-all duration-200 border";
const pillActive =
  "bg-teal text-white border-teal shadow-teal-glow";
const pillInactive =
  "bg-white/70 backdrop-blur-sm text-dark/70 border-white/60 hover:border-teal/50 hover:bg-white/90 shadow-sm";

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [priceOpen, setPriceOpen] = useState(false);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const activeQuartier = searchParams.get("quartier");
  const activeSort = searchParams.get("sort") ?? "relevance";
  const activeRating = searchParams.get("rating");
  const activeAvail = searchParams.get("availability");
  const activePayment = searchParams.get("accepts_payment");

  const hasFilters =
    activeQuartier || activeRating || activeAvail || activePayment ||
    searchParams.get("min_price") || searchParams.get("max_price");

  return (
    <div className="sticky top-[57px] z-40 bg-white/80 backdrop-blur-glass border-b border-gray-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Quartier pills */}
          <div className="flex gap-2 shrink-0">
            {QUARTIERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setParam("quartier", activeQuartier === value ? null : value)}
                className={[
                  pillBase,
                  activeQuartier === value ? pillActive : pillInactive,
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200/80 shrink-0" />

          {/* Price */}
          <div className="relative shrink-0">
            <button
              onClick={() => setPriceOpen((v) => !v)}
              className={[
                pillBase,
                "flex items-center gap-1.5",
                priceOpen || searchParams.get("min_price") || searchParams.get("max_price")
                  ? pillActive
                  : pillInactive,
              ].join(" ")}
            >
              <SlidersHorizontal className="w-3 h-3" />
              Preis
            </button>
            {priceOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white/95 backdrop-blur-glass rounded-card shadow-glass border border-white/60 z-50">
                <PriceSlider />
              </div>
            )}
          </div>

          {/* Availability */}
          <button
            onClick={() => setParam("availability", activeAvail === "today" ? null : "today")}
            className={[pillBase, activeAvail === "today" ? pillActive : pillInactive].join(" ")}
          >
            Heute verfügbar
          </button>

          {/* Rating */}
          {RATING_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setParam("rating", activeRating === value ? null : value)}
              className={[
                pillBase,
                "shrink-0",
                activeRating === value ? pillActive : pillInactive,
              ].join(" ")}
            >
              {label}
            </button>
          ))}

          {/* Online payment */}
          <button
            onClick={() => setParam("accepts_payment", activePayment === "true" ? null : "true")}
            className={[
              pillBase,
              "shrink-0 flex items-center gap-1.5",
              activePayment === "true" ? pillActive : pillInactive,
            ].join(" ")}
          >
            <CreditCard className="w-3 h-3" />
            Online-Zahlung
          </button>

          <div className="w-px h-5 bg-gray-200/80 shrink-0" />

          {/* Sort dropdown */}
          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value)}
            className={[
              pillBase,
              "shrink-0 outline-none cursor-pointer pr-6 appearance-none",
              pillInactive,
            ].join(" ")}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={() => router.replace(pathname, { scroll: false })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-body font-medium text-coral border border-coral/30 bg-coral/5 hover:bg-coral/10 transition-all duration-150 shrink-0"
            >
              <X className="w-3 h-3" />
              Filter löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
