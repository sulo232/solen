import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import { getCategorySeo } from "@/lib/seo/category-seo-cache";
import { buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS, safeJsonLd } from "@/lib/seo";
import { getFilterAvailability } from "@/lib/search/filter-availability";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("spa", loc);

  // The count and the JSON-LD list now come from ONE cached, parallel lookup instead of two
  // sequential uncached queries. Measured before the change: 580 to 585ms of database time on the
  // render path of every category tap, for two values no visitor ever sees.
  const { count } = await getCategorySeo("spa");

  const titles: Record<string, string> = {
    de: "Beste Spas & Wellness in Basel — Online buchen | Solen",
    en: "Best Spa & Wellness in Basel — Book Online | Solen",
    fr: "Meilleurs spas & bien-être à Bâle — Réserver en ligne | Solen",
    it: "Migliori spa e benessere a Basilea — Prenota online | Solen",
  };
  const descriptions: Record<string, string> = {
    de: `${count > 0 ? `${count} ` : ""}Spas & Wellness-Studios in Basel. Massagen, Gesichtsbehandlungen, Day-Spa. Vergleiche Preise, lies ★ Bewertungen und buche online.`,
    en: `${count > 0 ? `${count} ` : ""}spa & wellness studios in Basel. Massages, facials, day spa. Compare prices, read ★ reviews and book online.`,
    fr: `${count > 0 ? `${count} ` : ""}spas & studios bien-être à Bâle. Massages, soins du visage, day spa. Comparez les prix et réservez en ligne.`,
    it: `${count > 0 ? `${count} ` : ""}spa e studi wellness a Basilea. Massaggi, trattamenti viso, day spa. Confronta prezzi e prenota online.`,
  };

  return {
    title: titles[loc] ?? titles.de,
    description: descriptions[loc] ?? descriptions.de,
    openGraph: {
      title: titles[loc] ?? titles.de,
      description: descriptions[loc] ?? descriptions.de,
      type: "website",
      url: `https://solen.ch/${loc}/spa`,
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
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: `https://solen.ch/${loc}` },
    { name: "Spa" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.spa[loc] ?? CATEGORY_FAQS.spa.de);
  const filterAvailability = await getFilterAvailability();
  return (
    <>
      <h1 className="sr-only">{tNavigation("spa")}</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faq) }}
      />
      {/* V3-D350 (2026-05-28): unified Airbnb-style search is the default render
          (no flag). CategoryHero + the SEO below slot dropped unconditionally;
          metadata + JSON-LD above are KEPT (the real SEO). */}
      <SearchTemplate locale={loc} serviceFilter="spa" filterAvailability={filterAvailability} />
    </>
  );
}
