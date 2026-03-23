export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET: Get current user's referral code + stats
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Get referral entry with code + extended fields (D5)
  const { data: referral } = await supabase
    .from("referrals")
    .select("referral_code, code, max_uses, reward_amount")
    .eq("referrer_id", user.id)
    .is("referred_user_id", null)
    .single();

  // If no referral code exists yet (old user before trigger), create one
  let code = referral?.code ?? referral?.referral_code;
  if (!code) {
    code = "SOLEN-" + user.id.replace(/-/g, "").substring(0, 8).toUpperCase();
    await supabase.from("referrals").insert({
      referrer_id: user.id,
      referral_code: code,
      code,
      status: "pending",
      max_uses: 10,
      reward_amount: 1000,
    });
  }

  // Count completed referrals
  const { count: completedCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("status", "completed");

  // Sum earned credits from referrals
  const { data: credits } = await supabase
    .from("user_credits")
    .select("amount")
    .eq("user_id", user.id)
    .eq("source", "referral");

  const totalEarned = (credits ?? []).reduce((sum, c) => sum + Number(c.amount), 0);

  return NextResponse.json({
    referral_code: code,
    friends_invited: completedCount ?? 0,
    total_earned: totalEarned,
    max_uses: referral?.max_uses ?? 10,
    reward_amount: referral?.reward_amount ?? 1000,
  });
}
