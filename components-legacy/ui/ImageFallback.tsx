"use client";

import { cn } from "@/lib/utils";

/**
 * Salon card cover — A3 LOCKED 2026-05-03 (Phase 8 structural alignment).
 *
 * Reference: `public/solen-coral.html:225-245, 847-865`. Pre-launch we are NOT
 * using uploaded photos on cards — every salon card image is a solid
 * per-category color block with the salon name in massive Anton uppercase
 * centered on top. Replaces the gradient+noise placeholder.
 *
 * Per-category solid colors (from reference categories grid lines 813-820):
 *   COIFFEUR  #D4870A  amber-deep
 *   BARBER    #4A1E3C  plum
 *   NAILS     #E8624A  coral
 *   SPA       #7BA688  sage
 *   MAKEUP    #C9A96E  sand
 *   WAXING    #6BA3C8  blue
 *   (default) #1A1209  ink (when no category)
 *
 * Salon-name treatment: first word, uppercased, common prefix stripped
 * ("Salon Amara" → "AMARA", "Studio Lina" → "LINA", "Nori Barber" → "NORI").
 * Anton 56px desktop / 40px mobile, letter-spacing 0.04em, white 90%.
 *
 * Component name kept as `ImageFallback` for backward-compat across 4 import
 * sites. Misleading — this is no longer a *fallback*, it's the canonical
 * pattern. Rename to `SalonCardCover` is a future cleanup.
 */

const CATEGORY_COLORS: Record<string, string> = {
  coiffeur:   "#D4870A",
  hair:       "#D4870A",
  barber:     "#4A1E3C",
  barbershop: "#4A1E3C",
  nails:      "#E8624A",
  spa:        "#7BA688",
  massage:    "#7BA688",
  makeup:     "#C9A96E",
  beauty:     "#C9A96E",
  waxing:     "#6BA3C8",
  brows:      "#6BA3C8",
};

const DEFAULT_COLOR = "#1A1209";

/** Pick the salon's most distinctive word for the card hero label.
 *
 * Reference pattern (`solen-coral.html:847-865`): "AMARA" for "Salon Amara",
 * "NORI" for "Nori Barber" — i.e. the brand-distinctive word, uppercased.
 * Strip only the generic German/English prefix "Salon" / "Hairsalon" /
 * "Atelier"; leave "Studio", "Shop", "Barber", "Nail(s)" intact since those
 * often carry brand identity in real names ("Nail Studio Bliss" → "NAIL"
 * better than "STUDIO"; "Atelier Handwerk" → "HANDWERK" since "Atelier"
 * is purely generic in DACH naming).
 */
function pickCardLabel(salonName?: string): string {
  if (!salonName) return "";
  const STRIP = /^(salon|hairsalon|haarsalon|atelier)\b\s*/i;
  const cleaned = salonName.replace(STRIP, "").trim() || salonName.trim();
  const firstWord = cleaned.split(/\s+/)[0] ?? "";
  return firstWord.toUpperCase();
}

interface ImageFallbackProps {
  category?: string;
  salonName?: string;
  className?: string;
  /**
   * @deprecated A3 lock 2026-05-03: card cover always shows the salon-name
   * label. Prop retained for caller backward-compat but ignored.
   */
  showInitial?: boolean;
}

export default function ImageFallback({
  category,
  salonName,
  className,
}: ImageFallbackProps) {
  const bg = CATEGORY_COLORS[category?.toLowerCase() ?? ""] ?? DEFAULT_COLOR;
  const label = pickCardLabel(salonName);

  // Note: `relative` deliberately omitted — every caller passes `absolute inset-0`
  // and conflicting position utilities (Tailwind source order wins) caused the
  // div to collapse to text height. Caller owns positioning. 2026-05-03.
  return (
    <div
      className={cn(
        "overflow-hidden flex items-center justify-center select-none",
        className
      )}
      style={{ background: bg }}
      aria-hidden={!label}
    >
      {label && (
        <span
          className="font-heading text-white/90 leading-none text-center px-2"
          style={{
            fontSize: "clamp(32px, 12vw, 56px)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
