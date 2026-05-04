import type { Metadata } from "next";
import { SpaBelowGrid } from "@/components-legacy/spa/SpaSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("spa", loc);

  let count = 0;
  try {
    const supabase = createAdminSupabaseClient();
    const { count: c } = await supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .contains("categories", ["spa"])
      .eq("is_active", true);
    count = c ?? 0;
  } catch { /* graceful degradation */ }

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

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale ?? "de";
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: `https://solen.ch/${loc}` },
    { name: "Spa" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.spa);
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
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center">
        <SpaBelowGrid />
      </div>
    </>
  );
}
