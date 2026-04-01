"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronLeft, ChevronRight, MapPin, Check, Star, Calendar as CalendarIcon, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_SERVICES,
  DATE_QUICK_PICKS,
  getLocalizedLabel,
  datePickToParam,
} from "@/lib/guided-search-data";
import { CITIES, CITY_SLUGS, type CitySlug } from "@/lib/cities";
import { getPersistedCity } from "@/lib/city-cookie";
import type { SalonCategory } from "@/lib/types";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import SolenDatePicker from "@/components/ui/date-picker";
import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";

// ─────────────────────────────────────────────────────────────────────────────
// Types & static data
// ─────────────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type TimeKey = "any" | "morning" | "afternoon" | "evening";

type CategoryItem = {
  key: SalonCategory;
  Icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  subDe: string;
  subEn: string;
  subFr: string;
  subIt: string;
};

const CATEGORY_LIST: CategoryItem[] = [
  { key: "coiffeur",   Icon: CoiffeurIcon, subDe: "Haarschnitt, Farbe, Styling",  subEn: "Haircut, Color, Styling",   subFr: "Coupe, Couleur, Coiffage",   subIt: "Taglio, Colore, Styling" },
  { key: "barbershop", Icon: BarberIcon,   subDe: "Haarschnitt, Bart, Rasur",      subEn: "Haircut, Beard, Shave",     subFr: "Coupe, Barbe, Rasage",       subIt: "Taglio, Barba, Rasatura" },
  { key: "nails",      Icon: NailsIcon,    subDe: "Maniküre, Gel, Acryl",          subEn: "Manicure, Gel, Acrylic",    subFr: "Manucure, Gel, Acrylique",   subIt: "Manicure, Gel, Acrilico" },
  { key: "spa",        Icon: SpaIcon,      subDe: "Massage, Gesichtsbehandlung",   subEn: "Massage, Facial",           subFr: "Massage, Soin du visage",    subIt: "Massaggio, Trattamento viso" },
  { key: "makeup",     Icon: MakeupIcon,   subDe: "Make-up, Schminken",            subEn: "Makeup, Beauty",            subFr: "Maquillage, Beauté",         subIt: "Trucco, Bellezza" },
  { key: "waxing",     Icon: WaxingIcon,   subDe: "Haarentfernung",                subEn: "Hair Removal",              subFr: "Épilation",                  subIt: "Epilazione" },
];

const TIME_KEYS: TimeKey[] = ["any", "morning", "afternoon", "evening"];

const TRENDING_SEARCHES = [
  "Balayage",
  "Gel Nägel",
  "Herrenschnitt",
  "Wimpernverlängerung",
  "Hot Stone Massage",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Recent searches hook
// ─────────────────────────────────────────────────────────────────────────────

const RECENT_KEY = "solen_recent_searches";
const MAX_RECENT = 5;

type RecentSearch = {
  query: string;
  category?: string;
  city: string;
  timestamp: number;
};

function useRecentSearches() {
  const [recents, setRecents] = useState<RecentSearch[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch { /* ignore parse errors */ }
  }, []);

  const save = (entry: Omit<RecentSearch, "timestamp">) => {
    const newEntry: RecentSearch = { ...entry, timestamp: Date.now() };
    setRecents((prev) => {
      // Remove duplicate queries, then prepend, keep max 5
      const deduped = prev.filter((r) => r.query !== entry.query || r.category !== entry.category);
      const next = [newEntry, ...deduped].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const clear = () => {
    setRecents([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  };

  return { recents, save, clear };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function GuidedSearch({ categoryCounts = {}, hideTrigger = false }: { categoryCounts?: Record<string, number>; hideTrigger?: boolean }) {
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
  const [showServices,  setShowServices]  = useState(false);
  const [inputFocused,  setInputFocused]  = useState(false);
  const [showCalendar,  setShowCalendar]  = useState(false);
  const [specificDate,  setSpecificDate]  = useState<CalendarDate | null>(null);
  const [flashedCat,    setFlashedCat]    = useState<string | null>(null);

  const inputRef     = useRef<HTMLInputElement>(null);
  const cityTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { recents, save: saveRecent, clear: clearRecents } = useRecentSearches();

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

  // Body scroll lock — position:fixed approach to prevent layout shift on mobile
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.dataset.scrollY = String(scrollY);
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY ?? "0");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = parseInt(document.body.dataset.scrollY ?? "0");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // ESC key to close the sheet
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Focus input when step 1 opens
  useEffect(() => {
    if (isOpen && step === 1) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen, step]);

  // Adjust sheet height when mobile keyboard opens
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const keyboardHeight = window.innerHeight - viewport.height;
      const sheet = document.getElementById("gs-sheet");
      if (sheet) {
        sheet.style.maxHeight = keyboardHeight > 100
          ? `${viewport.height - 20}px`
          : "88svh";
      }
    };
    window.visualViewport?.addEventListener("resize", handler);
    return () => window.visualViewport?.removeEventListener("resize", handler);
  }, [isOpen]);


  // ── Helpers ───────────────────────────────────────────────────────────────

  const open = (openStep: Step = 1) => {
    setStep(openStep);
    setShowServices(false);
    setIsOpen(true);
  };

  const close = () => {
    clearTimeout(cityTimerRef.current);
    setIsOpen(false);
  };

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
    else if (!category && query.trim())    params.set("q", query.trim());
    const dateParam = dateKey !== "any"
      ? (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : datePickToParam(dateKey))
      : null;
    if (dateParam)                         params.set("date", dateParam);
    if (timeKey !== "any")                 params.set("time", timeKey);

    if (city) localStorage.setItem("solen_last_city", city);

    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);

    // Save to recent searches if there's a meaningful query or category
    if (service || query.trim() || category) {
      saveRecent({
        query: service ?? query.trim(),
        category: category ?? undefined,
        city: city ?? "all",
      });
    }

    close();
  };

  const selectCategory = (cat: SalonCategory) => {
    // Row flash: rgba(232,115,90,0.08) for 200ms, then advance to WO step
    setFlashedCat(cat);
    setTimeout(() => {
      setFlashedCat(null);
      setCategory(cat);
      setService(null);
      setStep(2);
    }, 200);
  };

  const selectService = (svc: string | null) => {
    setService(svc);
    setShowServices(false);
    setStep(2);
  };

  const selectCity = (c: CitySlug | null) => {
    setCity(c);
    clearTimeout(cityTimerRef.current);
    cityTimerRef.current = setTimeout(() => setStep(3), 150);
  };

  // ── Derived display values for the trigger pill ────────────────────────────
  const wasLabel  = category ? tNav(category as Parameters<typeof tNav>[0]) : null;
  const woLabel   = city ? getCityLabel(city) : getCityLabel("basel");
  const wannDefault = t("wannDefault" as Parameters<typeof t>[0]);
  const wannLabel = dateKey !== "any"
    ? (() => {
        const pick = DATE_QUICK_PICKS.find(p => p.key === dateKey);
        if (pick) return getLocalizedLabel(pick, locale);
        // Specific date (ISO format like "2026-04-15") — format nicely
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          try {
            const d = new Date(dateKey + "T00:00:00");
            return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : locale, {
              day: "numeric",
              month: "short",
            }).format(d);
          } catch { return dateKey; }
        }
        return wannDefault;
      })()
    : wannDefault;

  const services = category ? (CATEGORY_SERVICES[category] ?? []) : [];

  // ── Step dot animation values ──────────────────────────────────────────────
  const stepDot = (s: Step) => ({
    width:      s === step ? 20 : 6,
    background: s === step ? "#E8624A" : s < step ? "#1A1209" : "#E0E0E0",
  });

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="w-full relative">
      {/* ════════════════════════════════════════════════════════════════════
          TRIGGER PILL — compact (scrolled) or full (top of page)
          ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait" initial={false}>
        {!isOpen && !hideTrigger ? (
          /* ── FULL 3-SEGMENT PILL ─────────────────────────────────────────── */
          <motion.div
            key="full"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
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
              aria-label={t("openWas" as Parameters<typeof t>[0])}
              className="flex-1 flex flex-col justify-center px-4 py-2 rounded-l-full hover:bg-s-ink/[0.03] dark:hover:bg-white/[0.03] transition-colors min-w-0"
            >
              <span className="text-[9px] font-heading font-bold uppercase tracking-[.07em] text-s-ink dark:text-s-dm-text">
                {t("segWas" as Parameters<typeof t>[0])}
              </span>
              <span className={`text-[12px] font-body truncate ${wasLabel ? "font-semibold text-s-ink dark:text-s-dm-text" : "text-s-ink/40 dark:text-s-dm-text/40"}`}>
                {wasLabel ?? t("segWasPlaceholder" as Parameters<typeof t>[0])}
              </span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-s-ink/10 dark:bg-white/10 shrink-0" aria-hidden="true" />

            {/* Wo segment */}
            <button
              onClick={() => open(2)}
              aria-label={t("openWo" as Parameters<typeof t>[0])}
              className="flex-1 flex flex-col justify-center px-4 py-2 hover:bg-s-ink/[0.03] dark:hover:bg-white/[0.03] transition-colors min-w-0"
            >
              <span className="text-[9px] font-heading font-bold uppercase tracking-[.07em] text-s-ink dark:text-s-dm-text">
                {t("segWo" as Parameters<typeof t>[0])}
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
              aria-label={t("openWann" as Parameters<typeof t>[0])}
              className="flex-1 flex flex-col justify-center px-4 py-2 hover:bg-s-ink/[0.03] dark:hover:bg-white/[0.03] transition-colors min-w-0"
            >
              <span className="text-[9px] font-heading font-bold uppercase tracking-[.07em] text-s-ink dark:text-s-dm-text">
                {t("segWann" as Parameters<typeof t>[0])}
              </span>
              <span className={`text-[12px] font-body truncate ${dateKey !== "any" ? "font-semibold text-s-ink dark:text-s-dm-text" : "text-s-ink/40 dark:text-s-dm-text/40"}`}>
                {wannLabel}
              </span>
            </button>

            {/* Search button */}
            <button
              onClick={() => category ? navigate() : open(1)}
              aria-label={t("showResults" as Parameters<typeof t>[0])}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-s-coral hover:brightness-[1.06] active:scale-[0.96] transition-[transform,filter] duration-150 mx-2 shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(232,98,74,.30)" }}
            >
              <Search size={16} className="text-white" aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
              className="fixed inset-0 z-[60] bg-black/40"
              style={{ backdropFilter: "blur(2px)" }}
              onClick={close}
              aria-hidden="true"
            />

            {/* Sheet */}
            <motion.div
              id="gs-sheet"
              key="gs-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t("openCta")}
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
              exit={{ y: "100%", transition: { duration: 0.24, ease: "easeIn" } }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-s-dm-surface flex flex-col"
              style={{
                borderRadius: "24px 24px 0 0",
                maxHeight: "88svh",
                boxShadow: "0 -4px 32px rgba(0,0,0,.12)",
              }}
            >
              {/* Sticky sheet header — title + close */}
              <div
                className="shrink-0 sticky top-0 z-[1] bg-white dark:bg-s-dm-surface"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center justify-between px-6 pt-4 pb-3">
                  <span className="font-heading font-bold text-[20px] text-s-ink dark:text-s-dm-text leading-tight">
                    {t("steps.was.title" as Parameters<typeof t>[0])}
                  </span>
                  <button
                    onClick={close}
                    aria-label={t("reset" as Parameters<typeof t>[0])}
                    className="flex items-center justify-center rounded-full hover:bg-s-ink/[0.05] transition-colors"
                    style={{ width: 44, height: 44 }}
                  >
                    <X size={24} style={{ color: "#8A8178" }} aria-hidden="true" />
                  </button>
                </div>

                {/* Step indicator pills */}
                <div className="flex gap-2 px-6 pb-3">
                  {([
                    { s: 1 as const, label: t("segWas" as Parameters<typeof t>[0]) },
                    { s: 2 as const, label: t("segWo" as Parameters<typeof t>[0]) },
                    { s: 3 as const, label: t("segWann" as Parameters<typeof t>[0]) },
                  ]).map(({ s, label }) => {
                    const isActive = s === step;
                    const isCompleted = s < step;
                    return (
                      <button
                        key={s}
                        onClick={() => setStep(s)}
                        className="rounded-pill font-body font-medium text-[12px] transition-all duration-150"
                        style={{
                          padding: "4px 12px",
                          background: isActive ? "#1A1A1A" : isCompleted ? "#E8735A" : "#EDE8E2",
                          color: isActive ? "#FFFFFF" : isCompleted ? "#FFFFFF" : "#8A8178",
                        }}
                        aria-current={isActive ? "step" : undefined}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="px-6">

                  {/* ── Collapsed Was row (step 2+3) ── */}
                  <AnimatePresence>
                    {step > 1 && (
                      <motion.div
                        key="collapsed-was"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between py-3 border-b border-[#EBEBEB] dark:border-white/[0.07]">
                          <div>
                            <div className="text-[11px] font-heading font-bold uppercase tracking-[.07em]" style={{ color: "#8A8178" }}>
                              {t("segWas" as Parameters<typeof t>[0])}
                            </div>
                            <div className="font-heading font-bold text-[13px] text-s-ink dark:text-s-dm-text">
                              {category ? tNav(category as Parameters<typeof tNav>[0]) : t("segWasPlaceholder" as Parameters<typeof t>[0])}
                              {service ? ` · ${service}` : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => { setStep(1); setShowServices(false); }}
                            className="text-[11px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 underline underline-offset-2 hover:text-s-ink dark:hover:text-s-dm-text transition-colors ml-4"
                          >
                            {t("change" as Parameters<typeof t>[0])}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Collapsed Wo row (step 3) ── */}
                  <AnimatePresence>
                    {step > 2 && (
                      <motion.div
                        key="collapsed-wo"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between py-3 border-b border-[#EBEBEB] dark:border-white/[0.07]">
                          <div>
                            <div className="text-[11px] font-heading font-bold uppercase tracking-[.07em]" style={{ color: "#8A8178" }}>
                              {t("segWo" as Parameters<typeof t>[0])}
                            </div>
                            <div className="font-heading font-bold text-[13px] text-s-ink dark:text-s-dm-text">
                              {city ? getCityLabel(city) : t("steps.where.allSwitzerland")}
                            </div>
                          </div>
                          <button
                            onClick={() => setStep(2)}
                            className="text-[11px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 underline underline-offset-2 hover:text-s-ink dark:hover:text-s-dm-text transition-colors ml-4"
                          >
                            {t("change" as Parameters<typeof t>[0])}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                        {/* Category list OR service drill-down */}
                        {!showServices ? (
                          <>
                            {/* Recent searches — shown at top of Step 1 when there are saved searches */}
                            {recents.length > 0 && (
                              <div className="pt-4 pb-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40">
                                    {locale === "de" ? "Zuletzt gesucht" : locale === "fr" ? "Recherches récentes" : locale === "it" ? "Ricerche recenti" : "Recent searches"}
                                  </span>
                                  <button
                                    onClick={clearRecents}
                                    className="text-[11px] font-body text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
                                  >
                                    {locale === "de" ? "Alle löschen" : locale === "fr" ? "Tout effacer" : locale === "it" ? "Cancella tutto" : "Clear all"}
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {recents.map((r, i) => {
                                    const label = [r.query, r.city !== "all" ? r.city : null]
                                      .filter(Boolean)
                                      .join(" · ");
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => {
                                          if (r.category) setCategory(r.category as SalonCategory);
                                          if (r.city && r.city !== "all") setCity(r.city as CitySlug);
                                          navigate();
                                        }}
                                        aria-label={label}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] font-body font-medium text-s-ink/70 dark:text-s-dm-text/70 hover:text-s-ink dark:hover:text-s-dm-text hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.06] transition-colors"
                                        style={{ border: "1px solid rgba(26,18,9,0.10)", background: "var(--raised)" }}
                                      >
                                        <Clock size={11} className="text-s-ink/40 dark:text-s-dm-text/40 shrink-0" aria-hidden="true" />
                                        <span>{label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Trending searches */}
                            <div className={recents.length > 0 ? "pb-2" : "pt-4 pb-2"}>
                              <p className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
                                {locale === "de" ? "Beliebt in Basel 🔥" : locale === "fr" ? "Populaire à Bâle 🔥" : locale === "it" ? "Popolare a Basilea 🔥" : "Popular in Basel 🔥"}
                              </p>
                              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {TRENDING_SEARCHES.map((term) => (
                                  <button
                                    key={term}
                                    aria-label={term}
                                    onClick={() => {
                                      setQuery(term);
                                      navigate();
                                    }}
                                    className="shrink-0 px-3 py-1.5 rounded-pill text-[12px] font-body font-medium text-s-ink/70 dark:text-s-dm-text/70 hover:text-s-ink dark:hover:text-s-dm-text hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap"
                                    style={{ border: "1px solid rgba(26,18,9,0.10)", background: "var(--raised)" }}
                                  >
                                    {term}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Vertical category list */}
                            <div className="flex flex-col divide-y divide-[#F5F5F5] dark:divide-white/[0.06] mb-2">
                              {/* All services row */}
                              <button
                                onClick={() => selectService(null)}
                                aria-label={t("steps.was.skip" as Parameters<typeof t>[0])}
                                className={cn(
                                  "w-full flex items-center gap-4 py-4 text-left transition-colors",
                                  !category
                                    ? "text-s-coral"
                                    : "text-s-ink/70 dark:text-s-dm-text/70 hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02]"
                                )}
                              >
                                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-s-ink/[0.04] dark:bg-white/[0.06] shrink-0">
                                  <Star size={18} aria-hidden="true" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[14px] font-heading font-bold leading-tight">
                                    {t("steps.was.skip" as Parameters<typeof t>[0])}
                                  </p>
                                  <p className="text-[12px] text-s-ink/45 dark:text-s-dm-text/45 leading-tight mt-0.5">
                                    {t("steps.was.skipSub" as Parameters<typeof t>[0])}
                                  </p>
                                </div>
                                {!category && <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />}
                              </button>

                              {CATEGORY_LIST.map((cat) => {
                                const count = categoryCounts[cat.key] ?? 0;
                                const isFlashing = flashedCat === cat.key;
                                return (
                                  <button
                                    key={cat.key}
                                    onClick={() => selectCategory(cat.key)}
                                    aria-label={tNav(cat.key as Parameters<typeof tNav>[0])}
                                    className="w-full flex items-center text-left transition-[background-color] duration-100 hover:bg-[rgba(0,0,0,0.03)]"
                                    style={{
                                      padding: "14px 24px",
                                      gap: "14px",
                                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                                      minHeight: "56px",
                                      background: isFlashing ? "rgba(232,115,90,0.08)" : "transparent",
                                    }}
                                  >
                                    {/* Icon container */}
                                    <div
                                      className="shrink-0 flex items-center justify-center"
                                      style={{ width: 40, height: 40, borderRadius: 12, background: "#F5F0EB" }}
                                    >
                                      <cat.Icon width={20} height={20} className="text-s-coral" />
                                    </div>
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-heading font-bold text-[15px] text-s-ink dark:text-s-dm-text leading-tight">
                                        {tNav(cat.key as Parameters<typeof tNav>[0])}
                                      </p>
                                      <p className="font-body text-[13px] text-s-ink/50 dark:text-s-dm-text/50 leading-tight mt-0.5 truncate">
                                        {getCatSub(cat)}
                                      </p>
                                    </div>
                                    {/* Right side: count or chevron */}
                                    {count > 0 ? (
                                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: "13px", color: "#8A8178", whiteSpace: "nowrap", flexShrink: 0 }}>
                                        {count} {count === 1 ? "Salon" : "Salons"}
                                      </span>
                                    ) : (
                                      <ChevronRight size={18} style={{ color: "#C4BBB2", flexShrink: 0 }} aria-hidden="true" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-1 h-px bg-s-ink/8 dark:bg-white/8" />
                              <span className="text-[10px] text-s-ink/35 dark:text-s-dm-text/35 font-body uppercase tracking-wider whitespace-nowrap">
                                {t("orSearch" as Parameters<typeof t>[0])}
                              </span>
                              <div className="flex-1 h-px bg-s-ink/8 dark:bg-white/8" />
                            </div>

                            {/* Text search input */}
                            <div
                              className="relative flex items-center mb-4"
                              style={{ border: `${inputFocused ? "1.5px" : "1px"} solid ${inputFocused ? "#1A1A1A" : "rgba(0,0,0,0.10)"}`, borderRadius: "12px", transition: "border-color 150ms ease" }}
                            >
                              <Search size={15} className="absolute left-3.5 text-s-ink/35 dark:text-s-dm-text/35 shrink-0 pointer-events-none" aria-hidden="true" />
                              <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                  setQuery(e.target.value);
                                  setShowServices(e.target.value.length > 0);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && navigate()}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder={t("steps.was.searchPlaceholder" as Parameters<typeof t>[0])}
                                aria-label={t("steps.was.searchPlaceholder" as Parameters<typeof t>[0])}
                                className="w-full pl-10 pr-4 py-3 text-[13px] font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/35 dark:placeholder:text-s-dm-text/40 bg-transparent focus:outline-none"
                              />
                              {query && (
                                <button
                                  onClick={() => { setQuery(""); setShowServices(false); }}
                                  aria-label={t("reset")}
                                  className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full bg-s-ink/10 hover:bg-s-ink/20 transition-colors"
                                >
                                  <X size={10} className="text-s-ink dark:text-s-dm-text" />
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Service drill-down */
                          <div className="pb-2">
                            <button
                              onClick={() => { setQuery(""); setShowServices(false); }}
                              className="flex items-center gap-1.5 text-[12px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral dark:hover:text-s-coral transition-colors mb-3"
                            >
                              <ChevronLeft size={14} aria-hidden="true" />
                              {t("steps.was.backToCategories" as Parameters<typeof t>[0])}
                            </button>
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

                        {/* All categories CTA — replaces "Überspringen" */}
                        <div style={{ padding: "16px 0 24px", textAlign: "center" }}>
                          <button
                            onClick={() => { close(); router.push(`/${locale}/search`); }}
                            className="font-body font-medium text-[14px] hover:brightness-[1.06] transition-[filter] duration-150"
                            style={{ color: "#E8735A" }}
                          >
                            {t("allCategories" as Parameters<typeof t>[0])} →
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
                          {t("steps.where.subtitle" as Parameters<typeof t>[0])}
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
                          <MapPin size={20} className={city === null ? "text-s-coral" : "text-s-ink/40 dark:text-s-dm-text/40"} aria-hidden="true" />
                          <span className="flex-1 text-left text-[14px] font-body font-medium text-s-ink dark:text-s-dm-text">
                            {t("steps.where.allSwitzerland")}
                          </span>
                          <span className="text-[11px] font-body text-s-ink/40 dark:text-s-dm-text/40">
                            {t("steps.where.allSub" as Parameters<typeof t>[0])}
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
                          {t("steps.wann.title" as Parameters<typeof t>[0])}
                        </p>
                        <p className="font-heading font-bold text-[18px] text-s-ink dark:text-s-dm-text mb-4">
                          {t("steps.wann.subtitle" as Parameters<typeof t>[0])}
                        </p>

                        {/* Date quick-pick pills */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {DATE_QUICK_PICKS.map((pick) => {
                            const label = getLocalizedLabel(pick, locale);
                            const isSelected = dateKey === pick.key;
                            return (
                              <button
                                key={pick.key}
                                onClick={() => {
                                  setDateKey(pick.key);
                                  setSpecificDate(null);
                                  setShowCalendar(false);
                                }}
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

                        {/* Specific date toggle */}
                        <button
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="flex items-center gap-2 text-[13px] font-heading font-semibold text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral transition-colors mb-3 mt-1"
                        >
                          <CalendarIcon size={14} aria-hidden="true" />
                          {t("steps.wann.specificDate" as Parameters<typeof t>[0])}
                          <ChevronDown size={12} className={cn("transition-transform duration-200", showCalendar && "rotate-180")} />
                        </button>

                        {showCalendar && (
                          <div className="mb-4 rounded-card border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-surface overflow-hidden">
                            <SolenDatePicker
                              inline
                              value={specificDate}
                              onChange={(v) => {
                                const cal = v as CalendarDate;
                                setSpecificDate(cal);
                                setDateKey(cal.toString());
                              }}
                              minValue={today(getLocalTimeZone())}
                              locale={locale === "de" ? "de-CH" : locale}
                            />
                          </div>
                        )}

                        {/* Time of day */}
                        <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                          {t("steps.wann.timeLabel" as Parameters<typeof t>[0])}
                        </p>
                        <div className="flex flex-wrap gap-2 pb-6">
                          {TIME_KEYS.map((key) => {
                            const isSelected = timeKey === key;
                            return (
                              <button
                                key={key}
                                onClick={() => setTimeKey(key)}
                                aria-label={t(`steps.date.time.${key}` as Parameters<typeof t>[0])}
                                aria-pressed={isSelected}
                                className="px-[18px] py-2.5 rounded-pill text-[13px] font-heading font-semibold transition-all duration-150"
                                style={{
                                  border:     `1.5px solid ${isSelected ? "#1A1209" : "#E8E8E8"}`,
                                  background: isSelected ? "#1A1209" : "#FFFFFF",
                                  color:      isSelected ? "#FFFFFF" : "#1A1209",
                                }}
                              >
                                {t(`steps.date.time.${key}` as Parameters<typeof t>[0])}
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
                  onClick={() => {
                    if (!category) {
                      setStep(1);
                      setFlashedCat("__none__");
                      setTimeout(() => setFlashedCat(null), 400);
                    } else {
                      navigate();
                    }
                  }}
                  aria-label={t("showResults")}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-btn bg-s-coral text-white font-heading font-bold text-[13px] uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
                  style={{ boxShadow: "0 2px 6px rgba(232,98,74,.30), 0 4px 14px rgba(232,98,74,.18)" }}
                >
                  <Search size={14} aria-hidden="true" />
                  {category ? t("showResults") : t("steps.was.title" as Parameters<typeof t>[0])}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
