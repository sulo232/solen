import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { NailsAboveGrid, NailsBelowGrid } from "@/components/nail/NailsSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Nägel & Nailstudio in Basel — solen.ch",
  description: "Nagelstudios in Basel — Maniküre, Pediküre, Gel-Nägel, Nail Art. Online-Termine buchen.",
  openGraph: {
    title: "Nailstudio in Basel — solen.ch",
    description: "Gel, Acryl, BIAB, Nail Art — finde dein Nailstudio in Basel und buche online.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/nails",
    languages: { de: "https://solen.ch/de/nails", en: "https://solen.ch/en/nails", fr: "https://solen.ch/fr/nails", it: "https://solen.ch/it/nails" },
  },
};

export default async function Page() {
  let jsonLd = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["nails"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("nails", salons, "de");
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
        category="nails"
        aboveGrid={<NailsAboveGrid />}
        belowGrid={<NailsBelowGrid />}
      />
    </>
  );
}
