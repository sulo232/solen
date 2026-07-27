import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
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
    .from("salons").select("name").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const updateData = {
    frozen_at: new Date().toISOString(),
    frozen_reason: body.reason,
    // Freezing MUST take the salon dark. Before 2026-07-27 this route wrote only
    // frozen_at/frozen_reason, and frozen_at is read in exactly three places: an owner
    // banner on the settings page, the solen-score recalculation, and lib/salon-detail.ts
    // (which fetches it only to STRIP it for non-owners at :148). It gates nothing. The
    // customer-visibility gate is is_active (lib/salon-detail.ts:73 returns null without
    // it) plus listed_on_marketplace in the ~15 listing queries. So a "frozen" salon kept
    // its PDP live, kept appearing in search, and kept taking new bookings , this route
    // cancelled the bookings that existed at that instant and then let fresh ones arrive.
    is_active: false,
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
