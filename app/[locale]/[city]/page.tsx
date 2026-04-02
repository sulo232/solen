import { notFound } from "next/navigation";
import { isValidCitySlug, getCityName, type CitySlug } from "@/lib/cities";
import { buildAlternates } from "@/lib/seo";
import CityPage from "@/components/CityPage";

interface Props {
  params: Promise<{ locale: string; city: string }>;
}

export default async function CityRoute({ params }: Props) {
  const { city, locale } = await params;
  if (!isValidCitySlug(city)) {
    notFound();
  }

  return <CityPage city={city as CitySlug} locale={locale} />;
}

export function generateStaticParams() {
  const cities = ["basel", "zuerich", "bern"];
  return cities.map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props) {
  const { city, locale } = await params;
  if (!isValidCitySlug(city)) return {};

  const cityName = getCityName(city as CitySlug, locale);
  const alternates = buildAlternates(city, locale);
  return {
    title: `Salons in ${cityName} | Solen`,
    description: `Finde die besten Salons in ${cityName}. Coiffeur, Barber, Nails & mehr — jetzt buchen auf Solen.`,
    alternates,
  };
}
