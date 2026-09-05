/**
 * Exists-check: `npm run exists getResults` and `npm run exists "search results"` (ran
 * this turn from the repo root). No prior loader under directions-0905 fetches a real
 * MULTI-row salon result set; `app/[locale]/dev/_shared/seedSalon.ts` only resolves ONE
 * salon (its own comment: "one real, live salon"), so it cannot back a results grid.
 * `search results` returned two REMOVED hits (legacy SearchResults.tsx component, and
 * the result-count-heading + standalone-sort-button pairing) - neither blocks a data
 * loader, both are honoured in page.tsx's chrome (no count heading, no bare sort button).
 *
 * Server-only, admin client (dev-only route, same acceptable-bypass reasoning
 * seedBooking.ts already documents for this folder). Mirrors the exact filter shape
 * `GET /api/salons?city=basel&category=coiffeur` applies (app/api/salons/route.ts lines
 * ~178-186: is_active + listed_on_marketplace + is_test=false + categories contains +
 * city_id eq), using the same SALON_PUBLIC_COLS allowlist and the same
 * lib/min-price-service.ts helper the real route/home cards use for the from-price, so
 * this direction reads off the identical live rows the real page would return for the
 * same query, never a fabricated result set.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { SALON_PUBLIC_COLS } from "@/lib/salons/public-columns";
import { minPriceService, MIN_PRICE_SERVICE_COLUMNS, type PricedServiceRow } from "@/lib/min-price-service";
import { getCityName } from "@/lib/cities";

export interface ResultCard {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  category: string | null;
  address: string | null;
  averageRating: number | null;
  reviewCount: number;
  priceFromCHF: number | null;
  priceFromServiceName: string | null;
}

export interface ResultSet {
  cityName: string;
  category: string;
  cards: ResultCard[];
}

const CITY_SLUG = "basel";
const CATEGORY = "coiffeur";

let cache: ResultSet | null = null;

/** Real, live salons for city=basel, category=coiffeur - the same query
 * `/api/salons?city=basel&category=coiffeur` runs. Cached per server process (dev-only
 * mockup, data doesn't need to be request-fresh). Returns an empty `cards` array (never
 * a fabricated row) if the live DB genuinely has none. */
export async function getSearchResults(locale: string): Promise<ResultSet> {
  if (cache) return cache;

  const supabase = createAdminSupabaseClient();

  const { data: cityRow } = await supabase
    .from("cities")
    .select("id, name_de, name_en, name_fr, name_it")
    .eq("slug", CITY_SLUG)
    .maybeSingle();

  let query = supabase
    .from("salons")
    .select(SALON_PUBLIC_COLS)
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .contains("categories", [CATEGORY])
    .order("average_rating", { ascending: false, nullsFirst: false })
    .limit(9);

  if (cityRow) query = query.eq("city_id", cityRow.id);

  const { data: salons } = await query;
  const rows = salons ?? [];

  const cards: ResultCard[] = await Promise.all(
    rows.map(async (s) => {
      const { data: services } = await supabase
        .from("services")
        .select(MIN_PRICE_SERVICE_COLUMNS)
        .eq("salon_id", s.id)
        .eq("is_active", true);
      const { minPrice, names } = minPriceService((services ?? []) as PricedServiceRow[]);
      const serviceName = locale === "en" ? names.en ?? names.de : names.de ?? names.en;
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        photoUrl: s.cover_photo_url,
        category: s.categories?.[0] ?? null,
        address: s.address,
        averageRating: s.average_rating,
        reviewCount: s.review_count ?? 0,
        priceFromCHF: minPrice,
        priceFromServiceName: serviceName,
      };
    }),
  );

  const resolved: ResultSet = {
    cityName: cityRow ? getCityName(CITY_SLUG, locale, cityRow) : "Basel",
    category: CATEGORY,
    cards,
  };
  cache = resolved;
  return resolved;
}
