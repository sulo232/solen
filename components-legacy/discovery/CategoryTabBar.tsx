"use client";

import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DISCOVERY_CATEGORIES, type CategoryTab } from "@/lib/discovery-categories";

// DISCOVERY_CATEGORIES + CategoryTab moved to lib/discovery-categories (non-client) so server
// routes can import them; re-exported here for existing client consumers (inspo, CategoryPills).
export { DISCOVERY_CATEGORIES };
export type { CategoryTab };

interface CategoryTabBarProps {
  activeCategory: string;
  onChange: (key: string) => void;
  /** V3-D398: rendered as the LAST item inside the scroll row, so the filter button sits after the last pill. */
  trailing?: ReactNode;
}

export default function CategoryTabBar({ activeCategory, onChange, trailing }: CategoryTabBarProps) {
  const t = useTranslations("discover.tabs") as any;
  const td = useTranslations("discover") as any;
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none overscroll-x-contain"
      role="tablist"
      aria-label={td("tablist")}
    >
      {DISCOVERY_CATEGORIES.map((tab) => {
        const isActive = activeCategory === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            /* V3-D398 (council): text-only tab; active = SOLID accent + white (was the accent-pale tint, which the user
               read as washed-out — "colours, not a pale shape"). Category icons removed (nails/brows made no sense). */
            className={[
              "flex-shrink-0 px-4 py-3 rounded-pill text-xs font-heading font-medium whitespace-nowrap transition-[background-color,color] duration-150",
              isActive
                ? "bg-s-ink text-white"
                : "bg-s-bg-surface text-s-ink/70 border border-s-border hover:bg-s-bg-sunken",
            ].join(" ")}
          >
            {t(tab.labelKey as any)}
          </button>
        );
      })}
      {/* V3-D398: filter button rides at the END of the scroll row (after the last pill), not hardcoded to the right. */}
      {trailing}
    </div>
  );
}
