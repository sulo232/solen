"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";

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
        {/* V3-D346: eyebrow swept to plain ink-3 text. V3-D381 (2026-05-30): de-eyebrowed — sentence-case 12px
            (was uppercase+tracked 9px, the "weird font" treatment the user flagged). */}
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-s-ink tracking-[-0.01em]">
          {/* V3-D393: trending-up mark — a literal signal for "what's rising", not decoration. Stays ink (chrome). */}
          <TrendingUp size={14} className="shrink-0" aria-hidden />
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
            /* V3-D394: selected = accent (blue), matching the discovery selected-state sweep. */
            className={[
              "shrink-0 px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-150",
              selected === label
                ? "bg-s-ink text-white border border-s-ink"
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
