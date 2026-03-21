export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/discover/nails — Nail discovery feed (public, rate limited)
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;
  const sort = url.searchParams.get("sort") || "trending";
  const nailShape = url.searchParams.get("nail_shape");
  const nailStyle = url.searchParams.get("nail_style");
  const material = url.searchParams.get("material");
  const gender = url.searchParams.get("gender");

  const admin = createAdminSupabaseClient();

  let query = admin
    .from("discovery_items")
    .select("*", { count: "exact" })
    .eq("category", "nails")
    .eq("status", "published")
    .range(offset, offset + limit - 1);

  // Apply nail-specific filters
  if (nailShape) query = query.eq("gender", nailShape); // reusing field for shape filter
  if (nailStyle) query = query.contains("tags", [nailStyle]);
  if (material) query = query.contains("tags", [material]);
  if (gender) query = query.eq("gender", gender);

  // Sort
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "most_saved") {
    query = query.order("save_count", { ascending: false });
  } else {
    // trending: weighted by recency + engagement
    query = query.order("like_count", { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
