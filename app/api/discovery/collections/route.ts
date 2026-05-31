import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * Saved collections (V3-D414, Phase 2). The user's boards.
 * GET  → the user's collections, each with a save count + up to 3 cover thumbs (proxied, no expiry).
 * POST → create a collection { name, is_public? }.
 *
 * RLS is OFF on discovery_collections / discovery_saves, so every query is scoped to the session user in code
 * (read via admin + explicit .eq("user_id", …)). Logged-out GET returns an empty list.
 */
const thumbFor = (i: Record<string, any>): string | null =>
  i.tiktok_url && i.id ? `/api/discovery/thumb/${i.id}` : (i.image_url || i.tiktok_thumbnail_url || null);

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ collections: [] });

    const admin = createAdminSupabaseClient();
    const { data: cols, error } = await admin
      .from("discovery_collections")
      .select("id, name, is_public, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) { console.error("[collections] list failed:", error); return NextResponse.json({ collections: [] }); }

    const collections = await Promise.all((cols ?? []).map(async (c) => {
      const { data: saves, count } = await admin
        .from("discovery_saves")
        .select("item_id", { count: "exact" })
        .eq("user_id", userId)
        .eq("collection_id", c.id)
        .order("created_at", { ascending: false })
        .limit(4);
      const ids = (saves ?? []).map((s) => s.item_id);
      let covers: string[] = [];
      if (ids.length) {
        const { data: items } = await admin
          .from("discovery_items")
          .select("id, tiktok_url, image_url, tiktok_thumbnail_url")
          .in("id", ids);
        const byId = new Map((items ?? []).map((i) => [i.id, i]));
        covers = ids.map((id) => byId.get(id)).filter(Boolean).map((i) => thumbFor(i as Record<string, any>)).filter(Boolean).slice(0, 3) as string[];
      }
      return { id: c.id, name: c.name, is_public: c.is_public, count: count ?? 0, covers };
    }));
    return NextResponse.json({ collections });
  } catch (e) {
    console.error("[collections] GET error:", e);
    return NextResponse.json({ collections: [] });
  }
}

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "auth required" }, { status: 401 });

    const rateLimited = await applyRateLimit(generalLimiter, { userId });
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").toString().trim().slice(0, 60);
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("discovery_collections")
      .insert({ user_id: userId, name, is_public: !!body?.is_public })
      .select("id, name, is_public")
      .single();
    if (error) { console.error("[collections] create failed:", error); return NextResponse.json({ error: error.message }, { status: 500 }); }
    return NextResponse.json({ collection: data });
  } catch (e) {
    console.error("[collections] POST error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
