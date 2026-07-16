import type { SalonCategory } from "@/lib/types";

// reinvent-ok: this IS the canonical category-select source (CATEGORY_OPTIONS), not a
// re-declaration. Emoji removed (A6, dashboard not exempt); chips render label-only,
// matching the create wizard's text-only category chips.
export interface CategoryOption {
  value: SalonCategory;
  label: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "coiffeur",   label: "Coiffeur" },
  { value: "barbershop", label: "Barbershop" },
  { value: "nails",      label: "Nails" },
  { value: "spa",        label: "Spa / Massage" },
];
