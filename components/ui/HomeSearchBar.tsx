"use client";

import { useState, FormEvent } from "react";
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
} from "lucide-react";
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
  "px-3 py-1.5 rounded-pill text-xs font-body font-medium whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5";
const pillActive =
  "bg-s-coral text-white border-s-coral shadow-warm-sm";
const pillInactive =
  "bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm text-s-ink/70 dark:text-s-dm-text/70 border-white/60 dark:border-white/10 hover:border-s-coral/50 hover:bg-white/90 dark:hover:bg-s-dm-raised/90 shadow-warm-sm";

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
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [categoryHint, setCategoryHint] = useState(false);

  // Quick date chips
  const [activeDateChip, setActiveDateChip] = useState<"today" | "tomorrow" | "custom">("today");

  const handleDateChip = (chip: "today" | "tomorrow") => {
    setActiveDateChip(chip);
    setSelectedDate(chip === "today" ? todayValue : tomorrowValue());
  };

  const handleCustomDate = (d: DateValue) => {
    setActiveDateChip("custom");
    setSelectedDate(d);
  };

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
        // Detection failed — leave category null
      } finally {
        setDetecting(false);
      }
    }

    // If still no category: require user to pick one
    if (!category) {
      // Briefly highlight the category pills to draw attention
      setCategoryHint(true);
      setTimeout(() => setCategoryHint(false), 2000);
      return;
    }

    const params = new URLSearchParams();
    params.set("date", dateIso);
    if (query.trim()) params.set("q", encodeURIComponent(query.trim()));

    router.push(`/${locale}/${category}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
      role="search"
      aria-label="Salon suchen"
    >
      {/* Main search card */}
      <div className="bg-white/90 dark:bg-s-dm-surface/90 backdrop-blur-sm rounded-card shadow-card border border-s-ink/5 dark:border-white/10 p-4 space-y-4">

        {/* Row 1: Date section */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={16} className="text-s-ink/40 dark:text-s-dm-text/40 shrink-0" aria-hidden="true" />
          <button
            type="button"
            onClick={() => handleDateChip("today")}
            className={[pillBase, activeDateChip === "today" ? pillActive : pillInactive].join(" ")}
          >
            Heute
          </button>
          <button
            type="button"
            onClick={() => handleDateChip("tomorrow")}
            className={[pillBase, activeDateChip === "tomorrow" ? pillActive : pillInactive].join(" ")}
          >
            Morgen
          </button>
          <div className="shrink-0">
            <SolenDatePicker
              label=""
              value={selectedDate}
              onChange={handleCustomDate}
              minValue={todayValue}
              className="[&_label]:hidden"
            />
          </div>
        </div>

        {/* Row 2: Category pills */}
        {categoryHint && (
          <p className="text-xs text-s-coral font-body font-medium -mb-2 animate-pulse">
            Bitte wähle eine Kategorie
          </p>
        )}
        <div className={`flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 ${categoryHint ? "ring-2 ring-s-coral/30 rounded-pill p-1 -m-1" : ""}`}>
          {CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={[
                pillBase,
                selectedCategory === key ? pillActive : pillInactive,
              ].join(" ")}
              aria-pressed={selectedCategory === key}
              aria-label={`Kategorie ${label} ${selectedCategory === key ? "entfernen" : "wählen"}`}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* Row 3: Search input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Service, Stil oder Salon suchen…"
            aria-label="Service, Stil oder Salon suchen"
            id="tour-search"
            className="w-full rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg py-3 pl-10 pr-4 text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/40 dark:placeholder:text-s-dm-text/40 border border-s-ink/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-s-coral/30 focus:border-s-coral/30 transition-shadow duration-200"
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={detecting}
        className="mt-4 w-full sm:w-auto sm:mx-auto sm:flex sm:px-10 justify-center items-center gap-2 py-3 px-6 rounded-pill bg-s-coral hover:bg-s-coral-hover text-white font-heading font-semibold text-sm shadow-warm-sm hover:shadow-warm-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex"
      >
        {detecting ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Erkennung…
          </>
        ) : (
          <>
            <Search size={16} aria-hidden="true" />
            Suchen
          </>
        )}
      </button>
    </form>
  );
}
