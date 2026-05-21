import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPage from "@/components-legacy/CategoryPage";
import { CoiffeurAboveGrid, CoiffeurBelowGrid } from "@/components-legacy/coiffeur/CoiffeurSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema, buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("coiffeur", loc);

  let count = 0;
  try {
    const supabase = createAdminSupabaseClient();
    const { count: c } = await supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .contains("categories", ["coiffeur"])
      .eq("is_active", true);
    count = c ?? 0;
  } catch { /* graceful degradation */ }

  const titles: Record<string, string> = {
    de: "Beste Coiffeure in Basel — Online buchen | Solen",
    en: "Best Hair Salons in Basel — Book Online | Solen",
    fr: "Meilleurs coiffeurs à Bâle — Réserver en ligne | Solen",
    it: "Migliori parrucchieri a Basilea — Prenota online | Solen",
  };
  const descriptions: Record<string, string> = {
    de: `${count > 0 ? `${count} ` : ""}Coiffeur-Salons in Basel. Vergleiche Preise, lies ★ Bewertungen und buche online. Sofort bestätigt.`,
    en: `${count > 0 ? `${count} ` : ""}hair salons in Basel. Compare prices, read ★ reviews and book online. Instant confirmation.`,
    fr: `${count > 0 ? `${count} ` : ""}salons de coiffure à Bâle. Comparez les prix, lisez les ★ avis et réservez en ligne.`,
    it: `${count > 0 ? `${count} ` : ""}saloni di parrucchiere a Basilea. Confronta prezzi, leggi ★ recensioni e prenota online.`,
  };

  return {
    title: titles[loc] ?? titles.de,
    description: descriptions[loc] ?? descriptions.de,
    openGraph: {
      title: titles[loc] ?? titles.de,
      description: descriptions[loc] ?? descriptions.de,
      type: "website",
      url: `https://solen.ch/${loc}/coiffeur`,
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
    { name: "Coiffeur" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.coiffeur);
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["coiffeur"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("coiffeur", salons, loc);
    }
  } catch { /* graceful degradation — page renders without JSON-LD */ }

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
        category="coiffeur"
        aboveGrid={
          <Suspense fallback={null}>
            <CoiffeurAboveGrid />
          </Suspense>
        }
        belowGrid={<CoiffeurBelowGrid />}
      />
    </>
  );
}
