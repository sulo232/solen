import type { Metadata } from "next";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema, buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS } from "@/lib/seo";
import { getFilterAvailability } from "@/lib/search/filter-availability";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("nails", loc);

  let count = 0;
  try {
    const supabase = createAdminSupabaseClient();
    const { count: c } = await supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .contains("categories", ["nails"])
      .eq("is_active", true);
    count = c ?? 0;
  } catch { /* graceful degradation */ }

  const titles: Record<string, string> = {
    de: "Beste Nagelstudios in Basel — Online buchen | Solen",
    en: "Best Nail Studios in Basel — Book Online | Solen",
    fr: "Meilleurs salons d'ongles à Bâle — Réserver en ligne | Solen",
    it: "Migliori studi unghie a Basilea — Prenota online | Solen",
  };
  const descriptions: Record<string, string> = {
    de: `${count > 0 ? `${count} ` : ""}Nagelstudios in Basel. Gel-Nägel, Maniküre, Nail Art & mehr. Vergleiche Preise, lies ★ Bewertungen und buche online. Sofort bestätigt.`,
    en: `${count > 0 ? `${count} ` : ""}nail studios in Basel. Gel nails, manicure, nail art & more. Compare prices, read ★ reviews and book online.`,
    fr: `${count > 0 ? `${count} ` : ""}salons d'ongles à Bâle. Ongles gel, manucure, nail art & plus. Comparez les prix et réservez en ligne.`,
    it: `${count > 0 ? `${count} ` : ""}studi unghie a Basilea. Unghie gel, manicure, nail art e altro. Confronta prezzi e prenota online.`,
  };

  return {
    title: titles[loc] ?? titles.de,
    description: descriptions[loc] ?? descriptions.de,
    openGraph: {
      title: titles[loc] ?? titles.de,
      description: descriptions[loc] ?? descriptions.de,
      type: "website",
      url: `https://solen.ch/${loc}/nails`,
      siteName: "solen.ch",
    },
    alternates,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale ?? "de";
  let jsonLd = null;
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: `https://solen.ch/${loc}` },
    { name: "Nails" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.nails);
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["nails"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("nails", salons, loc);
    }
  } catch { /* graceful degradation */ }
  const filterAvailability = await getFilterAvailability();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* V3-D350 (2026-05-28): unified Airbnb-style search is the default render
          (no flag). CategoryHero + SEO above/below slots dropped unconditionally;
          metadata + JSON-LD above are KEPT (the real SEO). */}
      <SearchTemplate locale={loc} serviceFilter="nails" filterAvailability={filterAvailability} />
    </>
  );
}
