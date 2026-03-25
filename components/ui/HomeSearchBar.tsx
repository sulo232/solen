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
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto" role="search" aria-label="Salon suchen">

      {/* ── Main segmented bar ── */}
      <div className="rounded-search overflow-x-hidden sm:overflow-hidden"
        style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px) saturate(1.3)",
                 WebkitBackdropFilter: "blur(24px) saturate(1.3)",
                 border: "1px solid rgba(255,255,255,.80)",
                 boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.90)" }}>

        {/* Row: dates + categories side by side on lg, stacked on sm */}
        <div className="flex flex-col lg:flex-row">
          {/* Segment 1: Date */}
          <div className="flex items-center gap-2 px-5 py-4 lg:border-r border-b lg:border-b-0 border-s-ink/[0.06] flex-wrap">
            <Calendar size={14} className="text-s-ink/35 shrink-0" aria-hidden="true" />
            <button type="button" onClick={() => handleDateChip("today")}
              className={[pillBase, activeDateChip === "today" ? pillActive : pillInactive].join(" ")}>Heute</button>
            <button type="button" onClick={() => handleDateChip("tomorrow")}
              className={[pillBase, activeDateChip === "tomorrow" ? pillActive : pillInactive].join(" ")}>Morgen</button>
            <SolenDatePicker label="" value={selectedDate} onChange={handleCustomDate} minValue={todayValue} className="[&_label]:hidden" />
          </div>

          {/* Segment 2: Categories */}
          <div className={`flex items-center gap-1.5 px-5 py-4 overflow-x-auto no-scrollbar border-b lg:border-b-0 border-s-ink/[0.06] flex-1 ${categoryHint ? "ring-2 ring-s-coral/30 ring-inset" : ""}`}>
            {CATEGORIES.map(({ key, label, Icon }) => (
              <button key={key} type="button"
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                className={[pillBase, selectedCategory === key ? pillActive : pillInactive].join(" ")}
                aria-pressed={selectedCategory === key} aria-label={`Kategorie ${label}`}>
                <Icon size={13} aria-hidden="true" />{label}
              </button>
            ))}
          </div>

          {/* Segment 3: Text input + Search button inline */}
          <div className="relative flex items-stretch">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-s-ink/30" aria-hidden="true"/>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Service oder Salon…" aria-label="Service oder Salon suchen" id="tour-search"
              className="w-full lg:w-56 py-4 pl-10 pr-2 text-sm font-body text-s-ink placeholder:text-s-ink/35 bg-transparent focus:outline-none border-b lg:border-b-0 border-s-ink/[0.06]" />

            {/* Submit — nested inside bar */}
            <button type="submit" disabled={detecting}
              className="shrink-0 m-2 px-5 py-3 rounded-input bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.04em] flex items-center gap-1.5 shadow-coral-glow hover:brightness-[1.06] hover:shadow-coral-glow-hover transition-all disabled:opacity-60">
              {detecting ? <Loader2 size={14} className="animate-spin" /> : <Search size={13} aria-hidden="true" />}
              {detecting ? "…" : "Suchen"}
            </button>
          </div>
        </div>
      </div>

      {/* Category hint text */}
      {categoryHint && (
        <p className="text-xs text-s-coral font-body font-medium mt-2 text-center animate-pulse">
          Bitte wähle eine Kategorie
        </p>
      )}
    </form>
  );
}
