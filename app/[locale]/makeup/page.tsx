import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { MakeupAboveGrid, MakeupBelowGrid } from "@/components/makeup/MakeupSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Makeup & Beauty in Basel — solen.ch",
  description: "Make-up Artists in Basel — Braut-Makeup, Editorial, Abend-Look. Online buchen.",
  openGraph: {
    title: "Makeup & Beauty in Basel — solen.ch",
    description: "Professionelle Make-up Artists für jeden Anlass — Hochzeit, Editorial, Alltag.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/makeup",
    languages: { de: "https://solen.ch/de/makeup", en: "https://solen.ch/en/makeup", fr: "https://solen.ch/fr/makeup", it: "https://solen.ch/it/makeup" },
  },
};

export default async function Page() {
  let jsonLd = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["makeup"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("makeup", salons, "de");
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
        category="makeup"
        aboveGrid={<MakeupAboveGrid />}
        belowGrid={<MakeupBelowGrid />}
      />
    </>
  );
}
