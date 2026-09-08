// The policy-fee owner shares one published PaymentIntent between automated saved-card
// confirmation and customer recovery. Amounts are integer Rappen. Callers retain their
// existing policy consent and cancellation/no-show decisions. Successful fees share
// one settlement owner for the payout, audit and receipt.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe, toRappen } from "@/lib/stripe";
import { chargeOffSession } from "@/lib/bookings/off-session-charge";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import type Stripe from "stripe";
import type { NextRequest } from "next/server";

export type FeeKind = "cancellation" | "no_show";
export type FeeSource = "booking" | "walkin"; // 'walkin' reserved (D10); SP-AC implements 'booking'.

export type FeeErrorCode =
  | "INVALID_AMOUNT"
  | "BOOKING_NOT_FOUND"
  | "NO_SAVED_CARD"
  | "POLICY_NOT_ACCEPTED"
  | "UNSUPPORTED_SOURCE";

/** Typed error so callers can map a code -> HTTP status without string-matching. */
export class FeeError extends Error {
  code: FeeErrorCode;
  constructor(code: FeeErrorCode, message?: string) {
    super(message ?? code);
    this.name = "FeeError";
    this.code = code;
  }
}

export interface ChargeFeeArgs {
  /** Pass an ADMIN (service-role) client — the CAS update must not fight RLS. */
  db: SupabaseClient;
  source: FeeSource;
  /** Booking id (source='booking'). */
  id: string;
  /** Integer Rappen to charge; must be > 0. Capped to the paid base internally. */
  amountCents: number;
  kind: FeeKind;
  /** 'system' = cron no-show / window-expiry; 'salon' = salon-initiated. */
  actor: "salon" | "system" | "customer";
  actorUserId?: string | null;
  /** Context supplied by the caller for the successful settlement audit. */
  reason: string;
  request?: NextRequest;
}

export interface ChargeFeeResult {
  status: "charged" | "requires_action" | "pending" | "failed";
  paymentIntentId?: string;
  /** Rappen actually charged (present on success). */
  chargedCents?: number;
  /** Present when status='requires_action' — drives the re-auth hook (notification piece). */
  clientSecret?: string;
  /** Present when status='failed': the real Stripe decline reason, so a caller (cron loop)
   * can surface it instead of a bare status string. */
  error?: string;
  /** Present when status='failed'. true = a genuine card decline (customer-side,
   * data, do not redden a cron run over it). false = a system-side failure (claim
   * write, claim race, or a non-decline Stripe error) that SHOULD redden. Mirrors
   * OffSessionChargeResult's `declined` (lib/bookings/off-session-charge.ts). */
  declined?: boolean;
}

export interface FeeBooking {
  id: string;
  paid_amount: number | null;
  price_paid: number | null;
  fee_charge_status: string | null;
  fee_charge_claimed_at: string | null;
  fee_charge_intent_id: string | null;
  fee_charge_kind: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id?: string | null;
  policy_accepted_at: string | null;
  salons: { stripe_account_id: string | null } | null;
}

export class FeePaymentPending extends Error {
  constructor(message: string, public retryable = false) { super(message); }
}

export function feeIntentKind(pi: Pick<Stripe.PaymentIntent, "metadata">): FeeKind | null {
  if (pi.metadata.type === "no_show_fee") return "no_show";
  if (pi.metadata.type === "cancellation_fee") return "cancellation";
  if (pi.metadata.type === "fee_pay" && ["no_show", "cancellation"].includes(pi.metadata.kind)) {
    return pi.metadata.kind as FeeKind;
  }
  return null;
}

export function matchesFeeIntent(pi: Stripe.PaymentIntent, booking: FeeBooking, kind: FeeKind, amount: number): boolean {
  const customer = typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null;
  const destination = typeof pi.transfer_data?.destination === "string"
    ? pi.transfer_data.destination : pi.transfer_data?.destination?.id ?? null;
  return pi.metadata.booking_id === booking.id && feeIntentKind(pi) === kind &&
    pi.amount === amount && pi.currency === "chf" && customer === booking.stripe_customer_id &&
    destination === (booking.salons?.stripe_account_id ?? null);
}

async function findFeeIntent(booking: FeeBooking, kind: FeeKind, amount: number): Promise<Stripe.PaymentIntent | undefined> {
  const stripe = getStripe();
  let recovered: Stripe.PaymentIntent | undefined;
  if (booking.stripe_customer_id) {
    let after: string | undefined;
    for (let page = 0; page < 10; page++) {
      const result = await stripe.paymentIntents.list({ customer: booking.stripe_customer_id, limit: 100, ...(after ? { starting_after: after } : {}) });
      for (const pi of result.data) {
        if (pi.metadata.booking_id !== booking.id || !feeIntentKind(pi) || pi.status === "canceled") continue;
        if (!matchesFeeIntent(pi, booking, kind, amount) || recovered) throw new FeePaymentPending("Fee intents require reconciliation");
        recovered = pi;
      }
      if (!result.has_more) break;
      if (page === 9 || !result.data.length) throw new FeePaymentPending("Fee history requires reconciliation");
      after = result.data[result.data.length - 1].id;
    }
  }

  return recovered;
}

/** Shared reservation for off-session fees and pay links. Publish before confirming or
 * exposing a secret. Retries use the same Stripe key; an unresolved old claim is never
 * stolen after Stripe may have forgotten that key. Expired unknown claims require
 * manual Stripe inspection; this repository has no fee-claim reset endpoint. */
export async function prepareFeePayment(db: SupabaseClient, booking: FeeBooking, kind: FeeKind, amount: number): Promise<Stripe.PaymentIntent> {
  if (!booking.policy_accepted_at || (booking.fee_charge_kind && booking.fee_charge_kind !== kind)) {
    throw new FeePaymentPending("Fee obligation does not match the accepted policy");
  }
  if (!booking.stripe_customer_id) throw new FeePaymentPending("Fee customer requires reconciliation");
  const stripe = getStripe();
  const pointer = booking.fee_charge_intent_id;
  let recovered: Stripe.PaymentIntent | undefined;
  if (pointer) {
    const existing = await stripe.paymentIntents.retrieve(pointer);
    if (!matchesFeeIntent(existing, booking, kind, amount)) throw new FeePaymentPending("Stored fee requires reconciliation");
    const sibling = await findFeeIntent(booking, kind, amount);
    if (existing.status !== "canceled") {
      if (sibling && sibling.id !== existing.id) throw new FeePaymentPending("Fee has another active intent");
      return existing;
    }
    // A retained reservation plus one exact active intent identifies an interrupted
    // replacement. With no reservation, an independently payable sibling is ambiguous.
    if (sibling && !booking.fee_charge_claimed_at) throw new FeePaymentPending("Fee has another active intent");
    recovered = sibling;
  }

  const claimedAt = booking.fee_charge_claimed_at ?? new Date().toISOString();
  if (!booking.fee_charge_claimed_at) {
    let q = db.from("bookings").update({ fee_charge_claimed_at: claimedAt, fee_charge_kind: kind })
      .eq("id", booking.id).is("fee_charge_claimed_at", null)
      .or("fee_charge_status.is.null,fee_charge_status.eq.failed,fee_charge_status.eq.requires_action");
    q = pointer ? q.eq("fee_charge_intent_id", pointer) : q.is("fee_charge_intent_id", null);
    const { data, error } = await q.select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new FeePaymentPending("Fee preparation is already in progress", true);
  }

  if (!pointer) recovered = await findFeeIntent(booking, kind, amount);

  let pi = recovered;
  if (!pi) {
    const age = Date.now() - new Date(claimedAt).getTime();
    // Stripe retains idempotency results for at least 24 hours. Leave one hour of
    // clock/transport margin; never create from an expired or malformed reservation.
    if (!Number.isFinite(age) || age < 0 || age >= 23 * 60 * 60 * 1000) {
      throw new FeePaymentPending("Fee preparation requires reconciliation");
    }
    const { data: settings, error } = await db.from("platform_settings").select("value").eq("key", "commission").maybeSingle();
    if (error) throw error;
    const rate = (settings as any)?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
    const destination = booking.salons?.stripe_account_id;
    const params: Stripe.PaymentIntentCreateParams = {
      amount, currency: "chf", automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { type: "fee_pay", booking_id: booking.id, kind },
      ...(booking.stripe_customer_id ? { customer: booking.stripe_customer_id } : {}),
      ...(destination ? { application_fee_amount: Math.round(amount * rate / 100), transfer_data: { destination } } : {}),
    };
    const key = `fee:booking:${booking.id}:${kind}:${amount}${pointer ? `:after:${pointer}` : ""}`;
    pi = await stripe.paymentIntents.create(params, { idempotencyKey: key });
  }
  if (!matchesFeeIntent(pi, booking, kind, amount)) throw new FeePaymentPending("Created fee does not match the obligation");

  let publication = db.from("bookings").update({ fee_charge_intent_id: pi.id, fee_charge_claimed_at: null, fee_charge_kind: kind })
    .eq("id", booking.id).eq("fee_charge_claimed_at", claimedAt)
    .or("fee_charge_status.is.null,fee_charge_status.eq.failed,fee_charge_status.eq.requires_action");
  publication = pointer ? publication.eq("fee_charge_intent_id", pointer) : publication.is("fee_charge_intent_id", null);
  const { data: published, error: publishError } = await publication.select("id").maybeSingle();
  if (publishError) throw publishError;
  if (!published) {
    const { data: current, error } = await db.from("bookings").select("fee_charge_intent_id, fee_charge_status").eq("id", booking.id).single();
    if (error) throw error;
    if (current?.fee_charge_intent_id !== pi.id || current?.fee_charge_status === "charged") {
      // A newly created unexposed intent can be canceled, but never cancel the current
      // pointer: another caller may already be completing it.
      if (!recovered && current?.fee_charge_intent_id !== pi.id) await stripe.paymentIntents.cancel(pi.id);
      throw new FeePaymentPending("Fee state changed during preparation");
    }
  }
  return pi;
}

export async function chargeFee(args: ChargeFeeArgs): Promise<ChargeFeeResult> {
  const { db, source, id, amountCents, kind } = args;
  if (source !== "booking") throw new FeeError("UNSUPPORTED_SOURCE");
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new FeeError("INVALID_AMOUNT");
  const { data, error } = await db.from("bookings")
    .select("id, paid_amount, price_paid, fee_charge_status, fee_charge_claimed_at, fee_charge_intent_id, fee_charge_kind, stripe_customer_id, stripe_payment_method_id, policy_accepted_at, salons(stripe_account_id)")
    .eq("id", id).single();
  if (error || !data) throw new FeeError("BOOKING_NOT_FOUND");
  const booking = data as unknown as FeeBooking;
  if (booking.fee_charge_status === "charged") return { status: "charged", paymentIntentId: booking.fee_charge_intent_id ?? undefined };
  if (!booking.stripe_customer_id || !booking.stripe_payment_method_id) throw new FeeError("NO_SAVED_CARD");
  if (!booking.policy_accepted_at) throw new FeeError("POLICY_NOT_ACCEPTED");
  const base = booking.paid_amount ?? toRappen(Number(booking.price_paid ?? 0));
  const amount = base > 0 ? Math.min(amountCents, base) : amountCents;
  let pi: Stripe.PaymentIntent;
  try { pi = await prepareFeePayment(db, booking, kind, amount); }
  catch (err) {
    console.error(`[charge-fee] preparation failed for booking ${id}:`, err);
    return { status: "failed", error: "Fee preparation requires reconciliation or retry", declined: false };
  }
  // An in-flight payment or held authorization is not a card decline or a new
  // confirmation opportunity. Leave its stored business state intact and wait.
  if (pi.status === "processing" || pi.status === "requires_capture") {
    return { status: "pending", paymentIntentId: pi.id };
  }
  if (pi.status === "requires_action" || (booking.fee_charge_intent_id && pi.status !== "succeeded")) {
    return { status: "requires_action", paymentIntentId: pi.id, clientSecret: pi.client_secret ?? undefined };
  }
  const result = pi.status === "succeeded"
    ? { status: "charged" as const, paymentIntentId: pi.id, chargedCents: pi.amount }
    : await chargeOffSession({ amountCents: amount, stripeCustomerId: booking.stripe_customer_id,
      stripePaymentMethodId: booking.stripe_payment_method_id, stripeAccountId: booking.salons?.stripe_account_id ?? null,
      applicationFeeCents: pi.application_fee_amount ?? 0, idempotencyKey: `fee-confirm:${pi.id}`,
      metadata: pi.metadata, paymentIntentId: pi.id });
  if (result.status === "charged") {
    // This is the same settlement winner used by the webhook and customer confirm.
    // Retrieve the actual succeeded object instead of fabricating a status change.
    const succeeded = pi.status === "succeeded" ? pi : await getStripe().paymentIntents.retrieve(pi.id);
    const { settleFeePayment } = await import("@/lib/bookings/settle-fee-payment");
    await settleFeePayment(db, args.request ?? null, succeeded, { actor: args.actor, actorUserId: args.actorUserId, via: "off_session", reason: args.reason });
    return { status: "charged", paymentIntentId: pi.id, chargedCents: succeeded.amount };
  }
  if (result.status === "pending") return result;
  const { data: updated, error: writeError } = await db.from("bookings").update({ fee_charge_status: result.status })
    .eq("id", id).eq("fee_charge_intent_id", pi.id)
    .or("fee_charge_status.is.null,fee_charge_status.eq.failed,fee_charge_status.eq.requires_action")
    .select("id").maybeSingle();
  if (writeError) {
    console.error(`[charge-fee] result write failed for booking ${id}:`, writeError);
    const { alertAdmin } = await import("@/lib/alert-admin");
    await alertAdmin("fee result write failed", { booking_id: id, payment_intent: pi.id, error: writeError.message });
  } else if (!updated) {
    const { data: current } = await db.from("bookings").select("fee_charge_status, fee_charge_intent_id").eq("id", id).single();
    if (current?.fee_charge_status === "charged" && current.fee_charge_intent_id === pi.id) {
      return { status: "charged", paymentIntentId: pi.id, chargedCents: pi.amount };
    }
    return { status: "pending", paymentIntentId: pi.id };
  }
  if (result.status === "requires_action") {
    return { status: "requires_action", paymentIntentId: pi.id, clientSecret: result.clientSecret ?? undefined };
  }
  return { status: "failed", paymentIntentId: pi.id, error: result.error, declined: result.declined };
}
