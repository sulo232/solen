"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronLeft, MapPin, Check, Star } from "lucide-react";
import {
  CATEGORY_SERVICES,
  DATE_QUICK_PICKS,
  getLocalizedLabel,
  datePickToParam,
} from "@/lib/guided-search-data";
import { CITIES, CITY_SLUGS, type CitySlug } from "@/lib/cities";
import { getPersistedCity } from "@/lib/city-cookie";
import type { SalonCategory } from "@/lib/types";
import CoiffeurIcon from "@/components/icons/category/CoiffeurIcon";
import BarberIcon from "@/components/icons/category/BarberIcon";
import NailsIcon from "@/components/icons/category/NailsIcon";
import SpaIcon from "@/components/icons/category/SpaIcon";
import MakeupIcon from "@/components/icons/category/MakeupIcon";
import WaxingIcon from "@/components/icons/category/WaxingIcon";

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
  const [showServices,  setShowServices]  = useState(false);
  const [inputFocused,  setInputFocused]  = useState(false);

  const inputRef     = useRef<HTMLInputElement>(null);
  const cityTimerRef = useRef<ReturnType<typeof setTimeout>>();

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
        return pick ? getLocalizedLabel(pick, locale) : wannDefault;
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
                  )}

                  {/* ── Collapsed Wo row (step 3) ── */}
                  {step > 2 && (
                    <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0] dark:border-white/[0.07]">
                      <div>
                        <div className="text-[10px] font-heading font-bold uppercase tracking-[.07em] text-s-ink/40 dark:text-s-dm-text/40">
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
                          {t("steps.was.title" as Parameters<typeof t>[0])}
                        </p>

                        {/* Text search input */}
                        <div
                          className="relative flex items-center mb-4"
                          style={{ border: `1.5px solid ${inputFocused ? "#E8624A" : "rgba(26,18,9,0.12)"}`, borderRadius: "12px" }}
                        >
                          <Search size={15} className="absolute left-3.5 text-s-ink/35 dark:text-s-dm-text/35 shrink-0 pointer-events-none" aria-hidden="true" />
                          <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && navigate()}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder={t("steps.was.searchPlaceholder" as Parameters<typeof t>[0])}
                            aria-label={t("steps.was.searchPlaceholder" as Parameters<typeof t>[0])}
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

                        {/* Back to categories link */}
                        {showServices && (
                          <button
                            onClick={() => setShowServices(false)}
                            className="flex items-center gap-1.5 text-[12px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors mb-3"
                          >
                            <ChevronLeft size={14} aria-hidden="true" />
                            {t("steps.was.backToCategories" as Parameters<typeof t>[0])}
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
                              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-s-ink/[0.05] dark:bg-white/[0.05] shrink-0" aria-hidden="true">
                                <Star size={20} className="text-s-ink/40 dark:text-s-dm-text/40" />
                              </div>
                              <div>
                                <div className="font-heading font-bold text-[14px] text-s-ink dark:text-s-dm-text">
                                  {t("steps.was.skip" as Parameters<typeof t>[0])}
                                </div>
                                <div className="text-[12px] text-s-ink/50 dark:text-s-dm-text/50">
                                  {t("steps.was.skipSub" as Parameters<typeof t>[0])}
                                </div>
                              </div>
                            </button>
                            {CATEGORY_LIST.map((cat) => (
                              <button
                                key={cat.key}
                                onClick={() => selectCategory(cat.key)}
                                aria-label={tNav(cat.key as Parameters<typeof tNav>[0])}
                                className={`w-full flex items-center gap-3 py-3.5 border-t border-[#F5F5F5] dark:border-white/[0.06] text-left transition-colors ${
                                  category === cat.key
                                    ? "bg-s-coral/[0.04] dark:bg-s-coral/[0.08]"
                                    : "hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02]"
                                }`}
                              >
                                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-s-coral/[0.08] shrink-0" aria-hidden="true">
                                  <cat.Icon width={20} height={20} className="text-s-coral" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-heading font-bold text-[14px] text-s-ink dark:text-s-dm-text">
                                    {tNav(cat.key as Parameters<typeof tNav>[0])}
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
                            {t("skipStep" as Parameters<typeof t>[0])} →
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
