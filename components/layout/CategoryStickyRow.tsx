"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getPersistedCity } from "@/lib/city-cookie";
import type { CitySlug } from "@/lib/cities";
// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"] as const;
type CategoryKey = (typeof CATEGORIES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryStickyRowProps {
  locale: string;
}

/**
 * Airbnb-style inline category icon row that appears in the sticky header
 * when the homepage category grid scrolls out of view.
 *
 * Listens for `categoryGridVisibility` CustomEvent dispatched by HomePage.tsx.
 * On non-homepage category pages, always visible.
 */
export default function CategoryStickyRow({ locale }: CategoryStickyRowProps) {
  const [visible, setVisible] = useState(false);
  const [persistedCity, setPersistedCity] = useState<CitySlug | null>(null);
  const pathname = usePathname();
  const t = useTranslations("navigation");

  // Read the user's persisted city on mount (cookie → localStorage fallback)
  useEffect(() => {
    setPersistedCity(getPersistedCity());
  }, []);

  // On category pages (e.g. /de/coiffeur) — always show since there's no
  // homepage grid to scroll past
  const isHomepage = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isCategoryPage = CATEGORIES.some((key) => pathname.includes(`/${key}`));

  useEffect(() => {
    if (!isHomepage) {
      // On non-homepage pages, show the row by default
      setVisible(isCategoryPage);
      return;
    }

    // On homepage: listen for the IntersectionObserver event
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setVisible(detail?.visible === false); // grid OUT of view → show row
    };
    window.addEventListener("categoryGridVisibility", handler);
    return () => window.removeEventListener("categoryGridVisibility", handler);
  }, [isHomepage, isCategoryPage]);

  // Detect which category is currently active from URL
  const currentCategory = CATEGORIES.find((key) => pathname.includes(`/${key}`));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="category-sticky-row"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden w-full"
        >
          <div
            className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-1 px-2 mx-auto max-w-5xl"
            role="tablist"
            aria-label={t("categories" as Parameters<typeof t>[0])}
          >
            {CATEGORIES.map((key) => {
              const isActive = currentCategory === key;
              return (
                <Link
                  key={key}
                  href={persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t(key as Parameters<typeof t>[0])}
                  className={cn(
                    "relative flex items-center px-4 py-2 shrink-0 transition-colors duration-150 whitespace-nowrap",
                    isActive
                      ? "text-s-ink font-semibold"
                      : "text-[s-ink/60] hover:text-s-ink"
                  )}
                >
                  <span className="text-[13px] font-heading font-semibold">
                    {t(key as Parameters<typeof t>[0])}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="cat-sticky-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-s-ink"
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
