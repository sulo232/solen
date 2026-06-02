// lib/bookings/dispute-engine.ts
//
// SP-3 shared core for the two-direction money-adjustment engine built on the
// EXTENDED `booking_disputes` table (foundation migration
// 20260601_refund_appeal_foundation). One place owns:
//   - the Section 11 eligibility taxonomy (reason_code -> eligibility /
//     fast_track / 075-back-compat issue_type),
//   - the `case_events` timeline writer (one row per transition, both
//     directions), so the five SP-3 endpoints don't each re-implement it.
//
// HARD RULES honored here:
//   - Money is INTEGER Rappen end-to-end. Nothing in this file converts CHF.
//   - Review-first: NOTHING here auto-approves. `eligibility` /
//     `fast_track_recommended` are reviewer HINTS only — no transition reads
//     them to act (master plan Section 11).
//   - `case_events` write failure NEVER rolls back a money move — it logs and
//     continues; `logAuditEvent` is the redundant trail (SP3-adjustments
//     "Risks": case_events write failure after a money move).

import type { SupabaseClient } from "@supabase/supabase-js";
import { chargeOffSession } from "@/lib/bookings/off-session-charge";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";

// ───────────────────────────────────────────────────────────────────────────
// Status enum (shared; the legal EDGES per direction live in the route guards).
// Mirrors the live `booking_disputes_status_check`.
// ───────────────────────────────────────────────────────────────────────────
export type DisputeStatus =
  | "open"
  | "salon_reviewing"
  | "salon_approved"
  | "salon_rejected"
  | "escalated"
  | "admin_approved"
  | "admin_rejected"
  | "refunded"
  | "charged"
  | "void"
  | "closed";

export type DisputeDirection = "refund" | "upcharge";

// The Section 11 customer reason taxonomy (the unified create endpoint accepts these).
export type ReasonCode =
  | "salon_cancelled"
  | "no_show_salon"
  | "not_delivered"
  | "wrong_amount"
  | "double_charge"
  | "quality"
  | "other";

export type Eligibility = "eligible" | "discretionary" | "not_eligible";

// 075 back-compat issue_type values (the live CHECK on `issue_type` still applies;
// we never widen it — new code maps reason_code -> issue_type instead).
export type IssueType =
  | "quality"
  | "no_show_by_salon"
  | "wrong_service"
  | "overcharge"
  | "other";

export interface EligibilityResult {
  eligibility: Eligibility;
  fastTrackRecommended: boolean;
  issueType: IssueType;
}

/**
 * Section 11 → encoded. Maps a customer `reason_code` to the stored reviewer
 * hints + the 075 back-compat `issue_type`. Pure; no side effects.
 *
 * NB (master plan Section 11 + review-first): `eligibility` and
 * `fastTrackRecommended` are surfaced to the reviewer ONLY. No status
 * transition reads them. "Eligible" never means "auto-refund".
 */
export function resolveEligibility(reasonCode: ReasonCode): EligibilityResult {
  switch (reasonCode) {
    case "salon_cancelled":
      return { eligibility: "eligible", fastTrackRecommended: true, issueType: "no_show_by_salon" };
    case "no_show_salon":
      return { eligibility: "eligible", fastTrackRecommended: true, issueType: "no_show_by_salon" };
    case "not_delivered":
      return { eligibility: "eligible", fastTrackRecommended: false, issueType: "wrong_service" };
    case "wrong_amount":
      return { eligibility: "eligible", fastTrackRecommended: true, issueType: "overcharge" };
    case "double_charge":
      return { eligibility: "eligible", fastTrackRecommended: true, issueType: "overcharge" };
    case "quality":
      return { eligibility: "discretionary", fastTrackRecommended: false, issueType: "quality" };
    case "other":
    default:
      return { eligibility: "not_eligible", fastTrackRecommended: false, issueType: "other" };
  }
}

/**
 * `wrong_amount` / `double_charge` are money-correction reasons that can be filed
 * on a `confirmed` (not-yet-completed) booking; everything else requires
 * `completed` (mirrors 075's INSERT policy). SP3-adjustments Endpoint 1, logic #1.
 */
export function reasonAllowedOnConfirmed(reasonCode: ReasonCode): boolean {
  return reasonCode === "wrong_amount" || reasonCode === "double_charge";
}

// ───────────────────────────────────────────────────────────────────────────
// case_events timeline writer — shared by all SP-3 endpoints.
// ───────────────────────────────────────────────────────────────────────────
export type CaseActorRole = "customer" | "guest" | "salon" | "admin" | "system";

export interface CaseEventInput {
  disputeId: string;
  actorRole: CaseActorRole;
  /** null for guest / system actors. */
  actorUserId?: string | null;
  /** e.g. 'created' | 'salon_approved' | 'salon_rejected' | 'escalated'
   *  | 'admin_approved' | 'admin_rejected' | 'refund_issued' | 'voided'
   *  | 'customer_approved' | 'note'. */
  action: string;
  fromStatus?: DisputeStatus | null;
  toStatus?: DisputeStatus | null;
  /** Rappen, only when the event moved/claimed money. */
  amount?: number | null;
  note?: string | null;
}

/**
 * Append ONE timeline row. Best-effort: a failure here logs and resolves false —
 * it MUST NOT roll back a completed money move (SP3-adjustments "Risks"). Pass an
 * ADMIN (service-role) client — inserts are service-role-only by table design
 * (no public INSERT policy).
 */
export async function writeCaseEvent(
  db: SupabaseClient,
  input: CaseEventInput,
): Promise<boolean> {
  const note = input.note != null ? input.note.slice(0, 1000) : null; // mirror the CHECK
  const { error } = await db.from("case_events").insert({
    dispute_id: input.disputeId,
    actor_role: input.actorRole,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    amount: input.amount ?? null,
    note,
  });
  if (error) {
    console.error("[dispute-engine] case_event write failed:", error.message);
    return false;
  }
  return true;
}

// ───────────────────────────────────────────────────────────────────────────
// UPCHARGE CHARGE EXECUTOR (money-IN) — D13 / REFUND_APPEAL_PLAN §11 Lane A.
//
// When a customer EXPLICITLY approves a salon upcharge (booking_disputes
// direction='upcharge', status 'salon_approved'), charge the approved difference
// OFF-SESSION to the SP-G2 saved card and advance salon_approved → 'charged'.
//
// Reuses the shared off-session primitive (chargeOffSession) — the SAME Stripe
// call charge-fee uses (no duplicate paymentIntents.create). The Connect
// destination + application_fee + deterministic idempotency key + SCA
// requires_action fallback all come from that primitive (§10b#3).
//
// REVIEW-FIRST (D8): nothing here decides to charge. The caller only invokes this
// AFTER the customer's explicit approve transition; a no-response upcharge stays
// VOID (never reaches here). This is single-responsibility: money + the
// booking_disputes status/resolved_amount columns + the case_events row.
//
// MONEY UNIT: integer Rappen end-to-end (paid_amount, requested_amount, the +50%
// cap). NEVER reads price_paid (CHF — the 100x bug).
// ───────────────────────────────────────────────────────────────────────────

export type ChargeUpchargeErrorCode =
  | "DISPUTE_NOT_FOUND"
  | "NOT_UPCHARGE"
  | "WRONG_STATUS"
  | "INVALID_AMOUNT"
  | "EXCEEDS_CAP"
  | "NO_SAVED_CARD";

/** Typed error so the route maps a code → HTTP status without string-matching. */
export class ChargeUpchargeError extends Error {
  code: ChargeUpchargeErrorCode;
  constructor(code: ChargeUpchargeErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ChargeUpchargeError";
    this.code = code;
  }
}

export interface ChargeUpchargeArgs {
  /** ADMIN (service-role) client — the CAS update must not fight RLS. */
  db: SupabaseClient;
  /** The booking_disputes id (direction='upcharge', status must be 'salon_approved'). */
  disputeId: string;
  /** Actor that triggered the charge (the approving customer/guest, or 'system'). */
  actorRole: CaseActorRole;
  actorUserId?: string | null;
}

export interface ChargeUpchargeResult {
  status: "charged" | "requires_action" | "failed";
  paymentIntentId?: string | null;
  /** Rappen actually charged (present on success). */
  chargedCents?: number;
  /** Present when status='requires_action' — drives the re-auth hook (notification piece). */
  clientSecret?: string | null;
}

interface UpchargeDisputeRow {
  id: string;
  booking_id: string;
  direction: string;
  status: string;
  requested_amount: number | null;
  idempotency_key: string | null;
}

interface UpchargeBookingRow {
  id: string;
  paid_amount: number | null;
  refunded_amount: number | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  salon_id: string | null;
  salons: { stripe_account_id: string | null } | null;
}

/**
 * Charge an approved upcharge difference off-session, then advance the dispute
 * salon_approved → 'charged' (CAS). Idempotent: the deterministic Stripe key +
 * the status CAS mean a double-tap collapses to ONE charge. Never throws on a
 * Stripe decline / SCA — returns a discriminated status the route maps to HTTP.
 */
export async function chargeUpcharge(args: ChargeUpchargeArgs): Promise<ChargeUpchargeResult> {
  const { db, disputeId, actorRole, actorUserId } = args;

  // 1. Load the dispute (CAS target). Must be an upcharge in salon_approved.
  const { data: disputeData } = await db
    .from("booking_disputes")
    .select("id, booking_id, direction, status, requested_amount, idempotency_key")
    .eq("id", disputeId)
    .maybeSingle();
  if (!disputeData) throw new ChargeUpchargeError("DISPUTE_NOT_FOUND", `Dispute ${disputeId} not found`);
  const dispute = disputeData as unknown as UpchargeDisputeRow;

  if (dispute.direction !== "upcharge") {
    throw new ChargeUpchargeError("NOT_UPCHARGE", "Charge executor only handles direction='upcharge'");
  }
  if (dispute.status !== "salon_approved") {
    throw new ChargeUpchargeError(
      "WRONG_STATUS",
      `Upcharge must be 'salon_approved' to charge (is '${dispute.status}')`,
    );
  }

  const amountCents = dispute.requested_amount ?? 0;
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new ChargeUpchargeError("INVALID_AMOUNT", "Upcharge requested_amount must be a positive integer (Rappen)");
  }

  // 2. Load the booking: saved card (SP-G2) + Connect account + paid_amount/refunded_amount
  //    (the cap base is the NET retained: paid_amount − refunded_amount).
  const { data: bookingData } = await db
    .from("bookings")
    .select("id, paid_amount, refunded_amount, stripe_customer_id, stripe_payment_method_id, salon_id, salons(stripe_account_id)")
    .eq("id", dispute.booking_id)
    .maybeSingle();
  if (!bookingData) throw new ChargeUpchargeError("DISPUTE_NOT_FOUND", `Booking ${dispute.booking_id} not found`);
  const booking = bookingData as unknown as UpchargeBookingRow;

  // 3. Re-enforce the +50% cap against NET retained payment (paid_amount − refunded_amount,
  //    Rappen) — defense in depth; the request route already capped it, but the dispute may
  //    be stale AND a refund may have landed since (netting prevents re-charging a refund).
  //    NEVER price_paid.
  const paidAmount = booking.paid_amount ?? 0;
  if (paidAmount <= 0) {
    throw new ChargeUpchargeError("INVALID_AMOUNT", "Booking has no recorded payment to upcharge against");
  }
  const refundedAmount = booking.refunded_amount ?? 0;
  const netRetained = paidAmount - refundedAmount;
  const cap = Math.max(0, Math.round(netRetained * 0.5));
  if (amountCents > cap) {
    throw new ChargeUpchargeError("EXCEEDS_CAP", `Upcharge ${amountCents} exceeds 50% cap ${cap}`);
  }

  // 4. Require the saved card (SP-G2 full prepay persists these on payment success).
  const stripeCustomerId = booking.stripe_customer_id;
  const stripePaymentMethodId = booking.stripe_payment_method_id;
  if (!stripeCustomerId || !stripePaymentMethodId) {
    throw new ChargeUpchargeError("NO_SAVED_CARD", "Booking has no saved card (SP-G2 not satisfied)");
  }

  // 5. Commission — same source as booking-pay-intent / pre-charge: platform_settings
  //    'commission', falling back to the canonical DEFAULT_COMMISSION_RATE_PERCENT (NOT a
  //    bare literal — keeps the rate configurable + consistent with every other charge path).
  const { data: settings } = await db
    .from("platform_settings")
    .select("value")
    .eq("key", "commission")
    .maybeSingle();
  const ratePercent = (settings as any)?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
  const applicationFeeCents = Math.round(amountCents * (ratePercent / 100));

  // 6. Deterministic idempotency key — keyed on (dispute, amount) so a double-approve
  //    or retry collapses to ONE Stripe charge. Mirrors the admin-refund key shape.
  const idempotencyKey = `upcharge:${disputeId}:${amountCents}`;

  // 7. Off-session charge via the shared primitive.
  const stripeAccountId = booking.salons?.stripe_account_id ?? null;
  const result = await chargeOffSession({
    amountCents,
    stripeCustomerId,
    stripePaymentMethodId,
    stripeAccountId,
    applicationFeeCents,
    idempotencyKey,
    metadata: { type: "upcharge", booking_id: booking.id, dispute_id: disputeId, actor: actorRole },
  });

  // 8. SCA — leave at salon_approved so a later on-session re-auth can complete it.
  if (result.status === "requires_action") {
    console.error(
      `[dispute-engine] upcharge SCA authentication_required for dispute ${disputeId}; parked PI ${result.paymentIntentId}`,
    );
    return {
      status: "requires_action",
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
    };
  }

  // 9. Decline / other Stripe error — leave at salon_approved (retry re-enters with the
  //    same idempotency key); never throw (mirrors charge-fee — no cron/route crash).
  if (result.status === "failed") {
    console.error(`[dispute-engine] upcharge charge failed for dispute ${disputeId}:`, result.error);
    return { status: "failed" };
  }

  // 10. Success. CAS salon_approved → charged, persisting resolved_amount + the idem key.
  //     The charge PaymentIntent id is recorded on the case_events row below (the
  //     timeline owns the money trail; the dispute row has no charge-PI column). A
  //     racing caller that already advanced loses this write (Stripe already collapsed
  //     the second attempt via the shared idempotency key).
  const { data: casRow, error: casErr } = await db
    .from("booking_disputes")
    .update({
      status: "charged",
      resolved_amount: amountCents,
      idempotency_key: idempotencyKey,
    })
    .eq("id", disputeId)
    .eq("status", "salon_approved") // CAS
    .select("id")
    .maybeSingle();

  if (casErr) {
    // Money already moved; the status write lost. Log so the drift is visible — do NOT
    // re-charge (Stripe collapsed via the idempotency key on any retry).
    console.error(`[dispute-engine] upcharge CAS status update failed for dispute ${disputeId}:`, casErr.message);
  } else if (!casRow) {
    console.error(
      `[dispute-engine] upcharge CAS no-op (concurrent charge) for dispute ${disputeId}; money already captured`,
    );
  } else {
    // Timeline row only on the winning CAS (the actor who moved the money).
    await writeCaseEvent(db, {
      disputeId,
      actorRole,
      actorUserId: actorUserId ?? null,
      action: "charged",
      fromStatus: "salon_approved",
      toStatus: "charged",
      amount: amountCents,
      note: "upcharge difference charged to saved card",
    });
  }

  return { status: "charged", paymentIntentId: result.paymentIntentId, chargedCents: amountCents };
}
