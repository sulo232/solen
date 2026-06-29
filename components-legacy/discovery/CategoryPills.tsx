"use client";

import type { DiscoveryCategory } from "@/lib/types";
import { useTranslations } from "next-intl";
import { DISCOVERY_CATEGORIES } from "./CategoryTabBar";

// V3-D392: consume the single shared category list (CategoryTabBar) so the drawer can't drift out of sync — this is
// where "makeup / waxing" had rotted after the tab bar moved to hair/nails/lashes/brows (user: "we don't have makeup
// and waxing").
const CATEGORY_KEYS = DISCOVERY_CATEGORIES.map((c) => c.key) as (DiscoveryCategory | "all")[];

interface CategoryPillsProps {
  selected: DiscoveryCategory | "all";
  onSelect: (cat: DiscoveryCategory | "all") => void;
}

export default function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  const t = useTranslations("discover.tabs") as any;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORY_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          aria-pressed={selected === key}
          /* V3-D392: sentence-case per §2.5 rule A7 (tab-label role — only Eyebrow/Tag may be uppercase), matching the
             CategoryTabBar treatment so the same categories don't read differently in the drawer vs the feed. */
          /* Selected = calm gray fill, never black (owner 2026-06-29) , the TabPill treatment:
             sunken fill + ink text + semibold over a white unselected so the selection reads. */
          className={[
            "px-4 py-2.5 rounded-pill text-xs font-heading font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
            selected === key
              ? "bg-s-bg-sunken text-s-ink font-semibold"
              : "bg-white text-s-ink-2 hover:text-s-ink",
          ].join(" ")}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
