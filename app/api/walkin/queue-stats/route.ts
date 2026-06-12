export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  const serviceId = searchParams.get("service_id");
  // Owner 2026-06-12 ("think deeper: 20-35 is for ANYONE"): a chosen barber has
  // their OWN line — their preferred-queue depth served by ONE chair, so the wait
  // is longer/dynamic per barber. No staff_id = the anyone-wait (whole crew).
  const staffId = searchParams.get("staff_id");

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // People ahead in the queue (scoped to the chosen barber when given).
  let aheadQuery = admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .in("status", ["waiting", "in_chair"]);
  if (staffId) aheadQuery = aheadQuery.eq("preferred_barber_id", staffId);
  const { count: ahead } = await aheadQuery;

  // Active staff to estimate wait (a specific barber = one chair).
  const { data: staff } = await admin
    .from("staff_members")
    .select("id")
    .eq("salon_id", salonId)
    .eq("is_active", true);

  const aheadCount = ahead ?? 0;
  const activeStaffCount = staffId ? 1 : (staff?.length ?? 1);
  const wait = estimateWaitMinutes(aheadCount, 30, activeStaffCount);
  // Honest RANGE (LOCKFILE §0 rule 12: no "ca." point estimates): best case the
  // line moves a slot faster, worst case is the estimate itself.
  const low = aheadCount === 0 ? 0 : Math.max(5, wait - Math.min(15, Math.round(wait * 0.4)));

  return NextResponse.json({
    ahead: aheadCount,
    wait_minutes: wait,
    wait_low: low,
  });
}
