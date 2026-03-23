export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/gift-card-revenue?salon_id=XXX&period=month
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  const period = searchParams.get("period") ?? "month";

  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", salonId)
    .single();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (salon?.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const periodDays: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  const days = periodDays[period] ?? 30;
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // Gift cards purchased for this salon
  const { data: giftCards } = await admin
    .from("gift_cards")
    .select("id, amount, remaining_balance, status, created_at")
    .eq("salon_id", salonId)
    .gte("created_at", periodStart);

  const totalSold = giftCards?.length ?? 0;
  const totalGiftCardRevenue = (giftCards ?? []).reduce((s, gc) => s + (gc.amount ?? 0), 0);
  const totalRedeemed = (giftCards ?? []).reduce((s, gc) => s + ((gc.amount ?? 0) - (gc.remaining_balance ?? 0)), 0);
  const activeCards = (giftCards ?? []).filter(gc => gc.status === "active").length;

  // Referral completions for this salon
  const { data: referrals } = await admin
    .from("referrals")
    .select("id, reward_amount, status, created_at")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .gte("created_at", periodStart);

  const totalReferrals = referrals?.length ?? 0;
  const totalReferralRewards = (referrals ?? []).reduce((s, r) => s + (r.reward_amount ?? 0), 0);

  return NextResponse.json({
    salon_id: salonId,
    period,
    gift_cards: {
      total_sold: totalSold,
      total_revenue: totalGiftCardRevenue,
      total_redeemed: totalRedeemed,
      active_cards: activeCards,
      unredeemed_balance: totalGiftCardRevenue - totalRedeemed,
    },
    referrals: {
      total_completed: totalReferrals,
      total_rewards_paid: totalReferralRewards,
    },
  });
}
