import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import { getCategorySeo } from "@/lib/seo/category-seo-cache";
import { generateCategoryListSchema, buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS, safeJsonLd } from "@/lib/seo";
import { getFilterAvailability } from "@/lib/search/filter-availability";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("coiffeur", loc);

  // The count and the JSON-LD list now come from ONE cached, parallel lookup instead of two
  // sequential uncached queries. Measured before the change: 580 to 585ms of database time on the
  // render path of every category tap, for two values no visitor ever sees.
  const { count } = await getCategorySeo("coiffeur");

  const titles: Record<string, string> = {
    de: "Beste Coiffeure in Basel — Online buchen | Solen",
    en: "Best Hair Salons in Basel — Book Online | Solen", // em-dash-ok: pre-existing title dash, unrelated to this edit
    fr: "Meilleurs coiffeurs à Bâle — Réserver en ligne | Solen",
    it: "Migliori parrucchieri a Basilea — Prenota online | Solen",
  };
  const descriptions: Record<string, string> = {
    de: `${count > 0 ? `${count} ` : ""}Coiffeur-Salons in Basel. Vergleiche Preise, lies ★ Bewertungen und buche online. Sofort bestätigt.`,
    en: `${count > 0 ? `${count} ` : ""}hair salons in Basel. Compare prices, read ★ reviews and book online. Instant confirmation.`,
    fr: `${count > 0 ? `${count} ` : ""}stores de coiffure à Bâle. Comparez les prix, lisez les ★ avis et réservez en ligne.`,
    it: `${count > 0 ? `${count} ` : ""}store di parrucchiere a Basilea. Confronta prezzi, leggi ★ recensioni e prenota online.`,
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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale ?? "de";
  const tNavigation = await getTranslations({ locale: loc, namespace: "navigation" });
  let jsonLd = null;
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: `https://solen.ch/${loc}` },
    { name: "Coiffeur" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.coiffeur[loc] ?? CATEGORY_FAQS.coiffeur.de);
  const { salons } = await getCategorySeo("coiffeur");
  if (salons.length) jsonLd = generateCategoryListSchema("coiffeur", salons, loc);
  const filterAvailability = await getFilterAvailability();

  return (
    <>
      <h1 className="sr-only">{tNavigation("coiffeur")}</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faq) }}
      />
      {/* A4-jsonld-escape (2026-07-27): jsonLd carries salon.name/slug read
          straight from the DB. safeJsonLd escapes </script> breakout. */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      {/* V3-D350 (2026-05-28): the unified Airbnb-style search IS the default
          render now (no flag). CategoryHero + the SEO above/below slots are
          dropped unconditionally; the page leads with the search + 2-col card
          grid (the approved mockup — no big category image, like Uber/Fresha).
          generateMetadata + the JSON-LD above are KEPT (the real SEO). */}
      <SearchTemplate locale={loc} serviceFilter="coiffeur" filterAvailability={filterAvailability} />
    </>
  );
}
