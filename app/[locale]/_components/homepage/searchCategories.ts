import {
  Leaf,
  Scissors,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type SearchCategory = {
  label: string;
  icon: LucideIcon;
  bg: string; // tailwind arbitrary-value bg class — V3 cat-color combos per V2-D48
  fg: string; // tailwind arbitrary-value text class
  count: string; // hardcoded count for v1 per plan D9 — refresh quarterly
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
 * COUNTS HARDCODED — refresh from production via:
 *   select unnest(categories) as cat, count(*) from salons
 *   where is_active group by cat order by count desc
 */
export const CATEGORIES: SearchCategory[] = [
  {
    label: "Coiffeur",
    icon: Scissors,
    bg: "bg-[#FAF2E5]",
    fg: "text-[#C97A57]",
    count: "42 Salons",
  },
  {
    label: "Barbershop",
    icon: Scissors,
    bg: "bg-[#E8DDC9]",
    fg: "text-[#2A1F18]",
    count: "18 Salons",
  },
  {
    label: "Nails",
    icon: Sparkles,
    bg: "bg-[#D4DDC8]",
    fg: "text-[#8E4A2D]",
    count: "31 Salons",
  },
  {
    label: "Spa & Wellness",
    icon: Leaf,
    bg: "bg-[#D4EBD9]",
    fg: "text-[#0F3D26]",
    count: "14 Salons",
  },
];
