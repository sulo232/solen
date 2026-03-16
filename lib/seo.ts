import type { Salon, SalonCategory } from "./types";

const categoryToSchemaType: Record<SalonCategory, string> = {
  coiffeur: "HairSalon",
  barbershop: "HairSalon",
  nails: "NailSalon",
  spa: "DaySpa",
  makeup: "BeautySalon",
  waxing: "BeautySalon",
};

function getSchemaType(categories: SalonCategory[]): string {
  if (categories.includes("spa")) return "DaySpa";
  if (categories.includes("nails")) return "NailSalon";
  if (categories.includes("coiffeur") || categories.includes("barbershop")) return "HairSalon";
  return "HealthAndBeautyBusiness";
}

/**
 * Generate JSON-LD structured data for a salon profile page.
 * Embed in <head> via Next.js script tag or generateMetadata.
 * Used by Dev 2 on the salon/[slug] page.
 */
export function generateSalonSchema(salon: Salon, locale: "de" | "en" = "de") {
  const dayMap: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  const openingHoursSpec = Object.entries(salon.opening_hours ?? {})
    .filter(([, hours]) => hours !== null)
    .map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayMap[day] ?? day,
      opens: hours!.open,
      closes: hours!.close,
    }));

  const priceRange =
    salon.average_rating >= 4 ? "CHF CHF CHF" : salon.average_rating >= 3 ? "CHF CHF" : "CHF";

  return {
    "@context": "https://schema.org",
    "@type": getSchemaType(salon.categories),
    name: salon.name,
    url: `https://solen.ch/${locale}/salon/${salon.slug}`,
    telephone: salon.phone ?? undefined,
    image: salon.cover_photo_url ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.address,
      addressLocality: "Basel",
      addressCountry: "CH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: salon.latitude,
      longitude: salon.longitude,
    },
    aggregateRating:
      salon.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: salon.average_rating.toFixed(1),
            reviewCount: salon.review_count,
          }
        : undefined,
    openingHoursSpecification: openingHoursSpec,
    priceRange,
  };
}
