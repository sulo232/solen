"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, MapPin, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CITY_SLUGS, getCityName, type CitySlug } from "@/lib/cities";
import { getPersistedCity } from "@/lib/city-cookie";
import { cn } from "@/lib/utils";

interface AirbnbSearchBarProps {
  scrolledPast80: boolean;
  locale: string;
  categoryCounts?: Record<string, number>;
}

const DATE_OPTIONS = [
  { key: "today",   labelKey: "wannDefault" },
  { key: "tomorrow", labelKey: "tomorrow" },
  { key: "weekend",  labelKey: "thisWeekend" },
] as const;

export default function AirbnbSearchBar({ scrolledPast80, locale, categoryCounts }: AirbnbSearchBarProps) {
  const t = useTranslations("home.guidedSearch") as any;
  const tNav = useTranslations("navigation") as any;
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [city, setCity] = useState<CitySlug>(() => getPersistedCity() ?? "basel");
  const [dateKey, setDateKey] = useState("today");
  const [cityOpen, setCityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (dateKey && dateKey !== "today") params.set("date", dateKey);
    const base = `/${locale}/${city}/search`;
    const qs = params.toString();
    router.push(qs ? `${base}?${qs}` : base);
  };

  const dateLabel = (() => {
    if (dateKey === "today") return t("wannDefault") ?? "Heute";
    if (dateKey === "tomorrow") return t("tomorrow") ?? "Morgen";
    if (dateKey === "weekend") return t("thisWeekend") ?? "Wochenende";
    return t("wannDefault") ?? "Heute";
  })();

  return (
    <AnimatePresence>
      {!scrolledPast80 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="hidden md:block"
        >
          <div
            className="flex items-stretch bg-[--raised] rounded-search border border-s-ink/[0.08] shadow-elevation-2 overflow-visible relative"
            style={{ height: 64 }}
          >
            {/* Segment 1: Was */}
            <div className="flex-1 flex flex-col justify-center px-6 cursor-text min-w-0">
              <label className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 leading-none mb-1">
                {t("segWas") ?? "Was"}
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t("placeholder") ?? "Salon, Service..."}
                className="bg-transparent text-[14px] font-body font-medium text-s-ink placeholder:text-s-ink/35 outline-none border-none w-full truncate"
              />
            </div>

            {/* Divider */}
            <div className="w-px bg-s-ink/[0.08] self-stretch my-3" />

            {/* Segment 2: Wo */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => { setCityOpen((v) => !v); setDateOpen(false); }}
                className="flex flex-col justify-center px-6 h-full cursor-pointer hover:bg-s-ink/[0.03] transition-colors rounded-none"
                style={{ minWidth: 140 }}
              >
                <span className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 leading-none mb-1 text-left">
                  {t("segWo") ?? "Wo"}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] font-body font-medium text-s-ink">
                  <MapPin size={13} className="text-s-coral shrink-0" />
                  {getCityName(city, locale)}
                </span>
              </button>

              {/* City dropdown */}
              <AnimatePresence>
                {cityOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[calc(100%+8px)] left-0 bg-[--raised] rounded-input border border-s-ink/[0.08] shadow-v5-float z-50 overflow-hidden min-w-[160px]"
                  >
                    {CITY_SLUGS.map((slug) => (
                      <button
                        key={slug}
                        onClick={() => {
                          setCity(slug);
                          setCityOpen(false);
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
            <div className="relative flex-shrink-0">
              <button
                onClick={() => { setDateOpen((v) => !v); setCityOpen(false); }}
                className="flex flex-col justify-center px-6 h-full cursor-pointer hover:bg-s-ink/[0.03] transition-colors rounded-none"
                style={{ minWidth: 140 }}
              >
                <span className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 leading-none mb-1 text-left">
                  {t("segWann") ?? "Wann"}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] font-body font-medium text-s-ink">
                  <Calendar size={13} className="text-s-coral shrink-0" />
                  {dateLabel}
                </span>
              </button>

              {/* Date dropdown */}
              <AnimatePresence>
                {dateOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[calc(100%+8px)] left-0 bg-[--raised] rounded-input border border-s-ink/[0.08] shadow-v5-float z-50 overflow-hidden min-w-[160px]"
                  >
                    {[
                      { key: "today",    label: t("wannDefault") ?? "Heute" },
                      { key: "tomorrow", label: t("tomorrow") ?? "Morgen" },
                      { key: "weekend",  label: t("thisWeekend") ?? "Dieses Wochenende" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { setDateKey(key); setDateOpen(false); }}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-[13px] font-body font-medium hover:bg-s-ink/[0.04] transition-colors",
                          dateKey === key ? "text-s-coral font-semibold" : "text-s-ink/70"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", dateKey === key ? "bg-s-coral" : "bg-transparent")} />
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search button */}
            <div className="flex items-center pr-2 pl-3">
              <button
                onClick={handleSearch}
                aria-label={tNav("search") ?? "Suchen"}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
                style={{ boxShadow: "0 2px 8px rgba(232,98,74,.35)" }}
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Click-away overlay for dropdowns */}
          {(cityOpen || dateOpen) && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => { setCityOpen(false); setDateOpen(false); }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
