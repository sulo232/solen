import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { SpaBelowGrid } from "@/components/spa/SpaSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Spa & Wellness in Basel — solen.ch",
  description: "Spa & Wellness in Basel — Massagen, Gesichtsbehandlungen, Sauna. Jetzt buchen.",
  openGraph: {
    title: "Spa & Wellness in Basel — solen.ch",
    description: "Entspannung pur — Massagen, Gesichtsbehandlungen und Day-Spa-Pakete in Basel.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/spa",
    languages: { de: "https://solen.ch/de/spa", en: "https://solen.ch/en/spa", fr: "https://solen.ch/fr/spa", it: "https://solen.ch/it/spa" },
  },
};

export default async function Page() {
  let jsonLd = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["spa"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("spa", salons, "de");
    }
  } catch { /* graceful degradation */ }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CategoryPage
        category="spa"
        belowGrid={<SpaBelowGrid />}
      />
    </>
  );
}
