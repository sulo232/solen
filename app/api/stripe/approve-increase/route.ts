export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen } from "@/lib/stripe";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, approveIncreaseSchema } from "@/lib/validations";

// POST /api/stripe/approve-increase
// Called by customer to approve a price increase.
// Body: { booking_id }
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("payments");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(approveIncreaseSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, payment_intent_id, payment_status, deposit_amount, final_price, estimated_price, price_increase_requested_at")
    .eq("id", validated.booking_id)
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
    await stripe.paymentIntents.create({
      amount: toRappen(difference),
      currency: "chf",
      customer: undefined,
      metadata: { booking_id: validated.booking_id, type: "price_increase" },
      description: `Preiserhöhung Booking ${validated.booking_id}`,
      confirm: false,
    });
  }

  await admin.from("bookings").update({
    payment_status: "charged",
    price_increase_approved: true,
    price_confirmed_at: new Date().toISOString(),
  }).eq("id", validated.booking_id);

  return NextResponse.json({ ok: true });
}
