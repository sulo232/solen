export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, getClientIp } from "@/lib/ratelimit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();
// Strict rate limit: 5 per minute per IP (brute-force protection)
const balanceLimiter = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ? new Ratelimit({
      redis: new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "rl:gc-balance",
    })
  : null;

// GET /api/gift-cards/balance?code=XXX : check gift card balance (public, rate limited)
// GET /api/gift-cards/balance?salon_id=XXX : salon's own gift-card list (owner/admin only)
export async function GET(req: NextRequest) {
  if (balanceLimiter) {
    const rateLimited = await applyRateLimit(balanceLimiter, { ip: getClientIp(req) });
    if (rateLimited) return rateLimited;
  }

  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (salonId) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
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
