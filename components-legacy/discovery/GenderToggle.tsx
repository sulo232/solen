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
          /* V3-D392: sentence-case per §2.5 rule A7 — match the drawer's category pills (was uppercase). */
          /* V3-D394: selected segment = accent (blue) — discovery selected-state sweep. */
          className={[
            "px-3 py-2 rounded-pill text-[11px] font-heading font-medium transition-[background-color,color] duration-150",
            selected === key
              ? "bg-s-ink text-white shadow-warm-sm"
              : "text-s-ink/40 hover:text-s-ink-2",
          ].join(" ")}
        >
          {t(key === "female" ? "women" : key === "male" ? "men" : key)}
        </button>
      ))}
    </div>
  );
}
