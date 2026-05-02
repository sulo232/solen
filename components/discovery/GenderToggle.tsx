"use client";

import type { DiscoveryGender } from "@/lib/types";
import { useTranslations } from "next-intl";

const OPTION_KEYS: (DiscoveryGender | "all")[] = ["all", "female", "male", "unisex"];

interface GenderToggleProps {
  selected: DiscoveryGender | "all";
  onSelect: (g: DiscoveryGender | "all") => void;
}

export default function GenderToggle({ selected, onSelect }: GenderToggleProps) {
  const t = useTranslations("discover.gender") as any;

  return (
    <div className="flex gap-1 bg-s-ink/5 rounded-pill p-0.5">
      {OPTION_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          aria-pressed={selected === key}
          className={[
            "px-3 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-[background-color,color] duration-150",
            selected === key
              ? "bg-[--raised] text-s-ink shadow-warm-sm"
              : "text-s-ink/40 hover:text-s-ink/60",
          ].join(" ")}
        >
          {t(key === "female" ? "women" : key === "male" ? "men" : key)}
        </button>
      ))}
    </div>
  );
}
