export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// Explicit public column list, same as app/api/salons/route.ts's salonCols (the
// public card fields, never stripe_account_id / owner_id / search_doc / score_details).
const salonCols =
  "id, slug, name, cover_photo_url, gallery_urls, categories, address, postal_code, quartier, latitude, longitude, opening_hours, average_rating, review_count, last_minute_discount_percent, walkin_enabled, accepts_online_payment, solen_score, created_at";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // Cheap cookie-presence guard: skip the getSession() round-trip entirely when
  // no "sb-" prefixed cookie is present (logged-out callers), same response.
  const hasSbCookie = req.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSbCookie) return NextResponse.json({ items: [], total: 0 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ items: [], total: 0 });

  const rateLimitResponse = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimitResponse) return rateLimitResponse;

  const { data, error } = await supabase
    .from("favorites")
    .select("salon_id")
    .eq("user_id", user.id);

  const ids = (data ?? []).map(f => f.salon_id);

  // ids_only=1: the client just needs to know WHICH salon_ids are saved (heart
  // fill state), no salon join needed. One cheap query only. Checked BEFORE the
  // empty early-return so the response shape is the same regardless of favorite
  // count (council 2026-07-06: zero-favorites used to fall into {items,total}).
  const { searchParams } = new URL(req.url);
  if (searchParams.get("ids_only") === "1") {
    return NextResponse.json({ salon_ids: ids });
  }

  if (error || ids.length === 0) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const { data: salons, error: sErr } = await supabase
    .from("salons")
    .select(`${salonCols}, services(price)`)
    .in("id", ids)
    .eq("is_active", true)
    .eq("is_test", false);

  if (sErr) return NextResponse.json({ items: [], total: 0 });

  const items = (salons ?? []).map((salon: any) => {
      const services = salon.services as { price: number }[] | null;
      const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
      const { services: _s, ...rest } = salon;
      return { ...rest, avg_price };
  });

  return NextResponse.json({ items, total: items.length });
}

// V3-D462: the POST handler was missing — city/category "save" POSTs here and
// silently 405'd (heart filled, nothing persisted). Mirrors DELETE's auth +
// rate-limit; insert tolerates an already-saved row so re-saving is a no-op.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResponse = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimitResponse) return rateLimitResponse;

  let salonId: string | null = null;
  try {
    const body = await req.json();
    salonId = typeof body?.salon_id === "string" ? body.salon_id : null;
  } catch {
    salonId = null;
  }
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, salon_id: salonId });

  // Already favorited -> treat as success (idempotent), surface other errors.
  if (error && !/duplicate|unique|already exists/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, saved: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResponse = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("salon_id", salonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
