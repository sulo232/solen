export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, tipSchema } from "@/lib/validations";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
}

// POST /api/tips — Create a tip payment for a booking
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(tipSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Fetch booking to get salon info
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, salon_id, staff_member_id, user_id, salons(stripe_account_id)")
    .eq("id", validated.booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ error: "Not your booking" }, { status: 403 });

  const stripeAccountId = (booking.salons as any)?.stripe_account_id;

  // Create PaymentIntent for the tip (100% goes to salon, no platform fee)
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: validated.amount,
    currency: "chf",
    metadata: { type: "tip", booking_id: booking.id, user_id: user.id },
  };

  if (stripeAccountId) {
    piParams.transfer_data = { destination: stripeAccountId };
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.create(piParams);

    // Record the tip
    await supabase.from("tips").insert({
      booking_id: booking.id,
      staff_member_id: booking.staff_member_id,
      salon_id: booking.salon_id,
      amount: validated.amount,
      stripe_payment_intent_id: paymentIntent.id,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
