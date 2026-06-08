"use client";
import { cn } from "@/lib/utils";
import type { DiscoveryCategory } from "@/lib/types";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

// V3-D396: ONLY real user-supplied icons (bg-removed, trimmed, normalised → /public/hair-patterns/), rendered as CSS
// masks so they inherit currentColor — ink by default, accent-blue when selected. NO hand-drawn fallbacks: any texture
// without a real icon (coily, bald) is HIDDEN from the row (see the map), never shown with a placeholder glyph.
const Mask = (src: string): ReactNode => (
  <span
    aria-hidden
    className="h-7 w-7 shrink-0"
    style={{
      backgroundColor: "currentColor",
      WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`,
      WebkitMaskSize: "contain", maskSize: "contain",
      WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
      WebkitMaskPosition: "center", maskPosition: "center",
    }}
  />
);
const PATTERN_GLYPHS: Record<string, ReactNode> = {
  straight: Mask("/hair-patterns/straight.png"),
  wavy: Mask("/hair-patterns/wavy.png"),
  curly: Mask("/hair-patterns/coily.png"), // dropped coil icon → used for the common "Curly" type
  protective: Mask("/hair-patterns/protective.png"),
};

const HAIR_TEXTURES = [
  { value: null, label: "All" },
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
  { value: "protective", label: "Protective" },
  { value: "bald", label: "Bald" },
];

const BEARD_TYPES = [
  { value: null, label: "All" },
  { value: "full", label: "Full" },
  { value: "goatee", label: "Goatee" },
  { value: "stubble", label: "Stubble" },
  { value: "fade", label: "Fade" },
  { value: "line-up", label: "Line-up" },
];

interface PatternSelectorProps {
  category: DiscoveryCategory | null;
  selected: string | null;
  onSelect: (texture: string | null) => void;
  /** V3-D395: when set, render this as a prominent sentence-case heading (feed "Search by pattern" row) instead of the
      small uppercase "Textur" eyebrow used inside the filter drawer. */
  heading?: string;
}

export default function PatternSelector({ category, selected, onSelect, heading }: PatternSelectorProps) {
  const t = useTranslations("discover") as any;
  const options = category === "beard" ? BEARD_TYPES : HAIR_TEXTURES;
  // Only show for hair and beard categories
  if (category && !["hair", "beard"].includes(category)) return null;

  return (
    <div>
      {heading === "" ? null : heading ? (
        <p className="mb-2.5 font-heading text-[13px] font-semibold tracking-[-0.01em] text-s-ink">{heading}</p>
      ) : (
        <p className="text-[9px] font-heading uppercase tracking-[.08em] text-s-ink/30 mb-2">
          {t("texture")}
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {options.map((opt) => {
          const glyph = opt.value ? PATTERN_GLYPHS[opt.value] : null;
          // V3-D396: hair textures without a real icon yet (coily, bald) are hidden — no placeholder glyphs. "All"
          // (value null) and beard label-tiles still render.
          if (category !== "beard" && opt.value && !glyph) return null;
          const active = selected === opt.value;
          return (
            <button
              key={opt.value ?? "all"}
              aria-pressed={active}
              onClick={() => onSelect(opt.value)}
              /* V3-D394: glyph-tile (icon draws the pattern) + accent selected-state. Sentence-case per §2.5 A7. */
              /* V3-D398 (council): "colours, not a pale shape" → selected = SOLID accent + white icon (was pale tint,
                 which read as disabled). Unselected = grey tile + full-ink icon (was greyed /55). */
              className={cn(
                "flex min-h-[60px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-transparent px-3 py-2.5 text-[11px] font-heading font-medium whitespace-nowrap transition-[background-color,color] duration-150",
                active
                  ? "bg-s-ink text-white"
                  : "bg-s-bg-sunken text-s-ink hover:bg-s-bg-sunken"
              )}
            >
              {glyph}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
