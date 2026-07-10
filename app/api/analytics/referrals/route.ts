export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id is required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Verify ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salonId)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Attempt to fetch referral stats based on schema described in INCOMPLETE_FEATURES
    const { data: rawStats, error } = await supabase
      .from("referral_stats")
      .select("*")
      .eq("salon_id", salonId)
      .maybeSingle();

    if (error || !rawStats) {
      // Fallback if table doesn't exist or no data
      return NextResponse.json({
        total_referrals: 0,
        completed_referrals: 0,
        total_revenue_from_referrals: 0,
        top_referrers: []
      });
    }

    // Referrals have no salon_id column (not salon-scoped), so a per-salon
    // top-referrers breakdown is not computable; report honestly as empty.
    const top_referrers: { name: string; referrals: number; revenue: number }[] = [];

    return NextResponse.json({
      total_referrals: rawStats.total_referrals || 0,
      completed_referrals: rawStats.completed_referrals || 0,
      total_revenue_from_referrals: rawStats.total_revenue || 0,
      top_referrers
    });
  } catch {
    // Graceful fallback for stub feature
    return NextResponse.json({
      total_referrals: 0,
      completed_referrals: 0,
      total_revenue_from_referrals: 0,
      top_referrers: []
    });
  }
}
