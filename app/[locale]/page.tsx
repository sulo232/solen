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
  
  // Parallel DB queries
  const [
    { data: popularData, error: pError },
    { data: lastMinuteData, error: lmError },
    { data: newSalonsData, error: nsError },
    { data: sectionsData },
    { data: categoryCountsData, error: ccError },
    { count: coordsCount }
  ] = await Promise.all([
    supabase.from("salons").select("id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, min_price").eq("is_active", true).eq("is_test", false).order("average_rating", { ascending: false }).limit(8),
    supabase.from("salons").select("id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, last_minute_discount_percent, quartier, min_price").eq("is_active", true).eq("is_test", false).gt("last_minute_discount_percent", 0).order("last_minute_discount_percent", { ascending: false }).limit(4),
    supabase.from("salons").select("id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, min_price").eq("is_active", true).eq("is_test", false).order("created_at", { ascending: false }).limit(6),
    supabase.from("site_settings").select("value").eq("key", "homepage_sections").single().then((res) => ({ data: res.error ? null : res.data })),
    supabase.from("salons").select("categories").eq("is_active", true).eq("is_test", false),
    supabase.from("salons").select("*", { count: "exact", head: true }).eq("is_active", true).eq("is_test", false).not("latitude", "is", null).gt("latitude", 0),
  ]);

  if (pError) console.error("SSR popular salons query failed:", pError.message);
  if (lmError) console.error("SSR last-minute query failed:", lmError.message);
  if (nsError) console.error("SSR new salons query failed:", nsError.message);

  if (ccError) console.error("SSR category counts query failed:", ccError.message);

  // Build category counts from SSR data
  const categoryCounts: Record<string, number> = {};
  (categoryCountsData ?? []).forEach((row: { categories?: string[] }) => {
    (row.categories ?? []).forEach((cat: string) => {
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    });
  });

  const initialData = {
    salons: (popularData as unknown as any[]) ?? [],
    lastMinuteSlots: (lastMinuteData as unknown as any[]) ?? [],
    newSalons: (newSalonsData as unknown as any[]) ?? [],
    trendingSalons: (popularData as unknown as any[]) ?? [],
    categoryCounts,
    salonsWithCoords: coordsCount ?? 0,
    sections: (sectionsData?.value as Record<string, boolean>) ?? {
      trending: true, nearby: true, new_salons: true,
      rebook: true, reviews: true, last_minute: true, featured: true,
      social_proof: true, partner_cta: true,
    }
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
