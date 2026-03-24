import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { WaxingAboveGrid, WaxingBelowGrid } from "@/components/waxing/WaxingSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Waxing in Basel — solen.ch",
  description: "Waxing Studios in Basel — Brazilian, Bein, Achsel, Gesicht. Termin online buchen.",
  openGraph: {
    title: "Waxing in Basel — solen.ch",
    description: "Professionelles Waxing in Basel — alle Körperzonen. Jetzt Termin buchen.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/waxing",
    languages: { de: "https://solen.ch/de/waxing", en: "https://solen.ch/en/waxing", fr: "https://solen.ch/fr/waxing", it: "https://solen.ch/it/waxing" },
  },
};

export default async function Page() {
  let jsonLd = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["waxing"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("waxing", salons, "de");
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
        category="waxing"
        aboveGrid={<WaxingAboveGrid />}
        belowGrid={<WaxingBelowGrid />}
      />
    </>
  );
}
