export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, getClientIp } from "@/lib/ratelimit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Strict rate limit: 5 per minute per IP (brute-force protection)
const balanceLimiter = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "rl:gc-balance",
    })
  : null;

// GET /api/gift-cards/balance?code=XXX — Check gift card balance (public, rate limited)
export async function GET(req: NextRequest) {
  if (balanceLimiter) {
    const rateLimited = await applyRateLimit(balanceLimiter, { ip: getClientIp(req) });
    if (rateLimited) return rateLimited;
  }

  const code = new URL(req.url).searchParams.get("code");
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Valid code required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
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
