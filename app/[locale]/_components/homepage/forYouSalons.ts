// forYouSalons (V3-D348) — demo salon data for the "Weil du X magst" curation
// rows. Mirrors how the rest of the homepage works (Nearby.tsx is also static
// demo data; real geo/DB queries are a later phase). Keyed by the four
// SalonCard-supported categories — makeup/waxing picks gracefully get no row
// since SalonCard has no colorway/label for them.

export type ForYouCategory = "coiffeur" | "barbershop" | "nails" | "spa";

export const FORYOU_CATEGORIES: ForYouCategory[] = ["coiffeur", "barbershop", "nails", "spa"];

/** Short label for the "Weil du <label> magst" section title. */
export const FORYOU_LABEL: Record<ForYouCategory, string> = {
  coiffeur: "Coiffeur",
  barbershop: "Barber",
  nails: "Nails",
  spa: "Spa",
};

export interface ForYouSalon {
  slug: string;
  name: string;
  rating: number;
  category: ForYouCategory;
  photoUrl: string;
  priceFromCHF: number;
  address: string;
}

// Photos reuse the proven Unsplash URLs already loading in Nearby.tsx.
const PHOTO = {
  nails: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80",
  coiffeur: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80",
  barbershop: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=450&fit=crop&q=80",
};

export const FORYOU_SALONS: Record<ForYouCategory, ForYouSalon[]> = {
  nails: [
    { slug: "nagelstudio-bellezza", name: "Nagelstudio Bellezza", rating: 4.9, category: "nails", photoUrl: PHOTO.nails, priceFromCHF: 45, address: "Bahnhofstrasse 28" },
    { slug: "pink-lily-nails", name: "Pink Lily Nails", rating: 4.8, category: "nails", photoUrl: PHOTO.nails, priceFromCHF: 39, address: "Niederdorfstrasse 12" },
    { slug: "nail-loft-zh", name: "Nail Loft", rating: 4.7, category: "nails", photoUrl: PHOTO.nails, priceFromCHF: 49, address: "Langstrasse 84" },
  ],
  spa: [
    { slug: "aqua-spa-retreat", name: "Aqua Spa Retreat", rating: 5.0, category: "spa", photoUrl: PHOTO.spa, priceFromCHF: 90, address: "Seestrasse 41" },
    { slug: "zen-wellness", name: "Zen Wellness", rating: 4.9, category: "spa", photoUrl: PHOTO.spa, priceFromCHF: 110, address: "Limmatquai 70" },
    { slug: "thermal-oasis", name: "Thermal Oasis", rating: 4.8, category: "spa", photoUrl: PHOTO.spa, priceFromCHF: 95, address: "Stampfenbachstrasse 5" },
  ],
  coiffeur: [
    { slug: "maison-lumiere", name: "Maison Lumière", rating: 4.9, category: "coiffeur", photoUrl: PHOTO.coiffeur, priceFromCHF: 80, address: "Augustinergasse 22" },
    { slug: "atelier-coiffure-zh", name: "Atelier Coiffure", rating: 4.8, category: "coiffeur", photoUrl: PHOTO.coiffeur, priceFromCHF: 75, address: "Rennweg 33" },
    { slug: "salon-bellevue-zh", name: "Salon Bellevue", rating: 4.7, category: "coiffeur", photoUrl: PHOTO.coiffeur, priceFromCHF: 70, address: "Theaterstrasse 9" },
  ],
  barbershop: [
    { slug: "studio-noir", name: "Studio Noir", rating: 4.9, category: "barbershop", photoUrl: PHOTO.barbershop, priceFromCHF: 50, address: "Zähringerstrasse 41" },
    { slug: "kings-barber", name: "Kings Barber", rating: 4.8, category: "barbershop", photoUrl: PHOTO.barbershop, priceFromCHF: 45, address: "Müllerstrasse 16" },
    { slug: "boheme-zh", name: "Bohème", rating: 4.7, category: "barbershop", photoUrl: PHOTO.barbershop, priceFromCHF: 48, address: "Josefstrasse 102" },
  ],
};
