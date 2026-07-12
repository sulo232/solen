import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/discovery/boards/[id] — V3-D414. A board (editorial collection) plus its looks.
 * Looks come from the curated discovery_board_pins (ordered by sort_order); if a board has no explicit pins,
 * falls back to a style-keyword FTS match. Reads tables/RPC directly (NOT the /feed route) so opening a board
 * never logs a search / pollutes Recent. Fails soft.
 */
const ITEM_COLS =
  "id, source, content_type, media_type, image_url, tiktok_url, tiktok_thumbnail_url, tiktok_embed_html, author_name, style_name, alt_text, tags, price_min";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { id } = await params;
  try {
    const admin = createAdminSupabaseClient();

    const { data: board, error: bErr } = await admin
      .from("discovery_boards")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();
    if (bErr || !board) return NextResponse.json({ error: "not found" }, { status: 404 });

    // 1) Curated pins, in order.
    const { data: pins, error: pErr } = await admin
      .from("discovery_board_pins")
      .select("item_id, sort_order")
      .eq("board_id", id)
      .order("sort_order", { ascending: true });
    if (pErr) console.error("[Discover] board pins query failed:", pErr);

    let items: Array<Record<string, any>> = [];
    if (pins && pins.length > 0) {
      const ids = pins.map((p) => p.item_id);
      const { data: rows } = await admin
        .from("discovery_items")
        .select(ITEM_COLS)
        .in("id", ids)
        .eq("status", "published")
        .eq("is_active", true);
      const byId = new Map((rows ?? []).map((r) => [r.id, r]));
      items = ids.map((i) => byId.get(i)).filter(Boolean) as Array<Record<string, any>>; // preserve pin order
    } else {
      // 2) Fallback: FTS on the board's style keyword (no logging — this is not the /feed route).
      const { data: rows, error: rErr } = await admin.rpc("search_discovery", {
        q: board.style_name || board.name,
        p_category: board.category ?? undefined,
        p_gender: undefined,
        p_texture: undefined,
        p_style: undefined,
        p_limit: 40,
        p_offset: 0,
      });
      if (rErr) console.error("[Discover] board fallback search failed:", rErr);
      items = ((rows ?? []) as Array<Record<string, any>>).map(({ total_count, ...rest }) => rest);
    }

    return NextResponse.json({ board, items });
  } catch (e) {
    console.error("[Discover] board detail endpoint error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
