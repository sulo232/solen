import type { Salon, SalonCategory } from "./types";

const BASE_URL = "https://solen.ch";
const LOCALES = ["de", "en", "fr", "it"] as const;

/* ─── Canonical URL + hreflang alternates helper ─── */

export function buildAlternates(path: string, locale?: string) {
  const loc = locale ?? "de";
  return {
    canonical: `${BASE_URL}/${loc}/${path}`.replace(/\/+$/, ""),
    languages: Object.fromEntries(
      LOCALES.map((l) => [l, `${BASE_URL}/${l}/${path}`.replace(/\/+$/, "")]),
    ),
  };
}

/* ─── Category listing ItemList schema ─── */

interface CategoryListSalon {
  name: string;
  slug: string;
  cover_photo_url?: string | null;
}

export function generateCategoryListSchema(
  category: string,
  salons: CategoryListSalon[],
  locale: string = "de",
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.charAt(0).toUpperCase() + category.slice(1)} in Basel`,
    url: `https://solen.ch/${locale}/${category}`,
    numberOfItems: salons.length,
    itemListElement: salons.slice(0, 20).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://solen.ch/${locale}/salon/${s.slug}`,
      name: s.name,
      ...(s.cover_photo_url ? { image: s.cover_photo_url } : {}),
    })),
  };
}

/* ─── WebSite + SearchAction schema (homepage) ─── */

export function generateWebsiteSchema(locale: string = "de") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "solen.ch",
    url: `https://solen.ch/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://solen.ch/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

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
export function generateSalonSchema(salon: Salon, locale: string = "de") {
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
