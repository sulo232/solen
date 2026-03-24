import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPage from "@/components/CategoryPage";
import { BarbershopAboveGrid, BarbershopBelowGrid } from "@/components/barber/BarbershopSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Barbershop in Basel — solen.ch",
  description: "Barbershops in Basel — Haarschnitt, Bart-Trimm und Grooming. Walk-in oder online buchen.",
  openGraph: {
    title: "Barbershop in Basel — solen.ch",
    description: "Finde den besten Barbershop in deiner Nähe. Skin Fades, Bart-Design, Walk-in Queue.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/barbershop",
    languages: { de: "https://solen.ch/de/barbershop", en: "https://solen.ch/en/barbershop", fr: "https://solen.ch/fr/barbershop", it: "https://solen.ch/it/barbershop" },
  },
};

export default async function Page() {
  let jsonLd = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", ["barbershop"])
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema("barbershop", salons, "de");
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
        category="barbershop"
        aboveGrid={
          <Suspense fallback={null}>
            <BarbershopAboveGrid />
          </Suspense>
        }
        belowGrid={<BarbershopBelowGrid />}
      />
    </>
  );
}
