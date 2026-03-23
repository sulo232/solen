import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.reason || typeof body.reason !== 'string') {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  const { data: salon, error: fetchErr } = await admin
    .from("salons").select("name, warning_count").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const newCount = (salon.warning_count || 0) + 1;
  const freeze = newCount >= 3;

  const updateData: any = { warning_count: newCount };
  if (freeze) {
    updateData.frozen_at = new Date().toISOString();
    updateData.frozen_reason = body.reason;
  }

  const { error } = await admin.from("salons").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("account_actions").insert({
    salon_id: id,
    action_type: 'warning',
    reason: body.reason,
    admin_id: user.id,
  });

  await logAuditEvent(req, user.id, "salon.warn", "salon", id, { salon_name: salon.name, new_count: newCount });

  return NextResponse.json({ ok: true, warning_count: newCount, frozen: freeze });
}
