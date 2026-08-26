// GET /api/transit/nearest-stop?lat=<lat>&lng=<lng> — nearest PUBLIC TRANSPORT stop
// to a given coordinate. Built for the salon PDP "Standort" card (SalonLocation.tsx),
// replacing the fake hardcoded `walkTimeMinutes` placeholder with a real computed value.
//
// exists-check: `npm run exists nearest-stop` = 0 matches. `npm run exists transit`
// only matches unrelated PageTransition/PageTransitionWrapper animation components
// (components-legacy/layout/) — no prior art to extend, this is a new route.
//
// Data source: transport.opendata.ch — the Swiss public-transport open-data API
// (SBB/Swiss agencies, GTFS-backed, no API key needed). Fits: this is a Swiss product
// and salon coordinates are always CH addresses. `/v1/locations?x=<lng>&y=<lat>&type=
// station` returns stations near a coordinate, pre-sorted by proximity, with a
// straight-line `distance` in METRES already computed server-side.
//
// MEASURED response quirks (real call against the Cuts & Culture fixture coords,
// lng 7.5791 / lat 47.5589, 2026-07-23):
//   1. `coordinate.x` = LATITUDE, `coordinate.y` = LONGITUDE — the OPPOSITE of the
//      query's own x=lng / y=lat convention. Confirmed by cross-checking a real
//      station's `coordinate` against a haversine calc from the query point — it
//      matched the API's own `distance` field to within 0.1m (188.9m computed vs
//      189m reported for "Basel, Spalentor").
//   2. The endpoint can return a non-station "nearest address" pseudo-result ahead of
//      real stations (id:null, coordinate.x/y:null, icon:null, an unrelated distance
//      scale). Filtered out below — only entries with a real id + coordinate count as
//      a usable transit stop.
export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

type OpendataStation = {
  id: string | null;
  name: string;
  distance: number | null; // metres, straight-line from the query point
  icon: string | null; // "tram" | "bus" | "train" | other value | null
  coordinate: { x: number | null; y: number | null }; // x=lat, y=lng — see header note #1
};

type OpendataLocationsResponse = { stations?: OpendataStation[] };

export type TransitStopType = "tram" | "bus" | "train" | "other";

export type NearestTransitStop = {
  name: string;
  type: TransitStopType;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  walkMinutes: number;
  walkSource?: "directions" | "straight-line";
};

// Average adult walking speed, used to convert the station's distance into a minutes
// estimate — 80 m/min ≈ 4.8 km/h. This is a straight-line distance, not a routed
// path (opendata.ch's /locations endpoint gives no path distance) — the same
// simplification the mock `walkTimeMinutes` prop this route replaces always implied,
// just computed now instead of hardcoded.
const WALK_SPEED_M_PER_MIN = 80;

// In-memory TTL cache, module-scope (same pattern as app/api/search/geocode/route.ts's
// servedCitiesCache) — station positions near a fixed salon address essentially never
// change, so a long TTL avoids hammering the upstream API on every PDP render.
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (owner 2026-07-24: refresh weekly, not daily - a stop rarely moves; also fewer upstream calls)
const stopCache = new Map<string, { stop: NearestTransitStop | null; fetchedAt: number }>();

function cacheKey(lat: number, lng: number): string {
  // Round to 4dp (~11m) — a salon's coordinates are fixed, this just collapses
  // float-noise duplicates onto the same cache entry.
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function iconToType(icon: string | null): TransitStopType {
  if (icon === "tram" || icon === "bus" || icon === "train") return icon;
  return "other";
}

/** Haversine — great-circle distance in metres. Fallback only: the opendata.ch
 *  `distance` field is measured (see header note #1) to match this within 0.1m for
 *  real stations, so this only runs if that field is ever missing. */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchNearestStop(lat: number, lng: number): Promise<NearestTransitStop | null> {
  const url = `https://transport.opendata.ch/v1/locations?x=${lng}&y=${lat}&type=station`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error("[api/transit/nearest-stop] opendata.ch responded", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as OpendataLocationsResponse;
    const stations = json.stations ?? [];
    // Real stations only — see header note #2. The API pre-sorts by proximity, so the
    // first entry with a real id + coordinate is the nearest actual stop.
    const nearest = stations.find((s) => s.id != null && s.coordinate?.x != null && s.coordinate?.y != null);
    if (!nearest || nearest.coordinate.x == null || nearest.coordinate.y == null) return null;

    // coordinate.x = latitude, coordinate.y = longitude (see header note #1).
    const stopLat = nearest.coordinate.x;
    const stopLng = nearest.coordinate.y;
    const distanceMeters =
      typeof nearest.distance === "number" ? nearest.distance : haversineM(lat, lng, stopLat, stopLng);

    return {
      name: nearest.name,
      type: iconToType(nearest.icon),
      latitude: stopLat,
      longitude: stopLng,
      distanceMeters: Math.round(distanceMeters),
      // Minimum 1 — a "0 Min." chip for a stop right outside the door reads as broken,
      // not fast.
      ...(await routedWalk(lng, lat, stopLng, stopLat, distanceMeters)),
    };
  } catch (err) {
    console.error("[api/transit/nearest-stop] fetch failed:", err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng query params are required" }, { status: 400 });
  }

  const key = cacheKey(lat, lng);
  const cached = stopCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ stop: cached.stop });
  }

  // Degrades gracefully: fetchNearestStop returns null (not a throw) for any upstream
  // failure or empty result, so a dead/unreachable opendata.ch never 500s this route —
  // the caller (SalonLocation) renders nothing rather than a fake fallback number.
  const stop = await fetchNearestStop(lat, lng);
  stopCache.set(key, { stop, fetchedAt: Date.now() });
  return NextResponse.json({ stop });
}

/**
 * Real walking time from the Mapbox Directions walking profile — a routed duration that
 * respects actual paths (detours, closures), instead of a straight-line guess. Falls back
 * to the haversine/WALK_SPEED estimate only if Directions fails, and ALWAYS reports which
 * source produced the number so the UI never passes an estimate off as a routed figure.
 */
async function routedWalk(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number,
  fallbackMeters: number,
): Promise<{ walkMinutes: number; walkSource: "directions" | "straight-line" }> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    try {
      const u =
        "https://api.mapbox.com/directions/v5/mapbox/walking/" +
        `${fromLng},${fromLat};${toLng},${toLat}` +
        `?overview=false&access_token=${token}`;
      // 4000ms: transit lookup, same bound as the opendata.ch fetch above in this file
      const res = await fetch(u, { next: { revalidate: 604800 }, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const j = (await res.json()) as { routes?: { duration?: number }[] };
        const secs = j.routes?.[0]?.duration;
        if (typeof secs === "number" && Number.isFinite(secs)) {
          return { walkMinutes: Math.max(1, Math.round(secs / 60)), walkSource: "directions" };
        }
      }
    } catch {
      // fall through to the estimate below
    }
  }
  return {
    walkMinutes: Math.max(1, Math.round(fallbackMeters / WALK_SPEED_M_PER_MIN)),
    walkSource: "straight-line",
  };
}
