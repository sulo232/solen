// exists-check: net-new vs lib/cities.ts, lib/supabase.ts, lib/ratelimit.ts because
// this is a NEW API route (B3.1/B3.2, _plans/SEARCH_MAP_OVERHAUL.md), `npm run exists
// geocode` returned 0 matches. It REUSES lib/cities.ts conventions (served-city shape,
// haversine) and lib/supabase.ts / lib/ratelimit.ts as-is (no duplication of those
// modules); the only net-new code is the Mapbox forward-geocode call + the
// served-city restriction/dedup logic below.
export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getPublicEnv } from "@/lib/env";

// B3.1/B3.2 (_plans/SEARCH_MAP_OVERHAUL.md): street/place -> city geocode, RESTRICTED
// to Solen's served cities. Frontend pick-list (B3.3) is a separate later task; this
// route only resolves + returns candidates for it to render.

type ServedCity = {
  slug: string;
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  latitude: number;
  longitude: number;
  radius_km: number | null;
};

export type GeocodeCandidate = {
  type: "street" | "place" | "city";
  label: string;
  street: string | null;
  city_name: string;
  city_slug: string;
  latitude: number;
  longitude: number;
};

// Served-cities cache: this table changes rarely (owner-managed rollout list), so a
// short in-memory TTL avoids a DB round-trip on every geocode keystroke without ever
// serving a materially stale served-city set.
let servedCitiesCache: { data: ServedCity[]; fetchedAt: number } | null = null;
const SERVED_CITIES_TTL_MS = 5 * 60 * 1000;

async function getServedCities(): Promise<ServedCity[]> {
  if (servedCitiesCache && Date.now() - servedCitiesCache.fetchedAt < SERVED_CITIES_TTL_MS) {
    return servedCitiesCache.data;
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cities")
    .select("slug, name_de, name_en, name_fr, name_it, latitude, longitude, radius_km")
    .eq("is_active", true);
  if (error) {
    console.error("[api/search/geocode] failed to load served cities:", error.message);
    return servedCitiesCache?.data ?? [];
  }
  const rows = (data ?? []) as ServedCity[];
  servedCitiesCache = { data: rows, fetchedAt: Date.now() };
  return rows;
}

function cityNames(c: ServedCity): string[] {
  return [c.name_de, c.name_en, c.name_fr, c.name_it].filter(Boolean).map((n) => n.toLowerCase().trim());
}

/** Haversine distance in km. Local copy (server route), mirrors lib/cities.ts. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Match a free-text city name (from Mapbox result context) against a served city. */
function matchServedCityByName(cityText: string | null, served: ServedCity[]): ServedCity | null {
  if (!cityText) return null;
  const key = cityText.toLowerCase().trim();
  return served.find((c) => cityNames(c).includes(key)) ?? null;
}

/** Match by proximity to a served city's centre within its configured radius. */
function matchServedCityByProximity(lat: number, lng: number, served: ServedCity[]): ServedCity | null {
  for (const c of served) {
    const radiusKm = c.radius_km ?? 15; // fallback radius when unset in DB
    if (haversineKm(lat, lng, c.latitude, c.longitude) <= radiusKm) return c;
  }
  return null;
}

// Mapbox v6 forward geocoding feature shape (subset used here).
type MapboxContextEntry = { name?: string };
type MapboxFeature = {
  properties: {
    feature_type?: string;
    name?: string;
    place_formatted?: string;
    coordinates?: { latitude?: number; longitude?: number };
    context?: {
      place?: MapboxContextEntry;
      locality?: MapboxContextEntry;
      district?: MapboxContextEntry;
    };
  };
  geometry?: { coordinates?: [number, number] }; // [lng, lat]
};

function extractCityText(f: MapboxFeature): string | null {
  const ctx = f.properties.context;
  // place = the town/city in Mapbox v6 context; locality/district cover some CH
  // municipalities that resolve as locality instead of place.
  return ctx?.place?.name ?? ctx?.locality?.name ?? ctx?.district?.name ?? null;
}

function extractStreetLabel(f: MapboxFeature): string | null {
  const type = f.properties.feature_type;
  if (type === "address" || type === "street") return f.properties.name ?? null;
  return null;
}

function extractLatLng(f: MapboxFeature): { lat: number; lng: number } | null {
  const coords = f.properties.coordinates;
  if (typeof coords?.latitude === "number" && typeof coords?.longitude === "number") {
    return { lat: coords.latitude, lng: coords.longitude };
  }
  const g = f.geometry?.coordinates;
  if (Array.isArray(g) && g.length === 2) return { lat: g[1], lng: g[0] };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ candidates: [] });
    }
    const query = q.slice(0, 200);

    const served = await getServedCities();
    if (served.length === 0) {
      // No active served city means nothing can be restricted-in; don't call out to
      // Mapbox for a request that can never return a valid candidate.
      return NextResponse.json({ candidates: [] });
    }

    // Fast path: q matches a served city's slug or localized name directly.
    const qKey = query.toLowerCase();
    const directCity = served.find((c) => c.slug.toLowerCase() === qKey || cityNames(c).includes(qKey));
    if (directCity) {
      const candidate: GeocodeCandidate = {
        type: "city",
        label: directCity.name_de,
        street: null,
        city_name: directCity.name_de,
        city_slug: directCity.slug,
        latitude: directCity.latitude,
        longitude: directCity.longitude,
      };
      return NextResponse.json({ candidates: [candidate] });
    }

    const rawToken = getPublicEnv().NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!rawToken) {
      console.error("[api/search/geocode] NEXT_PUBLIC_MAPBOX_TOKEN not set, cannot geocode");
      return NextResponse.json({ error: "Geocoding unavailable" }, { status: 500 });
    }
    const token: string = rawToken;

    function buildUrl(proximityCity: ServedCity): string {
      // Mapbox Geocoding v6 forward search, CH-biased, address/street/place types.
      const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
      url.searchParams.set("q", query);
      url.searchParams.set("access_token", token);
      url.searchParams.set("country", "ch");
      url.searchParams.set("autocomplete", "true");
      url.searchParams.set("types", "address,street,place");
      url.searchParams.set("limit", "8");
      // Bias toward Switzerland's rough bbox (west,south,east,north) so results skew
      // Swiss even before the served-city restriction below.
      url.searchParams.set("bbox", "5.9,45.8,10.5,47.9");
      // proximity biases RANKING (not a hard filter) toward this served city. Without
      // it, a common Swiss street name ("Marktgasse"/"Bahnhofstrasse" exist in dozens
      // of towns) never surfaces a served-city hit within Mapbox's top `limit` results,
      // since Switzerland has hundreds of small towns competing for rank. Mapbox
      // proximity param order is lng,lat.
      url.searchParams.set("proximity", `${proximityCity.longitude},${proximityCity.latitude}`);
      return url.toString();
    }

    async function fetchFeatures(proximityCity: ServedCity): Promise<MapboxFeature[]> {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(buildUrl(proximityCity), { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          console.error("[api/search/geocode] Mapbox responded", res.status, await res.text().catch(() => ""));
          return [];
        }
        const json = (await res.json()) as { features?: MapboxFeature[] };
        return json.features ?? [];
      } catch (err) {
        console.error("[api/search/geocode] Mapbox fetch failed:", err);
        return [];
      }
    }

    // Fire one proximity-biased request PER served city (in parallel) rather than one
    // unbiased request. This is what makes genuine ambiguity detectable: a street name
    // that exists in multiple served cities (e.g. "Marktgasse" in Basel AND Zuerich AND
    // Bern) only surfaces >1 candidate when each city's own request is proximity-biased
    // toward it, a single request biased to just one city buries the others past
    // Mapbox's `limit` cutoff, and an unbiased request buries ALL served cities behind
    // the hundreds of small Swiss towns sharing the same street name.
    const perCityFeatures = await Promise.all(served.map((c) => fetchFeatures(c)));
    const features = perCityFeatures.flat();

    const candidates: GeocodeCandidate[] = [];
    const seen = new Set<string>();

    for (const f of features) {
      const cityText = extractCityText(f);
      const latLng = extractLatLng(f);
      if (!latLng) continue;

      // Restrict to served cities: match by the result's city name against the
      // served-city name set, falling back to proximity when Mapbox's context is
      // missing/ambiguous (e.g. a bare "place" result with no separate city context).
      const matchedCity =
        matchServedCityByName(cityText, served) ?? matchServedCityByProximity(latLng.lat, latLng.lng, served);
      if (!matchedCity) continue; // DROP results in unserved cities entirely

      const street = extractStreetLabel(f);
      const type: GeocodeCandidate["type"] = street ? "street" : "place";
      const label = street ? `${street}, ${matchedCity.name_de}` : (f.properties.name ?? matchedCity.name_de);

      const dedupeKey = `${label}|${matchedCity.slug}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      candidates.push({
        type,
        label,
        street,
        city_name: matchedCity.name_de,
        city_slug: matchedCity.slug,
        latitude: latLng.lat,
        longitude: latLng.lng,
      });
    }

    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[api/search/geocode] error:", err);
    return NextResponse.json({ candidates: [] });
  }
}
