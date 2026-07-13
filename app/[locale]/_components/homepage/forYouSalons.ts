// forYouSalons (V3-D348) — demo salon data for the "Weil du X magst" curation
// rows. Mirrors how the rest of the homepage works (Nearby.tsx is also static
// demo data; real geo/DB queries are a later phase). Keyed by the four
// SalonCard-supported categories — unsupported picks gracefully get no row
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
  /** Real salon UUID — threaded to SalonCard → HeartButton so the save persists. */
  id: string;
  slug: string;
  name: string;
  rating: number;
  category: ForYouCategory;
  photoUrl: string;
}

// Photos reuse the proven Unsplash URLs already loading in Nearby.tsx.
const PHOTO = {
  nails: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80",
  coiffeur: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80",
  barbershop: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=450&fit=crop&q=80",
};

// 2026-06-05: ids/slugs/names point at REAL seeded salons (Basel) so every
// "Weil du X magst" + "Deals für dich" card resolves to a live PDP instead of
// a 404. Curated price/photo/address styling kept; identity is real. 3 real
// salons per category, top-rated first.
export const FORYOU_SALONS: Record<ForYouCategory, ForYouSalon[]> = {
  nails: [
    { id: "ca037638-362a-491b-ada2-238e20d9d4a9", slug: "nail-studio-bliss", name: "Nail Studio Bliss", rating: 4.95, category: "nails", photoUrl: PHOTO.nails },
    { id: "08760993-cdfd-4cc7-ac69-6a2bf8aed383", slug: "pink-petal-nails", name: "Pink Petal Nails", rating: 4.88, category: "nails", photoUrl: PHOTO.nails },
    { id: "07ff40e7-1f3b-4031-837b-6f48b7425257", slug: "la-belle-ongle", name: "La Belle Ongle", rating: 4.80, category: "nails", photoUrl: PHOTO.nails },
  ],
  spa: [
    { id: "40c96be2-198c-471e-82d8-3ada6f7de0de", slug: "smooth-skin-studio", name: "Smooth Skin Studio", rating: 4.90, category: "spa", photoUrl: PHOTO.spa },
    { id: "6aedd8a4-30fd-4390-949c-4d1fa06e1ff1", slug: "wax-and-glow-basel", name: "Wax & Glow Basel", rating: 4.83, category: "spa", photoUrl: PHOTO.spa },
    { id: "1a07334e-4bd5-4fff-83b0-93cc49bd796d", slug: "belle-epil", name: "Belle Epil", rating: 4.76, category: "spa", photoUrl: PHOTO.spa },
  ],
  coiffeur: [
    { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", rating: 4.93, category: "coiffeur", photoUrl: PHOTO.coiffeur },
    { id: "e34402f4-2986-4f63-8487-b09645395c65", slug: "glow-lab-basel", name: "Glow Lab Basel", rating: 4.87, category: "coiffeur", photoUrl: PHOTO.coiffeur },
    { id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477", slug: "salon-lumiere", name: "Salon Lumière", rating: 4.85, category: "coiffeur", photoUrl: PHOTO.coiffeur },
  ],
  barbershop: [
    { id: "599bb853-c713-4dae-a3c4-96c6216139c4", slug: "old-town-barbers", name: "Old Town Barbers", rating: 4.91, category: "barbershop", photoUrl: PHOTO.barbershop },
    { id: "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f", slug: "the-fade-factory", name: "The Fade Factory", rating: 4.86, category: "barbershop", photoUrl: PHOTO.barbershop },
    { id: "63e581dd-2b0e-4910-b4a5-543bc1e157f6", slug: "blade-and-stone", name: "Blade & Stone", rating: 4.79, category: "barbershop", photoUrl: PHOTO.barbershop },
  ],
};

// Frontend audit 2026-07-08 (FRONTEND_AUDIT_2026-07-08.md, home bucket, ForYouSalonRows.tsx:25):
// DealSalon/FORYOU_DEALS and the wantsDeals prop were dead code (never imported, never
// referenced), removed rather than wired since no real "deals" data source exists yet.
