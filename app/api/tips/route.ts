export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, tipSchema } from "@/lib/validations";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// POST /api/tips, Create a tip payment for a booking
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("payments");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(tipSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Fetch booking to get salon info
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, salon_id, staff_member_id, user_id, salons(stripe_account_id, accepts_online_payment)")
    .eq("id", validated.booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ error: "Not your booking" }, { status: 403 });

  const stripeAccountId = (booking.salons as any)?.stripe_account_id;
  const acceptsOnlinePayment = (booking.salons as any)?.accepts_online_payment;
  // Tips ride the salon's Connect account (100% to salon, no platform cut). With NO connected
  // account, or an account that hasn't finished onboarding (accepts_online_payment false, so
  // charges_enabled is still false on Stripe's side), the charge would silently land in Solen's
  // balance or fail to route. Tips are not platform revenue, so that's a misroute. Block it;
  // the customer tips at the counter. (Parity with /api/walkin/tip, which already guards this.)
  if (!stripeAccountId || !acceptsOnlinePayment) {
    return NextResponse.json({ error: "This salon can't take tips online yet. Tip at the counter." }, { status: 409 });
  }

  const admin = createAdminSupabaseClient();

  // Single-screen tip = variable amount. If a still-open pending tip intent already exists for this
  // booking, UPDATE its amount and return the SAME clientSecret, so the Payment Element never
  // remounts (card stays entered) and we never leak duplicate intents. Otherwise create a fresh one.
  const { data: existingTip } = await admin
    .from("tips")
    .select("id, stripe_payment_intent_id")
    .eq("booking_id", booking.id)
    .eq("status", "pending")
    .not("stripe_payment_intent_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingTip?.stripe_payment_intent_id) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(existingTip.stripe_payment_intent_id);
      if (!["succeeded", "processing", "canceled"].includes(pi.status)) {
        const updated = await getStripe().paymentIntents.update(existingTip.stripe_payment_intent_id, { amount: validated.amount });
        await admin.from("tips").update({ amount: validated.amount }).eq("id", existingTip.id);
        return NextResponse.json({ clientSecret: updated.client_secret }, { status: 200 });
      }
    } catch (e) {
      console.error("[tips] reuse/update of pending intent failed, creating fresh:", e);
    }
  }

  // PaymentIntent for the tip: 100% to salon (transfer_data WITHOUT application_fee → no Solen
  // cut). automatic_payment_methods lets the client confirm it with the Payment Element.
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: validated.amount,
    currency: "chf",
    transfer_data: { destination: stripeAccountId },
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { type: "tip", booking_id: booking.id, user_id: user.id },
  };

  try {
    const paymentIntent = await getStripe().paymentIntents.create(piParams);

    // Record the tip (service-role write, the tips table grants no public INSERT).
    await admin.from("tips").insert({
      booking_id: booking.id,
      staff_member_id: booking.staff_member_id,
      salon_id: booking.salon_id,
      user_id: user.id,
      amount: validated.amount,
      stripe_payment_intent_id: paymentIntent.id,
      status: "pending",
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
