/**
 * Featured salons for the search-hub empty state (V2-D51 Phase 5).
 *
 * STATIC DEMO data matching the homepage's current pattern (Coiffeur,
 * LastMinute, Nearby etc. all use DEMO arrays inline). When the rest of the
 * homepage wires up real Supabase queries via Server Components, this constant
 * gets replaced by a `featuredSalons` prop passed from `app/[locale]/page.tsx`
 * → Hero → SearchBar (per plan D3).
 *
 * Production query when ready:
 *   select id, name, slug, average_rating, cover_photo_url, address
 *   from salons
 *   where is_active = true
 *   order by average_rating desc, review_count desc
 *   limit 3;
 */

export type FeaturedSalon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number;
  cover_photo_url: string | null;
  address: string;
  badge?: "Neu" | "Top 10" | null;
};

// 2026-06-05: ids/slugs/names point at REAL seeded salons (Basel) so each
// featured card resolves to a live PDP instead of a 404. Top-3 by rating.
export const FEATURED_SALONS: FeaturedSalon[] = [
  {
    id: "0ed041f9-149b-4241-a09e-d41351be7097",
    name: "Muse Beauty Studio",
    slug: "muse-beauty-studio",
    average_rating: 4.93,
    cover_photo_url: null,
    address: "Spalenberg 12, Basel",
    badge: "Neu",
  },
  {
    id: "e34402f4-2986-4f63-8487-b09645395c65",
    name: "Glow Lab Basel",
    slug: "glow-lab-basel",
    average_rating: 4.87,
    cover_photo_url: null,
    address: "Aeschenvorstadt 36, Basel",
    badge: "Top 10",
  },
  {
    id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477",
    name: "Salon Lumière",
    slug: "salon-lumiere",
    average_rating: 4.85,
    cover_photo_url: null,
    address: "Steinenvorstadt 67, Basel",
    badge: null,
  },
];
