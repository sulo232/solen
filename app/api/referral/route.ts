import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attempt to get user referral config or profile containing the code
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", session.user.id)
      .single();

    let referralCode = profile?.referral_code;

    // If no referral code exists, optionally generate one
    if (!referralCode) {
      referralCode = `SOLEN-${session.user.id.substring(0, 5).toUpperCase()}`;
      await supabase.from("profiles").update({ referral_code: referralCode }).eq("id", session.user.id);
    }

    // Try to get stats from user_referrals / user_credits table
    // If table doesn't exist, we just catch and return 0
    let friends_invited = 0;
    let total_earned = 0;

    try {
      const { data: stats } = await supabase
        .from("referrals")
        .select("id")
        .eq("referrer_id", session.user.id)
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
        .eq("user_id", session.user.id);

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
