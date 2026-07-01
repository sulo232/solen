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

/**
 * Display cities for the SEARCH location picker , the broader set a user can search.
 * Superset of the 3 active routing cities above (which have dedicated /[city] pages).
 * CANONICAL single source. SearchBar.tsx + SearchOverlay.tsx currently hold a duplicate
 * of this list (pre-existing debt) , they should import SEARCH_CITIES to unify.
 */
export const SEARCH_CITIES = [
  "Basel", "Zürich", "Bern", "Lausanne", "Genf", "Luzern", "Neuchâtel", "Winterthur",
] as const;

/**
 * City illustration tiles for the search location picker (Airbnb-style destination icons).
 * Owner-provided blue line-art on pale-blue tiles, processed to uniform 128px PNGs with
 * transparent corners (public/icons/cities). Keyed by the SEARCH_CITIES display name.
 */
export const CITY_ICONS: Record<string, string> = {
  "Basel": "/icons/cities/basel.png",
  "Zürich": "/icons/cities/zurich.png",
  "Bern": "/icons/cities/bern.png",
  "Lausanne": "/icons/cities/lausanne.png",
  "Genf": "/icons/cities/genf.png",
  "Luzern": "/icons/cities/luzern.png",
  "Neuchâtel": "/icons/cities/neuchatel.png",
  "Winterthur": "/icons/cities/winterthur.png",
};

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

/**
 * Resolve a `city` value to a CitySlug, accepting EITHER a slug ("basel") OR a localized display
 * name ("Basel"/"Zürich"/"Zurich"/...). The search overlay writes the display name into the URL,
 * but the routing layer keys off slugs , without this, picking a city silently failed the
 * isValidCitySlug check and fell back to countrywide. Returns null for unknown / non-routing cities
 * (e.g. Lausanne, which has no dedicated city yet).
 */
export function slugFromCity(value: string): CitySlug | null {
  const v = value.trim().toLowerCase();
  if (isValidCitySlug(v)) return v;
  for (const slug of CITY_SLUGS) {
    const c = CITIES[slug];
    if ([c.name_de, c.name_en, c.name_fr, c.name_it].some((n) => n.toLowerCase() === v)) return slug;
  }
  return null;
}

/**
 * The city the SEARCH surface defaults to when the user has not chosen one, so the search bar and
 * map show a REAL city instead of "Schweizweit" (owner 2026-07-01). Applied as a real filter, so
 * the label is always honest (never a city name over countrywide results). Env-overridable; falls
 * back to the launch city (Basel , the only city with inventory today). Real DETECTION
 * (geolocation / last-searched city) is a deliberate follow-up: it needs a per-city inventory
 * check first, else a user near an empty city (Zürich/Bern have 0 salons) lands on 0 results.
 */
export const DEFAULT_CITY_SLUG: CitySlug =
  process.env.NEXT_PUBLIC_DEFAULT_CITY && isValidCitySlug(process.env.NEXT_PUBLIC_DEFAULT_CITY)
    ? (process.env.NEXT_PUBLIC_DEFAULT_CITY as CitySlug)
    : "basel";

/**
 * URL sentinel for an EXPLICIT "search the whole country" choice (the overlay's "Keine Präferenz"
 * and the empty-state "search everywhere"). Distinct from "no city chosen yet" (which falls back
 * to DEFAULT_CITY_SLUG): `?city=all` resolves activeCity to null so results are countrywide.
 */
export const ALL_CITIES_PARAM = "all";
