import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryLikeLimiter } from "@/lib/ratelimit";

/**
 * Save / unsave a look into a collection (V3-D414, Phase 2).
 * POST   { item_id }      → save the look into this collection. Upserts on (user_id, item_id) UNIQUE, so a look
 *                           lives in exactly one collection; re-saving moves it here.
 * DELETE ?item_id=…       → remove the look from this collection (deletes the save row).
 * Owner-scoped; collection ownership is verified before writing.
 */
async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function ownsCollection(admin: ReturnType<typeof createAdminSupabaseClient>, id: string, userId: string) {
  const { data } = await admin.from("discovery_collections").select("id").eq("id", id).eq("user_id", userId).single();
  return !!data;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const { id } = await params;
  try {
    const userId = await requireUser();
    if (!userId) return NextResponse.json({ error: "auth required" }, { status: 401 });

    const rateLimited = await applyRateLimit(discoveryLikeLimiter, { userId });
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const itemId = (body?.item_id ?? "").toString();
    if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

    const admin = createAdminSupabaseClient();
    if (!(await ownsCollection(admin, id, userId))) return NextResponse.json({ error: "not found" }, { status: 404 });

    const { error } = await admin
      .from("discovery_saves")
      .upsert({ user_id: userId, item_id: itemId, collection_id: id }, { onConflict: "user_id,item_id" });
    if (error) { console.error("[collections/items] save failed:", error); return NextResponse.json({ error: error.message }, { status: 500 }); }
    return NextResponse.json({ ok: true, saved: true });
  } catch (e) {
    console.error("[collections/items] POST error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await requireUser();
    if (!userId) return NextResponse.json({ error: "auth required" }, { status: 401 });

    const rateLimited = await applyRateLimit(discoveryLikeLimiter, { userId });
    if (rateLimited) return rateLimited;

    const itemId = req.nextUrl.searchParams.get("item_id");
    if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("discovery_saves")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("collection_id", id);
    if (error) { console.error("[collections/items] remove failed:", error); return NextResponse.json({ error: error.message }, { status: 500 }); }
    return NextResponse.json({ ok: true, saved: false });
  } catch (e) {
    console.error("[collections/items] DELETE error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
