export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/walkin/queue/status?token={tracking_token}
// Public — anonymous clients poll this every 30s to track their queue position.
// No auth required; tracking_token is the identity proof.
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  const { data: entry, error } = await admin
    .from("barber_walkin_queue")
    .select(
      "id, customer_name, position, status, estimated_wait_minutes, joined_at, called_at, started_at, completed_at, salon_id"
    )
    .eq("tracking_token", token)
    .single();

  if (error || !entry) {
    return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
  }

  // Count how many people are ahead (waiting, not in_chair)
  const { count: ahead } = await admin
    .from("barber_walkin_queue")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", entry.salon_id)
    .eq("status", "waiting")
    .lt("position", entry.position);

  return NextResponse.json({
    id: entry.id,
    customerName: entry.customer_name,
    position: entry.position,
    status: entry.status,
    estimatedWaitMinutes: entry.estimated_wait_minutes,
    aheadCount: ahead ?? 0,
    joinedAt: entry.joined_at,
    calledAt: entry.called_at,
    startedAt: entry.started_at,
    completedAt: entry.completed_at,
  });
}
