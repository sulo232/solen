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

export const FEATURED_SALONS: FeaturedSalon[] = [
  {
    id: "demo-1",
    name: "Coiffure Yvette",
    slug: "coiffure-yvette",
    average_rating: 4.9,
    cover_photo_url: null,
    address: "Spalenberg 12, Basel",
    badge: "Neu",
  },
  {
    id: "demo-2",
    name: "Atelier Coiffure",
    slug: "atelier-coiffure",
    average_rating: 4.7,
    cover_photo_url: null,
    address: "Aeschenvorstadt 36, Basel",
    badge: "Top 10",
  },
  {
    id: "demo-3",
    name: "Studio Bel",
    slug: "studio-bel",
    average_rating: 4.8,
    cover_photo_url: null,
    address: "Steinenvorstadt 67, Basel",
    badge: null,
  },
];
