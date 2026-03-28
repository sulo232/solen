"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Search,
  Scissors,
  ScissorsLineDashed,
  Sparkles,
  Droplets,
  Palette,
  Zap,
  Calendar,
  Loader2,
  MapPin,
} from "lucide-react";
import { getPersistedCity } from "@/lib/city-cookie";
import { CITY_SLUGS } from "@/lib/cities";
import SolenDatePicker from "@/components/ui/date-picker";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import type { SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Category definitions (matches HomePage CATEGORIES)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: { key: SalonCategory; label: string; Icon: typeof Scissors }[] = [
  { key: "coiffeur",   label: "Coiffeur",    Icon: Scissors },
  { key: "barbershop", label: "Barbershop",  Icon: ScissorsLineDashed },
  { key: "nails",      label: "Nails",       Icon: Sparkles },
  { key: "spa",        label: "Spa",         Icon: Droplets },
  { key: "makeup",     label: "Makeup",      Icon: Palette },
  { key: "waxing",     label: "Waxing",      Icon: Zap },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pill styles (matches FilterBar.tsx)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────

function dateValueToIso(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

const todayValue = today(getLocalTimeZone());

function tomorrowValue() {
  return todayValue.add({ days: 1 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeSearchBar() {
  const router = useRouter();
  const locale = useLocale();

  const [selectedDate, setSelectedDate] = useState<DateValue>(todayValue);
  const [selectedCategory, setSelectedCategory] = useState<SalonCategory | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [categoryHint, setCategoryHint] = useState(false);

  // Pre-fill city on mount
  useEffect(() => {
    setSelectedCity(getPersistedCity());
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const dateIso = dateValueToIso(selectedDate);
    let category = selectedCategory;

    // If no category selected but query exists, try to auto-detect
    if (!category && query.trim()) {
      setDetecting(true);
      try {
        const res = await fetch(
          `/api/search/detect-category?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.category) category = data.category;
        }
      } catch {
        // Detection failed
      } finally {
        setDetecting(false);
      }
    }

    if (!category && !query.trim()) {
      // Nothing search related, but they clicked search. Just highlight something visually or default.
      setCategoryHint(true);
      setTimeout(() => setCategoryHint(false), 2000);
      return;
    }

    const citySlug = selectedCity ?? "";
    const basePath = citySlug
      ? `/${locale}/${citySlug}/${category ?? "search"}`
      : `/${locale}/search`;

    const params = new URLSearchParams();
    if (dateIso !== dateValueToIso(todayValue)) params.set("date", dateIso);
    if (!category && query.trim()) params.set("q", encodeURIComponent(query.trim())); 

    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto" role="search" aria-label="Salon suchen">
      <div className="rounded-card overflow-hidden"
        style={{ background: "var(--glass-bg-strong)", backdropFilter: "blur(24px) saturate(1.3)",
                 WebkitBackdropFilter: "blur(24px) saturate(1.3)",
                 border: "1px solid var(--glass-bg-card)",
                 boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), var(--glass-shadow-inset)" }}>
        
        <div className="flex flex-col md:flex-row items-stretch">
          
          {/* Field 1: Service (Text Input) */}
          <div className="relative flex-1 min-w-0 border-b md:border-b-0 md:border-r border-s-ink/[0.06] flex items-center bg-transparent transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus-within:bg-black/5 dark:focus-within:bg-white/5">
            <Search size={18} className="absolute left-5 text-s-ink/40" aria-hidden="true" />
            <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedCategory(null); }}
              placeholder="Welchen Service suchst du?" aria-label="Service suchen"
              className={`w-full py-5 md:py-6 pl-12 pr-4 text-sm md:text-[15px] font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/40 dark:placeholder:text-s-dm-text/40 bg-transparent focus:outline-none ${categoryHint ? "ring-2 ring-s-coral/30 ring-inset" : ""}`} />
            
            {/* If they type something that maps exactly, show pill? For now just keep input */}
          </div>

          {/* Field 2: City Dropdown */}
          <div className="relative md:w-48 xl:w-56 shrink-0 border-b md:border-b-0 md:border-r border-s-ink/[0.06] flex items-center group transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus-within:bg-black/5 dark:focus-within:bg-white/5 cursor-pointer">
            <MapPin size={18} className="absolute left-5 text-s-ink/40" aria-hidden="true" />
            <select
              value={selectedCity || ""}
              onChange={(e) => setSelectedCity(e.target.value || null)}
              className="w-full h-full py-5 md:py-6 pl-12 pr-8 text-sm md:text-[15px] font-body font-medium text-s-ink dark:text-s-dm-text bg-transparent appearance-none focus:outline-none cursor-pointer"
              aria-label="Stadt wählen"
            >
              <option value="" className="text-black">Ganze Schweiz</option>
              {CITY_SLUGS.map((slug: string) => (
                <option key={slug} value={slug} className="text-black">
                  {slug.charAt(0).toUpperCase() + slug.slice(1)}
                </option>
              ))}
            </select>
            <div className="absolute right-5 pointer-events-none text-s-ink/40">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Field 3: Date Picker & Submit */}
          <div className="relative md:w-64 xl:w-72 shrink-0 flex items-center justify-between pl-2 pr-2 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus-within:bg-black/5 dark:focus-within:bg-white/5">
            <div className="flex-1 flex items-center">
              <SolenDatePicker 
                label="" 
                value={selectedDate} 
                onChange={setSelectedDate} 
                minValue={todayValue} 
                className="[&_label]:hidden w-full [&_button]:w-full [&_button]:border-none [&_button]:shadow-none [&_button]:bg-transparent [&_button]:text-s-ink dark:[&_button]:text-s-dm-text [&_button]:text-sm md:[&_button]:text-[15px] [&_button]:font-medium [&>div]:w-full" 
              />
            </div>
            
            {/* Submit Button */}
            <button type="submit" disabled={detecting}
              className="shrink-0 ml-2 px-6 py-3 md:py-4 rounded-[10px] bg-s-coral text-white font-heading font-bold text-sm md:text-[15px] uppercase tracking-[.04em] flex items-center justify-center gap-2 shadow-coral-glow hover:brightness-[1.06] hover:shadow-coral-glow-hover transition-all disabled:opacity-60 min-w-[100px] h-[44px] md:h-[48px]">
              {detecting ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} aria-hidden="true" />}
              <span className="hidden sm:inline">{detecting ? "Suche..." : "Suchen"}</span>
            </button>
          </div>

        </div>
      </div>
      
      {/* Category hint text */}
      {categoryHint && (
        <p className="text-xs text-s-coral font-body font-medium mt-3 text-center animate-pulse">
          Bitte gib einen Service ein
        </p>
      )}
    </form>
  );
}
