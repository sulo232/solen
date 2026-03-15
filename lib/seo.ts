// ─────────────────────────────────────────────────────────────────────────────
// lib/seo.ts — SEO utilities
// Dev 2 embeds the JSON-LD in the salon profile page <head> via Next.js
// metadata API. This file is Dev 1's responsibility.
// ─────────────────────────────────────────────────────────────────────────────

import type { Salon, SalonCategory } from "./types";

const APP_URL = "https://solen.ch";

// Maps our category enum to Google's LocalBusiness @type
const CATEGORY_TYPE: Record<SalonCategory, string> = {
  coiffeur:   "HairSalon",
  barbershop: "HairSalon",
  nails:      "NailSalon",
  spa:        "DaySpa",
  makeup:     "BeautySalon",
  waxing:     "BeautySalon",
};

/**
 * Generates a JSON-LD LocalBusiness schema object for a salon profile page.
 * Dev 2 embeds this via Next.js Script tag or <head> metadata.
 */
export function generateSalonSchema(salon: Salon, locale: "de" | "en" = "de") {
  // Determine the most specific @type from categories
  const primaryCategory = salon.categories[0];
  const schemaType = primaryCategory ? (CATEGORY_TYPE[primaryCategory] ?? "LocalBusiness") : "LocalBusiness";

  // Build openingHoursSpecification from salon.opening_hours
  const dayMap: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  const openingHoursSpecification = salon.opening_hours
    ? Object.entries(salon.opening_hours)
        .filter(([, hours]) => hours !== null)
        .map(([day, hours]) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayMap[day] ?? day,
          opens:  hours!.open,
          closes: hours!.close,
        }))
    : [];

  const description =
    locale === "de" ? salon.description_de : salon.description_en;

  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name:    salon.name,
    url:     `${APP_URL}/${locale}/salon/${salon.slug}`,
    image:   salon.cover_photo_url ?? undefined,
    telephone: salon.phone ?? undefined,
    description: description ?? undefined,
    address: {
      "@type":           "PostalAddress",
      streetAddress:     salon.address,
      addressLocality:   "Basel",
      addressRegion:     "BS",
      addressCountry:    "CH",
    },
    geo: {
      "@type":     "GeoCoordinates",
      latitude:    salon.latitude,
      longitude:   salon.longitude,
    },
    aggregateRating: salon.review_count > 0
      ? {
          "@type":       "AggregateRating",
          ratingValue:   salon.average_rating,
          reviewCount:   salon.review_count,
          bestRating:    5,
          worstRating:   1,
        }
      : undefined,
    openingHoursSpecification,
    sameAs: salon.instagram_url ? [salon.instagram_url] : [],
  };

  return schema;
}

/**
 * Generates a canonical URL for a salon profile.
 */
export function salonCanonicalUrl(slug: string, locale: "de" | "en" = "de") {
  return `${APP_URL}/${locale}/salon/${slug}`;
}

/**
 * Generates Open Graph metadata for a salon.
 */
export function salonOpenGraph(salon: Salon, locale: "de" | "en" = "de") {
  const description = (locale === "de" ? salon.description_de : salon.description_en)
    ?? `${salon.name} — Online buchen auf solen.ch`;

  return {
    title:       `${salon.name} | solen.ch`,
    description,
    images:      salon.cover_photo_url ? [{ url: salon.cover_photo_url }] : [],
    locale:      locale === "de" ? "de_CH" : "en_GB",
    type:        "business.business" as const,
    url:         salonCanonicalUrl(salon.slug, locale),
  };
}
