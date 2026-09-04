export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, type EmailLocale } from "@/lib/email";
import { paymentFailedNotification } from "@/lib/email-templates/booking-notifications";
import { toRappen } from "@/lib/stripe";
import { chargeOffSession } from "@/lib/bookings/off-session-charge";
import { alertAdmin } from "@/lib/alert-admin";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import { withCronRun } from "@/lib/cron-run";
import { resolveSwissLocale } from "@/lib/format";
import { resolvePromoDiscount } from "@/lib/promo/resolve-promo-discount";
import { localizedField } from "@/lib/i18n/localized-field";

// Cron: Pre-charge saved cards 5 days before appointment. Daily.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("pre-charge", async () => {
  const admin = createAdminSupabaseClient();
  const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Find bookings with saved cards approaching in 5 days
  const { data: bookings } = await admin
    .from("bookings")
    // promo_code is fetched for the overcharge fix below. Without it here the fix would read
    // undefined on every row and silently never discount anything, which is the exact
    // looks-wired-does-nothing shape this project keeps getting caught by.
    .select("id, user_id, salon_id, price_paid, promo_code, stripe_customer_id, stripe_payment_method_id, starts_at, salons(name, stripe_account_id), services(name_de, name_en, name_fr, name_it)")
    .eq("payment_status", "card_saved")
    .eq("status", "confirmed")
    .gt("starts_at", now)
    .lt("starts_at", fiveDaysFromNow)
    .not("stripe_customer_id", "is", null)
    .not("stripe_payment_method_id", "is", null)
    // A payment_intent_id already on the row means Stripe was already called for it; exclude
    // it so a booking is never picked up for a second charge.
    .is("payment_intent_id", null)
    .limit(50);

  let charged = 0;
  let declined = 0;
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
    // This is the GROSS price BEFORE any promo, the same value booking-pay-intent calls
    // fullRappen: bookings/route.ts states it outright where it saves the code, "its presence
    // here grants NO discount", because every constraint is re-checked at charge time.
    const grossRappen = toRappen(booking.price_paid ?? 0);

    // OVERCHARGE FIX, ported by hand 2026-08-14 from an unmerged branch where it was written on
    // 2026-07-07 and then stranded. This cron charged the gross and never looked at the promo the
    // customer applied, so anyone who booked with a discount code AND saved their card instead of
    // paying at checkout was charged the full price five days later. The pay-now path applies the
    // discount correctly; only this path did not, which is why it survived: the two ways to pay
    // disagreed and only one of them was ever exercised in testing.
    // The shared helper is the same one the pay-now path uses, so both apply IDENTICAL rules: it
    // re-reads the live promo row and re-checks active, dates, usage, minimum spend, salon scope
    // and tier, then caps the discount so it can never exceed the charge or drop it below Stripe's
    // 50 Rappen floor. The persisted code is never trusted as pre-validated.
    const { promoDiscountRappen, promoCodeApplied } = await resolvePromoDiscount(admin, {
      promoCode: (booking as { promo_code?: string | null }).promo_code,
      fullPriceChf: booking.price_paid ?? 0,
      salonId: booking.salon_id,
      userId: booking.user_id,
      baseAmountRappen: grossRappen,
    });
    const amountRappen = grossRappen - promoDiscountRappen;
    const platformFee = Math.round(amountRappen * (ratePercent / 100));
    if (promoDiscountRappen > 0) {
      console.log(
        `[pre-charge] booking ${booking.id}: promo ${promoCodeApplied} took ${promoDiscountRappen} Rappen off ${grossRappen}`,
      );
    }

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

      // Re-assert status=confirmed (TXN-03 / data-money-02): the Stripe charge above
      // already succeeded, but the booking may have been cancelled between the SELECT
      // that found it and this UPDATE (a concurrent cron overlap or a customer
      // cancellation racing the batch). Confirm the update actually matched a row
      // before counting it as charged, mirroring app/api/cron/no-show/route.ts.
      const { data: updatedRows, error: updateError } = await admin
        .from("bookings")
        .update({
          payment_status: "paid",
          payment_intent_id: result.paymentIntentId,
          paid_amount: amountRappen,
          platform_fee: platformFee,
        })
        .eq("id", booking.id)
        .eq("status", "confirmed")
        .select("id");

      if (updateError) {
        // The UPDATE itself errored: the row is untouched, still card_saved/confirmed, and
        // payment_intent_id was never written, so tomorrow's SELECT above would pick this
        // booking up again and charge the same card a second time. The Stripe charge already
        // succeeded, so this needs a human, not another automatic attempt.
        console.error(`[pre-charge] booking ${booking.id} charged in Stripe but the paid-marking update errored:`, updateError.message);
        void alertAdmin("pre-charge: paid-marking update failed after a successful Stripe charge", {
          booking_id: booking.id,
          payment_intent: result.paymentIntentId,
          amount_rappen: amountRappen,
          error: updateError.message,
        });
        errors.push(`booking ${booking.id}: charged in Stripe but paid-marking update failed: ${updateError.message}`);
        continue;
      }

      if (!updatedRows || updatedRows.length === 0) {
        // Zero rows matched, no error: the booking was cancelled between the SELECT and this
        // UPDATE, so status is no longer 'confirmed'. Bad (charged, not recorded) but not a
        // repeat-charge risk, tomorrow's SELECT filters on status='confirmed' and will not
        // select this row again.
        console.error(`[pre-charge] booking ${booking.id} no longer confirmed after charge (changed between select and update); charged in Stripe but not marked paid, needs reconciliation`);
        errors.push(`booking ${booking.id}: charged in Stripe but no longer confirmed after charge, needs reconciliation`);
        continue;
      }

      charged++;
    } catch (err: any) {
      console.error(`[pre-charge] Card declined for booking ${booking.id}:`, err.message);
      declined++;
      errors.push(`booking ${booking.id}: pre-charge failed: ${err.message}`);

      // Notify customer about card decline
      const { data: userAuth } = booking.user_id
        ? await admin.auth.admin.getUserById(booking.user_id)
        : { data: null };
      if (userAuth?.user?.email) {
        try {
          // A9-email-locale (2026-07-27): the customer's own profile.locale, was hardcoded
          // German + de-CH; routed through the existing paymentFailedNotification builder
          // instead of inline HTML (was raw German-only HTML with no locale mechanism).
          const { data: declinedProfile } = booking.user_id
            ? await admin.from("profiles").select("locale").eq("id", booking.user_id).maybeSingle()
            : { data: null };
          const declinedLocale = (declinedProfile?.locale as EmailLocale) ?? "de";
          await sendEmail(paymentFailedNotification(
            userAuth.user.email,
            {
              service: localizedField(booking.services, "name", declinedLocale) || "Service",
              salon: (booking.salons as any)?.name ?? "Salon",
              date: new Date(booking.starts_at).toLocaleDateString(resolveSwissLocale(declinedLocale)),
            },
            declinedLocale
          ));
        } catch (err) { console.error("[cron/pre-charge] decline notification email failed:", err); }
      }
    }
  }

  return { charged, declined, processed: charged + declined, errors };
  });
}
