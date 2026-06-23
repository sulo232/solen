// exists-check: net-new vs app/api/cron/loyalty-recompute (this MIRRORS that cron's auth + RPC-call pattern,
// but recomputes the NEW user_style_affinity points instead of loyalty_status). No existing style-affinity cron.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

// Cron: recompute the Inspo "for-you" style-affinity points for all users (the DNA point system, owner 2026-06-23).
// Calls the security-definer RPC that aggregates discovery behaviour (saves / likes / views / searches) into a
// decayed per-attribute score, mirroring recompute_user_salon_affinity. Daily. Migration: 20260623124500_user_style_affinity.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("recompute_user_style_affinity");
  if (error) {
    console.error("[cron/style-affinity-recompute] rpc failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rowsWritten: data ?? 0 });
}
