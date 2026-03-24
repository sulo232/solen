import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPage from "@/components/CategoryPage";
import { CoiffeurAboveGrid, CoiffeurBelowGrid } from "@/components/coiffeur/CoiffeurSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Coiffeur in Basel — solen.ch",
  description: "Finde die besten Coiffeure in Basel. Buche online bei top-bewerteten Friseursalons.",
  openGraph: {
    title: "Coiffeur in Basel — solen.ch",
    description: "Top Coiffeure in Basel — Schnitt, Farbe, Styling. Jetzt online buchen.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/coiffeur",
    languages: { de: "https://solen.ch/de/coiffeur", en: "https://solen.ch/en/coiffeur", fr: "https://solen.ch/fr/coiffeur", it: "https://solen.ch/it/coiffeur" },
  },
};

export default async function Page() {
  let jsonLd = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["coiffeur"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("coiffeur", salons, "de");
    }
  } catch { /* graceful degradation — page renders without JSON-LD */ }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CategoryPage
        category="coiffeur"
        aboveGrid={
          <Suspense fallback={null}>
            <CoiffeurAboveGrid />
          </Suspense>
        }
        belowGrid={<CoiffeurBelowGrid />}
      />
    </>
  );
}
