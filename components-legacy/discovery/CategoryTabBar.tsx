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
  const td = useTranslations("discover") as any;
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none overscroll-x-contain"
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
            /* V3-D346 (2026-05-29): dropped inline green-tint shadow (retired brand) — canonical shadow-elevation-2 applies.
               V3-D378 (2026-05-30): sentence-case per §2.5 Tab-label role (rule A7 — only Eyebrow/Tag may be uppercase);
               dropped uppercase + .06em tracking, added font-medium (500). */
            className={[
              "flex-shrink-0 px-4 py-3 rounded-pill text-xs font-heading font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
              isActive
                ? "bg-s-ink text-white shadow-elevation-2"
                : "bg-s-bg-surface text-s-ink/70 border border-s-ink/10 hover:bg-s-ink/[0.08]",
            ].join(" ")}
          >
            {t(tab.labelKey as any)}
          </button>
        );
      })}
    </div>
  );
}
