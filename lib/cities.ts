// =============================================================================
// lib/cities.ts (City constants, types, and utilities)
// =============================================================================
//
// SOURCE OF TRUTH (2026-07-04 city-rollout refactor): the DB `cities` table
// (WHERE is_active) is now the single source of truth for which cities are
// live. `CitySlug` used to be a hardcoded 3-value union ("basel" | "zuerich"
// | "bern") that every routing/nav surface trusted as exhaustive, that made
// the admin Staedte toggle (app/[locale]/dashboard/cities-admin) a no-op:
// disabling Zuerich in the DB never removed it from the selector, and a newly
// enabled city (e.g. Luzern) could never route at all without a code change.
//
// `CitySlug` is now `string` (any DB slug is valid at runtime). The 3-city
// CITIES/CITY_SLUGS constants below are kept ONLY as a synchronous
// type-safety / last-resort fallback for contexts that cannot reach the DB
// (e.g. a client module evaluated before its first network round-trip), they
// are NOT the runtime gate anymore. Server code must call
// `getActiveCities()`; client nav must fetch the public `/api/cities`
// endpoint (which itself reads `cities WHERE is_active`).
// =============================================================================

/** Any DB `cities.slug` value. No longer a 3-value exhaustive union, the DB
 *  `cities` table (WHERE is_active) is the runtime source of truth. Kept as
 *  a named alias (not bare `string`) so call sites stay self-documenting. */
export type CitySlug = string;

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

/**
 * Static FALLBACK city data, the 3 launch cities, for contexts that cannot
 * reach the DB (e.g. `DEFAULT_CITY_SLUG` evaluated at module load, or a
 * synchronous client helper before `/api/cities` has resolved). NOT the
 * runtime source of truth: a city can be active in the DB without being
 * listed here (e.g. Luzern), and `getCityName`/`getCityCoords` below accept
 * a live `City`/DB row to resolve those correctly.
 */
export const CITIES: Record<string, { name_de: string; name_en: string; name_fr: string; name_it: string; lat: number; lng: number }> = {
  basel:   { name_de: "Basel",  name_en: "Basel",  name_fr: "Bâle",   name_it: "Basilea", lat: 47.5596, lng: 7.5886 },
  zuerich: { name_de: "Zürich", name_en: "Zurich", name_fr: "Zurich", name_it: "Zurigo",  lat: 47.3769, lng: 8.5417 },
  bern:    { name_de: "Bern",   name_en: "Berne",  name_fr: "Berne",  name_it: "Berna",   lat: 46.9480, lng: 7.4474 },
};

/** Fallback-only slug list. See module header, NOT the runtime gate. */
export const CITY_SLUGS: CitySlug[] = ["basel", "zuerich", "bern"];

// ─────────────────────────────────────────────────────────────────────────
// DB-backed active-cities loader (SERVER ONLY, this module is also
// imported by client components, so no top-level `next/headers` /
// `createServerSupabaseClient` import; both are dynamically imported inside
// the function body, same pattern lib/supabase.ts itself uses).
// ─────────────────────────────────────────────────────────────────────────

export interface ActiveCityRow {
  id: string;
  slug: string;
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  display_order: number;
  latitude: number;
  longitude: number;
  radius_km: number | null;
}

// Short in-memory TTL cache, mirrors app/api/search/geocode/route.ts's
// `servedCitiesCache` pattern (the `cities` table changes rarely: an
// owner-managed rollout list, not per-request data).
let activeCitiesCache: { data: ActiveCityRow[]; fetchedAt: number } | null = null;
const ACTIVE_CITIES_TTL_MS = 5 * 60 * 1000;

/** Force the next `getActiveCities()` call to re-hit the DB. Call this right
 *  after an admin toggles `cities.is_active` so the change is visible
 *  immediately instead of waiting out the TTL. */
export function bustActiveCitiesCache(): void {
  activeCitiesCache = null;
}

/**
 * SERVER-ONLY. Reads `cities WHERE is_active ORDER BY display_order`, the
 * single source of truth for which cities are live. 5-minute in-memory TTL
 * cache (bust via `bustActiveCitiesCache()`). Falls back to the last good
 * cached value (not the static CITIES fallback) on a DB error, matching the
 * geocode route's error-handling convention.
 */
export async function getActiveCities(): Promise<ActiveCityRow[]> {
  if (activeCitiesCache && Date.now() - activeCitiesCache.fetchedAt < ACTIVE_CITIES_TTL_MS) {
    return activeCitiesCache.data;
  }
  const { createServerSupabaseClient } = await import("@/lib/supabase");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, slug, name_de, name_en, name_fr, name_it, display_order, latitude, longitude, radius_km")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("[lib/cities] getActiveCities failed:", error.message);
    return activeCitiesCache?.data ?? [];
  }
  const rows = (data ?? []) as ActiveCityRow[];
  activeCitiesCache = { data: rows, fetchedAt: Date.now() };
  return rows;
}

/** SERVER-ONLY. `isValidCitySlug` cannot hit the DB (used by client-only
 *  `lib/city-cookie.ts`), so route-level gating (the `/[city]` dynamic
 *  segment) must validate against the LIVE active set at request time. */
export async function isActiveCitySlug(slug: string): Promise<boolean> {
  const active = await getActiveCities();
  return active.some((c) => c.slug === slug);
}

/** SERVER-ONLY. Resolve a slug to its DB row (or null if inactive/unknown). */
export async function getActiveCityBySlug(slug: string): Promise<ActiveCityRow | null> {
  const active = await getActiveCities();
  return active.find((c) => c.slug === slug) ?? null;
}

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

/**
 * Get a localized city name. Accepts an optional `row` (a live DB city, from
 * `getActiveCities()` / `/api/cities`) so a city NOT in the static fallback
 * list (e.g. Luzern) still resolves to its real localized name instead of
 * falling back to the bare slug. Falls back to the static CITIES map, then
 * to the slug itself if truly unknown.
 */
export function getCityName(
  slug: CitySlug,
  locale: string,
  row?: Pick<ActiveCityRow, "name_de" | "name_en" | "name_fr" | "name_it"> | null,
): string {
  const source = row ?? CITIES[slug];
  if (!source) return slug;
  const key = `name_${locale}` as keyof typeof source;
  return (source[key] as string) ?? source.name_de;
}

/** Get a city's coordinates. Accepts an optional live DB `row` (same
 *  reasoning as `getCityName`) so a non-fallback-listed active city still
 *  resolves real coordinates instead of silently defaulting. */
export function getCityCoords(
  slug: CitySlug,
  row?: Pick<ActiveCityRow, "latitude" | "longitude"> | null,
): { lat: number; lng: number } | null {
  if (row) return { lat: row.latitude, lng: row.longitude };
  const city = CITIES[slug];
  return city ? { lat: city.lat, lng: city.lng } : null;
}

/** Find nearest city from coordinates using Haversine distance. Accepts an
 *  optional live `candidates` list (from `getActiveCities()`/`/api/cities`)
 *  so nearest-city detection considers every DB-active city, not just the
 *  3-city static fallback. Falls back to the static CITIES map. */
export function findNearestCity(
  lat: number,
  lng: number,
  candidates?: ActiveCityRow[],
): CitySlug {
  const pool: { slug: string; lat: number; lng: number }[] = candidates?.length
    ? candidates.map((c) => ({ slug: c.slug, lat: c.latitude, lng: c.longitude }))
    : Object.entries(CITIES).map(([slug, c]) => ({ slug, lat: c.lat, lng: c.lng }));

  let nearest: CitySlug = pool[0]?.slug ?? "basel";
  let minDist = Infinity;

  for (const c of pool) {
    const dist = haversine(lat, lng, c.lat, c.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = c.slug;
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

/**
 * Check if a slug is a valid/known city. CLIENT-SAFE (no DB call), so this
 * cannot be the runtime gate for routing (that's `isActiveCitySlug`, server,
 * DB-backed). Accepts an optional `validSlugs` list, pass the live set from
 * `/api/cities` (fetched client-side) so this reflects the CURRENT active
 * DB set instead of only the 3-city static fallback. Without it, falls back
 * to the static CITY_SLUGS list (used only before the live set has loaded).
 */
export function isValidCitySlug(slug: string, validSlugs?: string[]): slug is CitySlug {
  return (validSlugs ?? CITY_SLUGS).includes(slug);
}

/**
 * Resolve a `city` value to a CitySlug, accepting EITHER a slug ("basel") OR a localized display
 * name ("Basel"/"Zürich"/"Zurich"/...). The search overlay writes the display name into the URL,
 * but the routing layer keys off slugs , without this, picking a city silently failed the
 * isValidCitySlug check and fell back to countrywide. Returns null for unknown / non-routing cities
 * (e.g. Lausanne, which has no dedicated city yet). Accepts an optional live `rows` list (from
 * `/api/cities`) so this also resolves cities outside the static CITIES fallback.
 */
export function slugFromCity(value: string, rows?: ActiveCityRow[]): CitySlug | null {
  const v = value.trim().toLowerCase();
  if (rows?.length) {
    const bySlug = rows.find((c) => c.slug.toLowerCase() === v);
    if (bySlug) return bySlug.slug;
    const byName = rows.find((c) =>
      [c.name_de, c.name_en, c.name_fr, c.name_it].some((n) => n.toLowerCase() === v),
    );
    if (byName) return byName.slug;
    return null;
  }
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
