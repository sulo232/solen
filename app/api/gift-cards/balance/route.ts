export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, getClientIp, guestLookupLimiter } from "@/lib/ratelimit";

// GET /api/gift-cards/balance?code=XXX : check gift card balance (public, rate limited)
// GET /api/gift-cards/balance?salon_id=XXX : salon's own gift-card list (owner/admin only)
export async function GET(req: NextRequest) {
  // Was a standalone `new Ratelimit(...)` outside lib/ratelimit.ts (invisible to the
  // fail-mode split, ring 1a finding). guestLookupLimiter fits this surface's actual
  // risk profile (a public gift-card code -> balance lookup is the same enumeration
  // shape as a guest booking-reference lookup) and is already in ABUSE_PRONE_LIMITERS,
  // so an unconfigured-Upstash production boot now fails CLOSED here too.
  const rateLimited = await applyRateLimit(guestLookupLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (salonId) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (salon?.owner_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: cards } = await admin
      .from("gift_cards")
      .select("id, code, original_amount, remaining_amount, purchaser_email, recipient_name, recipient_email, is_active, created_at, expires_at")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false });

    return NextResponse.json({ items: cards ?? [] });
  }

  const code = new URL(req.url).searchParams.get("code");
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Valid code required" }, { status: 400 });
  }

  // Code lookup via admin client. Public `gc_public_check` RLS was dropped
  // 2026-05-16; the IP rate-limiter above is the brute-force gate.
  const supabase = createAdminSupabaseClient();
  const { data: card } = await supabase
    .from("gift_cards")
    .select("remaining_amount, is_active, expires_at, salon_id, salons(name)")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (!card) return NextResponse.json({ error: "Gift card not found" }, { status: 404 });

  const expired = card.expires_at ? new Date(card.expires_at) < new Date() : false;

  return NextResponse.json({
    balance: card.remaining_amount,
    is_active: card.is_active && !expired,
    expired,
    salon_name: (card.salons as any)?.name ?? null,
  });
}
