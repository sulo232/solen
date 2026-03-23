export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, discoveryLikeLimiter, getClientIp } from "@/lib/ratelimit";

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
  // Accept both frontend param names (style/shape) and legacy names (nail_style/nail_shape)
  const style = url.searchParams.get("style") || url.searchParams.get("nail_style");
  const shape = url.searchParams.get("shape") || url.searchParams.get("nail_shape");
  const material = url.searchParams.get("material");
  const gender = url.searchParams.get("gender");

  const admin = createAdminSupabaseClient();

  let query = admin
    .from("discovery_items")
    .select("*", { count: "exact" })
    .eq("category", "nails")
    .eq("status", "published")
    .range(offset, offset + limit - 1);

  // Apply nail-specific filters via tags array
  if (shape) query = query.contains("tags", [shape]);
  if (style) query = query.contains("tags", [style]);
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

// POST /api/discover/nails — Like or save a nail design (auth required)
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(discoveryLikeLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  let body: { item_id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { item_id, action } = body;
  if (!item_id || typeof item_id !== "string" || !["like", "save"].includes(action ?? "")) {
    return NextResponse.json({ error: "item_id (string) and action (like|save) required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const table = action === "like" ? "discovery_likes" : "discovery_saves";
  const countCol = action === "like" ? "like_count" : "save_count";

  // Check if already exists (toggle off)
  const { data: existing } = await admin
    .from(table)
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", item_id)
    .maybeSingle();

  if (existing) {
    // Remove
    await admin.from(table).delete().eq("id", existing.id);
    await admin.rpc("increment_field", { table_name: "discovery_items", row_id: item_id, field_name: countCol, amount: -1 });
    return NextResponse.json({ toggled: false });
  } else {
    // Add
    await admin.from(table).insert({ user_id: user.id, item_id });
    await admin.rpc("increment_field", { table_name: "discovery_items", row_id: item_id, field_name: countCol, amount: 1 });
    return NextResponse.json({ toggled: true });
  }
}
