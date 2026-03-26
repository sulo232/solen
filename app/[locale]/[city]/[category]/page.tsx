import { notFound } from "next/navigation";
import { isValidCitySlug, getCityName, type CitySlug } from "@/lib/cities";
import type { SalonCategory } from "@/lib/types";
import CityPage from "@/components/CityPage";

const VALID_CATEGORIES: SalonCategory[] = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];

interface Props {
  params: { locale: string; city: string; category: string };
}

export default function CityCategoryRoute({ params }: Props) {
  if (!isValidCitySlug(params.city)) notFound();
  if (!VALID_CATEGORIES.includes(params.category as SalonCategory)) notFound();

  return (
    <CityPage
      city={params.city as CitySlug}
      locale={params.locale}
      initialCategory={params.category as SalonCategory}
    />
  );
}

export function generateStaticParams() {
  const cities = ["basel", "zuerich", "bern"];
  const categories = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];
  return cities.flatMap((city) =>
    categories.map((category) => ({ city, category }))
  );
}

export function generateMetadata({ params }: Props) {
  if (!isValidCitySlug(params.city)) return {};
  const cityName = getCityName(params.city as CitySlug, params.locale);
  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  return {
    title: `${categoryName} in ${cityName} | Solen`,
    description: `Die besten ${categoryName}-Salons in ${cityName}. Jetzt buchen auf Solen.`,
  };
}
