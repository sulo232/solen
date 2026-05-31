export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  const serviceId = searchParams.get("service_id");

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // People ahead in the queue.
  const { count: ahead } = await admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .in("status", ["waiting", "in_chair"]);

  // Active staff to estimate wait.
  const { data: staff } = await admin
    .from("staff_members")
    .select("id")
    .eq("salon_id", salonId)
    .eq("is_active", true);

  const aheadCount = ahead ?? 0;
  const activeStaffCount = staff?.length ?? 1;
  const wait = estimateWaitMinutes(aheadCount, 30, activeStaffCount);

  return NextResponse.json({
    ahead: aheadCount,
    wait_minutes: wait,
  });
}
