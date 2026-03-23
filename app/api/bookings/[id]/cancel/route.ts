export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation } from "@/lib/email";
import { calculateRefund } from "@/lib/cancellation-policy";
import { validateBody, bookingCancelSchema } from "@/lib/validations";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { data: validated } = validateBody(bookingCancelSchema, body);
  const reason = validated?.reason;

  // Fetch booking with relations (including salon owner_id for notification)
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*, owner_id, cancellation_fee_percent, cancellation_window_hours, cancellation_count), services(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const isCustomer = booking.user_id === user.id;
  const isSalonOwner = (booking.salons as any)?.owner_id === user.id;

  if (!isCustomer && !isSalonOwner) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ message: "Booking cannot be cancelled", code: "INVALID_STATUS" }, { status: 400 });
  }

  // Calculate refund if booking was paid via Stripe
  let refundResult = { refundAmount: 0, feeAmount: 0, isWithinWindow: false };
  const paidAmount = booking.paid_amount ?? booking.price_paid ?? 0;
  const paymentIntentId = booking.payment_intent_id;

  if (paidAmount > 0 && paymentIntentId) {
    const salon = booking.salons as any;
    
    if (isSalonOwner) {
      refundResult = { refundAmount: paidAmount, feeAmount: 0, isWithinWindow: true };
    } else {
      refundResult = calculateRefund(
        paidAmount,
        salon?.cancellation_fee_percent ?? 30,
        salon?.cancellation_window_hours ?? 24,
        new Date(booking.starts_at)
      );
    }

    // Process Stripe refund if there's an amount to refund
    if (refundResult.refundAmount > 0) {
      try {
        await getStripe().refunds.create({
          payment_intent: paymentIntentId,
          amount: refundResult.refundAmount,
          reason: "requested_by_customer",
        });
      } catch (stripeErr: any) {
        return NextResponse.json({ message: `Refund failed: ${stripeErr.message}`, code: "STRIPE_ERROR" }, { status: 500 });
      }
    }
  }

  if (isSalonOwner) {
    const adminClient = await import("@/lib/supabase").then((m) => m.createAdminSupabaseClient());
    const currentCount = (booking.salons as any)?.cancellation_count ?? 0;
    const newCount = currentCount + 1;
    await adminClient.from("salons").update({ cancellation_count: newCount }).eq("id", booking.salon_id);
    
    if (newCount >= 3) {
      const { logAuditEvent } = await import("@/lib/audit");
      await logAuditEvent({
        actor_id: user.id,
        action: "salon_excessive_cancellations",
        target_type: "salon",
        target_id: booking.salon_id,
        metadata: { count: newCount },
        ip_address: request.headers.get("x-forwarded-for") ?? "unknown"
      });
    }
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason ?? null,
      cancelled_at: new Date().toISOString(),
      payment_status: refundResult.refundAmount > 0 ? "refunded" : (refundResult.feeAmount > 0 ? "partially_refunded" : undefined),
      refunded_amount: refundResult.refundAmount > 0 ? refundResult.refundAmount : undefined,
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ message: updateError.message, code: "DB_ERROR" }, { status: 500 });

  // Free the slot
  await supabase
    .from("availability_slots")
    .update({ status: "available", booked_by: null, booking_id: null })
    .eq("id", booking.slot_id);

  // Notify waitlist entries for the freed slot
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const adminForWaitlist = createAdminSupabaseClient();
  const cancelledDate = new Date(booking.starts_at).toISOString().split("T")[0];
  const { data: waitlistEntries } = await adminForWaitlist
    .from("waitlist")
    .select("id, user_id")
    .eq("salon_id", booking.salon_id)
    .eq("service_id", booking.service_id)
    .eq("preferred_date", cancelledDate)
    .is("notified_at", null)
    .order("created_at", { ascending: true })
    .limit(3);

  for (const entry of waitlistEntries ?? []) {
    const { data: waitlistUser } = await adminForWaitlist.auth.admin.getUserById(entry.user_id);
    if (waitlistUser?.user?.email) {
      try {
        await sendEmail({
          to: waitlistUser.user.email,
          subject: `Ein Termin ist frei geworden bei ${booking.salons?.name ?? "einem Salon"}!`,
          html: `<p>Ein Termin für <strong>${booking.services?.name_de ?? "deinen Service"}</strong> am <strong>${new Date(booking.starts_at).toLocaleDateString("de-CH")}</strong> ist jetzt verfügbar.</p><p><a href="https://solen.ch">Jetzt buchen →</a></p>`,
        });
      } catch { /* non-fatal */ }
    }
    await adminForWaitlist.from("waitlist").update({ notified_at: new Date().toISOString() }).eq("id", entry.id);
  }

  // Send cancellation emails to customer + salon owner
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("locale").eq("id", user.id).single();
  const locale = (profile?.locale as "de" | "en" | "fr") ?? "de";
  const dateStr = new Date(booking.starts_at).toLocaleDateString("de-CH");
  const serviceName = booking.services?.name_de ?? "Service";
  const salonName = booking.salons?.name ?? "Salon";
  const customerId = booking.user_id;
  const salonOwnerId = booking.salons?.owner_id;

  const promises: Promise<void>[] = [];

  if (user.email) {
    const { sendNotification } = await import("@/lib/notifications");
    promises.push(sendNotification({
      userId: customerId,
      type: isCustomer ? "booking_cancelled_by_customer" : "booking_cancelled_by_salon",
      title: `Buchung storniert: ${serviceName}`,
      body: `Ihre Buchung bei ${salonName} am ${dateStr} wurde storniert.`,
      data: { booking_id: id },
      emailParams: {
        to: user.email,
        locale: locale,
        vars: { service: serviceName, salon: salonName, date: dateStr }
      }
    }));
  }

  if (salonOwnerId && salonOwnerId !== user.id) {
    const { data: ownerAuth } = await admin.auth.admin.getUserById(salonOwnerId);
    const ownerEmail = ownerAuth?.user?.email;
    if (ownerEmail) {
      const { sendNotification } = await import("@/lib/notifications");
      promises.push(sendNotification({
        userId: salonOwnerId,
        type: isCustomer ? "booking_cancelled_by_customer" : "booking_cancelled_by_salon",
        title: `Kunde hat storniert: ${serviceName}`,
        body: `Die Buchung für ${serviceName} am ${dateStr} wurde storniert.`,
        data: { booking_id: id },
        emailParams: {
          to: ownerEmail,
          locale: "de",
          vars: { service: serviceName, salon: salonName, date: dateStr }
        }
      }));
    }
  }

  try {
    await Promise.allSettled(promises);
  } catch { /* non-fatal */ }

  return NextResponse.json({
    data: {
      id,
      status: "cancelled",
      refund_amount: refundResult.refundAmount,
      fee_amount: refundResult.feeAmount,
      within_cancellation_window: refundResult.isWithinWindow,
    },
  });
}
