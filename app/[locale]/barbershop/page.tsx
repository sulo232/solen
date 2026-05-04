import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPage from "@/components-legacy/CategoryPage";
import { BarbershopAboveGrid, BarbershopBelowGrid } from "@/components-legacy/barber/BarbershopSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema, buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("barbershop", loc);

  let count = 0;
  try {
    const supabase = createAdminSupabaseClient();
    const { count: c } = await supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .contains("categories", ["barbershop"])
      .eq("is_active", true);
    count = c ?? 0;
  } catch { /* graceful degradation */ }

  const titles: Record<string, string> = {
    de: "Beste Barbershops in Basel — Online buchen | Solen",
    en: "Best Barbershops in Basel — Book Online | Solen",
    fr: "Meilleurs barbiers à Bâle — Réserver en ligne | Solen",
    it: "Migliori barbieri a Basilea — Prenota online | Solen",
  };
  const descriptions: Record<string, string> = {
    de: `${count > 0 ? `${count} ` : ""}Barbershops in Basel. Skin Fades, Bart-Design, Walk-in Queue. Vergleiche Preise, lies ★ Bewertungen und buche online.`,
    en: `${count > 0 ? `${count} ` : ""}barbershops in Basel. Skin fades, beard design, walk-in queue. Compare prices, read ★ reviews and book online.`,
    fr: `${count > 0 ? `${count} ` : ""}barbiers à Bâle. Fades, design de barbe, file d'attente walk-in. Comparez les prix et réservez en ligne.`,
    it: `${count > 0 ? `${count} ` : ""}barbieri a Basilea. Fade, design barba, coda walk-in. Confronta prezzi e prenota online.`,
  };

  return {
    title: titles[loc] ?? titles.de,
    description: descriptions[loc] ?? descriptions.de,
    openGraph: {
      title: titles[loc] ?? titles.de,
      description: descriptions[loc] ?? descriptions.de,
      type: "website",
      url: `https://solen.ch/${loc}/barbershop`,
      siteName: "solen.ch",
    },
    alternates,
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale ?? "de";
  let jsonLd = null;
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: `https://solen.ch/${loc}` },
    { name: "Barbershop" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.barbershop);
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["barbershop"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("barbershop", salons, loc);
    }
  } catch { /* graceful degradation */ }

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
      <CategoryPage
        category="barbershop"
        aboveGrid={
          <Suspense fallback={null}>
            <BarbershopAboveGrid />
          </Suspense>
        }
        belowGrid={<BarbershopBelowGrid />}
      />
    </>
  );
}
