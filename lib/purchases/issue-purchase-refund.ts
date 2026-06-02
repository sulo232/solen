// lib/purchases/issue-purchase-refund.ts
//
// The single chokepoint for refunding PACKAGE + RETAIL purchases — the sibling
// of lib/bookings/issue-refund.ts for the non-booking money paths. It reuses the
// SAME Connect-aware mechanics (reverse_transfer + refund_application_fee +
// deterministic idempotency key + CAS on a refunded_amount column + typed errors
// + alertAdmin) but resolves the PaymentIntent / paid amount / connected account
// from the right purchase table instead of `bookings`.
//
// Why a sibling and not an `issueRefund` overload: issueRefund is hard-wired to
// the bookings shape (payment_intent_id / paid_amount columns, salons(...) join,
// payment_status writes). package_purchases + retail_purchases use different
// column + join shapes and have no payment_status. Keeping them separate avoids
// threading two table shapes through one function while preserving identical
// money mechanics.
//
// Owner decision (2026-06-02): packages + retail are refundable; gift-cards /
// vouchers / tips are FINAL-SALE — NOT handled here.
//
// MONEY UNIT: integer Rappen end-to-end. amountCents in, Stripe `amount` in
// Rappen, package_purchases / retail_purchases paid_amount + refunded_amount are
// INTEGER Rappen (migration 20260602100000_purchase_refunds).

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { getRefundConfig } from "@/lib/bookings/refund-config";
import { alertAdmin } from "@/lib/alert-admin";

export type PurchaseRefundSource = "package" | "retail";

export type PurchaseRefundErrorCode =
  | "INVALID_AMOUNT"
  | "PURCHASE_NOT_FOUND"
  | "NO_PAID_AMOUNT"
  | "EXCEEDS_REMAINING"
  | "NO_PAYMENT"
  | "STRIPE_FAILED"
  | "CONCURRENT_RETRY"
  | "UNSUPPORTED_SOURCE";

/** Typed error so callers map a code -> HTTP status without string-matching. */
export class PurchaseRefundError extends Error {
  code: PurchaseRefundErrorCode;
  constructor(code: PurchaseRefundErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PurchaseRefundError";
    this.code = code;
  }
}

export interface IssuePurchaseRefundArgs {
  /** Pass an ADMIN (service-role) client — the CAS update must not fight RLS. */
  db: SupabaseClient;
  source: PurchaseRefundSource;
  /** package_purchases.id or retail_purchases.id. */
  id: string;
  /** Integer Rappen to refund; must be > 0 and <= remaining (paid − already-refunded). */
  amountCents: number;
  actor: "salon" | "admin" | "customer" | "system";
  /** Free text for audit (written by the CALLER, not here). */
  reason: string;
  /** When omitted, resolved from getRefundConfig() (D7). */
  refundApplicationFee?: boolean;
}

export interface IssuePurchaseRefundResult {
  refundId: string;
  totalRefundedCents: number;
  status: "refunded" | "partially_refunded";
  /** Resolved buyer (user_id) so the caller can fire the refund notification. */
  userId: string | null;
  /** Resolved salon so the caller can build the notification / audit context. */
  salonId: string | null;
}

// Shape resolved per source. Both tables expose these via a join on salons.
interface ResolvedPurchase {
  paymentIntentId: string | null;
  paidAmount: number | null; // Rappen
  refundedAmount: number | null; // Rappen
  salonId: string | null;
  userId: string | null;
  stripeAccountId: string | null;
}

/**
 * Per-source resolver. Centralises the only thing that differs between the two
 * sources: which table + columns hold the PI / amount / refunded / salon.
 */
async function resolvePurchase(
  db: SupabaseClient,
  source: PurchaseRefundSource,
  id: string,
): Promise<ResolvedPurchase | null> {
  if (source === "package") {
    const { data, error } = await db
      .from("package_purchases")
      .select("id, stripe_payment_intent_id, paid_amount, refunded_amount, salon_id, user_id, salons(stripe_account_id)")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    const row = data as unknown as {
      stripe_payment_intent_id: string | null;
      paid_amount: number | null;
      refunded_amount: number | null;
      salon_id: string | null;
      user_id: string | null;
      salons: { stripe_account_id: string | null } | null;
    };
    return {
      paymentIntentId: row.stripe_payment_intent_id,
      paidAmount: row.paid_amount,
      refundedAmount: row.refunded_amount,
      salonId: row.salon_id,
      userId: row.user_id,
      stripeAccountId: row.salons?.stripe_account_id ?? null,
    };
  }

  // retail
  const { data, error } = await db
    .from("retail_purchases")
    .select("id, stripe_payment_intent_id, paid_amount, refunded_amount, salon_id, user_id, salons(stripe_account_id)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const row = data as unknown as {
    stripe_payment_intent_id: string | null;
    paid_amount: number | null;
    refunded_amount: number | null;
    salon_id: string | null;
    user_id: string | null;
    salons: { stripe_account_id: string | null } | null;
  };
  return {
    paymentIntentId: row.stripe_payment_intent_id,
    paidAmount: row.paid_amount,
    refundedAmount: row.refunded_amount,
    salonId: row.salon_id,
    userId: row.user_id,
    stripeAccountId: row.salons?.stripe_account_id ?? null,
  };
}

/**
 * Atomic accounting CAS, per source. Mirrors issueRefund's
 * .eq("refunded_amount", staleRefunded) guard: rejects the write if another
 * actor already advanced the total. Returns the matched row (or null on no-op).
 */
async function casRefundedAmount(
  db: SupabaseClient,
  source: PurchaseRefundSource,
  id: string,
  staleRefunded: number,
  newTotal: number,
  status: "refunded" | "partially_refunded",
) {
  const table = source === "package" ? "package_purchases" : "retail_purchases";
  // retail_purchases has a `status` column (migration 20260602100000);
  // package_purchases does not, so only write status for retail.
  const update: Record<string, unknown> =
    source === "retail"
      ? { refunded_amount: newTotal, status }
      : { refunded_amount: newTotal };
  return db
    .from(table)
    .update(update)
    .eq("id", id)
    .eq("refunded_amount", staleRefunded) // CAS guard.
    .select("id")
    .maybeSingle();
}

/**
 * Resolve the Rappen amount to refund for a PACKAGE, shared by the salon + admin
 * trigger routes so the pro-rata math lives in ONE place.
 *
 * mode "amount"  → the caller's explicit Rappen (validated for presence here).
 * mode "prorata" → value of UNUSED sessions. The per-session price isn't stored,
 *                  so derive it: floor(paid * (total − used) / total), capped at
 *                  remaining. Floor so we never over-refund a fractional Rappen.
 *
 * Returns a discriminated result so the route maps the failure to a 400 with a code
 * (kept here, not thrown, so the route controls the HTTP shape consistently).
 */
export function resolvePackageRefundAmount(input: {
  mode: "amount" | "prorata";
  amount?: number;
  paid: number;
  alreadyRefunded: number;
  sessionsTotal: number;
  sessionsUsed: number;
}):
  | { ok: true; amountCents: number }
  | { ok: false; code: PurchaseRefundErrorCode; message: string } {
  const { mode, amount, paid, alreadyRefunded, sessionsTotal, sessionsUsed } = input;
  if (paid <= 0) {
    return { ok: false, code: "NO_PAID_AMOUNT", message: "Purchase not settled — cannot refund" };
  }
  const remaining = paid - alreadyRefunded;

  if (mode === "prorata") {
    if (sessionsTotal <= 0) {
      return { ok: false, code: "INVALID_AMOUNT", message: "Package has no sessions to pro-rate" };
    }
    const unused = Math.max(0, sessionsTotal - sessionsUsed);
    const amountCents = Math.min(remaining, Math.floor((paid * unused) / sessionsTotal));
    if (amountCents <= 0) {
      return { ok: false, code: "EXCEEDS_REMAINING", message: "No unused sessions to refund" };
    }
    return { ok: true, amountCents };
  }

  if (typeof amount !== "number") {
    return { ok: false, code: "INVALID_AMOUNT", message: "amount is required for mode 'amount'" };
  }
  return { ok: true, amountCents: amount };
}

export async function issuePurchaseRefund(
  args: IssuePurchaseRefundArgs,
): Promise<IssuePurchaseRefundResult> {
  const { db, source, id, amountCents, refundApplicationFee } = args;

  if (source !== "package" && source !== "retail") {
    throw new PurchaseRefundError("UNSUPPORTED_SOURCE", `Refund source '${source}' not implemented`);
  }

  // 1. Validate input.
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new PurchaseRefundError("INVALID_AMOUNT", "amountCents must be a positive integer (Rappen)");
  }

  // 2. Resolve the purchase (admin client).
  const purchase = await resolvePurchase(db, source, id);
  if (!purchase) {
    throw new PurchaseRefundError("PURCHASE_NOT_FOUND", `${source} purchase ${id} not found`);
  }

  // 3. Compute remaining in Rappen.
  const paidAmount = purchase.paidAmount ?? 0;
  if (paidAmount <= 0) {
    throw new PurchaseRefundError(
      "NO_PAID_AMOUNT",
      "No integer paid_amount on purchase — not settled / cannot refund",
    );
  }
  const staleRefunded = purchase.refundedAmount ?? 0;
  const remaining = paidAmount - staleRefunded;
  if (amountCents > remaining) {
    throw new PurchaseRefundError("EXCEEDS_REMAINING", `Refund ${amountCents} exceeds remaining ${remaining}`);
  }

  // 4. Require a payment intent.
  const pi = purchase.paymentIntentId;
  if (!pi) {
    throw new PurchaseRefundError("NO_PAYMENT", "Purchase has no Stripe payment_intent_id");
  }

  // 5. Resolve fee policy (D7) — shared with booking refunds.
  const appFee = refundApplicationFee ?? (await getRefundConfig()).refundApplicationFeeDefault;

  // 6. Deterministic idempotency key — per (source, purchase, prior-refunded-total,
  //    amount). A double-click / Stripe retry collapses to one refund; keyed on the
  //    same staleRefunded that gates the CAS below, so Stripe + DB stay in lockstep.
  const idempotencyKey = `refund:${source}:${id}:${staleRefunded}:${amountCents}`;

  // 7. Stripe call. reverse_transfer / refund_application_fee ONLY for Connect
  //    destination charges (stripe_account_id present); omit both otherwise.
  const refundParams: Record<string, unknown> = {
    payment_intent: pi,
    amount: amountCents, // Rappen — Stripe's smallest unit for CHF.
    reason: "requested_by_customer",
  };
  if (purchase.stripeAccountId) {
    refundParams.reverse_transfer = true; // claw back the salon's transferred funds.
    refundParams.refund_application_fee = appFee; // D7-driven (platform fee returns when true).
  }

  let refund: { id: string };
  try {
    refund = await getStripe().refunds.create(refundParams as any, { idempotencyKey });
  } catch (stripeErr: any) {
    void alertAdmin("Stripe purchase refund threw", {
      source,
      purchase_id: id,
      payment_intent: pi,
      amount_cents: amountCents,
      idempotency_key: idempotencyKey,
      stripe_error_type: stripeErr?.type ?? stripeErr?.raw?.type ?? null,
      stripe_error_code: stripeErr?.code ?? stripeErr?.raw?.code ?? null,
      error: stripeErr?.message ?? String(stripeErr),
    });
    throw new PurchaseRefundError("STRIPE_FAILED", stripeErr?.message ?? "Stripe refund failed");
  }

  // 8. Atomic accounting — compare-and-set, NOT read-modify-write (salon + admin
  //    can both act). The CAS guard rejects the write if another actor advanced
  //    the total between the read and here.
  const newTotal = staleRefunded + amountCents;
  const isFull = newTotal >= paidAmount;
  const status: IssuePurchaseRefundResult["status"] = isFull ? "refunded" : "partially_refunded";

  const { data: casRow, error: casError } = await casRefundedAmount(
    db,
    source,
    id,
    staleRefunded,
    newTotal,
    status,
  );

  if (casError) {
    console.error("[issuePurchaseRefund] CAS update error:", casError);
    throw new PurchaseRefundError("CONCURRENT_RETRY", casError.message);
  }

  if (!casRow) {
    // CAS matched 0 rows -> a concurrent refund already advanced the total.
    // Because the Stripe idempotency key is keyed on the SAME staleRefunded,
    // Stripe also collapsed this to the already-issued refund. Re-read and
    // return current state rather than double-counting.
    const fresh = await resolvePurchase(db, source, id);
    const freshTotal = fresh?.refundedAmount ?? newTotal;
    const freshPaid = fresh?.paidAmount ?? paidAmount;
    console.error(
      `[issuePurchaseRefund] CAS no-op (concurrent refund) for ${source} ${id}; ` +
        `returning current refunded_amount=${freshTotal}`,
    );
    return {
      refundId: refund.id,
      totalRefundedCents: freshTotal,
      status: freshTotal >= freshPaid ? "refunded" : "partially_refunded",
      userId: purchase.userId,
      salonId: purchase.salonId,
    };
  }

  // 9. salon_payouts reconciliation is intentionally NOT done here. The
  //    `charge.refunded` Stripe webhook is the single canonical reconciler — it
  //    fires after every refunds.create (including this one) and recomputes the
  //    payout row from the charge's own figures. Decrementing here too would
  //    double-count (the same lesson as issue-refund.ts §9). Note: a payout row
  //    only exists if the original PI's payment_intent.succeeded wrote one; the
  //    webhook's charge.refunded handler is a guarded no-op when there is none.

  // 10. Notification + audit are the CALLER's responsibility (it owns the locale /
  //     case context); this chokepoint is single-responsibility: Stripe refund +
  //     the purchase-row CAS. We return userId / salonId so the caller can notify.
  return {
    refundId: refund.id,
    totalRefundedCents: newTotal,
    status,
    userId: purchase.userId,
    salonId: purchase.salonId,
  };
}
