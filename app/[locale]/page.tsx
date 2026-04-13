import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { generateWebsiteSchema, buildAlternates } from "@/lib/seo";

const TITLES: Record<string, string> = {
  de: "Solen — Finde & buche die besten Salons in der Schweiz",
  en: "Solen — Discover & Book the Best Salons in Switzerland",
  fr: "Solen — Trouve & réserve les meilleurs salons en Suisse",
  it: "Solen — Trova e prenota i migliori saloni in Svizzera",
};

const DESCRIPTIONS: Record<string, string> = {
  de: "Entdecke Top-Salons für Coiffeur, Nails, Spa & mehr in Basel, Zürich und Bern. Online buchen, sofort bestätigt. ★ Bewertungen & Preise vergleichen.",
  en: "Discover top salons for haircuts, nails, spa & more in Basel, Zurich and Bern. Book online, instant confirmation. ★ Compare reviews & prices.",
  fr: "Découvre les meilleurs salons pour coiffeur, ongles, spa & plus à Bâle, Zurich et Berne. Réservation en ligne, confirmation immédiate. ★ Comparer.",
  it: "Scopri i migliori saloni per parrucchiere, unghie, spa e altro a Basilea, Zurigo e Berna. Prenota online, conferma immediata. ★ Confronta.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const title = TITLES[loc] ?? TITLES.de;
  const description = DESCRIPTIONS[loc] ?? DESCRIPTIONS.de;
  const alternates = buildAlternates("", loc);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://solen.ch/${loc}`,
      siteName: "solen.ch",
      images: [{ url: "/og-homepage.png", width: 1200, height: 630, alt: "Solen — Beauty & Wellness Booking" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-homepage.png"],
    },
    alternates,
  };
}

import { createServerSupabaseClient } from "@/lib/supabase";

export const revalidate = 300; // Cache the SSR page for 5 minutes (ISR)

export default async function Page() {
  const jsonLd = generateWebsiteSchema("de");
  
  // SSR Critical Data
  const supabase = await createServerSupabaseClient();
  
  // Full cols with services join — only used for popular/new salons where price display matters
  const SALON_COLS = "id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, postal_code, booking_confirmation_mode, services(price)";
  // Lean cols without services join — used for category carousel queries (much faster)
  const SALON_COLS_LEAN = "id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, postal_code, booking_confirmation_mode";

  // Parallel DB queries — wrapped with 8s timeout to prevent SSR hang
  const withTimeout = <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> =>
    Promise.race([Promise.resolve(promise), new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 8000))]);

  const emptyResult = { data: null, error: null } as any;
  const emptyCount = { count: 0, error: null } as any;

  const [
    { data: popularData, error: pError },
    { data: lastMinuteData, error: lmError },
    { data: newSalonsData, error: nsError },
    { data: sectionsData },
    { count: coordsCount },
    { data: trendingData },
    { data: citiesData },
    // Per-category salon lists for homepage carousels (lean — no services join)
    { data: coiffeurData },
    { data: nailsData },
    { data: barbershopData },
    { data: makeupData },
    { data: waxingData },
  ] = await Promise.all([
    withTimeout(supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).order("average_rating", { ascending: false }).limit(24), emptyResult),
    withTimeout(supabase.from("salons").select("id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, last_minute_discount_percent, quartier").eq("is_active", true).eq("is_test", false).gt("last_minute_discount_percent", 0).order("last_minute_discount_percent", { ascending: false }).limit(4), emptyResult),
    withTimeout(supabase.from("salons").select(SALON_COLS).eq("is_active", true).eq("is_test", false).order("created_at", { ascending: false }).limit(6), emptyResult),
    withTimeout(supabase.from("site_settings").select("value").eq("key", "homepage_sections").single().then((res) => ({ data: res.error ? null : res.data })), { data: null }),
    withTimeout(supabase.from("salons").select("*", { count: "exact", head: true }).eq("is_active", true).eq("is_test", false).not("latitude", "is", null).gt("latitude", 0), emptyCount),
    withTimeout(supabase.from("salons").select("id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, solen_score, is_active").eq("is_active", true).eq("is_test", false).order("solen_score", { ascending: false, nullsFirst: false }).limit(8), emptyResult),
    withTimeout(supabase.from("cities").select("id, slug"), emptyResult),
    // Category-specific queries — lean cols, no services join
    withTimeout(supabase.from("salons").select(SALON_COLS_LEAN).eq("is_active", true).eq("is_test", false).contains("categories", ["coiffeur"]).order("average_rating", { ascending: false }).limit(8), emptyResult),
    withTimeout(supabase.from("salons").select(SALON_COLS_LEAN).eq("is_active", true).eq("is_test", false).contains("categories", ["nails"]).order("average_rating", { ascending: false }).limit(8), emptyResult),
    withTimeout(supabase.from("salons").select(SALON_COLS_LEAN).eq("is_active", true).eq("is_test", false).contains("categories", ["barbershop"]).order("average_rating", { ascending: false }).limit(8), emptyResult),
    withTimeout(supabase.from("salons").select(SALON_COLS_LEAN).eq("is_active", true).eq("is_test", false).contains("categories", ["makeup"]).order("average_rating", { ascending: false }).limit(8), emptyResult),
    withTimeout(supabase.from("salons").select(SALON_COLS_LEAN).eq("is_active", true).eq("is_test", false).contains("categories", ["waxing"]).order("average_rating", { ascending: false }).limit(8), emptyResult),
  ]);

  if (pError) console.error("SSR popular salons query failed:", pError.message);
  if (lmError) console.error("SSR last-minute query failed:", lmError.message);
  if (nsError) console.error("SSR new salons query failed:", nsError.message);

  // Build city slug lookup map
  const cityMap: Record<string, string> = {};
  (citiesData ?? []).forEach((c: { id: string; slug: string }) => { cityMap[c.id] = c.slug; });

  // Process salons: add city_slug + compute min_price from joined services, then strip services
  const addCitySlug = (salons: any[]) => salons.map((s) => {
    if (!s.services) return { ...s, city_slug: s.city_id ? (cityMap[s.city_id] ?? null) : null };
    const prices = (s.services ?? []).map((sv: { price: number }) => sv.price).filter((p: number) => typeof p === "number" && p > 0);
    const min_price = prices.length > 0 ? Math.min(...prices) : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { services: _services, ...rest } = s;
    return { ...rest, min_price, city_slug: s.city_id ? (cityMap[s.city_id] ?? null) : null };
  });

  // Deduplicate trending against popular
  const popularIds = new Set((popularData ?? []).map((s: any) => s.id));
  const dedupedTrending = (trendingData ?? [])
    .filter((s: any) => !popularIds.has(s.id))
    .slice(0, 6);

  // Category counts — pass empty object (search bar handles gracefully; avoids full-table scan)
  const categoryCounts: Record<string, number> = {};

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
      coiffeur:   addCitySlug((coiffeurData   as unknown as any[]) ?? []),
      nails:      addCitySlug((nailsData      as unknown as any[]) ?? []),
      barbershop: addCitySlug((barbershopData as unknown as any[]) ?? []),
      makeup:     addCitySlug((makeupData     as unknown as any[]) ?? []),
      waxing:     addCitySlug((waxingData     as unknown as any[]) ?? []),
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
