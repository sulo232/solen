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
import type { Redis } from "@upstash/redis";
import { createBoundedRedis } from "@/lib/redis";
import { getStripe } from "@/lib/stripe";
import { getRefundConfig } from "@/lib/bookings/refund-config";
import { alertAdmin } from "@/lib/alert-admin";
import { getServerEnv } from "@/lib/env";

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const env = getServerEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis = createBoundedRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  return redis;
}

// Short-lived per-purchase lock so two DIFFERING-amount refund calls (e.g. salon +
// admin acting near-simultaneously, or a UI double-submit with an edited amount)
// can't both read the same stale refunded_amount before either commits. The CAS
// guard below only collapses SAME-amount retries, because the Stripe idempotency
// key is keyed on amountCents too, so a different amount produces a different key
// and a genuine second Stripe refund. Fails open (no lock) when Redis isn't
// configured, matching this codebase's other Redis guards (nail/ai-budget.ts).
async function acquireRefundLock(
  source: PurchaseRefundSource,
  id: string,
): Promise<(() => Promise<void>) | null> {
  const r = getRedis();
  if (!r) return null; // no Redis configured -> fail open, matches nail/ai-budget.ts.
  const key = `purchase-refund-lock:${source}:${id}`;
  const token = crypto.randomUUID();
  // Retry briefly (the lock TTL is 15s, covering resolve + Stripe call + CAS for
  // the holder) so two near-simultaneous requests serialize instead of one
  // silently proceeding unlocked the instant the first request holds the key.
  for (let attempt = 0; attempt < 6; attempt++) {
    let acquired: Awaited<ReturnType<typeof r.set>>;
    try {
      acquired = await r.set(key, token, { nx: true, ex: 15 });
    } catch (err) {
      // A bounded r.set can now throw (timeout) instead of hanging forever. This is a
      // MONEY path: treat a timeout the same as "still locked" (return null) rather than
      // letting it escape as an uncaught exception, so the caller's existing null -> fail
      // CLOSED -> CONCURRENT_RETRY path fires and a timeout can never become a second refund.
      console.error("[issuePurchaseRefund] acquireRefundLock r.set failed:", err);
      return null;
    }
    if (acquired) {
      return async () => {
        try {
          const current = await r.get(key);
          if (current === token) await r.del(key); // drift-ok: internal Redis lock-release compare-and-delete (Redlock safe-unlock), not attacker-facing, no external party ever supplies `current` or `token`
        } catch (err) {
          // Release best-effort: the key's own 15s TTL (ex: 15 above) reclaims it even if
          // this call times out, so a failed release never leaves the lock stuck forever.
          console.error("[issuePurchaseRefund] acquireRefundLock release failed:", err);
        }
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null; // still locked after retrying -> caller treats as a live conflict.
}

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
  // retail-only: the purchased SKUs, so a FULL refund re-increments their stock (A-5).
  productIds: string[] | null;
  // retail-only (package_purchases has no status column): the CURRENT status,
  // captured so a Stripe-failure rollback can restore it exactly (claim-first
  // inversion below writes 'refunded' / 'partially_refunded' optimistically).
  status: string | null;
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
      productIds: null, // packages have no per-SKU stock.
      status: null, // package_purchases has no status column.
    };
  }

  // retail
  const { data, error } = await db
    .from("retail_purchases")
    .select("id, stripe_payment_intent_id, paid_amount, refunded_amount, salon_id, user_id, product_ids, status, salons(stripe_account_id)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const row = data as unknown as {
    stripe_payment_intent_id: string | null;
    paid_amount: number | null;
    refunded_amount: number | null;
    salon_id: string | null;
    user_id: string | null;
    product_ids: string[] | null;
    status: string | null;
    salons: { stripe_account_id: string | null } | null;
  };
  return {
    paymentIntentId: row.stripe_payment_intent_id,
    paidAmount: row.paid_amount,
    refundedAmount: row.refunded_amount,
    salonId: row.salon_id,
    userId: row.user_id,
    stripeAccountId: row.salons?.stripe_account_id ?? null,
    productIds: row.product_ids ?? null,
    status: row.status,
  };
}

/**
 * Atomic accounting CAS, per source. Mirrors issueRefund's
 * .eq("refunded_amount", staleRefunded) guard: rejects the write if another
 * actor already advanced the total. Returns the matched row (or null on no-op).
 * `status` is typed as a plain string (not the narrower refund-status union) so
 * this same helper can also drive the Stripe-failure ROLLBACK, which restores
 * the purchase's PRIOR status (e.g. 'paid'), not a refund status.
 */
async function casRefundedAmount(
  db: SupabaseClient,
  source: PurchaseRefundSource,
  id: string,
  staleRefunded: number,
  newTotal: number,
  status: string,
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

  // 1b. Serialize concurrent refund calls for the SAME purchase (e.g. salon +
  //     admin acting near-simultaneously with DIFFERENT amounts) so they can't
  //     both read the same stale refunded_amount before either commits. When
  //     Redis is configured and the lock is still held after retrying, this is
  //     a live conflict, not a duplicate click, so it fails closed here rather
  //     than silently letting a second real Stripe refund through uncounted.
  const redisConfigured = !!getRedis();
  const releaseLock = await acquireRefundLock(source, id);
  if (redisConfigured && !releaseLock) {
    throw new PurchaseRefundError(
      "CONCURRENT_RETRY",
      "Another refund for this purchase is in progress, retry shortly",
    );
  }

  try {

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

  // 5. Resolve fee policy (D7), shared with booking refunds.
  const appFee = refundApplicationFee ?? (await getRefundConfig()).refundApplicationFeeDefault;

  // 6. Deterministic idempotency key, per (source, purchase, prior-refunded-total,
  //    amount). A double-click / Stripe retry collapses to one refund; keyed on the
  //    same staleRefunded that gates the claim below, so Stripe + DB stay in lockstep.
  const idempotencyKey = `refund:${source}:${id}:${staleRefunded}:${amountCents}`;

  // 7. Compute the accounting totals up front so we can CLAIM them BEFORE
  //    touching Stripe. priorStatus is kept for the rollback in step 9 (retail
  //    only, package_purchases has no status column).
  const priorStatus = purchase.status;
  const newTotal = staleRefunded + amountCents;
  const isFull = newTotal >= paidAmount;
  const status: IssuePurchaseRefundResult["status"] = isFull ? "refunded" : "partially_refunded";

  // 8. CLAIM FIRST, atomic compare-and-set BEFORE calling Stripe, NOT
  //    read-modify-write (salon + admin can both act, and the Redis lock above
  //    fails open when Upstash is not configured, which it is not in this repo).
  //    This closes the race where two concurrent DIFFERENT-amount refunds (the
  //    Stripe idempotency key includes amountCents, so it does NOT collapse them)
  //    could both reach refunds.create before either wrote the DB, a real
  //    double-Stripe-refund, not just a DB no-op. Whoever wins this CAS is the
  //    only caller allowed to call Stripe; the loser is rejected here, before any
  //    money moves. The Redis lock stays as a secondary best-effort layer; this
  //    CAS is the real guard.
  const { data: claimRow, error: casError } = await casRefundedAmount(
    db,
    source,
    id,
    staleRefunded,
    newTotal,
    status,
  );

  if (casError) {
    console.error("[issuePurchaseRefund] CAS claim error:", casError);
    throw new PurchaseRefundError("CONCURRENT_RETRY", casError.message);
  }

  if (!claimRow) {
    // CAS matched 0 rows -> a concurrent refund already advanced refunded_amount
    // between our read and this claim. Do NOT call Stripe here, the caller
    // surfaces CONCURRENT_RETRY and the retry re-reads the fresh total.
    console.error(
      `[issuePurchaseRefund] CAS claim no-op (concurrent refund) for ${source} ${id}; refund not attempted`,
    );
    throw new PurchaseRefundError("CONCURRENT_RETRY", "refunded_amount advanced concurrently; retry");
  }

  // 9. Stripe call, only reached after winning the claim above. reverse_transfer /
  //    refund_application_fee ONLY for Connect destination charges (stripe_account_id
  //    present); omit both otherwise.
  const refundParams: Record<string, unknown> = {
    payment_intent: pi,
    amount: amountCents, // Rappen, Stripe's smallest unit for CHF.
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
    // Roll back the claim, we reserved newTotal (and, for retail, a refund
    // status) but Stripe never issued the money, so the purchase must not be
    // left showing a refund that didn't happen. Guarded: only revert if the row
    // is still at OUR claimed value; if a later (legitimate) refund has since
    // stacked on top of it, leave the row alone and let the alert below surface
    // the drift for manual reconciliation.
    const { data: rollbackRow, error: rollbackError } = await casRefundedAmount(
      db,
      source,
      id,
      newTotal,
      staleRefunded,
      priorStatus ?? "paid",
    );
    if (rollbackError) {
      console.error("[issuePurchaseRefund] claim rollback error:", rollbackError);
    }
    // rollback_reverted tells an admin apart a CLEAN revert (the CAS above matched
    // our claimed newTotal and undid it) from a NO-OP (a later legitimate refund
    // already advanced refunded_amount past newTotal, so the CAS guard matched 0
    // rows and the row was deliberately left alone, leaving drift for manual
    // reconciliation, see the guard comment above).
    const rollbackReverted = !rollbackError && !!rollbackRow;
    void alertAdmin("Stripe purchase refund threw", {
      source,
      purchase_id: id,
      payment_intent: pi,
      amount_cents: amountCents,
      idempotency_key: idempotencyKey,
      rollback_reverted: rollbackReverted,
      stripe_error_type: stripeErr?.type ?? stripeErr?.raw?.type ?? null,
      stripe_error_code: stripeErr?.code ?? stripeErr?.raw?.code ?? null,
      error: stripeErr?.message ?? String(stripeErr),
    });
    throw new PurchaseRefundError("STRIPE_FAILED", stripeErr?.message ?? "Stripe refund failed");
  }

  // 9b. A-5 stock RE-INCREMENT (retail, FULL refund only). Tied to the status
  //     transition, not the amount: it runs when THIS call won the claim in step 8
  //     (a concurrent retry already threw CONCURRENT_RETRY above and never reaches
  //     here, so a double-bump is not possible) AND the refund is full
  //     (status === "refunded"). Partial refunds leave stock alone. Each SKU is
  //     bumped +1 (v1 quantity = 1 per SKU per purchase). Untracked SKUs (NULL stock)
  //     return no row and are skipped. Best-effort: a stock-bump failure never fails the
  //     refund (the money already moved).
  if (source === "retail" && status === "refunded" && purchase.productIds?.length) {
    for (const productId of purchase.productIds) {
      const { error: incErr } = await db.rpc("increment_retail_stock", { p_product_id: productId });
      if (incErr) {
        console.error("[issuePurchaseRefund] stock re-increment RPC failed:", incErr, {
          purchase_id: id,
          product_id: productId,
        });
      }
    }
  }

  // 10. salon_payouts reconciliation is intentionally NOT done here. The
  //     `charge.refunded` Stripe webhook is the single canonical reconciler, it
  //     fires after every refunds.create (including this one) and recomputes the
  //     payout row from the charge's own figures. Decrementing here too would
  //     double-count (the same lesson as issue-refund.ts step 10). Note: a payout
  //     row only exists if the original PI's payment_intent.succeeded wrote one;
  //     the webhook's charge.refunded handler is a guarded no-op when there is none.

  // 10b. CREDITS + VOUCHER SPEND restore (owner-approved 2026-07-11), mirroring
  //      issue-refund.ts step 10b for structural symmetry across BOTH refund
  //      chokepoints. Packages/retail purchases never redeem credits/vouchers
  //      (only booking-pay-intent does, keyed to a booking's own PI), so this is a
  //      harmless idempotent no-op here in practice, both RPCs loop over ledger
  //      rows matching `pi` and simply find none. Gated on isFull (mirroring
  //      issue-refund.ts) so this stays correct as defense-in-depth for whenever
  //      that never-redeems invariant changes: a PARTIAL refund must not restore
  //      an all-or-nothing per-PI ledger while a redeemed amount could still be
  //      backing the unrefunded remainder. Never blocks the refund.
  if (isFull) {
    try {
      const { error: restoreCreditsErr } = await db.rpc("restore_user_credits", { p_pi: pi });
      if (restoreCreditsErr) {
        console.error("[issuePurchaseRefund] restore_user_credits failed:", restoreCreditsErr.message, { source, purchase_id: id, payment_intent: pi });
        void alertAdmin("restore_user_credits failed after a successful purchase refund", {
          source,
          purchase_id: id,
          payment_intent: pi,
          refund_id: refund.id,
          error: restoreCreditsErr.message,
        });
      }
    } catch (restoreCreditsCatchErr) {
      console.error("[issuePurchaseRefund] restore_user_credits threw:", restoreCreditsCatchErr, { source, purchase_id: id, payment_intent: pi });
      void alertAdmin("restore_user_credits threw after a successful purchase refund", {
        source,
        purchase_id: id,
        payment_intent: pi,
        refund_id: refund.id,
        error: String(restoreCreditsCatchErr),
      });
    }
    try {
      const { error: restoreVoucherErr } = await db.rpc("restore_voucher", { p_pi: pi });
      if (restoreVoucherErr) {
        console.error("[issuePurchaseRefund] restore_voucher failed:", restoreVoucherErr.message, { source, purchase_id: id, payment_intent: pi });
        void alertAdmin("restore_voucher failed after a successful purchase refund", {
          source,
          purchase_id: id,
          payment_intent: pi,
          refund_id: refund.id,
          error: restoreVoucherErr.message,
        });
      }
    } catch (restoreVoucherCatchErr) {
      console.error("[issuePurchaseRefund] restore_voucher threw:", restoreVoucherCatchErr, { source, purchase_id: id, payment_intent: pi });
      void alertAdmin("restore_voucher threw after a successful purchase refund", {
        source,
        purchase_id: id,
        payment_intent: pi,
        refund_id: refund.id,
        error: String(restoreVoucherCatchErr),
      });
    }
  }

  // 11. Notification + audit are the CALLER's responsibility (it owns the locale /
  //     case context); this chokepoint is single-responsibility: Stripe refund +
  //     the purchase-row claim. We return userId / salonId so the caller can
  //     notify. The accounting was already recorded by the claim in step 8 (no
  //     post-Stripe CAS needed).
  return {
    refundId: refund.id,
    totalRefundedCents: newTotal,
    status,
    userId: purchase.userId,
    salonId: purchase.salonId,
  };

  } finally {
    if (releaseLock) await releaseLock();
  }
}
