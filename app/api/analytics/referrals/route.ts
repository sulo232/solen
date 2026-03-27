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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  
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

    // Attempt to fetch top referrers
    const { data: referrers } = await supabase
      .from("referrals")
      .select("referrer_id, profiles(first_name, last_name), reward_amount")
      .eq("salon_id", salonId)
      .eq("status", "completed");

    // Grouping logic if referrers fetched successfully
    let top_referrers: { name: string; referrals: number; revenue: number }[] = [];
    if (referrers && referrers.length > 0) {
      const map = new Map<string, { count: number; rev: number; name: string }>();
      referrers.forEach(r => {
        const key = r.referrer_id;
        const name = r.profiles ? `${(r.profiles as any).first_name} ${(r.profiles as any).last_name}`.trim() : "Unknown User";
        const rev = r.reward_amount || 0;
        
        if (!map.has(key)) map.set(key, { count: 0, rev: 0, name });
        const entry = map.get(key)!;
        entry.count += 1;
        entry.rev += rev;
      });

      top_referrers = Array.from(map.values())
        .map(e => ({ name: e.name || "Gast", referrals: e.count, revenue: e.rev }))
        .sort((a, b) => b.referrals - a.referrals)
        .slice(0, 10);
    }

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
