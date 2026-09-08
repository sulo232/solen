import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { NextRequest } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { feeIntentKind, matchesFeeIntent, type FeeBooking } from "@/lib/bookings/charge-fee";
import { calculateNoShowFee, calculateCancellationFee } from "@/lib/cancellation-policy";
import { toRappen } from "@/lib/stripe";
import { localizedField } from "@/lib/i18n/localized-field";

export interface SettleFeePaymentResult {
  status: "charged";
  /** true when a PRIOR call (webhook or the client confirm) already settled this
   * booking's fee, this call did no writes and sent no notification. */
  alreadySettled: boolean;
}

/**
 * Idempotently mark a booking's policy fee as charged from a SUCCEEDED PaymentIntent
 * identified by the stored fee pointer (fee_pay and legacy policy-fee metadata).
 */
export async function settleFeePayment(
  admin: SupabaseClient,
  req: NextRequest | null,
  pi: Stripe.PaymentIntent,
  context?: { actor: string; actorUserId?: string | null; via: string; reason?: string },
): Promise<SettleFeePaymentResult> {
  const bookingId = pi.metadata?.booking_id;
  if (!bookingId) {
    throw new Error("[settle-fee-payment] PaymentIntent has no metadata.booking_id");
  }
  const kind = feeIntentKind(pi);
  if (!kind || pi.status !== "succeeded") throw new Error("Fee intent has not succeeded");
  const { data: booking, error } = await admin.from("bookings")
    .select("id, salon_id, starts_at, cancelled_at, paid_amount, price_paid, policy_snapshot, policy_accepted_at, fee_charge_status, fee_charge_kind, fee_charge_intent_id, stripe_customer_id, salons(stripe_account_id, no_show_fee_type, no_show_fee_value, cancellation_fee_type, cancellation_fee_value, free_cancel_hours)")
    .eq("id", bookingId).single();
  if (error) throw error;
  if (!booking || !booking.policy_accepted_at || booking.fee_charge_intent_id !== pi.id ||
      (booking.fee_charge_kind && booking.fee_charge_kind !== kind)) throw new Error("Fee pointer or obligation mismatch");
  const snapshot = booking.policy_snapshot as Record<string, any> | null;
  const salon = booking.salons as unknown as Record<string, any> | null;
  const prefix = kind === "no_show" ? "no_show" : "cancellation";
  const base = booking.paid_amount ?? toRappen(Number(booking.price_paid ?? 0));
  const feeType = snapshot?.[`${prefix}_fee_type`] ?? salon?.[`${prefix}_fee_type`];
  const feeValue = snapshot?.[`${prefix}_fee_value`] ?? salon?.[`${prefix}_fee_value`];
  const cancelledAt = booking.cancelled_at ? new Date(booking.cancelled_at).getTime() : NaN;
  const expected = kind === "cancellation"
    ? (Number.isFinite(cancelledAt) ? calculateCancellationFee(feeType, feeValue,
      snapshot?.free_cancel_hours ?? salon?.free_cancel_hours ?? 24,
      base, new Date(booking.starts_at), cancelledAt).feeCents : 0)
    : calculateNoShowFee(feeType, feeValue, base).feeCents;
  if (!matchesFeeIntent(pi, booking as unknown as FeeBooking, kind, expected)) throw new Error("Fee amount or payment routing mismatch");
  // The same intent-keyed payout ledger serves confirmation and webhook recovery.
  // Preserve a row already paid out; a duplicate delivery must not reset its status.
  if (!booking.salon_id) throw new Error("Fee booking has no salon for the payout ledger");
  const gross = pi.amount / 100;
  const commission = (pi.application_fee_amount ?? 0) / 100;
  const { error: ledgerError } = await admin.from("salon_payouts").upsert({
    booking_id: bookingId, salon_id: booking.salon_id, stripe_payment_intent_id: pi.id,
    gross_amount: gross, commission_amount: commission,
    commission_percent: Math.round(commission / gross * 10000) / 100,
    net_amount: Math.round((gross - commission) * 100) / 100, status: "recorded",
  }, { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true });
  if (ledgerError) throw ledgerError;
  if (booking.fee_charge_status === "charged") return { status: "charged", alreadySettled: true };

  const { data: settledRows, error: updateError } = await admin
    .from("bookings")
    .update({
      fee_charge_status: "charged",
      fee_charged_amount: pi.amount,
      fee_charge_intent_id: pi.id,
    })
    .eq("id", bookingId)
    .eq("fee_charge_intent_id", pi.id)
    .or("fee_charge_status.is.null,fee_charge_status.eq.failed,fee_charge_status.eq.requires_action")
    .select(
      "id, user_id, guest_email, starts_at, salons(name), services(name_de, name_en, name_fr, name_it), profiles(locale)"
    );

  if (updateError) {
    console.error(`[settle-fee-payment] CAS update failed for booking ${bookingId}:`, updateError.message);
    throw updateError;
  }

  if (!settledRows || settledRows.length === 0) {
    const { data: current, error } = await admin.from("bookings").select("fee_charge_status, fee_charge_intent_id").eq("id", bookingId).single();
    if (error) throw error;
    if (current?.fee_charge_status !== "charged" || current?.fee_charge_intent_id !== pi.id) throw new Error("Fee settlement lost its pointer");
    return { status: "charged", alreadySettled: true };
  }

  const actor = context?.actor ?? (req?.headers.has("stripe-signature") ? "system" : "customer");
  // actor_id is a nullable UUID FK to profiles, not an actor-category string.
  // Only an identity supplied by the authorized caller and found in profiles is stored.
  let actorId: string | null = null;
  if (context?.actorUserId) {
    const { data: profile, error: profileError } = await admin.from("profiles")
      .select("id").eq("id", context.actorUserId).maybeSingle();
    if (profileError) console.error("[settle-fee-payment] audit actor lookup failed:", profileError);
    else if (profile?.id === context.actorUserId) actorId = profile.id;
  }
  const action = kind === "cancellation" ? "cancellation_fee_charged" : "no_show_fee_charged";
  await logAuditEvent(req, actorId, action, "booking", bookingId, {
    actor,
    kind,
    ...(context?.reason ? { reason: context.reason } : {}),
    charged_cents: pi.amount,
    payment_intent_id: pi.id,
    via: context?.via ?? (req?.headers.has("stripe-signature") ? "stripe_webhook" : "fee_pay_link"),
  });

  const row = settledRows[0] as Record<string, any>;
  const salonName = (row.salons as { name?: string } | null)?.name ?? "Salon";
  const services = row.services as Record<string, string | null> | null;
  const custLocale = (row.profiles as { locale?: string } | null)?.locale ?? "de";
  const { notifyNoShowFee } = await import("@/lib/bookings/notify-no-show-fee");
  await notifyNoShowFee({
    admin,
    kind,
    userId: (row.user_id as string | null) ?? null,
    guestEmail: (row.guest_email as string | null) ?? null,
    serviceName: localizedField(services, "name", custLocale) || "Service",
    salonName,
    feeCents: pi.amount,
    date: (row.starts_at as string | null) ?? new Date().toISOString(),
    logPrefix: "fee-pay",
  }).catch((err) => console.error(`[settle-fee-payment] fee notification failed for booking ${bookingId}:`, err));

  return { status: "charged", alreadySettled: false };
}
