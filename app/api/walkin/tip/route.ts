export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinTipSchema } from "@/lib/validations";
import { getStripe } from "@/lib/stripe";
import { findQueueEntryByToken } from "@/lib/walkin/authz";
import type Stripe from "stripe";

// POST /api/walkin/tip, tip a walk-in barber, gated ONLY on the queue tracking token (the
// customer is usually a guest, no auth). The tip is 100% to the salon, NO Solen commission
// (tips are not platform revenue). On-session: returns a client_secret the ticket page
// confirms with the Payment Element. Recorded 'pending' here; the webhook flips it to 'paid'.
export async function POST(req: NextRequest) {
  const paymentsOff = await checkFeatureEnabled("payments");
  if (paymentsOff) return paymentsOff;

  const rateLimited = await applyRateLimit(paymentLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => null);
  const { data: validated, error: valError } = validateBody(walkinTipSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // The tracking token is the only authorization (guest walk-in), resolve via the shared gate.
  const entry = await findQueueEntryByToken<{
    id: string;
    salon_id: string;
    assigned_barber_id: string | null;
    preferred_barber_id: string | null;
    customer_id: string | null;
    completed_at: string | null;
  }>(admin, validated.token, "id, salon_id, assigned_barber_id, preferred_barber_id, customer_id, completed_at");
  if (!entry) return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });

  // Tips stay open for 7 days after the visit (mockup 17, 2026-06-11). After that the
  // deep link is dead — 410 so the page can show the specific expired state.
  if (entry.completed_at) {
    const ageMs = Date.now() - new Date(entry.completed_at).getTime();
    if (ageMs > 7 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "tip_window_expired" }, { status: 410 });
    }
  }

  // Tips ride the salon's Connect account. No connected account → tip at the counter instead.
  const { data: salon } = await admin
    .from("salons").select("stripe_account_id, accepts_online_payment").eq("id", entry.salon_id).maybeSingle();
  const stripeAccountId = (salon as any)?.stripe_account_id;
  const acceptsOnlinePayment = (salon as any)?.accepts_online_payment;
  if (!stripeAccountId || !acceptsOnlinePayment) {
    return NextResponse.json({ error: "This shop can't take tips online yet. Tip at the counter." }, { status: 409 });
  }

  // Single-screen tip = variable amount. Reuse + update a still-open pending intent for this queue
  // entry instead of leaking duplicates (keeps the card field mounted across amount changes).
  const { data: existingTip } = await admin
    .from("tips")
    .select("id, stripe_payment_intent_id")
    .eq("walkin_queue_id", entry.id)
    .eq("status", "pending")
    .not("stripe_payment_intent_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingTip?.stripe_payment_intent_id) {
    try {
      const existingPi = await getStripe().paymentIntents.retrieve(existingTip.stripe_payment_intent_id);
      if (!["succeeded", "processing", "canceled"].includes(existingPi.status)) {
        const updated = await getStripe().paymentIntents.update(existingTip.stripe_payment_intent_id, { amount: validated.amount });
        await admin.from("tips").update({ amount: validated.amount }).eq("id", existingTip.id);
        return NextResponse.json({ clientSecret: updated.client_secret }, { status: 200 });
      }
    } catch (e) {
      console.error("[walkin/tip] reuse/update of pending intent failed, creating fresh:", e);
    }
  }

  // Defense in depth: re-verify the staff id still belongs to this entry's salon before it is
  // written to the tips insert. A poisoned assigned_barber_id must not be able to attribute a
  // tip to another salon's staff row.
  let tipStaffId = entry.assigned_barber_id ?? entry.preferred_barber_id ?? null;
  if (tipStaffId) {
    const { data: staffRow } = await admin
      .from("staff_members")
      .select("id")
      .eq("id", tipStaffId)
      .eq("salon_id", entry.salon_id)
      .maybeSingle();
    if (!staffRow) tipStaffId = null;
  }

  // Claim a pending-tip slot for this queue entry BEFORE creating the Stripe PaymentIntent. A
  // partial unique index on tips(walkin_queue_id) WHERE status = 'pending' (added separately)
  // makes this insert atomic: two requests racing past the reuse check above can no longer both
  // win it, so at most one PaymentIntent is ever created per queue entry. This closes the TOCTOU
  // that let a fast double-submit create two separate PaymentIntents (double charge).
  const { data: claimedTip, error: claimError } = await admin
    .from("tips")
    .insert({
      salon_id: entry.salon_id,
      staff_member_id: tipStaffId,
      walkin_queue_id: entry.id,
      user_id: entry.customer_id ?? null,
      amount: validated.amount,
      status: "pending",
    })
    .select("id")
    .single();

  if (claimError) {
    if (claimError.code === "23505") {
      // Lost the race: another concurrent request already claimed the pending slot for this
      // queue entry. Reuse ITS PaymentIntent instead of creating a second one. The winner may
      // still be mid-create, so poll briefly for its stripe_payment_intent_id to appear.
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: winnerTip } = await admin
          .from("tips")
          .select("id, stripe_payment_intent_id")
          .eq("walkin_queue_id", entry.id)
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
            console.error("[walkin/tip] reuse of winning race's pending intent failed:", e);
          }
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      console.error("[walkin/tip] lost the claim race and could not reuse the winner's pending tip:", { walkin_queue_id: entry.id });
      return NextResponse.json({ error: "A tip payment is already being started for this queue entry. Please retry." }, { status: 409 });
    }
    console.error("[walkin/tip] failed to claim pending tip row:", claimError);
    return NextResponse.json({ error: "Could not start the tip payment." }, { status: 500 });
  }
  if (!claimedTip) {
    console.error("[walkin/tip] claim insert returned no row:", { walkin_queue_id: entry.id });
    return NextResponse.json({ error: "Could not start the tip payment." }, { status: 500 });
  }

  // We own the claim: create the Stripe PaymentIntent for this tip. 100% to the salon
  // (transfer_data WITHOUT application_fee_amount → no platform cut on tips).
  // automatic_payment_methods lets the client confirm it with the Payment Element.
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: validated.amount,
    currency: "chf",
    transfer_data: { destination: stripeAccountId },
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { type: "tip", walkin_queue_id: entry.id, salon_id: entry.salon_id },
    description: "Walk-in tip",
  };

  try {
    const pi = await getStripe().paymentIntents.create(piParams);

    // Attach the PaymentIntent to the row already claimed above (service-role write, the tips
    // table grants no public INSERT).
    const { error: attachError } = await admin.from("tips").update({ stripe_payment_intent_id: pi.id }).eq("id", claimedTip.id);
    if (attachError) {
      // Could not link the PI to the claimed row. Cancel the PI and release the claim so the
      // client can retry clean (an orphan pending row would block the unique index forever and
      // never flip to paid).
      console.error("[walkin/tip] failed to attach payment intent to claimed tip:", attachError);
      try { await getStripe().paymentIntents.cancel(pi.id); } catch (cancelErr) { console.error("[walkin/tip] failed to cancel orphan PI:", cancelErr); }
      await admin.from("tips").delete().eq("id", claimedTip.id);
      return NextResponse.json({ error: "Could not start the tip payment. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ clientSecret: pi.client_secret }, { status: 201 });
  } catch (err: any) {
    // Release the claim so a retry isn't stuck behind a dead row that never got a PaymentIntent.
    await admin.from("tips").delete().eq("id", claimedTip.id);
    console.error("[walkin/tip] create failed:", err);
    return NextResponse.json({ error: "Could not start the tip payment. Please try again." }, { status: 502 });
  }
}
