import type { Metadata } from "next";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import CategoryHero from "@/app/[locale]/_components/landings/CategoryHero";
import { MakeupBelowGrid } from "@/components-legacy/makeup/MakeupSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("makeup", loc);

  let count = 0;
  try {
    const supabase = createAdminSupabaseClient();
    const { count: c } = await supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .contains("categories", ["makeup"])
      .eq("is_active", true);
    count = c ?? 0;
  } catch { /* graceful degradation */ }

  const titles: Record<string, string> = {
    de: "Beste Makeup Artists in Basel — Online buchen | Solen",
    en: "Best Makeup Artists in Basel — Book Online | Solen",
    fr: "Meilleurs maquilleurs à Bâle — Réserver en ligne | Solen",
    it: "Migliori truccatori a Basilea — Prenota online | Solen",
  };
  const descriptions: Record<string, string> = {
    de: `${count > 0 ? `${count} ` : ""}Makeup Artists in Basel. Braut-Makeup, Editorial, Abend-Look. Vergleiche Preise, lies ★ Bewertungen und buche online.`,
    en: `${count > 0 ? `${count} ` : ""}makeup artists in Basel. Bridal, editorial, evening looks. Compare prices, read ★ reviews and book online.`,
    fr: `${count > 0 ? `${count} ` : ""}maquilleurs à Bâle. Mariage, éditorial, soirée. Comparez les prix et réservez en ligne.`,
    it: `${count > 0 ? `${count} ` : ""}truccatori a Basilea. Sposa, editoriale, look da sera. Confronta prezzi e prenota online.`,
  };

  return {
    title: titles[loc] ?? titles.de,
    description: descriptions[loc] ?? descriptions.de,
    openGraph: {
      title: titles[loc] ?? titles.de,
      description: descriptions[loc] ?? descriptions.de,
      type: "website",
      url: `https://solen.ch/${loc}/makeup`,
      siteName: "solen.ch",
    },
    alternates,
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale ?? "de";
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: `https://solen.ch/${loc}` },
    { name: "Makeup" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.makeup);
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
      {/* V3-D340 (W11, 2026-05-28): editorial split-hero ABOVE SearchTemplate. See CategoryHero docs for axis sources. */}
      <CategoryHero category="makeup" locale={loc} />
      {/* V3-D241 (W2, 2026-05-27): /makeup was broken FAQ-stub only (same
          pattern as /spa pre-V3-D230). Wired to SearchTemplate so the route
          actually shows makeup salons. */}
      <SearchTemplate
        locale={loc}
        serviceFilter="makeup"
        breadcrumb={[
          { label: "Solen", href: `/${loc}` },
          { label: "Makeup" },
        ]}
        hero={{ title: "Makeup Artists in Basel" }}
        belowSlot={<MakeupBelowGrid />}
      />
    </>
  );
}
