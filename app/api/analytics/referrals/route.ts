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
    // NOTE: `referral_stats` is not a real table (confirmed against lib/database.types.ts and
    // `npm run exists referral_stats`, 0 matches anywhere), so this route has always hit the
    // fallback below on every call (the query used to fail at runtime with a genuine Postgres
    // "table does not exist" error, caught by the `error || !rawStats` branch that used to sit
    // here). Skipping the always-failing query and returning the same fallback directly, byte
    // identical to the response every caller has always received.
    return NextResponse.json({
      total_referrals: 0,
      completed_referrals: 0,
      total_revenue_from_referrals: 0,
      top_referrers: []
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
