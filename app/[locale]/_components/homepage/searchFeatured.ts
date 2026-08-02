/**
 * Featured salons for the search-hub empty state (V2-D51 Phase 5).
 *
 * live-data-ok: id/name/slug below are 3 REAL seeded salon rows (not
 * fabricated values); only the address sub-line is fetched live, see above.
 *
 * IDENTITY-ONLY (2026-07-16): this used to also carry a hardcoded
 * `address`, `average_rating` and `badge`, but the hardcoded street
 * addresses had drifted from the live DB (verified wrong against the salons
 * table) and nothing rendered the rating/badge at all. Only
 * `id`/`name`/`slug` remain: enough to link to the real PDP and to seed a
 * live lookup. SearchOverlay fetches the current address for these ids from
 * the existing `/api/salons?ids=` listing endpoint on overlay open (see the
 * `featuredAddress` effect there), so the sub-line is always DB-real
 * instead of a second, driftable copy of the data.
 *
 * Matches the homepage's current pattern otherwise (Coiffeur, Nearby etc.
 * all use arrays inline). When the rest of the homepage wires up real
 * Supabase queries via Server Components, this constant gets replaced by a
 * `featuredSalons` prop passed from `app/[locale]/page.tsx` → Hero →
 * SearchBar (per plan D3).
 *
 * Production query when ready:
 *   select id, name, slug
 *   from salons
 *   where is_active = true
 *   order by average_rating desc, review_count desc
 *   limit 3;
 */

export type FeaturedSalon = {
  id: string;
  name: string;
  slug: string;
};

// 2026-06-05: ids/slugs/names point at REAL seeded salons (Basel) so each
// featured card resolves to a live PDP instead of a 404. Top-3 by rating.
export const FEATURED_SALONS: FeaturedSalon[] = [
  {
    id: "0ed041f9-149b-4241-a09e-d41351be7097",
    name: "Muse Beauty Studio",
    slug: "muse-beauty-studio",
  },
  {
    id: "e34402f4-2986-4f63-8487-b09645395c65",
    name: "Glow Lab Basel",
    slug: "glow-lab-basel",
  },
  {
    id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477",
    name: "Salon Lumière",
    slug: "salon-lumiere",
  },
];
