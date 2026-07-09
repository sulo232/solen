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

  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: validated.amount,
    currency: "chf",
    // 100% to the salon: transfer_data WITHOUT application_fee_amount → no platform cut on tips.
    transfer_data: { destination: stripeAccountId },
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { type: "tip", walkin_queue_id: entry.id, salon_id: entry.salon_id },
    description: "Walk-in tip",
  };

  try {
    const pi = await getStripe().paymentIntents.create(piParams);
    await admin.from("tips").insert({
      salon_id: entry.salon_id,
      staff_member_id: entry.assigned_barber_id ?? entry.preferred_barber_id ?? null,
      walkin_queue_id: entry.id,
      user_id: entry.customer_id ?? null,
      amount: validated.amount,
      stripe_payment_intent_id: pi.id,
      status: "pending",
    });
    return NextResponse.json({ clientSecret: pi.client_secret }, { status: 201 });
  } catch (err: any) {
    console.error("[walkin/tip] create failed:", err);
    return NextResponse.json({ error: "Could not start the tip payment. Please try again." }, { status: 502 });
  }
}
