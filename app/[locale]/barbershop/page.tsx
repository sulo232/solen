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
  const alternates = buildAlternates("barbershop", loc);

  // The count and the JSON-LD list now come from ONE cached, parallel lookup instead of two
  // sequential uncached queries. Measured before the change: 580 to 585ms of database time on the
  // render path of every category tap, for two values no visitor ever sees.
  const { count } = await getCategorySeo("barbershop");

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
    { name: "Barbershop" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.barbershop[loc] ?? CATEGORY_FAQS.barbershop.de);
  const { salons } = await getCategorySeo("barbershop");
  if (salons.length) jsonLd = generateCategoryListSchema("barbershop", salons, loc);
  const filterAvailability = await getFilterAvailability();

  return (
    <>
      <h1 className="sr-only">{tNavigation("barbershop")}</h1>
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
      {/* V3-D350 (2026-05-28): unified Airbnb-style search is the default render
          (no flag). CategoryHero + SEO above/below slots dropped unconditionally;
          metadata + JSON-LD above are KEPT (the real SEO). */}
      <SearchTemplate locale={loc} serviceFilter="barbershop" filterAvailability={filterAvailability} />
    </>
  );
}
