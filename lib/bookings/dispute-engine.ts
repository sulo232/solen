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
import { alertAdmin } from "@/lib/alert-admin";

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
// trust-06: 'harassment' added 2026-07-27, backing ToS section 7.3's zero-tolerance
// promise. This column (booking_disputes.reason_code) has no DB CHECK constraint
// (20260601_refund_appeal_foundation.sql:120, `reason_code text,` unconstrained), so
// this addition is safe without a migration; the back-compat `issueType` mapping below
// still only ever emits the CHECK-constrained IssueType values.
export type ReasonCode =
  | "salon_cancelled"
  | "no_show_salon"
  | "not_delivered"
  | "wrong_amount"
  | "double_charge"
  | "quality"
  | "harassment"
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
    case "harassment":
      // Not a refund-eligibility question, a safety flag: fast-tracked to admin
      // attention regardless of whether the customer also wants money back.
      return { eligibility: "discretionary", fastTrackRecommended: true, issueType: "other" };
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

// SALON RESPONSE DEADLINE. The "salon responds by {date}" promise already
// exists as COPY only, no computed date behind it: messages/en.json
// sentBodyRefund ("48 hours to respond"), sentStepReviewingMeta ("Responds
// within 48 hours"), ledeInReview ("within 48 hours"), tlSalonReviewingMeta
// ("up to 48h to respond") and escSalonReviewingBody ("usually responds
// within 2 days") all converge on the same number, in all 4 locales. No file
// anywhere turns that into an actual Date (checked: no cron, no route reads
// it). This is the one place that does, so a later timeout/auto-escalation
// job can import the exact same function and the two can never disagree
// (REFUND_PROCESS_2026-08-19.md, "A salon that ignores a case blocks it
// forever"). Escalation-on-timeout is that job's decision to make; nothing
// here writes a status or moves money, per line 13 above.

/** Hours the salon has to respond, matching the number already live in copy. */
export const SALON_RESPONSE_WINDOW_HOURS = 48;

/**
 * The salon's response deadline, clocked from when the case was filed
 * (created_at; nothing writes 'salon_reviewing' today, so 'open' is the
 * only live pending state, both are accepted here for when it starts being
 * used). Returns null once the case is past this stage (the salon already
 * responded, or it was never in this stage) so a stale date is never shown.
 */
export function salonRespondsByDeadline(
  status: DisputeStatus,
  createdAtIso: string,
): Date | null {
  if (status !== "open" && status !== "salon_reviewing") return null;
  const created = new Date(createdAtIso).getTime();
  if (Number.isNaN(created)) return null;
  return new Date(created + SALON_RESPONSE_WINDOW_HOURS * 60 * 60 * 1000);
}

/**
 * True once the salon's response deadline (above) has already passed and the
 * case is still sitting in open/salon_reviewing. salonRespondsByDeadline() only
 * computes the promised date, it never compares it to now, so both render
 * sites (RefundCaseView.tsx, dashboard/refunds/page.tsx) showed the identical
 * present/future-tense "responds by" copy even after the deadline had passed
 * (response-deadline-visible review, 2026-08-20). Reads the same status/date
 * inputs as salonRespondsByDeadline so the two can never disagree about which
 * cases are overdue, mirroring this file's own stated purpose. Display-only:
 * it does not write anything and nothing here decides to escalate, that stays
 * the dispute-timeout cron's job via escalateCase() above.
 */
export function salonResponseOverdue(
  status: DisputeStatus,
  createdAtIso: string,
): boolean {
  const deadline = salonRespondsByDeadline(status, createdAtIso);
  if (!deadline) return false;
  return Date.now() > deadline.getTime();
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
// ESCALATE (status -> 'escalated'): the ONE transition, shared by every
// caller that can move a case into Solen review: the admin "escalate" action
// (app/api/admin/booking-disputes/[id]/action/route.ts) and a timeout cron.
// Extracted here so a timeout job reuses the exact same transition instead of
// a second copy (this file's own header: "so the five SP-3 endpoints don't
// each re-implement it"). Sets the SAME columns the admin action already set
// (mediation_started_at / mediation_deadline_at, 30 days), so an escalation
// looks identical in the DB regardless of who or what triggered it.
//
// REVIEW-FIRST (line 13): this only ever writes status='escalated'. It never
// refunds, never approves, never touches money. A human still decides via
// admin_approve / admin_reject / refund on the now-escalated case.
// ───────────────────────────────────────────────────────────────────────────

export interface EscalateCaseArgs {
  /** ADMIN (service-role) client, the CAS update must not fight RLS. */
  db: SupabaseClient;
  disputeId: string;
  /** The status just read for this dispute, the CAS target. */
  fromStatus: DisputeStatus;
  actorRole: CaseActorRole;
  /** null for a guest/system actor. */
  actorUserId?: string | null;
  note?: string | null;
}

export interface EscalateCaseResult {
  /** false = lost the CAS (already escalated / moved on by a concurrent
   *  actor or run) or the DB write failed. Not an error the caller must
   *  surface, either way the case is no longer sitting un-escalated. */
  escalated: boolean;
  mediationDeadlineAt?: string;
}

/**
 * CAS `fromStatus` -> 'escalated', set the 30-day mediation window, write the
 * timeline row. Idempotent by construction: the `.eq("status", fromStatus)`
 * CAS means a case already flipped by a prior call (or a concurrent one)
 * fails this call's update with zero rows, so a retry or an overlapping run
 * never double-escalates or re-writes the mediation deadline.
 */
export async function escalateCase(args: EscalateCaseArgs): Promise<EscalateCaseResult> {
  const { db, disputeId, fromStatus, actorRole, actorUserId, note } = args;

  const mediationStart = new Date();
  const mediationDeadline = new Date(mediationStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: row, error } = await db
    .from("booking_disputes")
    .update({
      status: "escalated",
      mediation_started_at: mediationStart.toISOString(),
      mediation_deadline_at: mediationDeadline.toISOString(),
    })
    .eq("id", disputeId)
    .eq("status", fromStatus) // CAS
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`[dispute-engine] escalateCase update failed for dispute ${disputeId}:`, error.message);
    return { escalated: false };
  }
  if (!row) {
    // Lost the CAS: someone/something already moved this case off `fromStatus`.
    // Not a failure to report, the desired end state (not stuck un-escalated) is
    // already true.
    return { escalated: false };
  }

  await writeCaseEvent(db, {
    disputeId,
    actorRole,
    actorUserId: actorUserId ?? null,
    action: "escalated",
    fromStatus,
    toStatus: "escalated",
    note: note ?? null,
  });

  return { escalated: true, mediationDeadlineAt: mediationDeadline.toISOString() };
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
  status: "charged" | "requires_action" | "pending" | "failed";
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

  // 3. Re-enforce the +50% cap against NET retained payment (paid_amount minus refunded_amount,
  //    Rappen), defense in depth; the request route already capped it, but the dispute may
  //    be stale AND a refund may have landed since (netting prevents re-charging a refund).
  //    NEVER price_paid.
  const paidAmount = booking.paid_amount ?? 0;
  if (paidAmount <= 0) {
    throw new ChargeUpchargeError("INVALID_AMOUNT", "Booking has no recorded payment to upcharge against");
  }
  const refundedAmount = booking.refunded_amount ?? 0;
  const netRetained = paidAmount - refundedAmount;
  // The cap is CUMULATIVE across every upcharge already charged on this booking, not a fresh
  // 50%-of-net cap per dispute: without this, successive salon_approved upcharge disputes on
  // the same booking would each independently pass a 50% cap and cumulative upcharge could far
  // exceed 50%. Sum prior charged upcharges (excluding this dispute) and subtract from the base cap.
  const { data: priorUpcharges, error: priorUpchargesError } = await db
    .from("booking_disputes")
    .select("resolved_amount")
    .eq("booking_id", dispute.booking_id)
    .eq("direction", "upcharge")
    .eq("status", "charged")
    .neq("id", disputeId);
  if (priorUpchargesError) {
    // Fail CLOSED: an unverified cumulative cap must never fall back to 0 (that
    // silently reopens the old bypassable per-dispute 50% cap this query closes).
    console.error("[dispute-engine] prior-upcharge cap query failed:", priorUpchargesError.message);
    throw new ChargeUpchargeError("EXCEEDS_CAP", "Could not verify the cumulative upcharge cap; charge blocked");
  }
  const priorUpchargedCents = (priorUpcharges ?? []).reduce(
    (sum, d) => sum + (Number((d as { resolved_amount: number | null }).resolved_amount) || 0),
    0,
  );
  const cap = Math.max(0, Math.round(netRetained * 0.5) - priorUpchargedCents);
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

  // Pending Stripe processing/authorization leaves the approved dispute unchanged.
  if (result.status === "pending") return result;

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
    // re-charge (Stripe collapsed via the idempotency key on any retry). This is an
    // UNEXPECTED failure (not a decline — the charge SUCCEEDED): a captured upcharge
    // whose dispute row failed to record 'charged'. Exactly the "money move with no
    // record" case that needs a human — alert.
    console.error(`[dispute-engine] upcharge CAS status update failed for dispute ${disputeId}:`, casErr.message);
    void alertAdmin("upcharge charged but status write failed", {
      dispute_id: disputeId,
      booking_id: booking.id,
      payment_intent: result.paymentIntentId ?? null,
      charged_cents: amountCents,
      idempotency_key: idempotencyKey,
      error: casErr.message,
      note: "Money captured at Stripe; booking_disputes did NOT advance to 'charged'. Reconcile manually.",
    });
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
