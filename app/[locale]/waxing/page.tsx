import type { Metadata } from "next";
import { WaxingBelowGrid } from "@/components/waxing/WaxingSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { buildAlternates, generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const alternates = buildAlternates("waxing", loc);

  let count = 0;
  try {
    const supabase = createAdminSupabaseClient();
    const { count: c } = await supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .contains("categories", ["waxing"])
      .eq("is_active", true);
    count = c ?? 0;
  } catch { /* graceful degradation */ }

  const titles: Record<string, string> = {
    de: "Bestes Waxing in Basel — Online buchen | Solen",
    en: "Best Waxing Studios in Basel — Book Online | Solen",
    fr: "Meilleurs studios d'épilation à Bâle — Réserver en ligne | Solen",
    it: "Migliori studi ceretta a Basilea — Prenota online | Solen",
  };
  const descriptions: Record<string, string> = {
    de: `${count > 0 ? `${count} ` : ""}Waxing-Studios in Basel. Brazilian, Bein, Achsel & mehr. Vergleiche Preise, lies ★ Bewertungen und buche online. Sofort bestätigt.`,
    en: `${count > 0 ? `${count} ` : ""}waxing studios in Basel. Brazilian, legs, underarms & more. Compare prices, read ★ reviews and book online.`,
    fr: `${count > 0 ? `${count} ` : ""}studios d'épilation à Bâle. Brésilien, jambes, aisselles & plus. Comparez les prix et réservez en ligne.`,
    it: `${count > 0 ? `${count} ` : ""}studi ceretta a Basilea. Brasiliana, gambe, ascelle e altro. Confronta prezzi e prenota online.`,
  };

  return {
    title: titles[loc] ?? titles.de,
    description: descriptions[loc] ?? descriptions.de,
    openGraph: {
      title: titles[loc] ?? titles.de,
      description: descriptions[loc] ?? descriptions.de,
      type: "website",
      url: `https://solen.ch/${loc}/waxing`,
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
    { name: "Waxing" },
  ]);
  const faq = generateFaqSchema(CATEGORY_FAQS.waxing);
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
        <WaxingBelowGrid />
      </div>
    </>
  );
}
