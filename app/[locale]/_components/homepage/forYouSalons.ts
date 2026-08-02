// forYouSalons (V3-D348) - curated salon ids for the "Weil du X magst" curation
// rows. IDENTITY ONLY: id, slug, name, category. Every other card field
// (rating, review count, photo, price, address) comes from salonCardData.ts's
// live DB fetch (getSalonCardDataMap in page.tsx) - this file never carries a
// fabricated value. Keyed by the four SalonCard-supported categories,
// unsupported picks gracefully get no row since SalonCard has no colorway/
// label for them.

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
  /** Real salon UUID, threaded to SalonCard -> HeartButton so the save persists. */
  id: string;
  slug: string;
  name: string;
  category: ForYouCategory;
}

// 2026-06-05: ids/slugs/names point at REAL seeded salons (Basel) so every
// "Weil du X magst" card resolves to a live PDP instead of a 404. 3 real
// salons per category. 2026-07-16: curated rating/price/photo/address fields
// removed, those now come live from salonCardData.ts; this list only picks
// WHICH salons show, not what their card says. The cross-category discount
// row export (zero consumers, fabricated discounts against a DB with zero
// real last_minute_discount_percent rows) was removed in the same pass.
export const FORYOU_SALONS: Record<ForYouCategory, ForYouSalon[]> = {
  nails: [
    { id: "ca037638-362a-491b-ada2-238e20d9d4a9", slug: "nail-studio-bliss", name: "Nail Studio Bliss", category: "nails" },
    { id: "08760993-cdfd-4cc7-ac69-6a2bf8aed383", slug: "pink-petal-nails", name: "Pink Petal Nails", category: "nails" },
    { id: "07ff40e7-1f3b-4031-837b-6f48b7425257", slug: "la-belle-ongle", name: "La Belle Ongle", category: "nails" },
  ],
  spa: [
    { id: "40c96be2-198c-471e-82d8-3ada6f7de0de", slug: "smooth-skin-studio", name: "Smooth Skin Studio", category: "spa" },
    { id: "6aedd8a4-30fd-4390-949c-4d1fa06e1ff1", slug: "wax-and-glow-basel", name: "Wax & Glow Basel", category: "spa" },
    { id: "1a07334e-4bd5-4fff-83b0-93cc49bd796d", slug: "belle-epil", name: "Belle Epil", category: "spa" },
  ],
  coiffeur: [
    { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", category: "coiffeur" },
    { id: "e34402f4-2986-4f63-8487-b09645395c65", slug: "glow-lab-basel", name: "Glow Lab Basel", category: "coiffeur" },
    { id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477", slug: "salon-lumiere", name: "Salon Lumière", category: "coiffeur" },
  ],
  barbershop: [
    { id: "599bb853-c713-4dae-a3c4-96c6216139c4", slug: "old-town-barbers", name: "Old Town Barbers", category: "barbershop" },
    { id: "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f", slug: "the-fade-factory", name: "The Fade Factory", category: "barbershop" },
    { id: "63e581dd-2b0e-4910-b4a5-543bc1e157f6", slug: "blade-and-stone", name: "Blade & Stone", category: "barbershop" },
  ],
};
