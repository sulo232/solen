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

  // Claim a pending-tip slot for this booking BEFORE creating the Stripe PaymentIntent. A
  // partial unique index on tips(booking_id) WHERE status = 'pending' (added separately) makes
  // this insert atomic: two requests racing past the reuse check above can no longer both win
  // it, so at most one PaymentIntent is ever created per booking. This closes the TOCTOU that
  // let a fast double-submit create two separate PaymentIntents (double charge).
  const { data: claimedTip, error: claimError } = await admin
    .from("tips")
    .insert({
      booking_id: booking.id,
      staff_member_id: booking.staff_member_id,
      salon_id: booking.salon_id,
      user_id: user.id,
      amount: validated.amount,
      status: "pending",
    })
    .select("id")
    .single();

  if (claimError) {
    if (claimError.code === "23505") {
      // Lost the race: another concurrent request already claimed the pending slot for this
      // booking. Reuse ITS PaymentIntent instead of creating a second one. The winner may
      // still be mid-create, so poll briefly for its stripe_payment_intent_id to appear.
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: winnerTip } = await admin
          .from("tips")
          .select("id, stripe_payment_intent_id")
          .eq("booking_id", booking.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (winnerTip?.stripe_payment_intent_id) {
          try {
            const winnerPi = await getStripe().paymentIntents.retrieve(winnerTip.stripe_payment_intent_id);
            if (!["succeeded", "processing", "canceled"].includes(winnerPi.status)) {
              const updated = await getStripe().paymentIntents.update(winnerTip.stripe_payment_intent_id, { amount: validated.amount });
              await admin.from("tips").update({ amount: validated.amount }).eq("id", winnerTip.id);
              return NextResponse.json({ clientSecret: updated.client_secret }, { status: 200 });
            }
          } catch (e) {
            console.error("[tips] reuse of winning race's pending intent failed:", e);
          }
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      console.error("[tips] lost the claim race and could not reuse the winner's pending tip:", { booking_id: booking.id });
      return NextResponse.json({ error: "A tip payment is already being started for this booking. Please retry." }, { status: 409 });
    }
    console.error("[tips] failed to claim pending tip row:", claimError);
    return NextResponse.json({ error: "Could not start the tip payment." }, { status: 500 });
  }
  if (!claimedTip) {
    console.error("[tips] claim insert returned no row:", { booking_id: booking.id });
    return NextResponse.json({ error: "Could not start the tip payment." }, { status: 500 });
  }

  // We own the claim: create the Stripe PaymentIntent for this tip. 100% to salon (transfer_data
  // WITHOUT application_fee → no Solen cut). automatic_payment_methods lets the client confirm
  // it with the Payment Element.
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: validated.amount,
    currency: "chf",
    transfer_data: { destination: stripeAccountId },
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { type: "tip", booking_id: booking.id, user_id: user.id },
  };

  try {
    const paymentIntent = await getStripe().paymentIntents.create(piParams);

    // Attach the PaymentIntent to the row already claimed above (service-role write, the tips
    // table grants no public INSERT).
    const { error: attachError } = await admin.from("tips").update({ stripe_payment_intent_id: paymentIntent.id }).eq("id", claimedTip.id);
    if (attachError) {
      // Could not link the PI to the claimed row. Leaving it would strand a pending tip the
      // webhook can never mark paid (it matches on stripe_payment_intent_id) and that the
      // partial unique index would block forever. Cancel the PI and release the claim so the
      // client can retry clean.
      console.error("[tips] failed to attach payment intent to claimed tip:", attachError);
      try { await getStripe().paymentIntents.cancel(paymentIntent.id); } catch (cancelErr) { console.error("[tips] failed to cancel orphan PI:", cancelErr); }
      await admin.from("tips").delete().eq("id", claimedTip.id);
      return NextResponse.json({ error: "Could not start the tip payment. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret }, { status: 201 });
  } catch (err: any) {
    // Release the claim so a retry isn't stuck behind a dead row that never got a PaymentIntent.
    await admin.from("tips").delete().eq("id", claimedTip.id);
    console.error("[tips] PaymentIntent create failed after claim:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
