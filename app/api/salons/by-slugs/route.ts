export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/salons/by-slugs?slugs=a,b,c — V2-D52 Tier 1 Phase F.1.A #3
 *
 * Used by:
 *   - RecentlyViewed homepage section (when wired in F.1.C #11) — bulk-fetches
 *     salons whose slugs are stored in localStorage `solen.recentlyViewed`.
 *
 * Query params:
 *   slugs (required) — comma-separated list of salon slugs (max 12)
 *
 * Returns: { items: Salon[] } — order matches input slug order; missing slugs are silently dropped.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("slugs")?.trim();

  if (!raw) {
    return NextResponse.json({ message: "Missing required param: slugs", code: "BAD_REQUEST" }, { status: 400 });
  }

  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (slugs.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("salons")
    .select("id, name, slug, average_rating, review_count, cover_photo_url, address, categories")
    .in("slug", slugs)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Reorder to match input slug order so consumers get a stable history list
  const bySlug = new Map((data ?? []).map((s) => [s.slug, s] as const));
  const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean);

  return NextResponse.json({ items: ordered });
}
