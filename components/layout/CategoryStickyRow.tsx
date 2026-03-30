"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CategoryDef = {
  key: string;
  Icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
};

const CATEGORIES: CategoryDef[] = [
  { key: "coiffeur", Icon: CoiffeurIcon },
  { key: "barbershop", Icon: BarberIcon },
  { key: "nails", Icon: NailsIcon },
  { key: "spa", Icon: SpaIcon },
  { key: "makeup", Icon: MakeupIcon },
  { key: "waxing", Icon: WaxingIcon },
];

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
  const pathname = usePathname();
  const t = useTranslations("navigation");

  // On category pages (e.g. /de/coiffeur) — always show since there's no
  // homepage grid to scroll past
  const isHomepage = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isCategoryPage = CATEGORIES.some((c) => pathname.includes(`/${c.key}`));

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
  const currentCategory = CATEGORIES.find((c) =>
    pathname.includes(`/${c.key}`)
  )?.key;

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
            {CATEGORIES.map(({ key, Icon }) => {
              const isActive = currentCategory === key;
              return (
                <Link
                  key={key}
                  href={`/${locale}/${key}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t(key as Parameters<typeof t>[0])}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg shrink-0 transition-colors relative",
                    isActive
                      ? "text-s-coral"
                      : "text-s-ink/45 dark:text-s-dm-text/45 hover:text-s-ink dark:hover:text-s-dm-text"
                  )}
                >
                  <Icon width={18} height={18} className="shrink-0" />
                  <span className="text-[9px] font-heading font-bold uppercase tracking-wider whitespace-nowrap leading-none">
                    {t(key as Parameters<typeof t>[0])}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="cat-sticky-underline"
                      className="absolute -bottom-0.5 left-2 right-2 h-[2px] rounded-full bg-s-coral"
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
