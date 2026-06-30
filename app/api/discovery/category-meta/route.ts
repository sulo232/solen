// exists-check: net-new vs app/api/discovery/feed/route.ts because this is a dedicated
// aggregation endpoint replacing 5 parallel per-category feed calls from inspo/page.tsx.
// The feed RPC runs a window count(*) on every call; this endpoint uses lighter indexed
// .limit(1) selects per category and is called once on mount instead of 5 times.

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { DISCOVERY_CATEGORIES } from "@/lib/discovery-categories";

// Returns {meta: {[key]: {count, cover}}} for all discovery categories in one round-trip.
// Replaces the 5 parallel feed calls the Inspo page made on mount just to derive
// category pill counts and cover thumbnails. Four small indexed selects (one per specific
// category) + one 6-row global select, all run in parallel, vs five full discovery_feed
// RPC executions each computing a window count(*) over the entire table.
//
// Cover priority: tiktok_url present -> /api/discovery/thumb proxy (persisted, never expires).
// Otherwise image_url or tiktok_thumbnail_url directly.
// "all" cover: picks the 3rd published item (index 2) so it doesn't twin the "hair"
// pill when the catalogue is hair-heavy.

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  try {
    const admin = createAdminSupabaseClient();
    const categories = DISCOVERY_CATEGORIES.map((c) => c.key).filter((k) => k !== "all");

    const [perCatResults, allResult] = await Promise.all([
      Promise.all(
        categories.map(async (cat) => {
          const { data, count, error } = await admin
            .from("discovery_items")
            .select("id, tiktok_url, image_url, tiktok_thumbnail_url", { count: "exact" })
            .eq("status", "published")
            .eq("is_active", true)
            .eq("category", cat)
            .order("sort_order", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(1);
          if (error) {
            console.error(`[category-meta] query failed for ${cat}:`, error);
            return { cat, count: 0, cover: null as string | null };
          }
          const top = data?.[0] ?? null;
          const cover: string | null = top
            ? top.tiktok_url
              ? `/api/discovery/thumb/${top.id}`
              : (top.image_url || top.tiktok_thumbnail_url || null)
            : null;
          return { cat, count: count ?? 0, cover };
        })
      ),
      // "all" category: grab a few published items and pick the 3rd as a non-hair-biased cover.
      admin
        .from("discovery_items")
        .select("id, tiktok_url, image_url, tiktok_thumbnail_url")
        .eq("status", "published")
        .eq("is_active", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const meta: Record<string, { count: number; cover: string | null }> = {};

    for (const { cat, count, cover } of perCatResults) {
      meta[cat] = { count, cover };
    }

    const allItems = allResult.data ?? [];
    const allTop = allItems[2] ?? allItems[0] ?? null;
    const allCover: string | null = allTop
      ? allTop.tiktok_url
        ? `/api/discovery/thumb/${allTop.id}`
        : (allTop.image_url || allTop.tiktok_thumbnail_url || null)
      : null;
    meta["all"] = { count: allTop ? 1 : 0, cover: allCover };

    return NextResponse.json(
      { meta },
      {
        headers: {
          // 5-minute cache: category inventory is stable within a session.
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[category-meta] unexpected error:", err);
    return NextResponse.json({ meta: {} }, { status: 500 });
  }
}
