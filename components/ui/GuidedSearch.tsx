"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronLeft, MapPin, Check, Loader2 } from "lucide-react";
import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";
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
// Data
// ─────────────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

const CATEGORY_ITEMS: { key: SalonCategory; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "coiffeur",   Icon: CoiffeurIcon   },
  { key: "barbershop", Icon: BarberIcon     },
  { key: "nails",      Icon: NailsIcon      },
  { key: "spa",        Icon: SpaIcon        },
  { key: "makeup",     Icon: MakeupIcon     },
  { key: "waxing",     Icon: WaxingIcon     },
];

const stepMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -16 },
  transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function GuidedSearch() {
  const router    = useRouter();
  const locale    = useLocale();
  const t         = useTranslations("home.guidedSearch");
  const tNav      = useTranslations("navigation");

  const [isOpen,    setIsOpen]    = useState(false);
  const [step,      setStep]      = useState<Step>(1);
  const [city,      setCity]      = useState<CitySlug | null>(null);
  const [category,  setCategory]  = useState<SalonCategory | null>(null);
  const [service,   setService]   = useState<string | null>(null);
  const [dateKey,   setDateKey]   = useState<string | null>(null);
  const [query,     setQuery]     = useState("");
  const [detecting, setDetecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill city from cookie
  useEffect(() => {
    const c = getPersistedCity();
    if (c) setCity(c as CitySlug);
  }, []);

  // Scroll lock when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const open  = () => { setIsOpen(true); setStep(1); };
  const close = () => setIsOpen(false);

  const reset = () => {
    setCity(null);
    setCategory(null);
    setService(null);
    setDateKey(null);
    setQuery("");
    setCurrentStep(1);
  };

  const setCurrentStep = (s: number) => setStep(Math.max(1, Math.min(4, s)) as Step);

  const navigate = () => {
    const categoryOrSearch = category ?? (query.trim() ? "search" : null);
    let basePath: string;
    if (city && category) {
      basePath = `/${locale}/${city}/${category}`;
    } else if (category) {
      basePath = `/${locale}/${category}`;
    } else {
      basePath = `/${locale}/search`;
    }
    const params = new URLSearchParams();
    if (service) params.set("q", service);
    else if (!category && query.trim()) params.set("q", encodeURIComponent(query.trim()));
    const dateParam = dateKey ? datePickToParam(dateKey) : null;
    if (dateParam) params.set("date", dateParam);
    void categoryOrSearch;
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    close();
  };

  // Mode B: type something → auto-detect category
  const handleQuerySearch = async () => {
    const q = query.trim();
    if (!q) return;
    setDetecting(true);
    try {
      const res = await fetch(`/api/search/detect-category?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.category) {
          setCategory(data.category as SalonCategory);
          setCurrentStep(3);
          setDetecting(false);
          return;
        }
      }
    } catch {
      // Detection failed — fall through to plain search
    }
    setDetecting(false);
    navigate();
  };

  const selectCity     = (c: CitySlug | null) => { setCity(c);    setCurrentStep(2); };
  const selectCategory = (c: SalonCategory)   => { setCategory(c); setCurrentStep(3); };
  const selectService  = (s: string | null)   => { setService(s);  setCurrentStep(4); };
  const selectDate     = (d: string)           => setDateKey(d);

  // ── Derived ───────────────────────────────────────────────────────────────

  const getCityLabel = (slug: CitySlug) => {
    const c = CITIES[slug];
    return locale === "en" ? c.name_en
      : locale === "fr" ? c.name_fr
      : locale === "it" ? c.name_it
      : c.name_de;
  };

  const summaryParts = [
    city     ? getCityLabel(city) : null,
    category ? tNav(category)     : null,
    service  ?? null,
  ].filter(Boolean);

  const services = category ? (CATEGORY_SERVICES[category] ?? []) : [];
  const canNavigate = !!(category || query.trim());

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full relative">
      {/* ── Closed pill ──────────────────────────────────────────────────── */}
      <button
        onClick={open}
        aria-label={t("openCta")}
        className="w-full flex items-center gap-3 bg-white dark:bg-s-dm-raised px-5 py-4 text-left hover:-translate-y-[2px] transition-[transform,box-shadow] duration-300"
        style={{
          borderRadius: "50px",
          border: "1px solid rgba(26,18,9,0.10)",
          boxShadow: "0 2px 8px rgba(26,18,9,0.07), 0 1px 2px rgba(26,18,9,0.04)",
        }}
      >
        <Search size={16} className="text-s-ink/40 dark:text-s-dm-text/40 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-[14px] font-body text-s-ink/40 dark:text-s-dm-text/40 truncate">
          {summaryParts.length > 0 ? summaryParts.join(" · ") : t("placeholder")}
        </span>
        {summaryParts.length > 0 && (
          <span
            className="shrink-0 px-3 py-1.5 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.04em]"
            style={{ boxShadow: "0 2px 6px rgba(232,98,74,.25)" }}
          >
            {t("showResults")}
          </span>
        )}
      </button>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="gs-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-s-ink/25 dark:bg-black/45 backdrop-blur-[3px]"
              onClick={close}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              key="gs-panel"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={t("openCta")}
              className="fixed z-50 inset-0 flex flex-col bg-white dark:bg-s-dm-surface md:inset-auto md:top-24 md:left-1/2 md:-translate-x-1/2 md:w-[600px] md:max-h-[80vh] md:rounded-card-lg md:overflow-hidden"
              style={{ boxShadow: "0 20px 60px rgba(26,18,9,0.18), 0 4px 16px rgba(26,18,9,0.10)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-s-ink/[0.07] dark:border-white/[0.07] shrink-0">
                {step > 1 ? (
                  <button
                    onClick={() => setCurrentStep(step - 1)}
                    aria-label={t("back")}
                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-s-ink/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <ChevronLeft size={18} className="text-s-ink dark:text-s-dm-text" />
                  </button>
                ) : (
                  <div className="w-9 shrink-0" />
                )}

                {/* Progress dots */}
                <div className="flex-1 flex justify-center items-center gap-2" aria-hidden="true">
                  {([1, 2, 3, 4] as Step[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => s < step && setCurrentStep(s)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === step
                          ? "w-5 bg-s-coral"
                          : s < step
                          ? "w-3 bg-s-coral/35 cursor-pointer"
                          : "w-3 bg-s-ink/12 dark:bg-white/12 cursor-default"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={close}
                  aria-label={t("close")}
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-s-ink/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <X size={18} className="text-s-ink dark:text-s-dm-text" />
                </button>
              </div>

              {/* Mode B: query input — always visible */}
              <div className="px-4 pt-3 pb-2 shrink-0 border-b border-s-ink/[0.05] dark:border-white/[0.05]">
                <div className="relative flex items-center">
                  <Search size={15} className="absolute left-3.5 text-s-ink/35 dark:text-s-dm-text/35 shrink-0" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuerySearch()}
                    placeholder={t("placeholder")}
                    aria-label={t("placeholder")}
                    className="w-full pl-10 pr-10 py-2.5 text-[14px] font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/35 dark:placeholder:text-s-dm-text/40 bg-s-ink/[0.04] dark:bg-white/[0.05] rounded-input focus:outline-none focus:ring-2 focus:ring-s-coral/30 transition-[ring]"
                  />
                  {detecting ? (
                    <Loader2 size={14} className="absolute right-3.5 text-s-ink/40 animate-spin" aria-hidden="true" />
                  ) : query.trim() ? (
                    <button
                      onClick={() => setQuery("")}
                      aria-label={t("reset")}
                      className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full bg-s-ink/10 dark:bg-white/10 hover:bg-s-ink/20 dark:hover:bg-white/20 transition-colors"
                    >
                      <X size={10} className="text-s-ink dark:text-s-dm-text" />
                    </button>
                  ) : null}
                </div>
                {query.trim() && (
                  <button
                    onClick={handleQuerySearch}
                    disabled={detecting}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-input text-[13px] font-heading font-bold uppercase tracking-[.03em] text-s-coral hover:bg-s-coral/[0.05] transition-colors disabled:opacity-50"
                  >
                    <Search size={13} aria-hidden="true" />
                    {detecting ? t("detecting") : `"${query}" ${t("searchDirect")}`}
                  </button>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <AnimatePresence mode="wait" initial={false}>
                  {step === 1 && (
                    <motion.div key="step1" {...stepMotion} className="px-4 py-5">
                      <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                        {t("steps.where.title")}
                      </p>
                      {/* All Switzerland */}
                      <button
                        onClick={() => selectCity(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-card mb-2 border transition-all duration-200 ${
                          city === null
                            ? "border-s-coral bg-s-coral/[0.05] dark:bg-s-coral/[0.08]"
                            : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-ink/20 dark:hover:border-white/20"
                        }`}
                      >
                        <span className="text-[20px]" aria-hidden="true">🇨🇭</span>
                        <span className="flex-1 text-left text-[14px] font-body font-medium text-s-ink dark:text-s-dm-text">
                          {t("steps.where.allSwitzerland")}
                        </span>
                        {city === null && <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />}
                      </button>

                      {/* Cities */}
                      <div className="grid grid-cols-3 gap-2">
                        {CITY_SLUGS.map((slug) => (
                          <button
                            key={slug}
                            onClick={() => selectCity(slug)}
                            aria-label={getCityLabel(slug)}
                            className={`flex flex-col items-center gap-2 py-4 px-3 rounded-card border transition-all duration-200 ${
                              city === slug
                                ? "border-s-coral bg-s-coral/[0.05] dark:bg-s-coral/[0.08]"
                                : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-ink/20 dark:hover:border-white/20"
                            }`}
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

                  {step === 2 && (
                    <motion.div key="step2" {...stepMotion} className="px-4 py-5">
                      <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                        {t("steps.category.title")}
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {CATEGORY_ITEMS.map(({ key, Icon }) => (
                          <button
                            key={key}
                            onClick={() => selectCategory(key)}
                            aria-label={tNav(key)}
                            className={`group flex flex-col items-center gap-2.5 py-5 px-3 rounded-card border transition-all duration-200 ${
                              category === key
                                ? "border-s-coral bg-s-coral/[0.05] dark:bg-s-coral/[0.08]"
                                : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-ink/20 dark:hover:border-white/20 hover:-translate-y-[2px]"
                            }`}
                          >
                            <Icon
                              size={28}
                              className={`transition-colors ${category === key ? "text-s-coral" : "text-s-ink/60 dark:text-s-dm-text/60"}`}
                            />
                            <span className="text-[12px] font-heading font-bold uppercase tracking-[.03em] text-s-ink dark:text-s-dm-text text-center leading-tight">
                              {tNav(key)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" {...stepMotion} className="px-4 py-5">
                      <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                        {t("steps.service.title")}
                      </p>
                      {/* Skip option */}
                      <button
                        onClick={() => selectService(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-card mb-2 border transition-all duration-200 ${
                          service === null
                            ? "border-s-coral bg-s-coral/[0.05] dark:bg-s-coral/[0.08]"
                            : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-ink/15 dark:hover:border-white/15"
                        }`}
                      >
                        <span className="flex-1 text-left text-[14px] font-body text-s-ink/60 dark:text-s-dm-text/60 italic">
                          {t("steps.service.skip")}
                        </span>
                        {service === null && <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />}
                      </button>
                      {/* Service list */}
                      <div className="space-y-1.5">
                        {services.map((svc) => {
                          const label = getLocalizedLabel(svc, locale);
                          return (
                            <button
                              key={svc.key}
                              onClick={() => selectService(svc.key)}
                              aria-label={label}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-card border transition-all duration-200 ${
                                service === svc.key
                                  ? "border-s-coral bg-s-coral/[0.05] dark:bg-s-coral/[0.08]"
                                  : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-ink/20 dark:hover:border-white/20"
                              }`}
                            >
                              <span className="flex-1 text-left text-[14px] font-body font-medium text-s-ink dark:text-s-dm-text">
                                {label}
                              </span>
                              {service === svc.key && <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div key="step4" {...stepMotion} className="px-4 py-5">
                      <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                        {t("steps.date.title")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {DATE_QUICK_PICKS.map((pick) => {
                          const label = getLocalizedLabel(pick, locale);
                          const isSelected = dateKey === pick.key;
                          return (
                            <button
                              key={pick.key}
                              onClick={() => selectDate(pick.key)}
                              aria-label={label}
                              aria-pressed={isSelected}
                              className={`px-4 py-2.5 rounded-pill border text-[13px] font-body font-medium transition-all duration-200 ${
                                isSelected
                                  ? "border-s-coral bg-s-coral text-white shadow-coral-glow"
                                  : "border-s-ink/[0.10] dark:border-white/[0.10] text-s-ink dark:text-s-dm-text hover:border-s-ink/25 dark:hover:border-white/25"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-6 text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                        {t("steps.date.timeTitle")}
                      </p>
                      {/* Time prefs inline — reuse DATE_QUICK_PICKS structure */}
                      <div className="flex flex-wrap gap-2">
                        {(["any", "morning", "afternoon", "evening"] as const).map((key) => (
                          <button
                            key={key}
                            aria-label={t(`steps.date.time.${key}`)}
                            className="px-4 py-2.5 rounded-pill border border-s-ink/[0.10] dark:border-white/[0.10] text-[13px] font-body font-medium text-s-ink dark:text-s-dm-text hover:border-s-ink/25 dark:hover:border-white/25 transition-colors"
                          >
                            {t(`steps.date.time.${key}`)}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div
                className="shrink-0 flex items-center gap-3 px-4 py-4 border-t border-s-ink/[0.07] dark:border-white/[0.07]"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <button
                  onClick={reset}
                  className="text-[13px] font-body text-s-ink/45 dark:text-s-dm-text/45 hover:text-s-ink dark:hover:text-s-dm-text underline-offset-2 hover:underline transition-colors whitespace-nowrap"
                >
                  {t("reset")}
                </button>
                <button
                  onClick={navigate}
                  disabled={!canNavigate}
                  aria-label={t("showResults")}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-btn bg-s-coral text-white font-heading font-bold text-[13px] uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ boxShadow: canNavigate ? "0 2px 6px rgba(232,98,74,.30), 0 4px 14px rgba(232,98,74,.18)" : "none" }}
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
