import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
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
    .from("salons").select("name").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const updateData = {
    frozen_at: new Date().toISOString(),
    frozen_reason: body.reason,
  };

  const { error } = await admin.from("salons").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Batch cancel pending and confirmed bookings. paid_amount / refunded_amount are
  // integer Rappen — used to refund the full REMAINING balance per booking.
  const { data: activeBookings } = await admin
    .from("bookings")
    .select("id, slot_id, paid_amount, refunded_amount")
    .eq("salon_id", id)
    .in("status", ["pending_approval", "confirmed"]);

  for (const b of activeBookings ?? []) {
    await admin.from("bookings").update({
      status: "cancelled",
      cancellation_reason: "admin_salon_suspension",
      cancelled_at: new Date().toISOString()
    }).eq("id", b.id);

    // Refund the full remaining balance through the single refund chokepoint
    // (REFUND_APPEAL_PLAN §10b#3) — issueRefund resolves the payment_intent_id,
    // runs the CAS write on the admin client, and is the only place that calls
    // Stripe refunds. Tolerant of per-booking failure: log and continue so one
    // bad refund never aborts the whole freeze. amounts are integer Rappen.
    const remaining = (b.paid_amount ?? 0) - (b.refunded_amount ?? 0);
    if (remaining > 0) {
      try {
        await issueRefund({
          db: admin,
          source: "booking",
          id: b.id,
          amountCents: remaining,
          actor: "admin",
          reason: `admin froze salon (${body.reason})`,
        });
      } catch (e) {
        // NO_PAYMENT (no payment_intent_id), NO_PAID_AMOUNT, STRIPE_FAILED, etc. —
        // non-fatal; the cancellation above already stands.
        if (e instanceof RefundError) {
          console.error(`[freeze] issueRefund skipped for booking ${b.id} (${e.code}):`, e.message);
        } else {
          console.error("[freeze] issueRefund threw for booking", b.id, e);
        }
      }
    }

    if (b.slot_id) {
      await admin.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("id", b.slot_id);
    }
  }

  await admin.from("account_actions").insert({
    salon_id: id,
    action_type: 'suspension',
    reason: body.reason,
    admin_id: user.id,
  });

  await logAuditEvent(req, user.id, "salon.freeze", "salon", id, { salon_name: salon.name });

  return NextResponse.json({ ok: true });
}
