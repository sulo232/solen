export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, bookingRefundSchema } from "@/lib/validations";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
import { notifyRefundProcessed } from "@/lib/bookings/notify-refund";

// POST /api/bookings/[id]/refund — Salon-triggered manual refund
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Money surface gets the dedicated payment limiter (3/hour), not generalLimiter (§10b#12).
  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(bookingRefundSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { amount, reason } = validated;

  // Ownership check runs on the RLS-scoped REQUEST client. The actual refund write
  // uses the admin client inside issueRefund so the CAS update isn't fighting RLS.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, salon_id, status, salons(owner_id)")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const salonOwner = (booking.salons as unknown as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Only salon owners can issue refunds" }, { status: 403 });
  }

  if (!["completed", "confirmed", "cancelled"].includes(booking.status)) {
    return NextResponse.json({ error: "Cannot refund this booking status" }, { status: 400 });
  }

  // The single Stripe refund chokepoint. amount is integer Rappen (validated).
  const admin = createAdminSupabaseClient();
  try {
    const result = await issueRefund({
      db: admin,
      source: "booking",
      id: bookingId,
      amountCents: amount,
      actor: "salon",
      reason,
      // refundApplicationFee omitted -> resolves from D7 config.
    });

    // N1: notify the customer their refund was issued (this action's slice, Rappen).
    // Never blocks/rolls back the money move (same discipline as the Stripe webhook).
    await notifyRefundProcessed(admin, bookingId, amount, "refund").catch((err) =>
      console.error("[refund] refund notification failed:", err),
    );

    return NextResponse.json({
      data: {
        booking_id: bookingId,
        refunded_amount: amount,
        total_refunded: result.totalRefundedCents,
        payment_status: result.paymentStatus,
      },
    });
  } catch (e) {
    console.error("[refund] issueRefund failed:", e);
    if (e instanceof RefundError) {
      const status =
        e.code === "BOOKING_NOT_FOUND" ? 404
        : e.code === "STRIPE_FAILED" || e.code === "CONCURRENT_RETRY" ? 500
        : 400; // INVALID_AMOUNT / NO_PAID_AMOUNT / EXCEEDS_REMAINING / NO_PAYMENT / UNSUPPORTED_SOURCE
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
