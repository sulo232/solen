import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { cancelAndRefundSalonBookings } from "@/lib/bookings/suspend-salon";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminSalonActionReasonSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rawBody = await req.json().catch(() => ({}));
  const { data: validated, error: valError } = validateBody(adminSalonActionReasonSchema, rawBody);
  if (valError) {
    return NextResponse.json({ error: "Reason is required", message: valError.message }, { status: 400 });
  }
  const body = { reason: validated.reason };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    // Same fix as the freeze route (2026-07-27): frozen_at gates nothing on its own, so
    // the third-strike auto-freeze was leaving the salon live and bookable.
    updateData.is_active = false;
  }

  const { error } = await admin.from("salons").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A third-strike auto-freeze must do everything a manual freeze does. Adding is_active=false
  // above without this would deactivate the salon while leaving a customer's confirmed, PAID
  // booking behind: the salon vanishes from every is_active gate, the booking is never
  // cancelled, the money is never refunded through the single refund chokepoint, and no cron
  // sweeps is_active=false salons for orphans. Caught by the council security lens on
  // 2026-07-27 , the identical half-fixed shape the freeze fix had just diagnosed.
  const suspendResult = freeze
    ? await cancelAndRefundSalonBookings(admin, id, body.reason, "warn")
    : null;

  await admin.from("account_actions").insert({
    salon_id: id,
    action_type: 'warning',
    reason: body.reason,
    admin_id: user.id,
  });

  await logAuditEvent(req, user.id, "salon.warn", "salon", id, {
    salon_name: salon.name,
    new_count: newCount,
    ...(suspendResult ?? {}),
  });

  return NextResponse.json({ ok: true, warning_count: newCount, frozen: freeze });
}
