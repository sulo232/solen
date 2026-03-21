export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
}

// POST /api/bookings/[id]/refund — Salon-triggered manual refund
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { amount, reason } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Valid refund amount required" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string" || reason.length > 500) {
    return NextResponse.json({ error: "Reason required (max 500 chars)" }, { status: 400 });
  }

  // Fetch booking and verify salon ownership
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, paid_amount, price_paid, payment_intent_id, salon_id, status, refunded_amount, salons(owner_id)")
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

  const paidAmount = booking.paid_amount ?? booking.price_paid ?? 0;
  const alreadyRefunded = booking.refunded_amount ?? 0;
  const maxRefundable = paidAmount - alreadyRefunded;

  if (amount > maxRefundable) {
    return NextResponse.json({ error: `Max refundable: ${maxRefundable}` }, { status: 400 });
  }

  if (!booking.payment_intent_id) {
    return NextResponse.json({ error: "No Stripe payment to refund" }, { status: 400 });
  }

  // Process Stripe refund
  try {
    await getStripe().refunds.create({
      payment_intent: booking.payment_intent_id,
      amount,
      reason: "requested_by_customer",
    });
  } catch (stripeErr: any) {
    return NextResponse.json({ error: `Stripe refund failed: ${stripeErr.message}` }, { status: 500 });
  }

  // Update booking
  const newRefundedAmount = alreadyRefunded + amount;
  const isFullRefund = newRefundedAmount >= paidAmount;

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      refunded_amount: newRefundedAmount,
      payment_status: isFullRefund ? "refunded" : "partially_refunded",
    })
    .eq("id", bookingId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    data: {
      booking_id: bookingId,
      refunded_amount: amount,
      total_refunded: newRefundedAmount,
      payment_status: isFullRefund ? "refunded" : "partially_refunded",
    },
  });
}
