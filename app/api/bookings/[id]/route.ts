export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { validateBody, bookingPatchSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*), services(*), staff_members(*), availability_slots(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Auth check: must be booking owner or salon owner
  const isOwner = booking.user_id === user.id;
  const { data: salon } = await supabase.from("salons").select("owner_id").eq("id", booking.salon_id).single();
  const isSalonOwner = salon?.owner_id === user.id;

  if (!isOwner && !isSalonOwner) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  return NextResponse.json({ data: booking });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const { data: validated, error: valError } = validateBody(bookingPatchSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { status } = validated;

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*, salons(owner_id, stripe_account_id)")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });

  const isSalonOwner = booking.salons?.owner_id === user.id;
  const isBookingOwner = booking.user_id === user.id;
  
  if (!isSalonOwner && !isBookingOwner) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const updates: any = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();

  // Refund logic for cancellations
  if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    updates.cancellation_reason = isBookingOwner ? "customer_cancelled" : "salon_cancelled";

    const pi_id = booking.payment_intent_id;
    if (pi_id && (booking.payment_status === "paid" || booking.payment_status === "deposit_held")) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
        const intent = await stripe.paymentIntents.retrieve(pi_id);
        
        const hoursUntilAppointment = (new Date(booking.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);
        // By ToS §4.2: <24h gives 50% refund, >24h gives 100% refund. 
        // If salon cancels, always 100% refund.
        const isLate = isBookingOwner && hoursUntilAppointment < 24;
        
        if (booking.payment_status === "deposit_held" && intent.status === "requires_capture") {
          // It's just a hold
          if (!isLate) {
            // 100% refund -> cancel the hold
            await stripe.paymentIntents.cancel(pi_id);
            updates.payment_status = "refunded";
          } else {
            // 50% retained (50% fee). Capture 50%, release rest.
            const captureAmount = Math.round(intent.amount * 0.5);
            // Calculate new application fee proportionally
            const originalFee = intent.application_fee_amount || 0;
            const newFee = Math.round(originalFee * 0.5);
            await stripe.paymentIntents.capture(pi_id, {
              amount_to_capture: captureAmount,
              application_fee_amount: newFee > 0 ? newFee : undefined
            });
            updates.payment_status = "partially_refunded";
            updates.refunded_amount = intent.amount - captureAmount;
          }
        } else if (booking.payment_status === "paid" && intent.status === "succeeded") {
          // It's already captured
          if (!isLate) {
            // 100% refund
            await stripe.refunds.create({ 
              payment_intent: pi_id, 
              reverse_transfer: true, 
              refund_application_fee: true 
            });
            updates.payment_status = "refunded";
            updates.refunded_amount = intent.amount;
          } else {
            // 50% refund
            const refundAmount = Math.round(intent.amount * 0.5);
            await stripe.refunds.create({ 
              payment_intent: pi_id, 
              amount: refundAmount, 
              reverse_transfer: true,
              refund_application_fee: true
            });
            updates.payment_status = "partially_refunded";
            updates.refunded_amount = refundAmount;
          }
        }
      } catch (err: any) {
        console.error(`[bookings/patch] Stripe refund error for booking ${id}:`, err.message);
        // We log error but still let cancellation proceed
      }
    } else {
      updates.payment_status = "none";
    }

    // Free the slot
    if (booking.slot_id) {
      await supabase.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("id", booking.slot_id);
    }
  }

  const { error: updateErr } = await supabase.from("bookings").update(updates).eq("id", id);
  if (updateErr) return NextResponse.json({ message: updateErr.message, code: "DB_ERROR" }, { status: 500 });

  // Evaluate strikes and warnings
  if (status === "cancelled" || status === "no_show") {
    try {
      const { evaluateBookingPenalties } = await import("@/lib/strikes");
      const cancelledBy = isBookingOwner ? "customer" : "salon";
      await evaluateBookingPenalties(id, status as "cancelled" | "no_show", cancelledBy);
    } catch (err) {
      console.error("Strike evaluation error:", err);
    }
  }

  return NextResponse.json({ data: { success: true } });
}
