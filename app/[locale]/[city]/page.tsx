import { notFound } from "next/navigation";
import { isValidCitySlug, getCityName, type CitySlug } from "@/lib/cities";
import CityPage from "@/components/CityPage";

interface Props {
  params: { locale: string; city: string };
}

export default function CityRoute({ params }: Props) {
  if (!isValidCitySlug(params.city)) {
    notFound();
  }

  return <CityPage city={params.city as CitySlug} locale={params.locale} />;
}

export function generateStaticParams() {
  const cities = ["basel", "zuerich", "bern"];
  return cities.map((city) => ({ city }));
}

export function generateMetadata({ params }: Props) {
  if (!isValidCitySlug(params.city)) return {};

  const cityName = getCityName(params.city as CitySlug, params.locale);
  return {
    title: `Salons in ${cityName} | Solen`,
    description: `Finde die besten Salons in ${cityName}. Coiffeur, Barber, Nails & mehr — jetzt buchen auf Solen.`,
  };
}
