// lib/bookings/charge-fee.ts
//
// THE single chokepoint that talks to Stripe `paymentIntents.create` for an
// OFF-SESSION policy fee (cancellation / no-show) and writes bookings.fee_charge_*.
// Sibling to lib/bookings/issue-refund.ts (REFUND_APPEAL_PLAN §10b#3): one refund
// path + one charge path, both in lib/bookings/. The off-session pattern
// (off_session:true, confirm:true, customer+payment_method, Connect
// application_fee_amount + transfer_data.destination) is copied from
// app/api/cron/pre-charge/route.ts — do NOT write a third ad-hoc off-session create.
//
// LANE A (REFUND_APPEAL_PLAN §11): these charges are AUTOMATED — no per-case human
// review — because the customer pre-agreed to the salon's policy at booking
// (bookings.policy_accepted_at / policy_snapshot). The CALLER logs the charge to
// audit_log (logAuditEvent), NOT case_events (which is dispute-only; a policy
// auto-charge has no dispute parent).
//
// MONEY UNIT: integer Rappen (centimes) end-to-end. `amountCents` in, Stripe
// `amount` in Rappen, bookings.fee_charged_amount is INTEGER Rappen. The fee BASE
// is paid_amount (Rappen) ?? toRappen(price_paid) — NEVER send a CHF number into
// Stripe's `amount` (the live 100x bug the chokepoint avoids by construction).

import type { SupabaseClient } from "@supabase/supabase-js";
import { toRappen } from "@/lib/stripe";
import { chargeOffSession } from "@/lib/bookings/off-session-charge";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";

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
  actor: "salon" | "system";
  /** Free text for the audit log (written by the CALLER, not here). */
  reason: string;
}

export interface ChargeFeeResult {
  status: "charged" | "requires_action" | "failed";
  paymentIntentId?: string;
  /** Rappen actually charged (present on success). */
  chargedCents?: number;
  /** Present when status='requires_action' — drives the re-auth hook (notification piece). */
  clientSecret?: string;
}

interface BookingRow {
  id: string;
  payment_intent_id: string | null;
  paid_amount: number | null;
  price_paid: number | null;
  fee_charge_status: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  policy_accepted_at: string | null;
  salon_id: string | null;
  salons: { stripe_account_id: string | null } | null;
}

// fee_charge_status values that mean "already settled / in flight" — a second charge
// must NOT fire. Matches the bookings_fee_charge_status_check enum.
const TERMINAL_OR_INFLIGHT = new Set(["charged", "requires_action"]);

/**
 * Off-session policy-fee charge against the SP-G2 saved card. Idempotent + CAS-guarded
 * so the on-cancel hook and the no-show cron can never double-charge the same booking.
 * Never throws on a Stripe decline (returns status:'failed'); the cron loop continues.
 * SCA `authentication_required` -> status:'requires_action' (parks the PI, no retry).
 */
export async function chargeFee(args: ChargeFeeArgs): Promise<ChargeFeeResult> {
  const { db, source, id, amountCents, kind, actor } = args;

  // D10: only 'booking' is implemented. 'walkin' reserved.
  if (source !== "booking") {
    throw new FeeError("UNSUPPORTED_SOURCE", `Fee source '${source}' not implemented`);
  }

  // 1. Validate input.
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new FeeError("INVALID_AMOUNT", "amountCents must be a positive integer (Rappen)");
  }

  // 2. Fetch booking (admin client).
  const { data: bookingData, error: fetchError } = await db
    .from("bookings")
    .select(
      "id, payment_intent_id, paid_amount, price_paid, fee_charge_status, stripe_customer_id, stripe_payment_method_id, policy_accepted_at, salon_id, salons(stripe_account_id)"
    )
    .eq("id", id)
    .single();

  if (fetchError || !bookingData) {
    throw new FeeError("BOOKING_NOT_FOUND", `Booking ${id} not found`);
  }
  const booking = bookingData as unknown as BookingRow;

  // 3. Idempotency / status guard. If already charged or awaiting SCA, no second charge.
  const currentStatus = booking.fee_charge_status;
  if (currentStatus && TERMINAL_OR_INFLIGHT.has(currentStatus)) {
    return {
      status: currentStatus === "charged" ? "charged" : "requires_action",
      paymentIntentId: undefined,
    };
  }

  // 4. Require a saved card (SP-G2). Absent => skip (do not crash the cron loop).
  const stripeCustomerId = booking.stripe_customer_id;
  const stripePaymentMethodId = booking.stripe_payment_method_id;
  if (!stripeCustomerId || !stripePaymentMethodId) {
    throw new FeeError("NO_SAVED_CARD", `Booking ${id} has no saved card (SP-G2 not satisfied)`);
  }

  // 4b. LANE A CONSENT GATE (REFUND_APPEAL_PLAN §11 / Task B). A policy auto-charge has
  //     no per-case human review — its ONLY legal basis is the customer's pre-agreement
  //     at booking (bookings.policy_accepted_at). Enforced HERE in the chokepoint so no
  //     caller can bypass it: a booking with no acceptance is NOT silently charged — the
  //     callers catch this and leave it for a reviewed Lane B case (and log it).
  if (!booking.policy_accepted_at) {
    throw new FeeError(
      "POLICY_NOT_ACCEPTED",
      `Booking ${id} has no policy_accepted_at — refusing to auto-charge (no Lane A consent)`,
    );
  }

  // 5. Resolve the fee base in Rappen and cap the charge. base = paid_amount (Rappen)
  //    ?? toRappen(price_paid). NEVER send CHF into Stripe's amount.
  const base = booking.paid_amount ?? toRappen(Number(booking.price_paid ?? 0));
  const chargeCents = base > 0 ? Math.min(amountCents, base) : amountCents;

  // Commission read mirrors pre-charge / dispute-engine (platform_settings 'commission',
  // fallback = canonical DEFAULT_COMMISSION_RATE_PERCENT, NOT a bare `?? 1`). The old
  // literal 1 disagreed with every other charge path (which default to 15) whenever the
  // settings row was absent — the live "silent revenue drift" billing.ts warns about.
  const { data: settings } = await db
    .from("platform_settings")
    .select("value")
    .eq("key", "commission")
    .single();
  const ratePercent = (settings as any)?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
  const applicationFeeRappen = Math.round(chargeCents * (ratePercent / 100));

  // 6. Deterministic idempotency key — a double cron tick or hook+cron race collapses
  //    to ONE Stripe charge. Keyed on (source, booking, kind, amount).
  const idempotencyKey = `fee:${source}:${id}:${kind}:${chargeCents}`;

  // 7. Off-session charge via the shared primitive (the single place that talks to
  //    Stripe paymentIntents.create for an off-session charge — no duplicate Stripe
  //    call, §10b#3). We charge first, then CAS the result onto a stale/null status
  //    row so a concurrent caller that already advanced the status loses the write
  //    (and Stripe collapsed via the shared idempotency key).
  const stripeAccountId = booking.salons?.stripe_account_id ?? null;
  const result = await chargeOffSession({
    amountCents: chargeCents,
    stripeCustomerId,
    stripePaymentMethodId,
    stripeAccountId,
    applicationFeeCents: applicationFeeRappen,
    idempotencyKey,
    metadata: { type: `${kind}_fee`, booking_id: id, actor },
  });

  if (result.status === "requires_action") {
    // 8. SCA fallback. Park the PI for a later on-session re-auth. Do NOT retry
    //    off-session (it will keep failing). CAS onto a stale/null status row so a
    //    racing caller can't clobber.
    await casUpdate(db, id, currentStatus, {
      fee_charge_status: "requires_action",
      fee_charge_intent_id: result.paymentIntentId,
      fee_charge_kind: kind,
    });
    console.error(
      `[charge-fee] SCA authentication_required for booking ${id} (${kind}); parked PI ${result.paymentIntentId}`
    );
    return {
      status: "requires_action",
      paymentIntentId: result.paymentIntentId ?? undefined,
      clientSecret: result.clientSecret ?? undefined,
    };
  }

  if (result.status === "failed") {
    // Any other Stripe error (decline, restricted account, etc.) -> failed, logged,
    // cron continues to the next booking.
    await casUpdate(db, id, currentStatus, { fee_charge_status: "failed", fee_charge_kind: kind });
    console.error(`[charge-fee] charge failed for booking ${id} (${kind}):`, result.error);
    return { status: "failed" };
  }

  // 9. Success. CAS the charged state onto the stale/null status row.
  await casUpdate(db, id, currentStatus, {
    fee_charge_status: "charged",
    fee_charged_amount: chargeCents,
    fee_charge_intent_id: result.paymentIntentId,
    fee_charge_kind: kind,
  });

  // 10. Audit (logAuditEvent) is the CALLER's responsibility — this chokepoint is
  //     single-responsibility: money + the fee_charge_* booking columns only.
  return { status: "charged", paymentIntentId: result.paymentIntentId, chargedCents: chargeCents };
}

/**
 * Compare-and-set the fee_charge_* columns, guarded on the status we read before charging.
 * If a concurrent caller already advanced fee_charge_status, this matches 0 rows and is a
 * no-op (Stripe already collapsed via the shared idempotency key, so no double-charge).
 * `staleStatus` of null/undefined is matched with `.is(...)` (PostgREST null semantics).
 */
async function casUpdate(
  db: SupabaseClient,
  id: string,
  staleStatus: string | null,
  patch: Record<string, unknown>
): Promise<void> {
  let q = db.from("bookings").update(patch).eq("id", id);
  q = staleStatus == null ? q.is("fee_charge_status", null) : q.eq("fee_charge_status", staleStatus);
  const { error } = await q;
  if (error) {
    // Non-fatal: the money already moved (or didn't). Log so the row drift is visible.
    console.error(`[charge-fee] CAS status update failed for booking ${id}:`, error.message);
  }
}
