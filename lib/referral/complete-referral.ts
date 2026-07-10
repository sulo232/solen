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

    // CAS: only this call, among any concurrent/retried callers, can win the row.
    const { data: won, error: casError } = await admin
      .from("referrals")
      .update({
        referred_user_id: userId,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", referral.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (casError) {
      // referrals_one_completed_per_referred_uidx (UNIQUE referred_user_id WHERE
      // status='completed') rejects a second concurrent CAS with a DIFFERENT code for
      // the same user with 23505. That is the authoritative already-redeemed guard;
      // the pre-check SELECT above is only a cheap fast-path that can lose the race.
      if (casError.code === "23505") return { completed: false };
      console.error("[referral] referral CAS update failed:", casError, { referralId: referral.id, userId });
      return { completed: false };
    }
    if (!won) return { completed: false };

    const rewardAmount = referral.reward_amount ?? 10;
    const creditExpiry = new Date();
    creditExpiry.setMonth(creditExpiry.getMonth() + 6);

    const { error: creditError } = await admin.from("user_credits").insert([
      {
        user_id: referral.referrer_id,
        amount: rewardAmount,
        remaining: rewardAmount,
        source: "referral",
        source_id: referral.id,
        expires_at: creditExpiry.toISOString(),
      },
      {
        user_id: userId,
        amount: rewardAmount,
        remaining: rewardAmount,
        source: "referral",
        source_id: referral.id,
        expires_at: creditExpiry.toISOString(),
      },
    ]);
    if (creditError) {
      console.error("[referral] user_credits insert failed after referral CAS won:", creditError, {
        referralId: referral.id,
        userId,
      });
      // The CAS already won (referral row is 'completed'), but crediting failed, so
      // no retry could ever match the CAS again. Delete any credits that did land for
      // this referral (a single multi-row INSERT is atomic in Postgres, so this is a
      // defensive no-op in practice, not a required cleanup) and revert the referral
      // back to 'pending' so a later attempt (webhook retry / cron) can complete it
      // cleanly instead of leaving a permanently 'completed' referral with no payout.
      const { error: creditCleanupError } = await admin
        .from("user_credits")
        .delete()
        .eq("source", "referral")
        .eq("source_id", referral.id);
      if (creditCleanupError) {
        console.error("[referral] credit cleanup after failed insert also failed:", creditCleanupError, {
          referralId: referral.id,
        });
      }
      const { error: revertError } = await admin
        .from("referrals")
        .update({ status: "pending", referred_user_id: null, completed_at: null })
        .eq("id", referral.id);
      if (revertError) {
        console.error("[referral] revert to pending after failed credit insert also failed:", revertError, {
          referralId: referral.id,
        });
      }
      return { completed: false };
    }

    return { completed: true, rewardAmount };
  } catch (err) {
    console.error("[referral] completeReferralForFirstBooking failed:", err, { userId, referralCode });
    return { completed: false };
  }
}
