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
            "px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap transition-colors",
            selected === key
              ? "bg-s-coral text-white"
              : "bg-s-ink/5 dark:bg-white/10 text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-ink/10 dark:hover:bg-white/15",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
