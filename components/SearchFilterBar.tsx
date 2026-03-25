"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useMemo } from "react";
import { SlidersHorizontal, X, CreditCard, ChevronDown, Check, Tag, Star } from "lucide-react";
import PriceSlider from "@/components/ui/PriceSlider";
import SearchAutocomplete from "@/components/ui/SearchAutocomplete";
import SolenDatePicker from "@/components/ui/date-picker";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import type { Quartier, SalonCategory } from "@/lib/types";
import { motion } from "framer-motion";

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
  { value: "rating",    label: "Beliebteste"        },
  { value: "price",     label: "Preis (tief → hoch)" },
  { value: "nearest",   label: "Nächste"             },
  { value: "newest",    label: "Neueste"              },
  { value: "next_slot", label: "Nächster Termin"      },
];

const RATING_OPTIONS = [
  { value: "4", label: "4+", stars: true },
  { value: "4.5", label: "4.5+", stars: true },
];

// Shared pill classes — V3 spec
const pillBase =
  "px-3.5 py-2 min-h-[36px] rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5";
const pillActive =
  "bg-s-coral text-white border-s-coral"
  + " shadow-[0_2px_4px_rgba(232,98,74,.25),0_4px_16px_rgba(232,98,74,.15)]";
const pillInactive =
  "text-s-ink/65 dark:text-s-dm-text/65 border-s-ink/[0.08] dark:border-white/10"
  + " bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm"
  + " hover:border-s-coral/40 hover:bg-white/90 dark:hover:bg-s-dm-raised/90"
  + " shadow-[0_1px_2px_rgba(26,18,9,.06)]";

interface FilterBarProps {
  category?: SalonCategory;
}

function dateValueToIso(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export default function FilterBar({ category }: FilterBarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [priceOpen, setPriceOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

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
  const activeDate = searchParams.get("date");
  const activePayment = searchParams.get("accepts_payment");
  const activeOffPeak = searchParams.get("off_peak");

  const todayValue = useMemo(() => today(getLocalTimeZone()), []);
  const todayIso = dateValueToIso(todayValue);
  const tomorrowIso = dateValueToIso(todayValue.add({ days: 1 }));

  // Parse active date for date picker
  const datePickerValue = useMemo(() => {
    if (!activeDate) return undefined;
    try { return parseDate(activeDate); } catch { return undefined; }
  }, [activeDate]);

  const hasFilters =
    activeQuartier || activeRating || activeDate || activePayment || activeOffPeak ||
    searchParams.get("min_price") || searchParams.get("max_price");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="sticky top-[57px] z-40 isolate"
      style={{ background: "rgba(250,246,239,.82)", backdropFilter: "blur(28px) saturate(1.3)",
               WebkitBackdropFilter: "blur(28px) saturate(1.3)",
               boxShadow: "inset 0 -1px 0 rgba(26,18,9,.06), 0 1px 3px rgba(26,18,9,.04)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Search autocomplete */}
          <div className="shrink-0">
            <SearchAutocomplete
              category={category}
              onServiceSelect={(service) => {
                setParam("service", service.name_de);
              }}
            />
          </div>

          <div className="w-px h-5 bg-s-sand/80 shrink-0" />

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
                aria-label={`Quartier ${label} ${activeQuartier === value ? "entfernen" : "filtern"}`}
                aria-pressed={activeQuartier === value}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-s-sand/80 shrink-0" />

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
              <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
              Preis
            </button>
            {priceOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-5 z-50 rounded-[20px]"
                style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px) saturate(1.3)",
                         WebkitBackdropFilter: "blur(24px) saturate(1.3)",
                         border: "1px solid rgba(255,255,255,.80)",
                         boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.90)" }}>
                <PriceSlider />
              </div>
            )}
          </div>

          {/* Date quick chips + picker */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setParam("date", activeDate === todayIso ? null : todayIso)}
              className={[pillBase, activeDate === todayIso ? pillActive : pillInactive].join(" ")}
              aria-label="Heute verfügbare Salons filtern"
              aria-pressed={activeDate === todayIso}
            >
              Heute
            </button>
            <button
              onClick={() => setParam("date", activeDate === tomorrowIso ? null : tomorrowIso)}
              className={[pillBase, activeDate === tomorrowIso ? pillActive : pillInactive].join(" ")}
              aria-label="Morgen verfügbare Salons filtern"
              aria-pressed={activeDate === tomorrowIso}
            >
              Morgen
            </button>
            <SolenDatePicker
              label=""
              value={datePickerValue}
              onChange={(d) => setParam("date", dateValueToIso(d))}
              minValue={todayValue}
              className="[&_label]:hidden"
            />
          </div>

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
              <span className="flex items-center gap-1">{label} <Star size={10} className="fill-s-amber text-s-amber" /></span>
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

          {/* Off-peak / Nebenzeiten */}
          <button
            onClick={() => setParam("off_peak", activeOffPeak === "true" ? null : "true")}
            className={[
              pillBase,
              "shrink-0 flex items-center gap-1.5",
              activeOffPeak === "true" ? pillActive : pillInactive,
            ].join(" ")}
          >
            <Tag className="w-3 h-3" />
            Nebenzeiten
          </button>

          <div className="w-px h-5 bg-s-sand/80 shrink-0" />

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className={[
                pillBase,
                "flex items-center gap-1.5",
                activeSort !== "rating" ? pillActive : pillInactive,
              ].join(" ")}
            >
              {SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? "Beliebteste"}
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute top-full right-0 mt-2 w-52 z-50 rounded-[20px] overflow-hidden py-1"
                style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px) saturate(1.3)",
                         WebkitBackdropFilter: "blur(24px) saturate(1.3)",
                         border: "1px solid rgba(255,255,255,.80)",
                         boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.90)" }}>
                {SORT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setParam("sort", value); setSortOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/70 hover:bg-s-coral/[0.06] hover:text-s-coral transition-colors"
                    aria-label={`Sortieren nach ${label}`}
                  >
                    {label}
                    {activeSort === value && <Check className="w-3.5 h-3.5 text-s-coral" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={() => router.replace(pathname, { scroll: false })}
              className="flex items-center gap-1 px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-coral border border-s-coral/30 bg-s-coral/5 hover:bg-s-coral/10 transition-all duration-200 shrink-0"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              Filter löschen
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
