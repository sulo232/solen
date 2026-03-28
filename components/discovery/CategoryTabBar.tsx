"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

export interface CategoryTab {
  key: string;
  labelKey: string;
}

export const DISCOVERY_CATEGORIES: CategoryTab[] = [
  { key: "all",     labelKey: "all" },
  { key: "hair",    labelKey: "hair" },
  { key: "nails",   labelKey: "nails" },
  { key: "lashes",  labelKey: "lashes" },
  { key: "brows",   labelKey: "brows" },
  { key: "makeup",  labelKey: "makeup" },
];

interface CategoryTabBarProps {
  activeCategory: string;
  onChange: (key: string) => void;
}

export default function CategoryTabBar({ activeCategory, onChange }: CategoryTabBarProps) {
  const t = useTranslations("discover.tabs") as any;
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
      role="tablist"
      aria-label="Kategorien"
    >
      {DISCOVERY_CATEGORIES.map((tab) => {
        const isActive = activeCategory === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={[
              "flex-shrink-0 px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
              isActive
                ? "bg-s-coral text-white shadow-coral-glow"
                : "bg-s-bg-surface dark:bg-s-dm-surface text-s-ink/70 dark:text-s-dm-text/70 border border-s-ink/10 dark:border-white/10 hover:bg-s-ink/[0.08] dark:hover:bg-white/[0.12]",
            ].join(" ")}
            style={
              isActive
                ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" }
                : undefined
            }
          >
            {t(tab.labelKey as any)}
          </button>
        );
      })}
    </div>
  );
}
