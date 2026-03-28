"use client";

import type { DiscoveryCategory } from "@/lib/types";

const CATEGORIES: { key: DiscoveryCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hair", label: "Hair" },
  { key: "nails", label: "Nails" },
  { key: "makeup", label: "Makeup" },
  { key: "waxing", label: "Waxing" },
];

interface CategoryPillsProps {
  selected: DiscoveryCategory | "all";
  onSelect: (cat: DiscoveryCategory | "all") => void;
}

export default function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={[
            "px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
            selected === key
              ? "bg-s-coral text-white"
              : "bg-s-ink/[0.05] dark:bg-white/[0.07] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.12]",
          ].join(" ")}
          style={selected === key ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
