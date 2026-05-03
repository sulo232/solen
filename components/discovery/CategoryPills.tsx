"use client";

import type { DiscoveryCategory } from "@/lib/types";
import { useTranslations } from "next-intl";

const CATEGORY_KEYS: (DiscoveryCategory | "all")[] = ["all", "hair", "nails", "makeup", "waxing"];

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
          className={[
            "px-4 py-2.5 rounded-pill text-[11px] font-heading uppercase tracking-[.06em] whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
            selected === key
              ? "bg-s-coral text-white"
              : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]:bg-white/[0.12]",
          ].join(" ")}
          style={selected === key ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
