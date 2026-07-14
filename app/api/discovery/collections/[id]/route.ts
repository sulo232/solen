import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import type { Database } from "@/lib/database.types";

/**
 * A single saved collection (V3-D414, Phase 2). Owner-scoped.
 * GET    → the collection + its saved looks (newest first).
 * DELETE → delete the collection (its saves' collection_id is SET NULL by the FK, so the saves survive).
 * PATCH  → rename / toggle privacy { name?, is_public? }.
 */
const ITEM_COLS =
  "id, source, content_type, media_type, image_url, tiktok_url, tiktok_thumbnail_url, tiktok_embed_html, author_name, style_name, alt_text, tags, price_min";

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const { id } = await params;
  try {
    const userId = await requireUser();
    if (!userId) return NextResponse.json({ error: "auth required" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data: collection, error } = await admin
      .from("discovery_collections")
      .select("id, name, is_public, created_at")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error || !collection) return NextResponse.json({ error: "not found" }, { status: 404 });

    const { data: saves } = await admin
      .from("discovery_saves")
      .select("item_id")
      .eq("user_id", userId)
      .eq("collection_id", id)
      .order("created_at", { ascending: false });
    const ids = (saves ?? []).map((s) => s.item_id).filter((v): v is string => v !== null);

    let items: Array<Record<string, any>> = [];
    if (ids.length) {
      const { data: rows } = await admin
        .from("discovery_items")
        .select(ITEM_COLS)
        .in("id", ids)
        .eq("status", "published")
        .eq("is_active", true);
      const byId = new Map((rows ?? []).map((r) => [r.id, r]));
      items = ids.map((i) => byId.get(i)).filter(Boolean) as Array<Record<string, any>>;
    }
    return NextResponse.json({ collection, items });
  } catch (e) {
    console.error("[collections/[id]] GET error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await requireUser();
    if (!userId) return NextResponse.json({ error: "auth required" }, { status: 401 });

    const rateLimited = await applyRateLimit(generalLimiter, { userId });
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const patch: Database["public"]["Tables"]["discovery_collections"]["Update"] = {};
    if (typeof body?.name === "string") patch.name = body.name.trim().slice(0, 60);
    if (typeof body?.is_public === "boolean") patch.is_public = body.is_public;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("discovery_collections").update(patch).eq("id", id).eq("user_id", userId);
    if (error) { console.error("[collections/[id]] patch failed:", error); return NextResponse.json({ error: error.message }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[collections/[id]] PATCH error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await requireUser();
    if (!userId) return NextResponse.json({ error: "auth required" }, { status: 401 });

    const rateLimited = await applyRateLimit(generalLimiter, { userId });
    if (rateLimited) return rateLimited;

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("discovery_collections").delete().eq("id", id).eq("user_id", userId);
    if (error) { console.error("[collections/[id]] delete failed:", error); return NextResponse.json({ error: error.message }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[collections/[id]] DELETE error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
