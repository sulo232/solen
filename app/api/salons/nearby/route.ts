export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/salons/nearby?lat=X&lng=Y — V2-D52 Tier 1 Phase F.1.A #4
 *
 * Used by:
 *   - Nearby homepage section (when wired in F.1.C #10).
 *
 * Query params:
 *   lat   (optional) — user latitude
 *   lng   (optional) — user longitude
 *   city  (optional) — city slug, used as fallback if lat/lng absent
 *   limit (optional) — default 6, max 24
 *
 * If lat+lng present: returns salons sorted by Haversine distance computed in JS
 * (Postgres earthdistance / postgis isn't installed). Otherwise falls back to
 * top-rated in the given city (if any) or all-time top-rated.
 *
 * Returns: { items: Salon[] }, where each item has `distance_km` if lat/lng were given.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const citySlug = searchParams.get("city")?.trim().toLowerCase();
  const limitParam = parseInt(searchParams.get("limit") ?? "6", 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 6 : limitParam, 1), 24);

  const hasGeo = !isNaN(lat) && !isNaN(lng);

  const supabase = await createServerSupabaseClient();

  let cityId: string | undefined;
  if (citySlug) {
    const { data: cityRecord } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .single();
    if (cityRecord) cityId = cityRecord.id;
  }

  // If we have geo, fetch a wider candidate set then sort+truncate client-side.
  // If no geo, the rating sort + limit is the answer.
  let query = supabase
    .from("salons")
    .select("id, name, slug, average_rating, review_count, cover_photo_url, address, categories, latitude, longitude")
    .eq("is_active", true);

  if (cityId) query = query.eq("city_id", cityId);

  if (hasGeo) {
    // Pull more rows than needed; we'll sort in JS by distance and truncate.
    const { data, error } = await query.limit(limit * 4);
    if (error) {
      return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
    }
    const withDist = (data ?? [])
      .map((s) => ({ ...s, distance_km: haversineKm(lat, lng, s.latitude, s.longitude) }))
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);
    return NextResponse.json({ items: withDist });
  }

  // No geo fallback — top-rated in city or globally
  const { data, error } = await query
    .order("average_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

// Haversine — great-circle distance in kilometres.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
