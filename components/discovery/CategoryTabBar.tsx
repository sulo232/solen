"use client";

import { useRef } from "react";

export interface CategoryTab {
  key: string;
  label: string;
}

export const DISCOVERY_CATEGORIES: CategoryTab[] = [
  { key: "all",     label: "Alle" },
  { key: "hair",    label: "Hair" },
  { key: "nails",   label: "Nails" },
  { key: "lashes",  label: "Lashes" },
  { key: "brows",   label: "Brows" },
  { key: "makeup",  label: "Makeup" },
];

interface CategoryTabBarProps {
  activeCategory: string;
  onChange: (key: string) => void;
}

export default function CategoryTabBar({ activeCategory, onChange }: CategoryTabBarProps) {
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
              "flex-shrink-0 px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-all duration-150",
              isActive
                ? "bg-s-coral text-white"
                : "bg-s-ink/[0.05] dark:bg-white/[0.07] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.12]",
            ].join(" ")}
            style={
              isActive
                ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" }
                : undefined
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
