"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, MapPin, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { popoverVariants } from "@/lib/animations";
import { CITY_SLUGS, getCityName, type CitySlug } from "@/lib/cities";
import { getPersistedCity } from "@/lib/city-cookie";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import ServiceAutosuggest from "@/components/ui/ServiceAutosuggest";

interface AirbnbSearchBarProps {
  scrolledPast80: boolean;
  locale: string;
  categoryCounts?: Record<string, number>;
  onSearchActiveChange?: (active: boolean) => void;
}

const airbnbPopoverVariants = popoverVariants;

const DATE_OPTIONS = [
  { key: "today",   labelKey: "wannDefault" },
  { key: "tomorrow", labelKey: "tomorrow" },
  { key: "weekend",  labelKey: "thisWeekend" },
] as const;

const WAS_CATEGORIES = [
  { key: "coiffeur",   emoji: "✂️" },
  { key: "nails",      emoji: "💅" },
  { key: "barbershop", emoji: "💈" },
  { key: "spa",        emoji: "🧖" },
  { key: "makeup",     emoji: "💄" },
  { key: "waxing",     emoji: "🍯" },
] as const;

export default function AirbnbSearchBar({ scrolledPast80, locale, categoryCounts, onSearchActiveChange }: AirbnbSearchBarProps) {
  const t = useTranslations("home.guidedSearch") as any;
  const tNav = useTranslations("navigation") as any;
  const tc = useTranslations("common");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>(() => getPersistedCity() ?? "all");
  const [dateKey, setDateKey] = useState("today");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  const [activeSegment, setActiveSegment] = useState<'category' | 'city' | 'date' | null>(null);

  const activateSegment = (seg: 'category' | 'city' | 'date' | null) => {
    setActiveSegment(seg);
    onSearchActiveChange?.(seg !== null);
  };

  useEffect(() => {
    const handler = () => activateSegment(null);
    window.addEventListener("cancelAirbnbSearch", handler);
    return () => window.removeEventListener("cancelAirbnbSearch", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (dateKey === "custom" && customDate) {
      params.set("date", format(customDate, "yyyy-MM-dd"));
    } else if (dateKey && dateKey !== "today") {
      params.set("date", dateKey);
    }
    const base = city === "all"
      ? `/${locale}/search`
      : `/${locale}/${city}/search`;
    const qs = params.toString();
    router.push(qs ? `${base}?${qs}` : base);
  };

  const dateLabel = (() => {
    if (dateKey === "custom" && customDate) return format(customDate, "dd. MMM");
    if (dateKey === "today") return t("wannDefault") ?? "Heute";
    if (dateKey === "tomorrow") return t("tomorrow") ?? "Morgen";
    if (dateKey === "weekend") return t("thisWeekend") ?? "Wochenende";
    return t("wannDefault") ?? "Heute";
  })();

  return (
    <AnimatePresence initial={false}>
      {!scrolledPast80 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="block"
        >
          <div
            className={cn(
              "flex items-stretch overflow-visible relative transition-[background-color,box-shadow] duration-200",
              activeSegment === null
                ? "bg-[--raised] rounded-search border border-s-ink/[0.08] shadow-elevation-2 hover:shadow-elevation-3 hover:scale-[1.005] transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                : "bg-s-ink/[0.05] border border-transparent shadow-none rounded-search"
            )}
            style={{ height: 64 }}
          >
            {/* Segment 1: Was */}
            <div className="relative flex-1 min-w-0">
              <div
                className={cn(
                  "h-full flex flex-col justify-center px-6 cursor-text transition-colors duration-150",
                  activeSegment === 'category'
                    ? "bg-white rounded-search shadow-elevation-2"
                    : activeSegment !== null
                      ? "hover:bg-s-ink/[0.12] rounded-full"
                      : ""
                )}
                onClick={() => activateSegment('category')}
              >
                <label className="text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/40 leading-none mb-1">
                  {t("segWas") ?? "Was"}
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => activateSegment('category')}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t("placeholder") ?? "Service, Salon oder Ort suchen..."}
                  className="bg-transparent text-[14px] font-body font-medium text-s-ink placeholder:text-s-ink/35 outline-none border-none w-full truncate"
                />
              </div>

              {/* Category dropdown — shown when Was is active and query is empty */}
              <AnimatePresence>
                {activeSegment === 'category' && query === "" && (
                  <motion.div
                    variants={airbnbPopoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: "top left" }}
                    className="absolute top-[calc(100%+8px)] left-0 bg-[--raised] rounded-input border border-s-ink/[0.08] shadow-v5-float z-50 overflow-hidden min-w-[280px]"
                  >
                    <p className="px-3 pt-3 pb-1 text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/40">
                      {tc("chooseCategory")}
                    </p>
                    <div className="grid grid-cols-3 gap-2 p-3">
                      {WAS_CATEGORIES.map(({ key, emoji }) => (
                        <button
                          key={key}
                          onClick={() => {
                            activateSegment(null);
                            router.push(`/${locale}/${key}`);
                          }}
                          aria-label={tNav(key as Parameters<typeof tNav>[0])}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-[10px] hover:bg-s-ink/[0.04] transition-colors duration-150 text-center cursor-pointer"
                        >
                          <span className="text-[24px] leading-none">{emoji}</span>
                          <span className="text-[12px] font-heading text-s-ink/70">{tNav(key as Parameters<typeof tNav>[0])}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Autosuggest dropdown — shown when Was is active and user is typing */}
              <AnimatePresence>
                {activeSegment === 'category' && query.length >= 2 && (
                  <motion.div
                    variants={airbnbPopoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: "top center" }}
                    className="absolute top-[calc(100%+8px)] left-0 bg-[--raised] rounded-input border border-s-ink/[0.08] shadow-v5-float z-50 overflow-hidden"
                  >
                    <ServiceAutosuggest
                      query={query}
                      locale={locale}
                      city={city}
                      onSelect={(item) => {
                        activateSegment(null);
                        if (item.type === "salon" && item.slug) {
                          router.push(`/${locale}/salon/${item.slug}`);
                        } else if (item.type === "service" && item.category) {
                          router.push(
                            `/${locale}/${item.category}?service=${encodeURIComponent(item.name.toLowerCase())}`
                          );
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px bg-s-ink/[0.08] self-stretch my-3" />

            {/* Segment 2: Wo */}
            <div className="relative flex-shrink-0 flex items-stretch">
              <button
                onClick={() => activateSegment(activeSegment === 'city' ? null : 'city')}
                className={cn(
                  "flex flex-col justify-center px-6 h-full transition-colors duration-150",
                  activeSegment === 'city'
                    ? "bg-white rounded-search shadow-elevation-2"
                    : activeSegment !== null
                      ? "hover:bg-s-ink/[0.12] rounded-full cursor-pointer"
                      : "hover:bg-s-ink/[0.03] transition-colors rounded-none cursor-pointer"
                )}
                style={{ minWidth: 140 }}
              >
                <span className="text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/40 leading-none mb-1 text-left">
                  {t("segWo") ?? "Wo"}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] font-body font-medium text-s-ink">
                  <MapPin size={13} className="text-s-ink/50 shrink-0" />
                  {city === "all"
                    ? tc("everywhere")
                    : getCityName(city as any, locale)}
                </span>
              </button>

              {/* City dropdown */}
              <AnimatePresence>
                {activeSegment === 'city' && (
                  <motion.div
                    variants={airbnbPopoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: "top center" }}
                    className="absolute top-[calc(100%+8px)] left-0 bg-[--raised] rounded-input border border-s-ink/[0.08] shadow-v5-float z-50 overflow-hidden min-w-[160px]"
                  >
                    {/* Nationwide option */}
                    <button
                      onClick={() => {
                        setCity("all");
                        activateSegment(null);
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("solen_last_city");
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-[13px] font-body font-medium hover:bg-s-ink/[0.04] transition-colors",
                        city === "all" ? "text-s-coral font-semibold" : "text-s-ink/70"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", city === "all" ? "bg-s-coral" : "bg-transparent")} />
                      {tc("everywhereCH")}
                    </button>
                    <div className="border-t border-s-ink/[0.06] my-1" />
                    {CITY_SLUGS.map((slug) => (
                      <button
                        key={slug}
                        onClick={() => {
                          setCity(slug);
                          activateSegment(null);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("solen_last_city", slug);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-[13px] font-body font-medium hover:bg-s-ink/[0.04] transition-colors",
                          city === slug ? "text-s-coral font-semibold" : "text-s-ink/70"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", city === slug ? "bg-s-coral" : "bg-transparent")} />
                        {getCityName(slug, locale)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px bg-s-ink/[0.08] self-stretch my-3" />

            {/* Segment 3: Wann */}
            <div className="relative flex-shrink-0 flex items-stretch">
              <button
                onClick={() => activateSegment(activeSegment === 'date' ? null : 'date')}
                className={cn(
                  "flex flex-col justify-center px-6 h-full transition-colors duration-150",
                  activeSegment === 'date'
                    ? "bg-white rounded-search shadow-elevation-2"
                    : activeSegment !== null
                      ? "hover:bg-s-ink/[0.12] rounded-full cursor-pointer"
                      : "hover:bg-s-ink/[0.03] transition-colors rounded-none cursor-pointer"
                )}
                style={{ minWidth: 140 }}
              >
                <span className="text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/40 leading-none mb-1 text-left">
                  {t("segWann") ?? "Wann"}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] font-body font-medium text-s-ink">
                  <Calendar size={13} className="text-s-ink/50 shrink-0" />
                  {dateLabel}
                </span>
              </button>

              {/* Date dropdown */}
              <AnimatePresence>
                {activeSegment === 'date' && (
                  <motion.div
                    variants={airbnbPopoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: "top center" }}
                    className="absolute top-[calc(100%+8px)] left-0 bg-[--raised] rounded-input border border-s-ink/[0.08] shadow-v5-float z-50 overflow-hidden min-w-[160px]"
                  >
                    {[
                      { key: "today",    label: t("wannDefault") ?? "Heute" },
                      { key: "tomorrow", label: t("tomorrow") ?? "Morgen" },
                      { key: "weekend",  label: t("thisWeekend") ?? "Dieses Wochenende" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { setDateKey(key); activateSegment(null); }}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-[13px] font-body font-medium hover:bg-s-ink/[0.04] transition-colors",
                          dateKey === key ? "text-s-coral font-semibold" : "text-s-ink/70"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", dateKey === key ? "bg-s-coral" : "bg-transparent")} />
                        {label}
                      </button>
                    ))}
                    {/* Calendar for custom date */}
                    <div className="border-t border-s-ink/[0.07] px-3 pb-3 pt-2">
                      <p className="text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/40 mb-2">
                        {tc("otherDate")}
                      </p>
                      <DayPicker
                        mode="single"
                        selected={customDate}
                        onSelect={(day: Date | undefined) => {
                          if (!day) return;
                          setCustomDate(day);
                          setDateKey("custom");
                          activateSegment(null);
                        }}
                        disabled={{ before: new Date() }}
                        style={{ margin: 0, padding: 0 }}
                        classNames={{
                          root: "!text-[12px] !font-body !p-0 rdp-custom",
                          day_selected: "!bg-s-coral !text-white",
                          day_today: "!font-bold !text-s-coral",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search button */}
            <div className="flex items-center pr-2 pl-3">
              <motion.button
                layout
                onClick={handleSearch}
                aria-label={tNav("search") ?? "Suchen"}
                className={cn(
                  "flex items-center justify-center gap-2 text-white active:scale-[0.97] transition-[transform,background-color] duration-150 bg-s-coral",
                  "rounded-full",
                  activeSegment !== null
                    ? "py-3 px-5"    // Expanded pill
                    : "w-12 h-12"   // Collapsed circle
                )}
                style={{
                  boxShadow: "0 2px 8px rgba(232,98,74,.35)",
                }}
                transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
              >
                <Search size={16} strokeWidth={3} className="text-white shrink-0" />
                <AnimatePresence>
                  {activeSegment !== null && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="text-[14px] font-heading overflow-hidden whitespace-nowrap"
                    >
                      {tNav("search") ?? "Suchen"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
