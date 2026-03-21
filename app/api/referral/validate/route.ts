export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/referral/validate?code=XXX — Check if referral code is valid
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const code = new URL(req.url).searchParams.get("code");
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Valid code required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Check current user (for self-referral prevention)
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  // Look up referral by code or referral_code
  const { data: referral } = await supabase
    .from("referrals")
    .select("referrer_id, code, referral_code, max_uses, reward_amount, status")
    .or(`code.eq.${code.toUpperCase().trim()},referral_code.eq.${code.toUpperCase().trim()}`)
    .is("referred_user_id", null)
    .single();

  if (!referral) {
    return NextResponse.json({ valid: false, error: "Referral code not found" });
  }

  // Self-referral prevention
  if (currentUserId && referral.referrer_id === currentUserId) {
    return NextResponse.json({ valid: false, error: "Cannot use your own referral code" });
  }

  // Check usage count vs max_uses
  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", referral.referrer_id)
    .eq("status", "completed");

  const maxUses = referral.max_uses ?? 10;
  if ((count ?? 0) >= maxUses) {
    return NextResponse.json({ valid: false, error: "Referral code has reached maximum uses" });
  }

  return NextResponse.json({
    valid: true,
    reward_amount: referral.reward_amount ?? 1000,
  });
}
