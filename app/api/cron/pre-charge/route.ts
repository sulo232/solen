export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { toRappen } from "@/lib/stripe";
import { chargeOffSession } from "@/lib/bookings/off-session-charge";
import { getServerEnv } from "@/lib/env";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import { withCronRun, ALL_DECLINED_SYMPTOM_FLOOR } from "@/lib/cron-run";
import { preChargeDeclinedNotification } from "@/lib/email-templates/booking-notifications";
import type { EmailLocale } from "@/lib/email";

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
  // Customer-side: a genuine Stripe card decline (or a stalled SCA re-auth). Data,
  // not a failure, never pushed to `errors` on its own (see the all-declined
  // symptom check at the end of the loop for the aggregate exception).
  let declined = 0;
  // System-side: the charge machinery itself did not do its job (a non-decline
  // Stripe error, or Stripe charged the money but the DB write no longer matched).
  let failed = 0;
  const errors: string[] = [];

  for (const booking of bookings ?? []) {
    // The query above already filters .not("stripe_customer_id"/"stripe_payment_method_id",
    // "is", null), so both are always present here; this narrows the type to match.
    if (!booking.stripe_customer_id || !booking.stripe_payment_method_id) continue;
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
    const settingsValue = settings?.value as { rate_percent?: number } | null;
    const ratePercent = settingsValue?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
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
        // never throws; route the non-success path through the same handling (notify
        // customer) as a thrown Stripe error below. Tag the thrown Error with
        // `declined` so the catch block can classify it without re-deriving the
        // Stripe error type: a real card decline (result.declined) OR a stalled SCA
        // re-auth are both customer-side outcomes, everything else (a non-decline
        // Stripe error) is system-side.
        const message = result.status === "requires_action"
          ? "authentication_required (off-session SCA)"
          : result.error;
        const thrown = new Error(message) as Error & { declined: boolean };
        thrown.declined = result.status === "requires_action" ? true : result.declined;
        throw thrown;
      }

      // CAS: re-assert the exact precondition the SELECT above filtered on, so a
      // booking that changed state concurrently (e.g. cancelled between select and
      // this write) does not get force-flipped to paid. A 0-row match means Stripe
      // already charged the money but the DB no longer agrees, that drift must
      // surface as a failure, not silently pass as "charged".
      const { data: updatedRow } = await admin
        .from("bookings")
        .update({
          payment_status: "paid",
          payment_intent_id: result.paymentIntentId,
          paid_amount: amountRappen,
          platform_fee: platformFee,
        })
        .eq("id", booking.id)
        .eq("status", "confirmed")
        .eq("payment_status", "card_saved")
        .select("id")
        .maybeSingle();

      if (!updatedRow) {
        // Stripe already has the money; the DB no longer agrees. That is a system-side
        // drift, not a customer outcome, so it goes to `failed` (reddens), not `declined`.
        console.error(`[pre-charge] booking ${booking.id} charged at Stripe but DB update matched 0 rows (status changed concurrently)`);
        errors.push(`booking ${booking.id}: charged at Stripe but bookings row no longer matched card_saved/confirmed (concurrent status change)`);
        failed++;
        continue;
      }

      charged++;
    } catch (err: any) {
      const isDecline = err?.declined === true;
      if (isDecline) {
        // A genuine card decline (or a stalled SCA re-auth): the system worked, the
        // answer was no. Counted, but never pushed to `errors` on its own.
        console.error(`[pre-charge] Card declined for booking ${booking.id}:`, err.message);
        declined++;
        // Only a genuine decline earns the "update your payment method" email. This used to
        // sit OUTSIDE the if/else and fired for BOTH branches, so a Stripe outage on OUR side
        // told the customer to fix THEIR card. That is a false accusation about their money:
        // they go check a card that was never the problem, and the one real signal (our
        // system is down) arrives dressed up as their mistake. Same no-fabrication principle
        // as any invented number on a page, just aimed at a person.
        const { data: userAuth } = booking.user_id
          ? await admin.auth.admin.getUserById(booking.user_id)
          : { data: null };
        if (userAuth?.user?.email) {
          // Locale via profiles.locale, same pattern as notify-upcharge.ts. Defaults to
          // "de" when the profile has none set (or user_id is somehow absent here).
          let locale: EmailLocale = "de";
          if (booking.user_id) {
            const { data: profile } = await admin
              .from("profiles")
              .select("locale")
              .eq("id", booking.user_id)
              .single();
            locale = (profile?.locale as EmailLocale) ?? "de";
          }
          try {
            await sendEmail(
              preChargeDeclinedNotification(
                userAuth.user.email,
                {
                  salon: (booking.salons as any)?.name ?? "Salon",
                  date: new Date(booking.starts_at).toLocaleDateString("de-CH"),
                },
                locale,
              ),
            );
          } catch (err) { console.error("[cron/pre-charge] decline notification email failed:", err); }
        }
      } else {
        // Anything else (a non-decline Stripe error, or an unclassified exception, which
        // fails CLOSED to system-side by default): the charge machinery itself did not do
        // its job. NO customer email: it is not their card, it is us. The run goes red
        // instead (errors below), which is where this belongs, and the next sweep retries.
        console.error(`[pre-charge] System error charging booking ${booking.id}:`, err.message);
        failed++;
        errors.push(`booking ${booking.id}: ${err.message}`);
      }
    }
  }

  // Symptom, not per-item: every attempt this run declined and NOTHING else went
  // wrong. That is not N unlucky customers, it is a broken Stripe/account config
  // wearing a customer-shaped costume (BACKEND_LAW.md #14). A run with any real
  // charge or any system-side failure already reddens on its own, this only fires
  // for the case that would otherwise stay silently green: a pure decline sweep
  // at or above ALL_DECLINED_SYMPTOM_FLOOR (see lib/cron-run.ts for the reasoning).
  if (charged === 0 && failed === 0 && declined >= ALL_DECLINED_SYMPTOM_FLOOR) {
    errors.push(
      `every one of ${declined} pre-charge attempts this run declined (0 charged, 0 system errors): likely a broken Stripe/account config, not ${declined} unrelated bad cards`,
    );
  }

  return { charged, declined, failed, processed: charged + declined + failed, errors };
  });
}
