import { notFound } from "next/navigation";
import { isValidCitySlug, getCityName, type CitySlug } from "@/lib/cities";
import type { SalonCategory } from "@/lib/types";
import CategoryPage from "@/components/CategoryPage";
import { Suspense } from "react";

// Category specific sections
import { CoiffeurAboveGrid, CoiffeurBelowGrid } from "@/components/coiffeur/CoiffeurSections";
import { BarbershopAboveGrid, BarbershopBelowGrid } from "@/components/barber/BarbershopSections";
import { NailsAboveGrid, NailsBelowGrid } from "@/components/nail/NailsSections";
import { SpaBelowGrid } from "@/components/spa/SpaSections";
import { MakeupAboveGrid, MakeupBelowGrid } from "@/components/makeup/MakeupSections";
import { WaxingAboveGrid, WaxingBelowGrid } from "@/components/waxing/WaxingSections";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateCategoryListSchema } from "@/lib/seo";

const VALID_CATEGORIES: SalonCategory[] = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];

interface Props {
  params: Promise<{ locale: string; city: string; category: string }>;
}

export default async function CityCategoryRoute({ params }: Props) {
  const { city, category, locale } = await params;
  if (!isValidCitySlug(city)) notFound();
  if (!VALID_CATEGORIES.includes(category as SalonCategory)) notFound();

  let aboveGrid = null;
  let belowGrid = null;

  switch (category as SalonCategory) {
    case "coiffeur":
      aboveGrid = <CoiffeurAboveGrid />;
      belowGrid = <CoiffeurBelowGrid />;
      break;
    case "barbershop":
      aboveGrid = <BarbershopAboveGrid />;
      belowGrid = <BarbershopBelowGrid />;
      break;
    case "nails":
      aboveGrid = <NailsAboveGrid />;
      belowGrid = <NailsBelowGrid />;
      break;
    case "spa":
      belowGrid = <SpaBelowGrid />;
      break;
    case "makeup":
      aboveGrid = <MakeupAboveGrid />;
      belowGrid = <MakeupBelowGrid />;
      break;
    case "waxing":
      aboveGrid = <WaxingAboveGrid />;
      belowGrid = <WaxingBelowGrid />;
      break;
  }

  let jsonLd = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("name, slug, cover_photo_url, average_rating, review_count")
      .contains("categories", [category])
      .eq("city", city)
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(20);
    if (salons?.length) {
      jsonLd = generateCategoryListSchema(category as SalonCategory, salons, locale);
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
        category={category as SalonCategory}
        city={city as CitySlug}
        aboveGrid={<Suspense fallback={null}>{aboveGrid}</Suspense>}
        belowGrid={belowGrid}
      />
    </>
  );
}

export function generateStaticParams() {
  const cities = ["basel", "zuerich", "bern"];
  const categories = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];
  return cities.flatMap((city) =>
    categories.map((category) => ({ city, category }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { city, locale, category } = await params;
  if (!isValidCitySlug(city)) return {};
  const cityName = getCityName(city as CitySlug, locale);
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${categoryName} in ${cityName} | Solen`,
    description: `Die besten ${categoryName}-Salons in ${cityName}. Jetzt buchen auf Solen.`,
  };
}
