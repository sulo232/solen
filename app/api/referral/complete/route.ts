import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, referralLimiter } from "@/lib/ratelimit";
import { validateBody, completeReferralSchema } from "@/lib/validations";

// POST: Complete a referral — credit both users CHF 10
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Rate limit: max 10 referral completions per month per referrer
  const rateLimited = await applyRateLimit(referralLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(completeReferralSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Use admin client for cross-user operations
  const admin = createAdminSupabaseClient();

  // Find the referral code
  const { data: referral } = await admin
    .from("referrals")
    .select("*")
    .eq("referral_code", data.referral_code)
    .is("referred_user_id", null)
    .eq("status", "pending")
    .single();

  if (!referral) {
    return NextResponse.json({ error: "Ungültiger oder bereits verwendeter Empfehlungscode" }, { status: 404 });
  }

  // Prevent self-referral
  if (referral.referrer_id === user.id) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst empfehlen" }, { status: 400 });
  }

  // Check if this user was already referred
  const { data: existingReferral } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_user_id", user.id)
    .eq("status", "completed")
    .single();

  if (existingReferral) {
    return NextResponse.json({ error: "Du hast bereits einen Empfehlungscode verwendet" }, { status: 409 });
  }

  const rewardAmount = referral.reward_amount ?? 10;
  const creditExpiry = new Date();
  creditExpiry.setMonth(creditExpiry.getMonth() + 6); // Credits expire in 6 months

  // Update referral status
  await admin
    .from("referrals")
    .update({
      referred_user_id: user.id,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  // Credit the referrer
  await admin.from("user_credits").insert({
    user_id: referral.referrer_id,
    amount: rewardAmount,
    remaining: rewardAmount,
    source: "referral",
    source_id: referral.id,
    expires_at: creditExpiry.toISOString(),
  });

  // Credit the referred user
  await admin.from("user_credits").insert({
    user_id: user.id,
    amount: rewardAmount,
    remaining: rewardAmount,
    source: "referral",
    source_id: referral.id,
    expires_at: creditExpiry.toISOString(),
  });

  // Generate a new pending referral code for the referrer (so they can keep referring)
  const newCode = "SOLEN-" + referral.referrer_id.replace(/-/g, "").substring(0, 6).toUpperCase()
    + Math.random().toString(36).substring(2, 4).toUpperCase();

  await admin.from("referrals").insert({
    referrer_id: referral.referrer_id,
    referral_code: newCode,
    status: "pending",
  });

  return NextResponse.json({
    success: true,
    credit_amount: rewardAmount,
    message: `CHF ${rewardAmount.toFixed(2)} Guthaben gutgeschrieben!`,
  });
}
