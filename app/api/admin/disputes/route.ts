export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { logAuditEvent } from "@/lib/audit";

// GET /api/admin/disputes — List all disputes (admin only)
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data: disputes, error } = await admin
    .from("price_disputes")
    .select("*, bookings(id, user_id, salon_id, starts_at, price_paid, salons(name, slug))")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ disputes: disputes ?? [] });
}

// PATCH /api/admin/disputes — Admin resolves a dispute
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { dispute_id, decision, admin_amount } = body;

  if (!dispute_id || !decision || !["approved", "rejected", "compromised"].includes(decision)) {
    return NextResponse.json({ error: "dispute_id and decision (approved/rejected/compromised) required" }, { status: 400 });
  }

  if (decision === "compromised" && (!admin_amount || typeof admin_amount !== "number")) {
    return NextResponse.json({ error: "admin_amount required for compromise" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("price_disputes")
    .update({
      status: "resolved",
      admin_decision: decision,
      admin_amount: decision === "compromised" ? admin_amount : null,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", dispute_id)
    .eq("status", "disputed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    actor_id: user.id,
    action: "resolve_dispute",
    target_type: "price_dispute",
    target_id: dispute_id,
    metadata: { decision, admin_amount },
  });

  return NextResponse.json({ message: "Dispute resolved" });
}
