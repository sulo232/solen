/**
 * Exists-check: `npm run exists decision-mockup` = 1 REMOVED hit (bundles, unrelated).
 * `npm run exists SalonResultCard/SalonServices/BackButton` = all real, reused below.
 * Net-new: this loader. No dev route previously fetched a REAL salon row for a
 * server-rendered mockup (existing /dev/* mockups hard-code fabricated SALONS arrays,
 * e.g. results-full/page.tsx:17), so a shared real-data loader for the M1-M5 decision
 * mockups did not exist and is the one net-new piece here.
 *
 * Server-only. Fetches ONE real, live, publicly-listed salon (same visibility filters
 * as GET /api/salons: is_active + listed_on_marketplace + is_test=false) with a real
 * cover photo and at least one real service, so every decision mockup that needs "a
 * real salon" (M1 hero photo, M4 result card, M5 PDP service rows) reads off the SAME
 * live row instead of 3 separate ad-hoc queries or fabricated data.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getCityName } from "@/lib/cities";

export interface SeedService {
  id: string;
  name_de: string;
  name_en: string | null;
  duration_minutes: number;
  price: number;
}

export interface SeedSalon {
  id: string;
  slug: string;
  name: string;
  coverPhotoUrl: string;
  galleryUrls: string[];
  averageRating: number | null;
  reviewCount: number;
  address: string;
  category: string | null;
  cityName: string | null;
  services: SeedService[];
  priceFromCHF: number | null;
}

const cacheByLocale = new Map<string, SeedSalon>();

/** One real, live salon with a photo + at least one service. Cached per server
 * process (dev-only mockups, data doesn't need to be request-fresh). Returns null
 * only if the DB genuinely has no matching row (never fabricated as a fallback). */
export async function getSeedSalon(locale: string): Promise<SeedSalon | null> {
  const cached = cacheByLocale.get(locale);
  if (cached) return cached;

  const supabase = createAdminSupabaseClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("id, slug, name, cover_photo_url, gallery_urls, average_rating, review_count, address, categories, city_id")
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .not("cover_photo_url", "is", null)
    .order("review_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!salon || !salon.cover_photo_url) return null;

  const { data: services } = await supabase
    .from("services")
    .select("id, name_de, name_en, duration_minutes, price")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(5);

  let cityRow: { name_de: string; name_en: string; name_fr: string; name_it: string } | null = null;
  if (salon.city_id) {
    const { data } = await supabase
      .from("cities")
      .select("name_de, name_en, name_fr, name_it")
      .eq("id", salon.city_id)
      .maybeSingle();
    cityRow = data;
  }

  const seedServices = services ?? [];

  const resolved: SeedSalon = {
    id: salon.id,
    slug: salon.slug,
    name: salon.name,
    coverPhotoUrl: salon.cover_photo_url,
    galleryUrls: salon.gallery_urls ?? [salon.cover_photo_url],
    averageRating: salon.average_rating,
    reviewCount: salon.review_count ?? 0,
    address: salon.address,
    category: salon.categories?.[0] ?? null,
    cityName: cityRow ? getCityName(salon.slug, locale, cityRow) : null,
    services: seedServices,
    priceFromCHF: seedServices.length > 0 ? Math.min(...seedServices.map((s) => s.price)) : null,
  };

  cacheByLocale.set(locale, resolved);
  return resolved;
}
