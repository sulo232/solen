/**
 * Direction A (Fresha list) real-data loader for /dev/directions-0905/search-results.
 *
 * Exists-check: `npm run exists search-results` -> 2 REMOVED hits, both unrelated to this
 * loader (SearchResults.tsx legacy component, and the result-count/sort-button removal on
 * the live page). `npm run exists directions-0905` -> 1 REMOVED hit (the 2026-09-04
 * micro-treatment batch, a format rejection, not a data question), plus the shared
 * DirectionFrame component (reused, not forked). `getSeedSalon` (dev/_shared/seedSalon.ts)
 * only returns ONE salon; this surface needs a LIST (a search-results page), so it is a
 * net-new loader, not a duplicate of that one.
 *
 * reinvent-ok: CATEGORY_LABEL is IMPORTED from SalonResultCard.tsx (its own canonical
 * slug->label map, already exported for exactly this kind of reuse), not re-declared here.
 *
 * Mirrors the SAME live filters GET /api/salons applies for a category route
 * (app/api/salons/route.ts): is_active, listed_on_marketplace, is_test=false, categories
 * contains the requested slug, city_id matching the requested city slug. Real DB columns
 * only, confirmed live against _inventory/_db-columns.json before writing this file
 * (salons: is_active, listed_on_marketplace, is_test, categories, city_id, review_count,
 * average_rating, cover_photo_url, gallery_urls, address, slug, name, quartier all present;
 * services: id, salon_id, name_de, name_en, duration_minutes, price, is_active all present).
 * Never fabricated: a city/category with zero live rows renders zero cards, not invented ones.
 *
 * Server-only, admin client (bypasses RLS), same acceptable-use note as seedSalon.ts: this
 * only ever runs inside /dev/directions-0905/*, never a real request path.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getActiveCityBySlug, getCityName } from "@/lib/cities";
import { minPriceService, MIN_PRICE_SERVICE_COLUMNS, type PricedServiceRow } from "@/lib/min-price-service";
import { nameForLocale } from "@/lib/min-price-service";
import { CATEGORY_LABEL } from "@/app/[locale]/_components/search/SalonResultCard";

export interface SearchResultService {
  id: string;
  name_de: string | null;
  name_en: string | null;
  duration_minutes: number | null;
  price: number | null;
}

export interface SearchResultSalon {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  galleryCount: number;
  averageRating: number | null;
  reviewCount: number;
  address: string | null;
  category: string | null;
  cityName: string | null;
  services: SearchResultService[];
  priceFromCHF: number | null;
  priceFromService: string | null;
}

export interface SearchResultsData {
  cityName: string | null;
  categorySlug: string;
  total: number;
  salons: SearchResultSalon[];
}

let cache: SearchResultsData | null = null;

/** Real basel/coiffeur result set, same visibility + category + city filters the live
 *  /api/salons route applies. Cached per server process (dev-only mockup, no need for
 *  request-fresh data). Returns an empty list (never fabricated rows) if the DB genuinely
 *  has nothing matching. */
export async function getSearchResults(locale: string): Promise<SearchResultsData> {
  if (cache) return cache;

  const citySlug = "basel";
  const categorySlug = "coiffeur";

  const supabase = createAdminSupabaseClient();
  const cityRow = await getActiveCityBySlug(citySlug);

  let query = supabase
    .from("salons")
    .select(
      "id, slug, name, cover_photo_url, gallery_urls, average_rating, review_count, address, categories, city_id",
      { count: "exact" },
    )
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .contains("categories", [categorySlug])
    .not("cover_photo_url", "is", null)
    .order("review_count", { ascending: false })
    .limit(8);

  if (cityRow) {
    query = query.eq("city_id", cityRow.id);
  }

  const { data: salonRows, count } = await query;
  const rows = salonRows ?? [];

  const cityName = cityRow ? getCityName(citySlug, locale, cityRow) : null;

  const salons: SearchResultSalon[] = await Promise.all(
    rows.map(async (salon): Promise<SearchResultSalon> => {
      const { data: serviceRows } = await supabase
        .from("services")
        .select(`id, duration_minutes, ${MIN_PRICE_SERVICE_COLUMNS}`)
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(3);

      const services = (serviceRows ?? []) as unknown as (PricedServiceRow & {
        id: string;
        duration_minutes: number | null;
      })[];

      const minSvc = minPriceService(services as PricedServiceRow[]);
      const priceFromService = nameForLocale(minSvc.names, locale);

      return {
        id: salon.id,
        slug: salon.slug,
        name: salon.name,
        photoUrl: salon.cover_photo_url,
        galleryCount: salon.gallery_urls?.length ?? 0,
        averageRating: salon.average_rating,
        reviewCount: salon.review_count ?? 0,
        address: salon.address,
        category: CATEGORY_LABEL[categorySlug] ?? categorySlug,
        cityName,
        services: services.map((s) => ({
          id: s.id,
          name_de: (s.name_de as string | null) ?? null,
          name_en: (s.name_en as string | null) ?? null,
          duration_minutes: s.duration_minutes,
          price: (s.price as number | null) ?? null,
        })),
        priceFromCHF: minSvc.minPrice,
        priceFromService,
      };
    }),
  );

  const result: SearchResultsData = {
    cityName,
    categorySlug,
    total: count ?? salons.length,
    salons,
  };

  cache = result;
  return result;
}
