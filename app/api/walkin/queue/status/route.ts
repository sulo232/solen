export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/walkin/queue/status?token=... — Public: check queue position by tracking token
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const token = req.nextUrl.searchParams.get("token");
  if (!token || token.length < 5) {
    return NextResponse.json({ error: "Valid tracking token required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: entry } = await admin
    .from("barber_walkin_queue")
    .select("id, salon_id, customer_name, position, status, estimated_wait_minutes, joined_at, called_at, started_at, completed_at")
    .eq("tracking_token", token)
    .single();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Count how many are ahead
  let ahead = 0;
  if (entry.status === "waiting") {
    const { count } = await admin
      .from("barber_walkin_queue")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", entry.salon_id)
      .eq("status", "waiting")
      .lt("position", entry.position);
    ahead = count ?? 0;
  }

  return NextResponse.json({
    id: entry.id,
    status: entry.status,
    position: entry.position,
    ahead,
    estimatedWait: entry.estimated_wait_minutes,
    joinedAt: entry.joined_at,
    calledAt: entry.called_at,
    startedAt: entry.started_at,
    completedAt: entry.completed_at,
  });
}
