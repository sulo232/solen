import type { SalonCategory } from "@/lib/types";

export interface CategoryOption {
  value: SalonCategory;
  label: string;
  emoji: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "coiffeur",   label: "Coiffeur",         emoji: "✂️" },
  { value: "barbershop", label: "Barbershop",        emoji: "🪒" },
  { value: "nails",      label: "Nails",             emoji: "💅" },
  { value: "spa",        label: "Spa / Massage",     emoji: "🧖" },
  { value: "makeup",     label: "Make-up / Kosmetik",emoji: "💄" },
  { value: "waxing",     label: "Waxing / Sugaring", emoji: "🌿" },
];
