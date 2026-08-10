// lib/referral/complete-referral.ts
//
// THE single chokepoint for completing a referral and crediting both sides. Extracted
// (reward-farming and double-credit fix) out of app/api/bookings/route.ts so every entry
// point that can complete a referral (the confirmed-at-create path, the Stripe webhook's
// payment_intent.succeeded handler, and app/api/referral/complete/route.ts) applies the
// SAME check and the SAME compare-and-swap, instead of three divergent copies.
//
// Call this ONLY once a booking has reached a real CONFIRMED (paid or salon-approved)
// state, never at booking-create time for a pending/pending_approval booking. Crediting
// at create time was farmable: abandon payment (or never get salon-approved) and the
// CHF 10/CHF 10 credits were already spent, gated only on a COUNT of pre-existing
// status='confirmed' bookings that always excluded the just-created pending row.
//
// Idempotent by construction: the UPDATE below is a compare-and-swap
// (`.eq("id", referral.id).eq("status", "pending")`), so a concurrent call or a Stripe
// webhook retry that loses the race gets 0 rows back and returns before crediting.
// The two user_credits INSERTs only ever run once per referral.
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkFeatureEnabled } from "@/lib/feature-flags";

export interface CompleteReferralResult {
  completed: boolean;
  rewardAmount?: number;
}

export async function completeReferralForFirstBooking(
  admin: SupabaseClient,
  userId: string | null | undefined,
  referralCode: string | null | undefined,
): Promise<CompleteReferralResult> {
  if (!userId || !referralCode) return { completed: false };

  try {
    // Feature-flag gate: this is THE single chokepoint every referral-completion caller
    // (booking-create, the booking confirm route, the Stripe webhook) funnels through, so
    // gating it here is enough to disable referral completion platform-wide. When the
    // "referral" flag is off, checkFeatureEnabled returns a non-null response and we bail
    // BEFORE any of the bookings/referrals/user_credits reads below run, no crediting, no
    // referral row mutation, no rate-limit-worthy DB work at all.
    const referralDisabled = await checkFeatureEnabled("referral");
    if (referralDisabled) return { completed: false };

    // Only reward a user's FIRST confirmed booking. The caller only invokes this once
    // the triggering booking has already reached status='confirmed', so a count of 1
    // here means the just-confirmed booking is the user's only one.
    const { count: confirmedCount } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "confirmed");
    if ((confirmedCount ?? 0) > 1) return { completed: false };

    // A user can only ever redeem one referral code, regardless of which code is passed.
    const { data: existingReferral } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .eq("status", "completed")
      .maybeSingle();
    if (existingReferral) return { completed: false };

    // Find the pending referral matching the provided code.
    const { data: referral } = await admin
      .from("referrals")
      .select("id, referrer_id, reward_amount")
      .eq("referral_code", referralCode)
      .is("referred_user_id", null)
      .eq("status", "pending")
      .maybeSingle();
    if (!referral || referral.referrer_id === userId) return { completed: false };

    const rewardAmount = referral.reward_amount ?? 10;
    const creditExpiry = new Date();
    creditExpiry.setMonth(creditExpiry.getMonth() + 6);

    // data-money-09: CAS + both user_credits inserts folded into ONE Postgres function
    // (complete_referral_and_credit, supabase/migrations/20260727121500_referral_complete_atomic.sql)
    // so PostgREST's one-request-one-transaction boundary makes them atomic. A hard crash
    // between the CAS committing and the credit insert running (impossible to guard against
    // with two sequential .from() calls, since each is its own transaction) now just rolls
    // back the whole function, leaving the referral exactly 'pending', no manual revert
    // needed. `db` casts to `any`: the RPC is not yet in lib/database.types.ts because this
    // migration has not been applied live (house rule against running migrations from this
    // session); regenerate the types and drop the cast once it is applied.
    const db = admin as any;
    const { data: won, error: rpcError } = await db.rpc("complete_referral_and_credit", {
      p_referral_id: referral.id,
      p_referrer_id: referral.referrer_id,
      p_referred_user_id: userId,
      p_reward_amount: rewardAmount,
      p_expires_at: creditExpiry.toISOString(),
    });
    if (rpcError) {
      // referrals_one_completed_per_referred_uidx (UNIQUE referred_user_id WHERE
      // status='completed') rejects a second concurrent CAS with a DIFFERENT code for
      // the same user with 23505. That is the authoritative already-redeemed guard;
      // the pre-check SELECT above is only a cheap fast-path that can lose the race.
      if (rpcError.code === "23505") return { completed: false };
      console.error("[referral] complete_referral_and_credit RPC failed:", rpcError, { referralId: referral.id, userId });
      return { completed: false };
    }
    if (!won) return { completed: false };

    return { completed: true, rewardAmount };
  } catch (err) {
    console.error("[referral] completeReferralForFirstBooking failed:", err, { userId, referralCode });
    return { completed: false };
  }
}
