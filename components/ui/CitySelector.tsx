"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CITY_SLUGS, getCityName, type CitySlug } from "@/lib/cities";
import { getPersistedCity, setPersistedCity, clearPersistedCity } from "@/lib/city-cookie";

interface CitySelectorProps {
  variant?: "header" | "footer" | "menu";
  onCityChange?: (city: CitySlug | null) => void;
}

export default function CitySelector({ variant = "header", onCityChange }: CitySelectorProps) {
  const locale = useLocale();
  const t = useTranslations("cities");
  const [selectedCity, setSelectedCity] = useState<CitySlug | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted city on mount
  useEffect(() => {
    setSelectedCity(getPersistedCity());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (slug: CitySlug | null) => {
    setSelectedCity(slug);
    if (slug) {
      setPersistedCity(slug);
    } else {
      clearPersistedCity();
    }
    setIsOpen(false);
    onCityChange?.(slug);
  };

  const displayName = selectedCity ? getCityName(selectedCity, locale) : t("all");

  if (variant === "footer") {
    return (
      <div className="flex gap-4 flex-wrap">
        {CITY_SLUGS.map((slug) => (
          <button
            key={slug}
            onClick={() => handleSelect(slug)}
            className={`text-sm font-body transition-colors duration-150 ${
              selectedCity === slug
                ? "text-s-coral font-semibold"
                : "text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text"
            }`}
          >
            {getCityName(slug, locale)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 text-sm font-body transition-all duration-150
          ${variant === "menu"
            ? "w-full px-4 py-3 rounded-input bg-s-bg-surface dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text"
            : "px-3 py-1.5 rounded-pill border border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-ink/20 dark:hover:border-white/20 hover:text-s-ink dark:hover:text-s-dm-text"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("select")}
      >
        <MapPin size={14} className="text-s-coral shrink-0" aria-hidden="true" />
        <span className="truncate">{displayName}</span>
        <ChevronDown size={12} className={`shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 mt-2 min-w-[180px] rounded-input overflow-hidden
              bg-[--raised] dark:bg-s-dm-surface
              border border-s-ink/10 dark:border-white/10
              shadow-warm-lg
              ${variant === "menu" ? "left-0 right-0" : "right-0"}
            `}
            role="listbox"
            aria-label={t("select")}
          >
            {/* "All cities" option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-body text-s-ink dark:text-s-dm-text hover:bg-s-bg-surface dark:hover:bg-s-dm-bg transition-colors duration-150"
              role="option"
              aria-selected={selectedCity === null}
            >
              <span className="flex-1 text-left">{t("all")}</span>
              {selectedCity === null && <Check size={14} className="text-s-coral shrink-0" />}
            </button>

            <div className="h-px bg-s-ink/5 dark:bg-white/5" />

            {CITY_SLUGS.map((slug) => (
              <button
                key={slug}
                onClick={() => handleSelect(slug)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-body text-s-ink dark:text-s-dm-text hover:bg-s-bg-surface dark:hover:bg-s-dm-bg transition-colors duration-150"
                role="option"
                aria-selected={selectedCity === slug}
              >
                <span className="flex-1 text-left">{getCityName(slug, locale)}</span>
                {selectedCity === slug && <Check size={14} className="text-s-coral shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
