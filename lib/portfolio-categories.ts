// lib/portfolio-categories.ts
// Fixed per-salon-category taxonomy for the SALON portfolio gallery (salon_portfolio_images.category).
// Owner ask, 2026-07-25 (PDP_OVERHAUL.md X2/3b, "portfolio to be categories... like men's cut or a
// woman's cut, that the salon itself can upload those stuff and categorize it"): decided model A, a
// FIXED taxonomy per salon category, over free-text tags (B) or service-derived categories (C).
//
// ONE module read by the API route (app/api/salons/[slug]/gallery/route.ts), the dashboard
// (GalleryManager.tsx) and the PDP (SalonImageGallery.tsx), so a category name/order never drifts
// between the three surfaces. The DB CHECK constraint (supabase/migrations/20260725120000_salon_
// portfolio_images.sql) mirrors PORTFOLIO_CATEGORY_KEYS by hand (a plain CHECK can't see which
// salon owns a row, so it only guards "is this a real taxonomy value" globally; getPortfolioCategoriesForSalon
// below does the finer "valid for THIS salon's own category" check).
//
// Labels carry all 4 locales directly (name_de/en/fr/it), matching the services/service_categories
// convention already used in this codebase, rather than a next-intl messages/*.json entry per
// category, so the taxonomy stays genuinely ONE module (content included, not just keys).
import type { SalonCategory } from "@/lib/types";

export interface PortfolioCategory {
  /** Stored verbatim in salon_portfolio_images.category. Stable: never rename once live photos use it. */
  key: string;
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
}

/** Every valid stored category value. Kept in lockstep BY HAND with the DB CHECK constraint. */
export const PORTFOLIO_CATEGORY_KEYS = [
  "haircut",
  "fade",
  "beard",
  "styling",
  "womens_cut",
  "mens_cut",
  "color",
  "manicure",
  "pedicure",
  "nail_art",
  "gel",
  "face",
  "massage",
  "waxing",
  "other",
] as const;

export type PortfolioCategoryKey = (typeof PORTFOLIO_CATEGORY_KEYS)[number];

export const PORTFOLIO_CATEGORIES: Record<PortfolioCategoryKey, PortfolioCategory> = {
  haircut: { key: "haircut", name_de: "Haarschnitt", name_en: "Haircut", name_fr: "Coupe", name_it: "Taglio" },
  fade: { key: "fade", name_de: "Fade", name_en: "Fade", name_fr: "Fade", name_it: "Fade" },
  beard: { key: "beard", name_de: "Bart", name_en: "Beard", name_fr: "Barbe", name_it: "Barba" },
  styling: { key: "styling", name_de: "Styling", name_en: "Styling", name_fr: "Coiffage", name_it: "Styling" },
  womens_cut: { key: "womens_cut", name_de: "Damenschnitt", name_en: "Women's cut", name_fr: "Coupe femme", name_it: "Taglio donna" },
  mens_cut: { key: "mens_cut", name_de: "Herrenschnitt", name_en: "Men's cut", name_fr: "Coupe homme", name_it: "Taglio uomo" },
  color: { key: "color", name_de: "Farbe", name_en: "Color", name_fr: "Couleur", name_it: "Colore" },
  manicure: { key: "manicure", name_de: "Maniküre", name_en: "Manicure", name_fr: "Manucure", name_it: "Manicure" },
  pedicure: { key: "pedicure", name_de: "Pediküre", name_en: "Pedicure", name_fr: "Pédicure", name_it: "Pedicure" },
  nail_art: { key: "nail_art", name_de: "Nail Art", name_en: "Nail Art", name_fr: "Nail Art", name_it: "Nail Art" },
  gel: { key: "gel", name_de: "Gel", name_en: "Gel", name_fr: "Gel", name_it: "Gel" },
  face: { key: "face", name_de: "Gesicht", name_en: "Facial", name_fr: "Visage", name_it: "Viso" },
  massage: { key: "massage", name_de: "Massage", name_en: "Massage", name_fr: "Massage", name_it: "Massaggio" },
  waxing: { key: "waxing", name_de: "Waxing", name_en: "Waxing", name_fr: "Épilation", name_it: "Depilazione" },
  other: { key: "other", name_de: "Sonstiges", name_en: "Other", name_fr: "Autre", name_it: "Altro" },
};

/** Per-salon-category taxonomy, in the owner's stated display order (verbatim from the ask). */
export const PORTFOLIO_TAXONOMY_BY_SALON_CATEGORY: Record<SalonCategory, PortfolioCategoryKey[]> = {
  barbershop: ["haircut", "fade", "beard", "styling"],
  coiffeur: ["womens_cut", "mens_cut", "color", "styling"],
  nails: ["manicure", "pedicure", "nail_art", "gel"],
  spa: ["face", "massage", "waxing", "other"],
};

/**
 * The taxonomy for a salon, which may carry more than one category (salons.categories is an
 * array): unions each category's list and de-dupes (styling appears under both barbershop and
 * coiffeur), keeping first-seen order. Unknown/legacy category strings are ignored, not thrown.
 */
export function getPortfolioCategoriesForSalon(salonCategories: readonly string[]): PortfolioCategory[] {
  const keys: PortfolioCategoryKey[] = [];
  for (const cat of salonCategories) {
    const forCat = PORTFOLIO_TAXONOMY_BY_SALON_CATEGORY[cat as SalonCategory];
    if (!forCat) continue;
    for (const k of forCat) if (!keys.includes(k)) keys.push(k);
  }
  return keys.map((k) => PORTFOLIO_CATEGORIES[k]);
}

/** True if `category` is one of the salon's OWN valid taxonomy values (not just a global valid key). */
export function isValidPortfolioCategoryForSalon(category: string, salonCategories: readonly string[]): boolean {
  return getPortfolioCategoriesForSalon(salonCategories).some((c) => c.key === category);
}

export type PortfolioLocale = "de" | "en" | "fr" | "it";

export function getPortfolioCategoryLabel(key: string, locale: string): string {
  const cat = PORTFOLIO_CATEGORIES[key as PortfolioCategoryKey];
  if (!cat) return key;
  switch (locale) {
    case "en":
      return cat.name_en;
    case "fr":
      return cat.name_fr;
    case "it":
      return cat.name_it;
    default:
      return cat.name_de;
  }
}

/** "Alle" pseudo-category: PDP filter UI only, never stored on a photo row. */
export const PORTFOLIO_CATEGORY_ALL_LABEL: Record<PortfolioLocale, string> = {
  de: "Alle",
  en: "All",
  fr: "Tous",
  it: "Tutti",
};
