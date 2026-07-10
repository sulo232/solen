export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, referralLimiter } from "@/lib/ratelimit";
import { validateBody, completeReferralSchema } from "@/lib/validations";
import { completeReferralForFirstBooking } from "@/lib/referral/complete-referral";

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

  // Require a qualifying action before crediting (mirrors the booking-flow gate in
  // app/api/bookings/route.ts, which only completes a referral on the referred user's
  // first confirmed booking). Without this, a code alone paid out CHF 10 to both sides
  // with no real transaction behind it, farmable at scale.
  const { count: qualifyingBookingCount } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["confirmed", "completed"]);

  if (!qualifyingBookingCount || qualifyingBookingCount < 1) {
    return NextResponse.json(
      { error: "Schliesse zuerst eine Buchung ab, um deine Empfehlung zu aktivieren" },
      { status: 400 }
    );
  }

  // CAS + dual-credit now live in the shared helper (also used by app/api/bookings/route.ts
  // and the Stripe webhook's payment_intent.succeeded handler), so this route can no longer
  // double-complete or double-credit on a retry, nor race another completion path for the
  // same code into crediting twice.
  const result = await completeReferralForFirstBooking(admin, user.id, referral.referral_code);
  if (!result.completed) {
    return NextResponse.json(
      { error: "Ungültiger oder bereits verwendeter Empfehlungscode" },
      { status: 409 },
    );
  }
  const rewardAmount = result.rewardAmount ?? referral.reward_amount ?? 10;

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
