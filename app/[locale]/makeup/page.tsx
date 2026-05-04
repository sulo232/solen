import type { Metadata } from "next";
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
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center">
        <MakeupBelowGrid />
      </div>
    </>
  );
}
