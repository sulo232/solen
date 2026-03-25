"use client";

import type { DiscoveryGender } from "@/lib/types";

const OPTIONS: { key: DiscoveryGender | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "female", label: "Women" },
  { key: "male", label: "Men" },
  { key: "unisex", label: "Unisex" },
];

interface GenderToggleProps {
  selected: DiscoveryGender | "all";
  onSelect: (g: DiscoveryGender | "all") => void;
}

export default function GenderToggle({ selected, onSelect }: GenderToggleProps) {
  return (
    <div className="flex gap-1 bg-s-ink/5 dark:bg-white/5 rounded-pill p-0.5">
      {OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={[
            "px-3 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-all duration-150",
            selected === key
              ? "bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text shadow-warm-sm"
              : "text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink/60 dark:hover:text-s-dm-text/60",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
