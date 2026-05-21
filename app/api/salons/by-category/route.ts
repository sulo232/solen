export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/salons/by-category — V2-D52 Tier 1 Phase F.1.A #2
 *
 * Used by:
 *   - Homepage feed sections (Coiffeur.tsx / Barbershop.tsx — TBD / Nails.tsx — TBD / Spa.tsx — TBD)
 *     when wired in F.1.C
 *   - Category pages (/de/coiffeur, /de/barbershop, /de/nails, /de/spa) when rebuilt in F.1.E
 *
 * Query params:
 *   cat   (required) — one of: coiffeur, barbershop, nails, spa, makeup, waxing
 *   city  (optional) — city slug (e.g. "basel"); filters by `salons.city_id` via `cities.slug`
 *   limit (optional) — default 6, max 24
 *
 * Returns: { items: Salon[], total: number }
 */
export async function GET(request: NextRequest) {
  // Rate limit (public route, IP-based)
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const cat = searchParams.get("cat")?.trim().toLowerCase();
  const citySlug = searchParams.get("city")?.trim().toLowerCase();
  const limitParam = parseInt(searchParams.get("limit") ?? "6", 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 6 : limitParam, 1), 24);

  if (!cat) {
    return NextResponse.json({ message: "Missing required param: cat", code: "BAD_REQUEST" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Resolve city slug → city_id (optional filter)
  let cityId: string | undefined;
  if (citySlug) {
    const { data: cityRecord } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .single();
    if (cityRecord) cityId = cityRecord.id;
  }

  // Fetch salons in this category. Postgres array `cs` (set-contains) operator
  // is the right tool: `categories.cs.{coiffeur}` matches rows whose categories
  // array contains "coiffeur".
  let query = supabase
    .from("salons")
    .select("id, name, slug, average_rating, review_count, cover_photo_url, address, categories, last_minute_discount_percent")
    .contains("categories", [cat])
    .eq("is_active", true)
    .order("average_rating", { ascending: false })
    .order("review_count", { ascending: false });

  if (cityId) {
    query = query.eq("city_id", cityId);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    total: (data ?? []).length,
  });
}
