import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { generateWebsiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "solen.ch — Beauty & Wellness Booking in Basel",
  description: "Entdecke die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing — online buchen auf solen.ch.",
  openGraph: {
    title: "solen.ch — Beauty & Wellness Booking in Basel",
    description: "Entdecke die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing — online buchen.",
    type: "website",
    url: "https://solen.ch/de",
    siteName: "solen.ch",
  },
  alternates: {
    canonical: "https://solen.ch/de",
    languages: { de: "https://solen.ch/de", en: "https://solen.ch/en", fr: "https://solen.ch/fr", it: "https://solen.ch/it" },
  },
};

import { createServerSupabaseClient } from "@/lib/supabase";

export const revalidate = 300; // Cache the SSR page for 5 minutes (ISR)

export default async function Page() {
  const jsonLd = generateWebsiteSchema("de");
  
  // SSR Critical Data
  const supabase = await createServerSupabaseClient();
  
  const SALON_COLS = "id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, postal_code, booking_confirmation_mode, services(price)";

  // Parallel DB queries
  const [
    { data: popularData, error: pError },
    { data: lastMinuteData, error: lmError },
    { data: newSalonsData, error: nsError },
    { data: sectionsData },
    { data: categoryCountsData, error: ccError },
    { count: coordsCount },
    { data: trendingData },
    { data: citiesData },
    // Per-category salon lists for homepage carousels
    { data: coiffeurData },
    { data: nailsData },
    { data: barbershopData },
    { data: makeupData },
    { data: waxingData },
  ] = await Promise.all([
    supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).order("average_rating", { ascending: false }).limit(24),
    supabase.from("salons").select("id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, last_minute_discount_percent, quartier").eq("is_active", true).eq("is_test", false).gt("last_minute_discount_percent", 0).order("last_minute_discount_percent", { ascending: false }).limit(4),
    supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).order("created_at", { ascending: false }).limit(6),
    supabase.from("site_settings").select("value").eq("key", "homepage_sections").single().then((res) => ({ data: res.error ? null : res.data })),
    supabase.from("salons").select("categories").eq("is_active", true).eq("is_test", false),
    supabase.from("salons").select("*", { count: "exact", head: true }).eq("is_active", true).eq("is_test", false).not("latitude", "is", null).gt("latitude", 0),
    supabase.from("salons").select("id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, solen_score, is_active").eq("is_active", true).eq("is_test", false).order("solen_score", { ascending: false, nullsFirst: false }).limit(8),
    supabase.from("cities").select("id, slug"),
    // Category-specific queries (8 each, ordered by rating)
    supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).contains("categories", ["coiffeur"]).order("average_rating", { ascending: false }).limit(8),
    supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).contains("categories", ["nails"]).order("average_rating", { ascending: false }).limit(8),
    supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).contains("categories", ["barbershop"]).order("average_rating", { ascending: false }).limit(8),
    supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).contains("categories", ["makeup"]).order("average_rating", { ascending: false }).limit(8),
    supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).contains("categories", ["waxing"]).order("average_rating", { ascending: false }).limit(8),
  ]);

  if (pError) console.error("SSR popular salons query failed:", pError.message);
  if (lmError) console.error("SSR last-minute query failed:", lmError.message);
  if (nsError) console.error("SSR new salons query failed:", nsError.message);

  if (ccError) console.error("SSR category counts query failed:", ccError.message);

  // Build city slug lookup map
  const cityMap: Record<string, string> = {};
  (citiesData ?? []).forEach((c: { id: string; slug: string }) => { cityMap[c.id] = c.slug; });

  // Process salons: add city_slug + compute min_price from joined services, then strip services
  const processSalons = (salons: any[]) => salons.map((s) => {
    const prices = (s.services ?? []).map((sv: { price: number }) => sv.price).filter((p: number) => typeof p === "number" && p > 0);
    const min_price = prices.length > 0 ? Math.min(...prices) : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { services: _services, ...rest } = s;
    return { ...rest, min_price, city_slug: s.city_id ? (cityMap[s.city_id] ?? null) : null };
  });

  // Backwards-compat alias for queries that don't join services
  const addCitySlug = (salons: any[]) => salons.map((s) => ({ ...s, city_slug: s.city_id ? (cityMap[s.city_id] ?? null) : null }));

  // Deduplicate trending against popular
  const popularIds = new Set((popularData ?? []).map((s: any) => s.id));
  const dedupedTrending = (trendingData ?? [])
    .filter((s: any) => !popularIds.has(s.id))
    .slice(0, 6);

  // Build category counts from SSR data
  const categoryCounts: Record<string, number> = {};
  (categoryCountsData ?? []).forEach((row: { categories?: string[] }) => {
    (row.categories ?? []).forEach((cat: string) => {
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    });
  });

  const initialData = {
    salons: addCitySlug((popularData as unknown as any[]) ?? []),
    lastMinuteSlots: (lastMinuteData as unknown as any[]) ?? [],
    newSalons: (newSalonsData as unknown as any[]) ?? [],
    trendingSalons: dedupedTrending as unknown as any[],
    categoryCounts,
    salonsWithCoords: coordsCount ?? 0,
    sections: (sectionsData?.value as Record<string, boolean>) ?? {
      trending: true, nearby: true, new_salons: true,
      rebook: true, reviews: true, last_minute: true, featured: true,
      social_proof: true, partner_cta: true,
    },
    categorySalons: {
      coiffeur:   processSalons((coiffeurData   as unknown as any[]) ?? []),
      nails:      processSalons((nailsData      as unknown as any[]) ?? []),
      barbershop: processSalons((barbershopData as unknown as any[]) ?? []),
      makeup:     processSalons((makeupData     as unknown as any[]) ?? []),
      waxing:     processSalons((waxingData     as unknown as any[]) ?? []),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div>
        <HomePage initialData={initialData} />
      </div>
    </>
  );
}
