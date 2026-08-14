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
 * THIRD PASS, and this one is a REVERSAL. Owner 2026-08-12: "no ths is 3d i told i to make it 2d
 * allat". The drawn icons I had just wired in from `/icons/categories/v2/` are 3D renders, a
 * yellow dryer with a specular highlight, an orange chair with shadow, a polish bottle with a
 * gradient. He does not want 3D on this surface and says he has said so before. So they are out.
 *
 * WHAT THE 2D SET WE ACTUALLY OWN LOOKS LIKE, sampled out of the SVG source rather than eyeballed:
 *     public/icons/category/coiffeur.svg    #F4553E on 7 paths, #FB9385 on 1   (hue 7.6, 7.1)
 *     public/icons/category/nails-test.svg  #E14F42 on 6 paths, #F3A39B on 2   (hue 4.9, 5.5)
 * Two facts fall out of that, and both matter more than my opinion:
 *   1. THE 2D SET IS MONOCHROME. Every saturated path in both files is the same coral red, give or
 *      take three degrees of hue. It was never drawn as one colour per category, so a per-category
 *      rainbow of tints contradicts the set instead of resembling it, which is the other half of
 *      what he objected to.
 *   2. IT IS TWO FILES. There is no barbershop and no spa in 2D. `nails-test.svg` is even named as
 *      a test. So a full 2D set does not exist yet and cannot be conjured here.
 *
 * WHAT SHIPS UNTIL IT DOES: 2D line glyphs, which is what Lucide is, on the neutral sunken tile,
 * carrying the set's own sampled coral. One colour across the four, because that is what the set
 * is. The `art` field stays on the type and stays empty, so the day the four 2D icons exist they
 * drop straight in.
 *
 * KILLED IN THIS PASS, recorded so it is not tried a fourth time: per-category tints. Pass one
 * argued hues (75/32/0/150), pass two read them off the 3D art (90/50/20/120). Both were rejected,
 * the second because the art itself was wrong.
 */
export const CATEGORIES: SearchCategory[] = [
  {
    label: "Coiffeur",
    icon: Scissors,
    art: "", // the 2D coiffeur.svg exists but its three siblings do not; see the note above
    bg: "bg-s-bg-sunken",
    fg: "text-[#D8412B]", // drift-ok: the 2D set's own coral. Sampled #F4553E measures 3.07:1 on the sunken tile, too close to the 3:1 icon floor to trust, so it is darkened to this: measured 4.06:1 on sunken and 4.46:1 on white, same hue
  },
  {
    label: "Barbershop",
    icon: Scissors,
    art: "",
    bg: "bg-s-bg-sunken",
    fg: "text-[#D8412B]", // drift-ok: same sampled coral, the 2D set is monochrome
  },
  {
    label: "Nails",
    icon: Gem,
    art: "",
    bg: "bg-s-bg-sunken",
    fg: "text-[#D8412B]", // drift-ok: same sampled coral
  },
  {
    label: "Spa & Wellness",
    icon: Leaf,
    art: "",
    bg: "bg-s-bg-sunken",
    fg: "text-[#D8412B]", // drift-ok: same sampled coral
  },
];
