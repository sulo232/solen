// =============================================================================
// lib/cities.ts — City constants, types, and utilities
// =============================================================================

// =============================================================================

export type CitySlug = "basel" | "zuerich" | "bern";

export interface City {
  id: string;
  slug: CitySlug;
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  is_active: boolean;
  display_order: number;
  latitude: number;
  longitude: number;
  radius_km: number;
  created_at: string;
}

/** Static city data for client-side usage (no DB call needed) */
export const CITIES: Record<CitySlug, { name_de: string; name_en: string; name_fr: string; name_it: string; lat: number; lng: number }> = {
  basel:   { name_de: "Basel",  name_en: "Basel",  name_fr: "Bâle",   name_it: "Basilea", lat: 47.5596, lng: 7.5886 },
  zuerich: { name_de: "Zürich", name_en: "Zurich", name_fr: "Zurich", name_it: "Zurigo",  lat: 47.3769, lng: 8.5417 },
  bern:    { name_de: "Bern",   name_en: "Berne",  name_fr: "Berne",  name_it: "Berna",   lat: 46.9480, lng: 7.4474 },
};

export const CITY_SLUGS: CitySlug[] = ["basel", "zuerich", "bern"];

/** Get localized city name */
export function getCityName(slug: CitySlug, locale: string): string {
  const city = CITIES[slug];
  if (!city) return slug;
  const key = `name_${locale}` as keyof typeof city;
  return (city[key] as string) ?? city.name_de;
}

/** Find nearest city from coordinates using Haversine distance */
export function findNearestCity(lat: number, lng: number): CitySlug {
  let nearest: CitySlug = "basel";
  let minDist = Infinity;

  for (const [slug, city] of Object.entries(CITIES)) {
    const dist = haversine(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = slug as CitySlug;
    }
  }
  return nearest;
}

/** Haversine distance in km */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Check if a CitySlug is valid */
export function isValidCitySlug(slug: string): slug is CitySlug {
  return CITY_SLUGS.includes(slug as CitySlug);
}
