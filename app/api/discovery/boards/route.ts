import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/discovery/boards — editorial collections for the feed row.
// V3-D414: covers are now DERIVED from each board's actual looks through the /api/discovery/thumb proxy, instead
// of the stored cover_images (those are TikTok signed URLs that expire → grey collage tiles). Reliable photos.
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: boards, error } = await admin
    .from("discovery_boards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withCovers = await Promise.all(
    (boards ?? []).map(async (b: Record<string, any>) => {
      const { data: rows } = await admin.rpc("search_discovery", {
        q: b.style_name || b.name,
        p_category: b.category || null,
        p_gender: null,
        p_texture: null,
        p_style: null,
        p_limit: 4,
        p_offset: 0,
      });
      const covers = ((rows ?? []) as Array<Record<string, any>>)
        .map((r) => (r.tiktok_url && r.id ? `/api/discovery/thumb/${r.id}` : r.image_url || r.tiktok_thumbnail_url))
        .filter(Boolean)
        .slice(0, 3);
      return { ...b, cover_images: covers.length > 0 ? covers : (b.cover_images ?? []) };
    })
  );

  return NextResponse.json({ boards: withCovers });
}
