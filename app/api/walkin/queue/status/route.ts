export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";
import { recentAvgServiceMinutes } from "@/lib/barber/walkin-ticket";
import { findQueueEntryByToken } from "@/lib/walkin/authz";

// GET /api/walkin/queue/status?token={tracking_token}
// Public — anonymous clients poll this every 30s to track their queue position.
// No auth required; tracking_token is the identity proof.
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Single guest gate: resolve the entry by its tracking token (see lib/walkin/authz).
  const entry = await findQueueEntryByToken<{
    id: string; customer_name: string; position: number; status: string;
    estimated_wait_minutes: number; joined_at: string; called_at: string | null;
    started_at: string | null; completed_at: string | null; salon_id: string;
  }>(
    admin,
    token,
    "id, customer_name, position, status, estimated_wait_minutes, joined_at, called_at, started_at, completed_at, salon_id",
  );

  if (!entry) {
    return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
  }

  // Count how many people are ahead (waiting, not in_chair)
  const { count: ahead } = await admin
    .from("barber_walkin_queue")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", entry.salon_id)
    .eq("status", "waiting")
    .lt("position", entry.position);

  // Live ETA: recompute from the CURRENT queue depth + the salon's recent measured pace, so
  // the wait drops as the line moves — instead of the frozen creation-time estimate.
  const aheadCount = ahead ?? 0;
  let estimatedWaitMinutes = 0;
  if (entry.status === "waiting") {
    const { data: staff } = await admin
      .from("staff_members").select("id").eq("salon_id", entry.salon_id).eq("is_active", true);
    const avg = await recentAvgServiceMinutes(admin, entry.salon_id);
    // `|| 1`, not `?? 1`: 0 active staff must still estimate against 1 chair, else wait shows 0.
    estimatedWaitMinutes = estimateWaitMinutes(aheadCount, avg, staff?.length || 1);
  }

  return NextResponse.json({
    id: entry.id,
    customerName: entry.customer_name,
    position: entry.position,
    status: entry.status,
    estimatedWaitMinutes,
    aheadCount,
    joinedAt: entry.joined_at,
    calledAt: entry.called_at,
    startedAt: entry.started_at,
    completedAt: entry.completed_at,
  });
}
