import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { DISCOVERY_ITEM_PUBLIC_COLS } from "@/lib/discovery/public-columns";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const params = req.nextUrl.searchParams;
  const itemId = params.get("item_id");
  const limitParam = parseInt(params.get("limit") ?? "6", 10);
  const limit = Math.min(Math.max(limitParam, 1), 12);
  const mediaType = params.get("media_type"); // optional: "tiktok" for related tiktoks

  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Fetch the source item
  const { data: source } = await admin
    .from("discovery_items")
    .select("id, category, gender, texture, tags, face_shapes, style_name")
    .eq("id", itemId)
    .single();

  if (!source) return NextResponse.json({ items: [], total: 0 });

  // Build query for similar items. Explicit public column allowlist (see
  // lib/discovery/public-columns.ts), replaces the old `select('*')` which shipped
  // flag_reason (moderation note) and owner_user_id (uploader FK) to anonymous clients.
  // Keeps the columns the scoring logic below reads (tags, texture, gender, face_shapes,
  // like_count) plus category, which the ForYou caller falls back to when style_name is
  // absent.
  let query = admin
    .from("discovery_items")
    .select(DISCOVERY_ITEM_PUBLIC_COLS)
    .eq("status", "published")
    .eq("is_active", true)
    .neq("id", itemId);

  // Filter by media type if requested (for "Related TikToks" section)
  if (mediaType) {
    query = query.eq("media_type", mediaType);
  }

  // Prioritize same category
  query = query.eq("category", source.category);

  // Deterministic slice before scoring: the scoring below (lines 76-93) has no single
  // dominant column to push into the DB order, its heaviest weight, tag overlap x3, is
  // computed against the SOURCE item's tags at request time, not a static sortable column.
  // like_count was the obvious fallback (it's the scoring's own tiebreaker at line 96) but
  // measured live it is 0 for every row in discovery_items, a dead/never-populated metric,
  // so ordering by it would not actually change which rows land in the pre-scoring slice.
  // created_at is the freshness key the general browse feed's own RPC orders by (see the
  // FeedCursor comment in app/api/discovery/feed/route.ts: "gender rank, sort_order,
  // created_at, id"), is live and varies per row, so ordering by it here makes the arbitrary
  // limit*3 cut stable and meaningful (most recent first) instead of an unspecified DB order.
  query = query.order("created_at", { ascending: false });

  // Limit the result set
  query = query.limit(limit * 3); // fetch extra for scoring

  const { data: candidates } = await query;
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ items: [], total: 0 });
  }

  // Score and rank by similarity
  const sourceTags = new Set(source.tags ?? []);
  const sourceFaces = new Set(source.face_shapes ?? []);

  const scored = candidates.map((item) => {
    let score = 0;
    // Tag overlap (×3)
    const itemTags = item.tags ?? [];
    for (const tag of itemTags) {
      if (sourceTags.has(tag)) score += 3;
    }
    // Texture match (×2)
    if (source.texture && item.texture === source.texture) score += 2;
    // Gender match (×1)
    if (item.gender === source.gender) score += 1;
    // Face shape overlap (×1)
    const itemFaces = item.face_shapes ?? [];
    for (const face of itemFaces) {
      if (sourceFaces.has(face)) score += 1;
    }
    return { ...item, _score: score };
  });

  // Sort by score descending, then by like_count
  scored.sort((a, b) => b._score - a._score || (b.like_count ?? 0) - (a.like_count ?? 0));

  // Return top N without the internal score
  const results = scored.slice(0, limit).map(({ _score, ...item }) => item);

  return NextResponse.json({ items: results, total: results.length });
}
