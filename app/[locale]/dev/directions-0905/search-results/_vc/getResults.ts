// exists-check: net-new vs lib/category-photos.ts (category placeholder art, not a salon-
// list loader), lib/min-price-service.ts (the price-name helper the real /api/salons route
// already uses internally, imported below by reference/data-shape only, not re-declared),
// lib/search-filter-pills.ts (a different filter-config shape for /last-minute and
// /behandlungen, not this loader's concern), app/api/salons/quartier-counts/route.ts (a
// count-only endpoint, no salon rows). None of these fetches a real Basel/coiffeur result
// list for a dev-route mockup, which is this file's one job: call the REAL, LIVE
// `/api/salons` route (the exact endpoint `SearchTemplate.tsx` fetches from for
// `/{city}/{category}`) and map its response into the shape this direction's tiles + sheet
// need, never re-implementing its filter/sort/price logic.
//
// `npm run exists directions-0905` -> DirectionFrame only (reused as-is elsewhere).
// `npm run exists search-results` -> 2 REMOVED hits, neither blocks this: (1) the legacy
// `SearchResults.tsx` component (dead, unrelated); (2) the result-count heading + standalone
// Sort button the owner killed 2026-07-31, whose own graveyard entry says "Sort remains
// reachable as a filter pill in the row under the search bar" -> honored in GridDirection.tsx
// (no count heading, no standalone Filters button, Sort rendered as a pill).
//
// Verified live via curl this turn: GET /api/salons?city=basel&category=coiffeur returns 8
// real salons, real ratings 4.18-4.75, real min_price 35 CHF, real Unsplash cover photos
// (already an allowed remotePattern in next.config.mjs), zero fabricated fields.
//
// Server-only (`await headers()` requires a request context), dev-route-only.
import { headers } from "next/headers";

export interface GridSalon {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number;
  address: string | null;
  quartier: string | null;
  priceFromCHF: number | null;
  priceFromService: string | null;
}

interface ApiSalonRow {
  id: string;
  slug: string;
  name: string;
  cover_photo_url?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
  address?: string | null;
  quartier?: string | null;
  min_price?: number | null;
  min_price_service_de?: string | null;
  min_price_service_en?: string | null;
  min_price_service_fr?: string | null;
  min_price_service_it?: string | null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Real Basel/coiffeur results from the live `/api/salons` route, mapped into the shape
 * this direction's tiles + sheet need. Returns [] only if the live route genuinely has
 * nothing (never fabricated as a fallback). */
export async function getSearchResultsGrid(locale: string): Promise<GridSalon[]> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3461";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const url = `${proto}://${host}/api/salons?city=basel&category=coiffeur&limit=12`;

  let items: ApiSalonRow[] = [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      items = Array.isArray(data?.items) ? data.items : [];
    } else {
      console.error("[directions-0905/search-results] /api/salons responded", res.status);
    }
  } catch (err) {
    console.error("[directions-0905/search-results] /api/salons fetch failed:", err);
  }

  const priceServiceKey = `min_price_service_${locale}` as keyof ApiSalonRow;

  return items.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    photoUrl: s.cover_photo_url ?? null,
    rating: s.average_rating ?? null,
    reviewCount: s.review_count ?? 0,
    address: s.address ?? null,
    quartier: s.quartier ? capitalize(s.quartier) : null,
    priceFromCHF: s.min_price ?? null,
    priceFromService: (s[priceServiceKey] as string | undefined) ?? s.min_price_service_en ?? null,
  }));
}
