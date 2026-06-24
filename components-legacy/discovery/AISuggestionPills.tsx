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
  spa: [
    { label: "Facial" },
    { label: "Massage" },
    { label: "Peeling" },
    { label: "Hot Stone" },
    { label: "Anti-Aging" },
  ],
};

export default function AISuggestionPills({ category, onSelect }: AISuggestionPillsProps) {
  const t = useTranslations("discover") as any;
  const [selected, setSelected] = useState<string | null>(null);
  const pills = SUGGESTIONS[category] ?? SUGGESTIONS.all;

  return (
    <div>
      {/* Plain "Trending" label (no decorative icon, per the approved search mockup 2026-06-23). */}
      <p className="px-1 font-heading text-[13px] font-bold tracking-[-0.01em] text-s-ink">{t("trending")}</p>
      {/* Pills WRAP (calm, all visible). Selected = ink fill, NO ring (owner 2026-06-23: the blue outline read as the
          banned focus ring). Unselected = sunken pill + hairline (matches the category sub-style pills). */}
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {pills.map(({ label }) => (
          <button
            key={label}
            aria-pressed={selected === label}
            onClick={() => {
              setSelected(selected === label ? null : label);
              onSelect(selected === label ? "" : label);
            }}
            className={[
              "rounded-pill px-3.5 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-[background-color,color,border-color] duration-150",
              selected === label
                ? "border border-s-ink bg-s-ink text-white"
                : "border border-s-border bg-white text-s-ink-2 hover:text-s-ink",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
