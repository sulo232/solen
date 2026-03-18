import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/salons/[salonId]/off-peak-today
 * Returns active off-peak slot for today if currently in the time window.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { salonId } = await params;
  if (!salonId || salonId.length < 10) {
    return NextResponse.json({ error: "Invalid salon ID" }, { status: 400 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const admin = createAdminSupabaseClient();
  const { data: slots } = await admin
    .from("off_peak_slots")
    .select("id, start_time, end_time, discount_percent")
    .eq("salon_id", salonId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .lte("start_time", currentTime)
    .gte("end_time", currentTime)
    .limit(1);

  if (!slots || slots.length === 0) {
    return NextResponse.json({ slot: null });
  }

  return NextResponse.json({ slot: slots[0] });
}
