"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * AI Suggestion Pills – quick-tap trending style/service suggestions.
 * Shown on the discovery page to help users explore popular looks.
 */

interface AISuggestionPillsProps {
  category: string;
  onSelect: (term: string) => void;
}

const SUGGESTIONS: Record<string, { label: string }[]> = {
  all: [
    { label: "Balayage" },
    { label: "Curtain Bangs" },
    { label: "Gel Nails" },
    { label: "Herrenschnitt" },
    { label: "Facial" },
    { label: "Wimpern" },
    { label: "Locken" },
    { label: "Braut-Styling" },
  ],
  haare: [
    { label: "Balayage" },
    { label: "Curtain Bangs" },
    { label: "Bob" },
    { label: "Locken" },
    { label: "Highlights" },
    { label: "Braut-Styling" },
    { label: "Pixie Cut" },
    { label: "Toner" },
  ],
  nails: [
    { label: "Gel Nails" },
    { label: "French Tips" },
    { label: "Nail Art" },
    { label: "Maniküre" },
    { label: "Pediküre" },
    { label: "Chrome Nails" },
    { label: "Acryl" },
  ],
  barbershop: [
    { label: "Fade" },
    { label: "Buzz Cut" },
    { label: "Bart-Trim" },
    { label: "Skin Fade" },
    { label: "Mullet" },
    { label: "Line-Up" },
  ],
  makeup: [
    { label: "Braut-Makeup" },
    { label: "Contouring" },
    { label: "Wimpern" },
    { label: "Augenbrauen" },
    { label: "Smokey Eyes" },
    { label: "Natural Glow" },
  ],
  spa: [
    { label: "Facial" },
    { label: "Massage" },
    { label: "Peeling" },
    { label: "Hot Stone" },
    { label: "Anti-Aging" },
  ],
  waxing: [
    { label: "Brazilian" },
    { label: "Beine" },
    { label: "Gesicht" },
    { label: "Achseln" },
    { label: "Sugaring" },
  ],
};

export default function AISuggestionPills({ category, onSelect }: AISuggestionPillsProps) {
  const t = useTranslations("discover") as any;
  const [selected, setSelected] = useState<string | null>(null);
  const pills = SUGGESTIONS[category] ?? SUGGESTIONS.all;

  return (
    <div className="relative scroll-fade-right">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {/* V3-D346 (2026-05-29): eyebrow swept to plain ink-3 text — dropped Sparkles icon (A12), accent→ink-3 (A9), .14em→.08em (A8). */}
        <span className="shrink-0 text-[9px] font-heading uppercase tracking-[.08em] text-s-ink-3">
          {t("trending")}
        </span>
        {pills.map(({ label }) => (
          <button
            key={label}
            aria-pressed={selected === label}
            onClick={() => {
              setSelected(selected === label ? null : label);
              onSelect(selected === label ? "" : label);
            }}
            className={[
              "shrink-0 px-3 py-1.5 rounded-pill text-[11px] font-heading whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-150",
              selected === label
                ? "bg-s-ink text-white border border-s-ink shadow-elevation-2"
                : "border border-s-ink/[0.08] text-s-ink/65 bg-white/70 hover:border-s-ink/40 hover:text-s-ink",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
