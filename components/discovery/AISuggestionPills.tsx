"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * AI Suggestion Pills – quick-tap trending style/service suggestions.
 * Shown on the discovery page to help users explore popular looks.
 */

interface AISuggestionPillsProps {
  category: string;
  onSelect: (term: string) => void;
}

const SUGGESTIONS: Record<string, { label: string; emoji: string }[]> = {
  all: [
    { label: "Balayage", emoji: "🎨" },
    { label: "Curtain Bangs", emoji: "✂️" },
    { label: "Gel Nails", emoji: "💅" },
    { label: "Herrenschnitt", emoji: "💈" },
    { label: "Facial", emoji: "🧖" },
    { label: "Wimpern", emoji: "👁️" },
    { label: "Locken", emoji: "🌀" },
    { label: "Braut-Styling", emoji: "👰" },
  ],
  haare: [
    { label: "Balayage", emoji: "🎨" },
    { label: "Curtain Bangs", emoji: "✂️" },
    { label: "Bob", emoji: "💇" },
    { label: "Locken", emoji: "🌀" },
    { label: "Highlights", emoji: "☀️" },
    { label: "Braut-Styling", emoji: "👰" },
    { label: "Pixie Cut", emoji: "✨" },
    { label: "Toner", emoji: "🧴" },
  ],
  nails: [
    { label: "Gel Nails", emoji: "💅" },
    { label: "French Tips", emoji: "🤍" },
    { label: "Nail Art", emoji: "🎨" },
    { label: "Maniküre", emoji: "✋" },
    { label: "Pediküre", emoji: "🦶" },
    { label: "Chrome Nails", emoji: "🪩" },
    { label: "Acryl", emoji: "💎" },
  ],
  barbershop: [
    { label: "Fade", emoji: "💈" },
    { label: "Buzz Cut", emoji: "⚡" },
    { label: "Bart-Trim", emoji: "🧔" },
    { label: "Skin Fade", emoji: "🔪" },
    { label: "Mullet", emoji: "🎸" },
    { label: "Line-Up", emoji: "📐" },
  ],
  makeup: [
    { label: "Braut-Makeup", emoji: "👰" },
    { label: "Contouring", emoji: "🖌️" },
    { label: "Wimpern", emoji: "👁️" },
    { label: "Augenbrauen", emoji: "🪮" },
    { label: "Smokey Eyes", emoji: "💨" },
    { label: "Natural Glow", emoji: "✨" },
  ],
  spa: [
    { label: "Facial", emoji: "🧖" },
    { label: "Massage", emoji: "💆" },
    { label: "Peeling", emoji: "🧼" },
    { label: "Hot Stone", emoji: "🪨" },
    { label: "Anti-Aging", emoji: "⏳" },
  ],
  waxing: [
    { label: "Brazilian", emoji: "🌴" },
    { label: "Beine", emoji: "🦵" },
    { label: "Gesicht", emoji: "😊" },
    { label: "Achseln", emoji: "💪" },
    { label: "Sugaring", emoji: "🍯" },
  ],
};

export default function AISuggestionPills({ category, onSelect }: AISuggestionPillsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const pills = SUGGESTIONS[category] ?? SUGGESTIONS.all;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      <span className="shrink-0 flex items-center gap-1 text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-coral/70">
        <Sparkles size={11} />
        Trending
      </span>
      {pills.map(({ label, emoji }) => (
        <button
          key={label}
          onClick={() => {
            setSelected(selected === label ? null : label);
            onSelect(selected === label ? "" : label);
          }}
          className={[
            "shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-pill text-[11px] font-heading font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
            selected === label
              ? "bg-s-coral text-white shadow-[0_2px_6px_rgba(232,98,74,.3)]"
              : "bg-s-bg-sunken dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-ink/[0.07] dark:hover:bg-white/[0.10] border border-s-ink/[0.06] dark:border-white/[0.06]",
          ].join(" ")}
        >
          <span className="text-xs">{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
