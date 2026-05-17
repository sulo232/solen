export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/staff/featured — V2-D52 Tier 1 Phase F.1.A #5
 *
 * Used by:
 *   - FeaturedStylists homepage section (when wired in F.1.C #12).
 *
 * Query params:
 *   city  (optional) — city slug; filters by salons.city_id via cities.slug
 *   limit (optional) — default 4, max 12
 *
 * Returns: { items: { id, name, avatar_url, specialties, salon_id, salon_name, salon_slug, salon_rating } }
 *
 * NOTE: ranking is currently `created_at desc` (newest first). When real
 * featured-score data exists (per-staff-member views, ratings, booking counts),
 * upgrade the order clause.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const citySlug = searchParams.get("city")?.trim().toLowerCase();
  const limitParam = parseInt(searchParams.get("limit") ?? "4", 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 4 : limitParam, 1), 12);

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

  let query = supabase
    .from("staff_members")
    .select("id, name, avatar_url, specialties, salons!inner(id, name, slug, city_id, average_rating)")
    .eq("is_active", true);

  if (cityId) {
    query = query.eq("salons.city_id", cityId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  const items = (data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    avatar_url: s.avatar_url,
    specialties: s.specialties,
    salon_id: s.salons?.id,
    salon_name: s.salons?.name,
    salon_slug: s.salons?.slug,
    salon_rating: s.salons?.average_rating,
  }));

  return NextResponse.json({ items });
}
