import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { insertPendingReferralCode } from "@/lib/referral/code";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Schema-drift fix: this used to read/write `profiles.referral_code`, a column that
    // does not exist on the live `profiles` table. The code it minted there could never
    // match a row in `referrals` (which every completion path looks up by referral_code),
    // so a shared code was unrewardable end to end. The user's shareable code lives on
    // `referrals` (referral_code + referrer_id); a pending row for every user is created
    // by the trg_generate_referral_code trigger on profiles INSERT (migration 049). Use
    // the admin client: a normal user has no INSERT policy on `referrals` (system-only,
    // per that migration), so the fallback mint below needs the service role.
    const admin = createAdminSupabaseClient();
    const { data: pendingReferral } = await admin
      .from("referrals")
      .select("referral_code")
      .eq("referrer_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let referralCode = pendingReferral?.referral_code;

    // If no pending referral row exists (trigger somehow missed, or the last one was
    // already consumed and never rotated), mint one directly into `referrals`. CSPRNG,
    // not derived from user.id (that was guessable straight from the UUID), with a
    // retry on unique collision.
    if (!referralCode) {
      referralCode = await insertPendingReferralCode(admin, user.id);
    }

    // Try to get stats from user_referrals / user_credits table
    // If table doesn't exist, we just catch and return 0
    let friends_invited = 0;
    let total_earned = 0;

    try {
      const { data: stats } = await supabase
        .from("referrals")
        .select("id")
        .eq("referrer_id", user.id)
        .eq("status", "completed");

      if (stats) friends_invited = stats.length;
    } catch {
      // Ignore if referrals table doesn't have these columns
    }

    // total_earned = sum of still-valid (unexpired) user_credits.remaining for this user.
    // Was previously hardcoded to 0, so the checkout "Guthaben verfügbar" banner never showed.
    try {
      const nowIso = new Date().toISOString();
      const { data: credits } = await supabase
        .from("user_credits")
        .select("remaining, expires_at")
        .eq("user_id", user.id);

      if (credits) {
        total_earned = credits
          .filter((c) => !c.expires_at || c.expires_at > nowIso)
          .reduce((sum, c) => sum + (c.remaining ?? 0), 0);
      }
    } catch {
      // Ignore if user_credits is unavailable; total_earned stays 0.
    }

    return NextResponse.json({ 
      referral_code: referralCode,
      friends_invited,
      total_earned
    }, { status: 200 });

  } catch (err) {
    console.error("Referral API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
