"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, Loader2, MapPin } from "lucide-react";
import { getPersistedCity } from "@/lib/city-cookie";
import { CITY_SLUGS } from "@/lib/cities";
import SolenDatePicker from "@/components/ui/date-picker";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import type { SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────

function dateValueToIso(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

const todayValue = today(getLocalTimeZone());

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeSearchBar() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("home.search");

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <form onSubmit={handleSubmit} className="w-full" role="search" aria-label={t("formLabel")}>
      {/* Unified pill capsule — Airbnb-style single bar */}
      <div
        className="flex items-center bg-white overflow-hidden"
        style={{
          borderRadius: "50px",
          border: "1px solid rgba(26,18,9,0.10)",
          boxShadow: "0 2px 8px rgba(26,18,9,0.07), 0 1px 2px rgba(26,18,9,0.04)",
        }}
      >
        {/* Field 1: Service input */}
        <div className="relative flex-1 min-w-0 flex items-center">
          <Search size={16} className="absolute left-5 text-s-ink/35 pointer-events-none shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedCategory(null); }}
            placeholder={t("servicePlaceholder")}
            aria-label={t("servicePlaceholder")}
            className={`w-full py-4 pl-11 pr-3 text-[14px] font-body text-s-ink placeholder:text-s-ink/35 bg-transparent focus:outline-none ${categoryHint ? "placeholder:text-s-coral/60" : ""}`}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-s-ink/[0.10] shrink-0" aria-hidden="true" />

        {/* Field 2: City dropdown */}
        <div className="relative w-36 shrink-0 flex items-center">
          <MapPin size={14} className="absolute left-4 text-s-ink/35 pointer-events-none" aria-hidden="true" />
          <select
            value={selectedCity || ""}
            onChange={(e) => setSelectedCity(e.target.value || null)}
            className="w-full py-4 pl-9 pr-6 text-[14px] font-body font-medium text-s-ink bg-transparent appearance-none focus:outline-none cursor-pointer"
            aria-label={t("cityLabel")}
          >
            <option value="" className="text-s-ink">{t("allSwitzerland")}</option>
            {CITY_SLUGS.map((slug: string) => (
              <option key={slug} value={slug} className="text-s-ink">
                {slug.charAt(0).toUpperCase() + slug.slice(1)}
              </option>
            ))}
          </select>
          <div className="absolute right-2 pointer-events-none text-s-ink/35">
            <svg width="9" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-s-ink/[0.10] shrink-0 hidden md:block" aria-hidden="true" />

        {/* Field 3: Date picker (desktop only) */}
        <div className="hidden md:flex items-center w-44 shrink-0 pl-1 pr-2">
          <SolenDatePicker
            label=""
            value={selectedDate}
            onChange={setSelectedDate}
            minValue={todayValue}
            locale={locale === "de" || locale === "de-CH" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "de-CH"}
            className="[&_label]:hidden w-full [&>div]:w-full [&>div]:border-none [&>div]:shadow-none [&>div]:bg-transparent [&>div]:rounded-none [&>div]:px-2 [&>div]:py-4 [&_span]:text-[14px] [&_span]:font-body [&_span]:font-medium"
          />
        </div>

        {/* Submit button — coral pill inside the capsule */}
        <div className="p-1.5 shrink-0">
          <button
            type="submit"
            disabled={detecting}
            aria-label={detecting ? t("searching") : t("search")}
            className="flex items-center gap-2 px-5 py-3 rounded-[40px] bg-s-coral text-white font-heading font-bold text-[13px] uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-60 whitespace-nowrap"
            style={{ boxShadow: "0 2px 6px rgba(232,98,74,.30), 0 4px 14px rgba(232,98,74,.18)" }}
          >
            {detecting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} aria-hidden="true" />}
            <span className="hidden sm:inline">{detecting ? t("searching") : t("search")}</span>
          </button>
        </div>
      </div>

      {/* Category hint text */}
      {categoryHint && (
        <p className="text-xs text-s-coral font-body font-medium mt-3 animate-pulse">
          {t("categoryHint")}
        </p>
      )}
    </form>
  );
}
