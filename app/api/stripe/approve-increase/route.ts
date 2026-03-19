export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen } from "@/lib/stripe";

// POST /api/stripe/approve-increase
// Called by customer to approve a price increase.
// Body: { booking_id }
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { booking_id } = await req.json();
  if (!booking_id) return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, payment_intent_id, payment_status, deposit_amount, final_price, estimated_price, price_increase_requested_at")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.payment_status !== "deposit_held") {
    return NextResponse.json({ error: "Booking not in correct state" }, { status: 400 });
  }
  if (!booking.price_increase_requested_at) {
    return NextResponse.json({ error: "No price increase pending" }, { status: 400 });
  }

  const finalPrice = booking.final_price ?? 0;
  const depositAmount = booking.deposit_amount ?? 0;

  // Capture the deposit (held amount)
  await stripe.paymentIntents.capture(booking.payment_intent_id, {
    amount_to_capture: toRappen(depositAmount),
  });

  // If final > deposit, create a new charge for the difference
  if (finalPrice > depositAmount) {
    const difference = finalPrice - depositAmount;
    const additionalIntent = await stripe.paymentIntents.create({
      amount: toRappen(difference),
      currency: "chf",
      customer: undefined,
      metadata: { booking_id, type: "price_increase" },
      description: `Preiserhöhung Booking ${booking_id}`,
      confirm: false,
    });
    // The customer would need to confirm this separately via a new payment flow
    // For MVP: capture deposit and flag for manual follow-up
  }

  await admin.from("bookings").update({
    payment_status: "charged",
    price_increase_approved: true,
    price_confirmed_at: new Date().toISOString(),
  }).eq("id", booking_id);

  return NextResponse.json({ ok: true });
}
