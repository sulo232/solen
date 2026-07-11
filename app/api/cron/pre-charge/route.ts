export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { toRappen } from "@/lib/stripe";
import { chargeOffSession } from "@/lib/bookings/off-session-charge";
import { getServerEnv } from "@/lib/env";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import { withCronRun } from "@/lib/cron-run";

// Cron: Pre-charge saved cards 5 days before appointment. Daily.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("pre-charge", async () => {
  const admin = createAdminSupabaseClient();
  const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Find bookings with saved cards approaching in 5 days
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, price_paid, stripe_customer_id, stripe_payment_method_id, starts_at, salons(name, stripe_account_id), services(name_de)")
    .eq("payment_status", "card_saved")
    .eq("status", "confirmed")
    .gt("starts_at", now)
    .lt("starts_at", fiveDaysFromNow)
    .not("stripe_customer_id", "is", null)
    .not("stripe_payment_method_id", "is", null)
    .limit(50);

  let charged = 0;
  let declined = 0;

  for (const booking of bookings ?? []) {
    const salonStripeId = (booking.salons as any)?.stripe_account_id;

    // Read commission rate
    const { data: settings } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "commission")
      .single();
    // Canonical fallback: platform_settings.commission is the source of truth; the
    // ?? falls back to DEFAULT_COMMISSION_RATE_PERCENT (15) — the SAME default every
    // other charge path uses (webhook, booking-pay-intent, charge-fee, dispute-engine).
    // The old bare `?? 1` undercharged commission 15x vs the rest of the platform when
    // the settings row was missing (it is absent on the live DB today).
    const ratePercent = settings?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
    // price_paid is CHF (numeric); convert to Rappen at the boundary. Both the
    // Stripe amount and platform_fee are integer Rappen (fixes the live 100x bug).
    const amountRappen = toRappen(booking.price_paid ?? 0);
    const platformFee = Math.round(amountRappen * (ratePercent / 100));

    try {
      // Off-session charge via the SHARED primitive (the single place that talks to
      // Stripe paymentIntents.create off-session). It carries a DETERMINISTIC
      // idempotencyKey so a cron retry / overlap before the row flips to 'paid'
      // collapses to ONE Stripe charge instead of double-charging the customer the
      // full amount (H2). Keyed on (booking, amount) — stable across retries.
      const result = await chargeOffSession({
        amountCents: amountRappen,
        stripeCustomerId: booking.stripe_customer_id,
        stripePaymentMethodId: booking.stripe_payment_method_id,
        stripeAccountId: salonStripeId ?? null,
        applicationFeeCents: platformFee,
        idempotencyKey: `pre-charge:${booking.id}:${amountRappen}`,
        metadata: { type: "pre_charge", booking_id: booking.id, salon_id: booking.salon_id },
      });

      if (result.status !== "charged") {
        // Decline / restricted account / SCA authentication_required. chargeOffSession
        // never throws; route the non-success path through the same decline handling
        // (notify customer) as a thrown Stripe error below.
        throw new Error(
          result.status === "requires_action"
            ? "authentication_required (off-session SCA)"
            : result.error,
        );
      }

      await admin
        .from("bookings")
        .update({
          payment_status: "paid",
          payment_intent_id: result.paymentIntentId,
          paid_amount: amountRappen,
          platform_fee: platformFee,
        })
        .eq("id", booking.id);

      charged++;
    } catch (err: any) {
      console.error(`[pre-charge] Card declined for booking ${booking.id}:`, err.message);
      declined++;

      // Notify customer about card decline
      const { data: userAuth } = await admin.auth.admin.getUserById(booking.user_id);
      if (userAuth?.user?.email) {
        try {
          await sendEmail({
            to: userAuth.user.email,
            subject: `Zahlung fehlgeschlagen — ${(booking.salons as any)?.name ?? "Salon"}`,
            html: `<p>Die Vorab-Belastung für deinen Termin am ${new Date(booking.starts_at).toLocaleDateString("de-CH")} konnte nicht durchgeführt werden.</p><p>Bitte aktualisiere deine Zahlungsmethode oder kontaktiere den Salon.</p>`,
          });
        } catch { /* email non-fatal */ }
      }
    }
  }

  return { charged, declined, processed: charged + declined };
  });
}
