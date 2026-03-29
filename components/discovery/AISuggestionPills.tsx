"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
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
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      <span className="shrink-0 flex items-center gap-1 text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-coral/70">
        <Sparkles size={11} />
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
            "shrink-0 px-3 py-1.5 rounded-pill text-[11px] font-heading font-bold whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-150",
            selected === label
              ? "bg-s-coral text-white border border-s-coral shadow-[0_2px_6px_rgba(232,98,74,.3)]"
              : "border border-s-ink/[0.08] text-s-ink/65 dark:text-s-dm-text/65 bg-white/70 dark:bg-s-dm-surface hover:border-s-coral/40 hover:text-s-coral",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
