# Search Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current centered-dropdown search panel with an Airbnb-style bottom sheet that slides up from the bottom, reorders steps to Was→Wo→Wann, shows category as a vertical list, collapses completed steps, and shows a 3-segment trigger pill (Was·Wo·Wann) on the homepage plus a compact pill in the sticky nav.

**Architecture:** Rewrite `GuidedSearch.tsx` in-place (keep file, replace implementation). The trigger pill and bottom sheet live together in the component. The Header dispatches a `CustomEvent("openSearchSheet")` to open it externally — no prop drilling. All data utilities (`lib/guided-search-data.ts`, `lib/cities.ts`) stay untouched.

**Tech Stack:** Next.js App Router, TypeScript, Framer Motion (`framer-motion`), `next-intl`, Lucide icons, Tailwind CSS with solen V5 design tokens.

---

## Context

**Current state of `GuidedSearch.tsx`:**
- 506 lines, 4 steps: Wo(city) → Was(category grid 3-col) → Service list → Wann(date)
- Opens as a centered panel on desktop / fullscreen on mobile (NOT a bottom sheet)
- Single search-bar trigger (not 3-segment pill)

**What changes:**
- Layout → bottom sheet (slides up from bottom)
- Step order → Was(1) → Wo(2) → Wann(3) [3 steps, not 4]
- Was step → vertical category list + service drill-down in same step
- Completed steps → collapse to label + "Ändern" link
- Trigger → 3-segment pill (Was · Wo · Wann · [🔍 button])
- Header → compact pill visible when `scrolled === true`

**What stays the same:**
- `lib/guided-search-data.ts` — CATEGORY_SERVICES, DATE_QUICK_PICKS, getLocalizedLabel, datePickToParam
- `lib/cities.ts` — CITIES, CITY_SLUGS, CitySlug
- `lib/city-cookie.ts` — getPersistedCity
- Navigation logic (router.push to `/${locale}/${city}/${category}`)
- `app/[locale]/search/page.tsx` — search results page unchanged

**Pre-existing TS error** in `app/[locale]/referral/[code]/page.ts` — ignore throughout.

---

## File Map

| File | Action | Task |
|---|---|---|
| `components/ui/GuidedSearch.tsx` | Full rewrite | 1 |
| `components/HomePage.tsx` | Remove old pill container, no other changes needed (GuidedSearch renders its own pill) | 1 |
| `components/layout/Header.tsx` | Add compact search pill inside `scrolled` state | 2 |
| `messages/de.json` | Add/update `home.guidedSearch` keys | 3 |
| `messages/en.json` | Add/update `home.guidedSearch` keys | 3 |
| `messages/fr.json` | Add/update `home.guidedSearch` keys | 3 |
| `messages/it.json` | Add/update `home.guidedSearch` keys | 3 |

---

## Task 1: Rewrite GuidedSearch.tsx — bottom sheet + 3-segment pill

**Files:**
- Modify: `components/ui/GuidedSearch.tsx` (full rewrite)
- Modify: `components/HomePage.tsx` (verify GuidedSearch wrapper div width only)

### Before you start — read current code

- [ ] **Step 1: Read the current file**

```bash
cat components/ui/GuidedSearch.tsx
```

Keep note of: how `navigate()` builds the URL, how `getPersistedCity()` is used, the existing framer-motion import, the `CATEGORY_SERVICES` import path.

- [ ] **Step 2: Read the HomePage mounting context**

```bash
grep -n "GuidedSearch\|max-w\|mt-6" components/HomePage.tsx | head -20
```

The GuidedSearch is mounted inside a `<div className="mt-6 w-full max-w-2xl">`. That wrapper is fine — leave it.

### Replace GuidedSearch.tsx

- [ ] **Step 3: Write the new GuidedSearch.tsx**

Replace the entire file with:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronLeft, MapPin, Check } from "lucide-react";
import {
  CATEGORY_SERVICES,
  DATE_QUICK_PICKS,
  getLocalizedLabel,
  datePickToParam,
} from "@/lib/guided-search-data";
import { CITIES, CITY_SLUGS, type CitySlug } from "@/lib/cities";
import { getPersistedCity } from "@/lib/city-cookie";
import type { SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types & static data
// ─────────────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type TimeKey = "any" | "morning" | "afternoon" | "evening";

const CATEGORY_LIST: {
  key: SalonCategory;
  icon: string;
  subDe: string;
  subEn: string;
  subFr: string;
  subIt: string;
}[] = [
  { key: "coiffeur",   icon: "✂️", subDe: "Haarschnitt, Farbe, Styling",  subEn: "Haircut, Color, Styling",   subFr: "Coupe, Couleur, Coiffage",   subIt: "Taglio, Colore, Styling" },
  { key: "barbershop", icon: "💈", subDe: "Haarschnitt, Bart, Rasur",      subEn: "Haircut, Beard, Shave",     subFr: "Coupe, Barbe, Rasage",       subIt: "Taglio, Barba, Rasatura" },
  { key: "nails",      icon: "💅", subDe: "Maniküre, Gel, Acryl",          subEn: "Manicure, Gel, Acrylic",    subFr: "Manucure, Gel, Acrylique",   subIt: "Manicure, Gel, Acrilico" },
  { key: "spa",        icon: "🌿", subDe: "Massage, Gesichtsbehandlung",   subEn: "Massage, Facial",           subFr: "Massage, Soin du visage",    subIt: "Massaggio, Trattamento viso" },
  { key: "makeup",     icon: "💄", subDe: "Make-up, Schminken",            subEn: "Makeup, Beauty",            subFr: "Maquillage, Beauté",         subIt: "Trucco, Bellezza" },
  { key: "waxing",     icon: "🪡", subDe: "Haarentfernung",                subEn: "Hair Removal",              subFr: "Épilation",                  subIt: "Epilazione" },
];

const TIME_KEYS: TimeKey[] = ["any", "morning", "afternoon", "evening"];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function GuidedSearch() {
  const router = useRouter();
  const locale = useLocale();
  const t      = useTranslations("home.guidedSearch");
  const tNav   = useTranslations("navigation");

  const [isOpen,       setIsOpen]       = useState(false);
  const [step,         setStep]         = useState<Step>(1);
  const [city,         setCity]         = useState<CitySlug | null>(null);
  const [category,     setCategory]     = useState<SalonCategory | null>(null);
  const [service,      setService]      = useState<string | null>(null);
  const [dateKey,      setDateKey]      = useState<string>("any");
  const [timeKey,      setTimeKey]      = useState<TimeKey>("any");
  const [query,        setQuery]        = useState("");
  const [showServices, setShowServices] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill city from localStorage → cookie → default Basel
  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("solen_last_city") ?? getPersistedCity()
      : null;
    setCity((stored as CitySlug | null) ?? "basel");
  }, []);

  // Listen for external open events dispatched by Header compact pill
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ step?: number }>;
      setStep((ev.detail?.step as Step) ?? 1);
      setShowServices(false);
      setIsOpen(true);
    };
    window.addEventListener("openSearchSheet", handler);
    return () => window.removeEventListener("openSearchSheet", handler);
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Focus input when step 1 opens
  useEffect(() => {
    if (isOpen && step === 1) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen, step]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const open = (openStep: Step = 1) => {
    setStep(openStep);
    setShowServices(false);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const reset = () => {
    setCategory(null);
    setService(null);
    setDateKey("any");
    setTimeKey("any");
    setQuery("");
    setShowServices(false);
  };

  const getCityLabel = (slug: CitySlug) => {
    const c = CITIES[slug];
    return locale === "en" ? c.name_en
      : locale === "fr" ? c.name_fr
      : locale === "it" ? c.name_it
      : c.name_de;
  };

  const getCatSub = (cat: typeof CATEGORY_LIST[0]) => {
    if (locale === "en") return cat.subEn;
    if (locale === "fr") return cat.subFr;
    if (locale === "it") return cat.subIt;
    return cat.subDe;
  };

  const navigate = () => {
    let basePath: string;
    if (city && category)    basePath = `/${locale}/${city}/${category}`;
    else if (category)       basePath = `/${locale}/${category}`;
    else                     basePath = `/${locale}/search`;

    const params = new URLSearchParams();
    if (service)                           params.set("q", service);
    else if (!category && query.trim())    params.set("q", encodeURIComponent(query.trim()));
    const dateParam = dateKey !== "any" ? datePickToParam(dateKey) : null;
    if (dateParam)                         params.set("date", dateParam);
    if (timeKey !== "any")                 params.set("time", timeKey);

    if (city) localStorage.setItem("solen_last_city", city);

    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    close();
  };

  const selectCategory = (cat: SalonCategory) => {
    setCategory(cat);
    setService(null);
    setShowServices(true);
  };

  const selectService = (svc: string | null) => {
    setService(svc);
    setShowServices(false);
    setStep(2); // auto-advance to Wo
  };

  const selectCity = (c: CitySlug | null) => {
    setCity(c);
    setTimeout(() => setStep(3), 150); // brief delay so selected state is visible
  };

  // ── Derived display values for the trigger pill ────────────────────────────
  const wasLabel  = category ? tNav(category as string) : null;
  const woLabel   = city ? getCityLabel(city) : "Basel";
  const wannLabel = dateKey !== "any"
    ? DATE_QUICK_PICKS.find(p => p.key === dateKey)
      ? getLocalizedLabel(DATE_QUICK_PICKS.find(p => p.key === dateKey)!, locale)
      : t("wannDefault")
    : t("wannDefault");

  const services = category ? (CATEGORY_SERVICES[category] ?? []) : [];

  // ── Pill segment motion ────────────────────────────────────────────────────
  const stepDot = (s: Step) => ({
    width:      s === step ? 20 : 6,
    background: s === step ? "#E8624A" : s < step ? "#1A1209" : "#E0E0E0",
  });

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="w-full relative">
      {/* ════════════════════════════════════════════════════════════════════
          3-SEGMENT TRIGGER PILL
          ════════════════════════════════════════════════════════════════════ */}
      <div
        className="w-full flex items-center bg-white dark:bg-s-dm-raised"
        style={{
          borderRadius: "999px",
          border: "1px solid rgba(26,18,9,0.10)",
          boxShadow: "0 2px 12px rgba(26,18,9,0.10), 0 1px 4px rgba(26,18,9,0.04)",
          height: "56px",
        }}
        role="search"
      >
        {/* Was segment */}
        <button
          onClick={() => open(1)}
          aria-label={t("openWas")}
          className="flex-1 flex flex-col justify-center px-4 py-2 rounded-l-full hover:bg-s-ink/[0.03] dark:hover:bg-white/[0.03] transition-colors min-w-0"
        >
          <span className="text-[9px] font-heading font-bold uppercase tracking-[.07em] text-s-ink dark:text-s-dm-text">
            {t("segWas")}
          </span>
          <span className={`text-[12px] font-body truncate ${wasLabel ? "font-semibold text-s-ink dark:text-s-dm-text" : "text-s-ink/40 dark:text-s-dm-text/40"}`}>
            {wasLabel ?? t("segWasPlaceholder")}
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-s-ink/10 dark:bg-white/10 shrink-0" aria-hidden="true" />

        {/* Wo segment */}
        <button
          onClick={() => open(2)}
          aria-label={t("openWo")}
          className="flex-1 flex flex-col justify-center px-4 py-2 hover:bg-s-ink/[0.03] dark:hover:bg-white/[0.03] transition-colors min-w-0"
        >
          <span className="text-[9px] font-heading font-bold uppercase tracking-[.07em] text-s-ink dark:text-s-dm-text">
            {t("segWo")}
          </span>
          <span className="text-[12px] font-body font-semibold text-s-ink dark:text-s-dm-text truncate">
            {woLabel}
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-s-ink/10 dark:bg-white/10 shrink-0" aria-hidden="true" />

        {/* Wann segment */}
        <button
          onClick={() => open(3)}
          aria-label={t("openWann")}
          className="flex-1 flex flex-col justify-center px-4 py-2 hover:bg-s-ink/[0.03] dark:hover:bg-white/[0.03] transition-colors min-w-0"
        >
          <span className="text-[9px] font-heading font-bold uppercase tracking-[.07em] text-s-ink dark:text-s-dm-text">
            {t("segWann")}
          </span>
          <span className={`text-[12px] font-body truncate ${dateKey !== "any" ? "font-semibold text-s-ink dark:text-s-dm-text" : "text-s-ink/40 dark:text-s-dm-text/40"}`}>
            {wannLabel}
          </span>
        </button>

        {/* Search button */}
        <button
          onClick={() => (category || query.trim()) ? navigate() : open(1)}
          aria-label={t("showResults")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-s-coral hover:brightness-[1.06] active:scale-[0.96] transition-[transform,filter] duration-150 mx-2 shrink-0"
          style={{ boxShadow: "0 2px 8px rgba(232,98,74,.30)" }}
        >
          <Search size={16} className="text-white" aria-hidden="true" />
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          BOTTOM SHEET MODAL
          ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="gs-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40"
              style={{ backdropFilter: "blur(2px)" }}
              onClick={close}
              aria-hidden="true"
            />

            {/* Sheet */}
            <motion.div
              key="gs-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t("openCta")}
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
              exit={{ y: "100%", transition: { duration: 0.24, ease: "easeIn" } }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-s-dm-surface flex flex-col"
              style={{
                borderRadius: "24px 24px 0 0",
                maxHeight: "88svh",
                boxShadow: "0 -4px 32px rgba(0,0,0,.12)",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-0 shrink-0">
                <div className="w-9 h-1 rounded-full bg-s-ink/15 dark:bg-white/15" aria-hidden="true" />
              </div>

              {/* Step progress dots */}
              <div className="flex items-center justify-center gap-2 pt-3 pb-2 shrink-0" aria-hidden="true">
                {([1, 2, 3] as Step[]).map((s) => (
                  <motion.div
                    key={s}
                    animate={stepDot(s)}
                    transition={{ duration: 0.2 }}
                    className="h-1.5 rounded-full"
                  />
                ))}
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-6">

                  {/* ── Collapsed Was row (step 2+3) ── */}
                  {step > 1 && (
                    <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0] dark:border-white/[0.07]">
                      <div>
                        <div className="text-[10px] font-heading font-bold uppercase tracking-[.07em] text-s-ink/40 dark:text-s-dm-text/40">
                          {t("segWas")}
                        </div>
                        <div className="font-heading font-bold text-[13px] text-s-ink dark:text-s-dm-text">
                          {category ? tNav(category as string) : t("segWasPlaceholder")}
                          {service ? ` · ${service}` : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => { setStep(1); setShowServices(false); }}
                        className="text-[11px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 underline underline-offset-2 hover:text-s-ink dark:hover:text-s-dm-text transition-colors ml-4"
                      >
                        {t("change")}
                      </button>
                    </div>
                  )}

                  {/* ── Collapsed Wo row (step 3) ── */}
                  {step > 2 && (
                    <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0] dark:border-white/[0.07]">
                      <div>
                        <div className="text-[10px] font-heading font-bold uppercase tracking-[.07em] text-s-ink/40 dark:text-s-dm-text/40">
                          {t("segWo")}
                        </div>
                        <div className="font-heading font-bold text-[13px] text-s-ink dark:text-s-dm-text">
                          {city ? getCityLabel(city) : t("steps.where.allSwitzerland")}
                        </div>
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="text-[11px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 underline underline-offset-2 hover:text-s-ink dark:hover:text-s-dm-text transition-colors ml-4"
                      >
                        {t("change")}
                      </button>
                    </div>
                  )}

                  {/* ═══ STEP 1: WAS ════════════════════════════════════════ */}
                  <AnimatePresence mode="wait" initial={false}>
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mt-4 mb-3">
                          {t("steps.was.title")}
                        </p>

                        {/* Text search input */}
                        <div
                          className="relative flex items-center mb-4 transition-[border-color]"
                          style={{ border: "1.5px solid #E8E8E8", borderRadius: "12px" }}
                          ref={(el) => {
                            // Handled via onFocus/onBlur inline below
                            void el;
                          }}
                        >
                          <Search size={15} className="absolute left-3.5 text-s-ink/35 dark:text-s-dm-text/35 shrink-0 pointer-events-none" aria-hidden="true" />
                          <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && navigate()}
                            onFocus={(e) => { (e.currentTarget.parentElement as HTMLDivElement).style.borderColor = "#E8624A"; }}
                            onBlur={(e)  => { (e.currentTarget.parentElement as HTMLDivElement).style.borderColor = "#E8E8E8"; }}
                            placeholder={t("steps.was.searchPlaceholder")}
                            aria-label={t("steps.was.searchPlaceholder")}
                            className="w-full pl-10 pr-4 py-3 text-[13px] font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/35 dark:placeholder:text-s-dm-text/40 bg-transparent focus:outline-none"
                          />
                          {query && (
                            <button
                              onClick={() => setQuery("")}
                              aria-label={t("reset")}
                              className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full bg-s-ink/10 hover:bg-s-ink/20 transition-colors"
                            >
                              <X size={10} className="text-s-ink dark:text-s-dm-text" />
                            </button>
                          )}
                        </div>

                        {/* Back to categories link (when drilling into services) */}
                        {showServices && (
                          <button
                            onClick={() => setShowServices(false)}
                            className="flex items-center gap-1.5 text-[12px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors mb-3"
                          >
                            <ChevronLeft size={14} aria-hidden="true" />
                            {t("steps.was.backToCategories")}
                          </button>
                        )}

                        {/* Category list OR service drill-down */}
                        {!showServices ? (
                          <div className="pb-2">
                            {/* Skip / Alle Services */}
                            <button
                              onClick={() => selectService(null)}
                              className="w-full flex items-center gap-3 py-3.5 border-t border-[#F5F5F5] dark:border-white/[0.06] text-left hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base bg-s-ink/[0.05] dark:bg-white/[0.05] shrink-0" aria-hidden="true">✨</div>
                              <div>
                                <div className="font-heading font-bold text-[14px] text-s-ink dark:text-s-dm-text">{t("steps.was.skip")}</div>
                                <div className="text-[12px] text-s-ink/50 dark:text-s-dm-text/50">{t("steps.was.skipSub")}</div>
                              </div>
                            </button>
                            {CATEGORY_LIST.map((cat) => (
                              <button
                                key={cat.key}
                                onClick={() => selectCategory(cat.key)}
                                aria-label={tNav(cat.key as string)}
                                className={`w-full flex items-center gap-3 py-3.5 border-t border-[#F5F5F5] dark:border-white/[0.06] text-left transition-colors ${
                                  category === cat.key
                                    ? "bg-s-coral/[0.04] dark:bg-s-coral/[0.08]"
                                    : "hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02]"
                                }`}
                              >
                                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base bg-s-coral/[0.08] shrink-0" aria-hidden="true">
                                  {cat.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-heading font-bold text-[14px] text-s-ink dark:text-s-dm-text">
                                    {tNav(cat.key as string)}
                                  </div>
                                  <div className="text-[12px] text-s-ink/50 dark:text-s-dm-text/50 truncate">
                                    {getCatSub(cat)}
                                  </div>
                                </div>
                                {category === cat.key && (
                                  <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          /* Service drill-down */
                          <div className="pb-2">
                            {/* Skip: Egal */}
                            <button
                              onClick={() => selectService(null)}
                              className="w-full flex items-center gap-3 py-3.5 border-t border-[#F5F5F5] dark:border-white/[0.06] text-left hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="flex-1 font-body text-[14px] text-s-ink/50 dark:text-s-dm-text/50 italic">
                                {t("steps.service.skip")}
                              </div>
                              {service === null && <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />}
                            </button>
                            {services.map((svc) => {
                              const label = getLocalizedLabel(svc, locale);
                              return (
                                <button
                                  key={svc.key}
                                  onClick={() => selectService(svc.key)}
                                  aria-label={label}
                                  className={`w-full flex items-center gap-3 py-3.5 border-t border-[#F5F5F5] dark:border-white/[0.06] text-left transition-colors ${
                                    service === svc.key
                                      ? "bg-s-coral/[0.04] dark:bg-s-coral/[0.08]"
                                      : "hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02]"
                                  }`}
                                >
                                  <div className="flex-1 font-body font-medium text-[14px] text-s-ink dark:text-s-dm-text">{label}</div>
                                  {service === svc.key && (
                                    <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Skip step link */}
                        <div className="flex justify-center py-3">
                          <button
                            onClick={() => setStep(2)}
                            className="text-[12px] font-body text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
                          >
                            {t("skipStep")} →
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ═══ STEP 2: WO ══════════════════════════════════════ */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mt-4 mb-2">
                          {t("steps.where.title")}
                        </p>
                        <p className="font-heading font-bold text-[18px] text-s-ink dark:text-s-dm-text mb-4">
                          {t("steps.where.subtitle")}
                        </p>

                        {/* Ganze Schweiz */}
                        <button
                          onClick={() => selectCity(null)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-card border mb-3 transition-all duration-200 ${
                            city === null
                              ? "border-s-coral bg-s-coral/[0.05] dark:bg-s-coral/[0.08]"
                              : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-ink/20 dark:hover:border-white/20"
                          }`}
                        >
                          <span className="text-[20px]" aria-hidden="true">🇨🇭</span>
                          <span className="flex-1 text-left text-[14px] font-body font-medium text-s-ink dark:text-s-dm-text">
                            {t("steps.where.allSwitzerland")}
                          </span>
                          <span className="text-[11px] font-body text-s-ink/40 dark:text-s-dm-text/40">
                            {t("steps.where.allSub")}
                          </span>
                          {city === null && <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />}
                        </button>

                        {/* City cards */}
                        <div className="grid grid-cols-3 gap-2 pb-6">
                          {CITY_SLUGS.map((slug) => (
                            <button
                              key={slug}
                              onClick={() => selectCity(slug)}
                              aria-label={getCityLabel(slug)}
                              className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-card border transition-all duration-200 ${
                                city === slug
                                  ? "border-s-coral bg-s-coral/[0.05] dark:bg-s-coral/[0.08]"
                                  : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-ink/20 dark:hover:border-white/20"
                              }`}
                              style={{ minHeight: "80px" }}
                            >
                              <MapPin
                                size={20}
                                className={city === slug ? "text-s-coral" : "text-s-ink/40 dark:text-s-dm-text/40"}
                                aria-hidden="true"
                              />
                              <span className="text-[13px] font-body font-medium text-s-ink dark:text-s-dm-text">
                                {getCityLabel(slug)}
                              </span>
                              {city === slug && (
                                <div className="w-1.5 h-1.5 rounded-full bg-s-coral" aria-hidden="true" />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ═══ STEP 3: WANN ════════════════════════════════════ */}
                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mt-4 mb-2">
                          {t("steps.wann.title")}
                        </p>
                        <p className="font-heading font-bold text-[18px] text-s-ink dark:text-s-dm-text mb-4">
                          {t("steps.wann.subtitle")}
                        </p>

                        {/* Date quick-pick pills */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {DATE_QUICK_PICKS.map((pick) => {
                            const label = getLocalizedLabel(pick, locale);
                            const isSelected = dateKey === pick.key;
                            return (
                              <button
                                key={pick.key}
                                onClick={() => setDateKey(pick.key)}
                                aria-label={label}
                                aria-pressed={isSelected}
                                className="px-[18px] py-2.5 rounded-pill text-[13px] font-heading font-semibold transition-all duration-150"
                                style={{
                                  border:     `1.5px solid ${isSelected ? "#1A1209" : "#E8E8E8"}`,
                                  background: isSelected ? "#1A1209" : "#FFFFFF",
                                  color:      isSelected ? "#FFFFFF" : "#1A1209",
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Time of day */}
                        <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                          {t("steps.wann.timeLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2 pb-6">
                          {TIME_KEYS.map((key) => {
                            const isSelected = timeKey === key;
                            return (
                              <button
                                key={key}
                                onClick={() => setTimeKey(key)}
                                aria-label={t(`steps.date.time.${key}`)}
                                aria-pressed={isSelected}
                                className="px-[18px] py-2.5 rounded-pill text-[13px] font-heading font-semibold transition-all duration-150"
                                style={{
                                  border:     `1.5px solid ${isSelected ? "#1A1209" : "#E8E8E8"}`,
                                  background: isSelected ? "#1A1209" : "#FFFFFF",
                                  color:      isSelected ? "#FFFFFF" : "#1A1209",
                                }}
                              >
                                {t(`steps.date.time.${key}`)}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── Footer CTA ── */}
              <div
                className="shrink-0 flex items-center gap-3 px-6 pt-3 pb-6 border-t border-s-ink/[0.06] dark:border-white/[0.06]"
                style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
              >
                <button
                  onClick={reset}
                  className="text-[13px] font-body text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text underline-offset-2 hover:underline transition-colors whitespace-nowrap"
                >
                  {t("reset")}
                </button>
                <button
                  onClick={navigate}
                  aria-label={t("showResults")}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-btn bg-s-coral text-white font-heading font-bold text-[13px] uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
                  style={{ boxShadow: "0 2px 6px rgba(232,98,74,.30), 0 4px 14px rgba(232,98,74,.18)" }}
                >
                  <Search size={14} aria-hidden="true" />
                  {t("showResults")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Build check**

```bash
cd "c:/Users/sulod/solen" && npm run build 2>&1 | grep -E "error|Error" | grep -v "Supabase client\|node_modules" | head -20
```

If TS errors appear about `tNav(category as string)` — the `navigation` namespace keys match `SalonCategory` values. If `tNav` is typed strictly, cast: `tNav(category as Parameters<typeof tNav>[0])` or just `tNav(category!)`.

If errors about `steps.date.time.${key}` — this key already exists in the current translations. Verify with:
```bash
grep -A 6 '"time"' messages/de.json | head -10
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/GuidedSearch.tsx
git commit -m "feat(search): rewrite GuidedSearch as bottom sheet with 3-segment trigger pill"
git push origin main
```

---

## Task 2: Add compact search pill to Header

**Files:**
- Modify: `components/layout/Header.tsx`

### Before you start

- [ ] **Step 1: Read the Header scrolled section**

```bash
sed -n '50,90p' components/layout/Header.tsx
sed -n '120,200p' components/layout/Header.tsx
```

Find: where `scrolled` state is used, what's shown in the nav pill when `scrolled === true`, where to insert the compact pill.

- [ ] **Step 2: Add Search import to Header**

Check if `Search` from lucide-react is already imported:
```bash
grep "from.*lucide" components/layout/Header.tsx | head -5
```

If not already imported, add `Search` to the existing lucide import line.

- [ ] **Step 3: Add compact search pill**

Find the nav pill content area that's rendered when `scrolled === true`. Inside that area, after the logo/brand section and before the right-side nav items, add the compact pill.

Find the exact insertion point:
```bash
grep -n "scrolled\|logo\|Logo\|items-center\|justify-between" components/layout/Header.tsx | head -20
```

Insert this button after the logo (inside the scrolled nav, in the center or alongside the logo):

```tsx
{/* Compact search pill — visible only when scrolled */}
{scrolled && (
  <button
    onClick={() =>
      window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))
    }
    aria-label={t("search")}
    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-s-dm-surface/70 text-[12px] font-heading font-bold text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-ink/20 dark:hover:border-white/20 hover:text-s-ink dark:hover:text-s-dm-text transition-colors backdrop-blur-sm"
    style={{ boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
  >
    <Search size={13} className="text-s-coral" aria-hidden="true" />
    {t("search")}
  </button>
)}
```

Check if `t("search")` exists in the header's translation namespace:
```bash
grep -A 30 '"navigation"' messages/de.json | grep '"search"' | head -3
```

If the key doesn't exist under the header's namespace, use the existing `t("searching")` or add the key in Task 3.

- [ ] **Step 4: Build check**

```bash
cd "c:/Users/sulod/solen" && npm run build 2>&1 | tail -8
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(search): add compact search pill to sticky nav header"
git push origin main
```

---

## Task 3: i18n — add all new translation keys

**Files:**
- Modify: `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

### Before you start

- [ ] **Step 1: Read current guidedSearch keys**

```bash
grep -A 40 '"guidedSearch"' messages/de.json
```

Note what already exists. The existing keys to keep:
- `openCta`, `placeholder`, `close`, `back`, `reset`, `showResults`, `detecting`, `searchDirect`
- `steps.where.*`, `steps.category.*`, `steps.service.*`, `steps.date.*`

### Add new keys

- [ ] **Step 2: Update `messages/de.json`**

Inside the `"home"."guidedSearch"` object, add these new keys (merge with existing, don't delete old ones):

```json
"segWas": "Was",
"segWasPlaceholder": "Coiffeur, Nails…",
"segWo": "Wo",
"segWann": "Wann",
"wannDefault": "Flexibel",
"openWas": "Was suchen öffnen",
"openWo": "Wo suchen öffnen",
"openWann": "Wann suchen öffnen",
"change": "Ändern",
"skipStep": "Überspringen",
"steps": {
  "was": {
    "title": "Was suchst du?",
    "searchPlaceholder": "Service suchen…",
    "skip": "Egal / Alle Services",
    "skipSub": "Alle Kategorien durchsuchen",
    "backToCategories": "Alle Kategorien"
  },
  "where": {
    "title": "Wo?",
    "subtitle": "Stadt wählen",
    "allSwitzerland": "Ganze Schweiz",
    "allSub": "Alle Städte"
  },
  "wann": {
    "title": "Wann?",
    "subtitle": "Datum wählen",
    "timeLabel": "Tageszeit"
  },
  "service": {
    "skip": "Egal / Alle Services"
  },
  "date": {
    "time": {
      "any": "Egal",
      "morning": "Morgens",
      "afternoon": "Nachmittags",
      "evening": "Abends"
    }
  }
}
```

**Important:** The existing `steps` object already has `where`, `category`, `service`, `date` sub-keys. Merge carefully — do NOT delete any existing keys. Add the new ones alongside them.

- [ ] **Step 3: Update `messages/en.json`**

Same structure:
```json
"segWas": "What",
"segWasPlaceholder": "Hairdresser, Nails…",
"segWo": "Where",
"segWann": "When",
"wannDefault": "Flexible",
"openWas": "Open what search",
"openWo": "Open where search",
"openWann": "Open when search",
"change": "Edit",
"skipStep": "Skip",
"steps": {
  "was": {
    "title": "What are you looking for?",
    "searchPlaceholder": "Search service…",
    "skip": "Any / All services",
    "skipSub": "Search all categories",
    "backToCategories": "All categories"
  },
  "where": {
    "title": "Where?",
    "subtitle": "Choose city",
    "allSwitzerland": "All of Switzerland",
    "allSub": "All cities"
  },
  "wann": {
    "title": "When?",
    "subtitle": "Choose date",
    "timeLabel": "Time of day"
  },
  "service": {
    "skip": "Any / All services"
  },
  "date": {
    "time": {
      "any": "Any time",
      "morning": "Morning",
      "afternoon": "Afternoon",
      "evening": "Evening"
    }
  }
}
```

- [ ] **Step 4: Update `messages/fr.json`**

```json
"segWas": "Quoi",
"segWasPlaceholder": "Coiffeur, Ongles…",
"segWo": "Où",
"segWann": "Quand",
"wannDefault": "Flexible",
"openWas": "Ouvrir recherche quoi",
"openWo": "Ouvrir recherche où",
"openWann": "Ouvrir recherche quand",
"change": "Modifier",
"skipStep": "Passer",
"steps": {
  "was": {
    "title": "Que cherchez-vous ?",
    "searchPlaceholder": "Rechercher un service…",
    "skip": "Peu importe / Tous les services",
    "skipSub": "Toutes les catégories",
    "backToCategories": "Toutes les catégories"
  },
  "where": {
    "title": "Où ?",
    "subtitle": "Choisir une ville",
    "allSwitzerland": "Toute la Suisse",
    "allSub": "Toutes les villes"
  },
  "wann": {
    "title": "Quand ?",
    "subtitle": "Choisir une date",
    "timeLabel": "Moment de la journée"
  },
  "service": {
    "skip": "Peu importe / Tous les services"
  },
  "date": {
    "time": {
      "any": "N'importe quand",
      "morning": "Matin",
      "afternoon": "Après-midi",
      "evening": "Soir"
    }
  }
}
```

- [ ] **Step 5: Update `messages/it.json`**

```json
"segWas": "Cosa",
"segWasPlaceholder": "Parrucchiere, Unghie…",
"segWo": "Dove",
"segWann": "Quando",
"wannDefault": "Flessibile",
"openWas": "Apri ricerca cosa",
"openWo": "Apri ricerca dove",
"openWann": "Apri ricerca quando",
"change": "Modifica",
"skipStep": "Salta",
"steps": {
  "was": {
    "title": "Cosa stai cercando?",
    "searchPlaceholder": "Cerca servizio…",
    "skip": "Qualsiasi / Tutti i servizi",
    "skipSub": "Tutte le categorie",
    "backToCategories": "Tutte le categorie"
  },
  "where": {
    "title": "Dove?",
    "subtitle": "Scegli città",
    "allSwitzerland": "Tutta la Svizzera",
    "allSub": "Tutte le città"
  },
  "wann": {
    "title": "Quando?",
    "subtitle": "Scegli data",
    "timeLabel": "Ora del giorno"
  },
  "service": {
    "skip": "Qualsiasi / Tutti i servizi"
  },
  "date": {
    "time": {
      "any": "Qualsiasi ora",
      "morning": "Mattina",
      "afternoon": "Pomeriggio",
      "evening": "Sera"
    }
  }
}
```

- [ ] **Step 6: Verify JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/de.json','utf8')); console.log('de ok')"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('en ok')"
node -e "JSON.parse(require('fs').readFileSync('messages/fr.json','utf8')); console.log('fr ok')"
node -e "JSON.parse(require('fs').readFileSync('messages/it.json','utf8')); console.log('it ok')"
```

Expected: all 4 print "ok". If parse error: fix the JSON (missing comma, trailing comma, unmatched brace).

- [ ] **Step 7: Build check**

```bash
cd "c:/Users/sulod/solen" && npm run build 2>&1 | tail -8
```

- [ ] **Step 8: Commit**

```bash
git add messages/de.json messages/en.json messages/fr.json messages/it.json
git commit -m "feat(i18n): add search bottom sheet translation keys for all 4 locales"
git push origin main
```

---

## Verification

After all tasks complete:

```bash
# Build must pass
npm run build

# GuidedSearch renders bottom sheet (not centered modal)
grep -n "bottom-0\|y.*100%\|translateY" components/ui/GuidedSearch.tsx | head -5
# Expected: lines with "fixed bottom-0" and "y: \"100%\""

# 3-segment pill renders (not single search bar)
grep -n "segWas\|segWo\|segWann" components/ui/GuidedSearch.tsx | head -5
# Expected: 3+ results

# CustomEvent listener exists
grep -n "openSearchSheet" components/ui/GuidedSearch.tsx components/layout/Header.tsx
# Expected: addEventListener in GuidedSearch, dispatchEvent in Header

# Collapsed step rows exist
grep -n "change\|Ändern\|step > 1\|step > 2" components/ui/GuidedSearch.tsx | head -5
# Expected: lines with step > 1 and step > 2 collapsed rows

# Category list (not grid)
grep -n "grid-cols-3\|CATEGORY_LIST\|flex-col\|flex items-center gap-3" components/ui/GuidedSearch.tsx | head -8
# Expected: CATEGORY_LIST used, categories rendered as flex rows (not grid)

# No hardcoded German
grep -n '"[A-ZÄÖÜ][a-zäöüß]' components/ui/GuidedSearch.tsx | grep -v "//\|aria\|className" | head -5
# Expected: 0 results
```

---

## What's NOT in this plan

- **Mobile swipe-to-close gesture** (touch drag handle → close sheet) — requires `useDrag` from `@use-gesture/react`, separate task
- **Autocomplete search results** while typing in Was step — requires hitting `/api/search/suggest`, separate task
- **Removing the old search page** `app/[locale]/search/page.tsx` — keep it, search results page is still valid destination
- **Desktop max-width constraint** on the bottom sheet — spec says bottom sheet on all screen sizes; a separate desktop experience (e.g., popover) is deferred
