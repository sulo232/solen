import {
  Gem,
  Leaf,
  Scissors,
  type LucideIcon,
} from "lucide-react";

export type SearchCategory = {
  label: string;
  icon: LucideIcon;
  /**
   * The category's OWN drawn icon, the one this project already ships in
   * `/public/icons/categories/v2/`. Owner 2026-08-12: "the icon palletes dont make any scence and
   * doesnt resemble the icon seta that are made yk". He is right on both halves. A Lucide glyph in
   * a tinted box is not the icon set this app owns, and a hue I reasoned my way to is not the
   * colour that set is drawn in. Surfaces that can show art use this; the Lucide `icon` above stays
   * for the places that cannot.
   */
  art: string;
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
 * THE TINT SYSTEM, SECOND PASS , the colours now come OUT OF THE ICONS instead of out of my head.
 *
 * Owner 2026-08-12, on the first pass: "the icon palletes dont make any scence and doesnt resemble
 * the icon seta that are made yk". Correct on both counts, and the drift ledger had already logged
 * this exact mistake once ("used onboarding PHOTOS when real category ICONS existed").
 *
 * WHAT THE ICON SET WE OWN IS ACTUALLY DRAWN IN, measured off the art itself (alpha > 128, pixels
 * with real colour in them, dominant hue weighted by how colourful each pixel is):
 *     v2/coiffeur.png  a YELLOW hair dryer      hue  90, mean C* 63, 37% of the art has colour
 *     v2/barber.png    an ORANGE barber chair   hue  50, mean C* 56, 63%
 *     v2/nails.png     a ROSE polish bottle     hue  20, mean C* 51, 72%
 *     v2/spa.png       dark stones, GREEN leaf  hue 120, mean C* 68, 6% (the leaf is the only colour)
 *
 * THE RULE IS UNCHANGED and still holds the set together: one lightness and one colourfulness on
 * every tile (L*=92 C*=12) and on every fallback glyph (L*=42 C*=38). What changed is where the
 * hue comes from. It is no longer reasoned, it is READ OFF THE DRAWING each row shows.
 *
 * MEASURED: fallback glyph against its own tile is 4.91, 4.91, 4.89 and 4.93 to 1, all above the
 * 3:1 graphical floor and the 4.5:1 text floor.
 *
 * FIRST PASS, kept as a record of what was wrong with it: hues 75 / 32 / 0 / 150, argued from
 * "warm gold, barber pole, polish rose, spa green". Close enough to sound right and derived from
 * nothing, which is exactly what he objected to.
 */
export const CATEGORIES: SearchCategory[] = [
  {
    label: "Coiffeur",
    icon: Scissors,
    art: "/icons/categories/v2/coiffeur.png",
    bg: "bg-[#F2E7D1]", // drift-ok: read off v2/coiffeur.png, hue 90, at the system L*=92 C*=12
    fg: "text-[#756121]", // drift-ok: same hue at L*=42 C*=38, 4.91:1 on its own tile
  },
  {
    label: "Barbershop",
    icon: Scissors,
    art: "/icons/categories/v2/barber.png",
    bg: "bg-[#FEE3D7]", // drift-ok: read off v2/barber.png, hue 50, at the system L*=92 C*=12
    fg: "text-[#935234]", // drift-ok: same hue at L*=42 C*=38, 4.91:1 on its own tile
  },
  {
    label: "Nails",
    icon: Gem,
    art: "/icons/categories/v2/nails.png",
    bg: "bg-[#FFE1E1]", // drift-ok: read off v2/nails.png, hue 20, at the system L*=92 C*=12
    fg: "text-[#9D494F]", // drift-ok: same hue at L*=42 C*=38, 4.89:1 on its own tile
  },
  {
    label: "Spa & Wellness",
    icon: Leaf,
    art: "/icons/categories/v2/spa.png",
    bg: "bg-[#E5EBD4]", // drift-ok: read off v2/spa.png's leaf, hue 120, at the system L*=92 C*=12
    fg: "text-[#556A2A]", // drift-ok: same hue at L*=42 C*=38, 4.93:1 on its own tile
  },
];
