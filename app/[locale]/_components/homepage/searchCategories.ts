import {
  Brush,
  Hand,
  Leaf,
  Scissors,
  type LucideIcon,
} from "lucide-react";

export type SearchCategory = {
  label: string;
  icon: LucideIcon;
  bg: string; // tailwind arbitrary-value bg class, V3 cat-color combos per V2-D48
  fg: string; // tailwind arbitrary-value text class
};

/**
 * V3 search-hub categories — V2-D51 Phase 3.
 *
 * Cat colors lock to V2-D48 Earthen Wellness Light + LIVE_TRUTH §2:
 *   Coiffeur     = cream     #FAF2E5 / terracotta  #C97A57
 *   Barbershop   = bone      #E8DDC9 / ink         #2A1F18
 *   Nails        = sage-pale #D4DDC8 / terra-deep  #8E4A2D
 *   Spa          = emerald-subtle #D4EBD9 / emerald-deep #0F3D26
 *
 * NOTE on §5h.2 color rule: cat-color bgs here are *identification*, not
 * *action affordance*. The action is the whole card click (which sets
 * `service` state); the bg color identifies which category this card
 * represents — same pattern as SalonCard's category badge. Emerald-only
 * action rule still holds (CTAs, primary links, focus rings).
 *
 * Count sub-line removed 2026-07-16 (fabricated: the DB had 20 active salons
 * TOTAL vs the 42-salon count this row used to claim for Coiffeur alone). Real
 * per-category counts need a server-side count query threaded into every
 * SearchOverlay mount (there's no server boundary here today, this list is a
 * plain client-side module); the sub-line may return once that query exists.
 */
/**
 * THE TINT SYSTEM (owner 2026-08-12, "B1 but acc make system for tint not jst random n also the
 * icons make ot make scence"). These four pairs are COMPUTED, not picked.
 *
 * ONE RULE: every tile sits at the same lightness and the same colourfulness, and only the HUE
 * changes. In CIE Lab, where those are measurable: tint L*=92 C*=12, glyph L*=42 C*=38.
 *
 * WHAT THIS REPLACED, measured on the values that were here before:
 *     tint   L* 86.94 to 95.78 (8.8 apart)    C* 7.23 to 12.50
 *     glyph  L* 12.85 to 59.00 (46.1 apart)   one nearly black next to a mid brown
 *     hue    86.0, 87.7, 126.1, 150.5         the first two 1.7 degrees apart, i.e. one colour
 * That is why the first two rows read as two greys however you tinted them.
 *
 * HUES, one reason each: 75 warm gold (kept), 32 barber-pole terracotta and 43 degrees clear of
 * the gold, 0 polish rose, 150 green (kept).
 *
 * MEASURED: glyph against its own tile is 4.87, 4.86, 4.87, 4.91 to 1, all above the 3:1
 * graphical floor and the 4.5:1 text floor.
 *
 * ICONS: Barbershop was a SECOND Scissors, identical to Coiffeur, which is what made the two rows
 * indistinguishable. All 5842 icons in the installed set were searched for a razor or clippers and
 * there is none, so it takes Brush, a shaving brush. Nails was Gem, a diamond, which is not a nail;
 * it takes Hand, the thing being treated. Sparkles is banned in this project by name.
 *
 * Mockup that carried these before they landed: /dev/search-color.
 */
export const CATEGORIES: SearchCategory[] = [
  {
    label: "Coiffeur",
    icon: Scissors,
    bg: "bg-[#F7E5D2]", // drift-ok: tint system 2026-08-12, L*=92 C*=12 h=75
    fg: "text-[#825C25]", // drift-ok: tint system 2026-08-12, L*=42 C*=38 h=75, 4.87:1 on its own tile
  },
  {
    label: "Barbershop",
    icon: Brush,
    bg: "bg-[#FFE1DC]", // drift-ok: tint system 2026-08-12, L*=92 C*=12 h=32
    fg: "text-[#9B4C44]", // drift-ok: tint system 2026-08-12, L*=42 C*=38 h=32, 4.86:1 on its own tile
  },
  {
    label: "Nails",
    icon: Hand,
    bg: "bg-[#FFE0E8]", // drift-ok: tint system 2026-08-12, L*=92 C*=12 h=0
    fg: "text-[#9B4864]", // drift-ok: tint system 2026-08-12, L*=42 C*=38 h=0, 4.87:1 on its own tile
  },
  {
    label: "Spa & Wellness",
    icon: Leaf,
    bg: "bg-[#D8EEDC]", // drift-ok: tint system 2026-08-12, L*=92 C*=12 h=150
    fg: "text-[#2B7042]", // drift-ok: tint system 2026-08-12, L*=42 C*=38 h=150, 4.91:1 on its own tile
  },
];
