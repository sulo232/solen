import {
  Gem,
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
export const CATEGORIES: SearchCategory[] = [
  {
    label: "Coiffeur",
    icon: Scissors,
    bg: "bg-[#FAF2E5]",
    fg: "text-[#C97A57]",
  },
  {
    label: "Barbershop",
    icon: Scissors,
    bg: "bg-[#E8DDC9]",
    fg: "text-[#2A1F18]",
  },
  {
    label: "Nails",
    icon: Gem,
    bg: "bg-[#D4DDC8]",
    fg: "text-[#8E4A2D]",
  },
  {
    label: "Spa & Wellness",
    icon: Leaf,
    bg: "bg-[#D4EBD9]",
    fg: "text-[#0F3D26]",
  },
];
