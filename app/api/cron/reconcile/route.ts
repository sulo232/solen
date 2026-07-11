export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";

// Cron: Reconciliation (the money safety net). Daily.
//
// Pulls Stripe charges + refunds from the last ~48h and compares each against
// what the DB recorded. This is the backstop for the Stripe webhook: if a
// payment_intent.succeeded / charge.refunded delivery was ever dropped, mishandled,
// or written with a unit/amount bug, the numbers drift and this catches it.
//
// READ-ONLY on the DB — SELECT + compare only. It NEVER auto-fixes; it emails an
// admin digest + console.error's each mismatch so a human reconciles deliberately.
//
// UNIT CONTRACT (verified against app/api/stripe/webhook/route.ts):
//   - Stripe charge.amount_captured / amount_refunded are integer Rappen
//     (smallest CHF unit). bookings.paid_amount / refunded_amount are ALSO
//     integer Rappen, so those compares are direct integer == (no CHF floats).
//     package_purchases / retail_purchases.paid_amount / refunded_amount carry
//     the same integer-Rappen contract (migration 20260602100000_purchase_refunds).
//   - salon_payouts.gross/net are CHF numerics (the webhook writes pi.amount/100).
//     We only assert the payout ROW EXISTS here; amount-level payout drift is the
//     charge.amount_captured vs paid_amount check above plus the webhook's own
//     charge.refunded recompute, so we don't re-derive CHF here.
//
// PACKAGE / RETAIL PURCHASE reconciliation (added alongside the booking checks):
//   - live linkage confirmed against app/api/salon/retail/purchase/route.ts +
//     app/api/stripe/webhook/purchase-handler.ts: the PI's metadata.type is set
//     to "retail_purchase" at creation, and retail_purchases is keyed on
//     stripe_payment_intent_id (unique). package_purchases has the same column
//     but the Pakete creation routes (app/api/packages/*) were deleted 2026-06-13
//     (_design-system/REMOVED.md), so no NEW charge will ever carry a
//     package-purchase metadata.type; that branch below is defensive-only,
//     covering a legacy row whose PI still happens to fall in the lookback window.
//
// GIFT-CARD reconciliation (Ring 8, closes the single biggest coverage gap; see
// _plans/WEBHOOK_RESILIENCE.md): pi.metadata.type === "gift_card" charges are checked
// against gift_cards (row exists + is_active flipped true), the only activation path
// being gift-card-handler.ts's webhook CAS. A dropped/never-redelivered event used to
// fall silently into the non_booking skip bucket below with zero detection.
//
// SKIPPED (logged for honest coverage):
//   - walk-in charges (pi.metadata.type === "walk_in"): ticket flow, no
//     scheduled-booking row / payout path (webhook skips them too).
//   - salon gift-voucher purchases (pi.metadata.type === "voucher", vouchers table)
//     and discount/promo voucher purchases (pi.metadata.type === "voucher_purchase",
//     promo_codes/voucher_purchases tables): handled by their own webhook handlers, not
//     reconciled here. Same uncovered-class shape gift_card was in before this ring;
//     memo'd (not fixed this ring, one miss closed per Ring 8's own scope) in
//     _plans/WEBHOOK_RESILIENCE.md.
//   - any charge whose PI carries no booking_id metadata AND isn't a
//     retail_purchase/package_purchase/gift_card (non-booking / manual / test charges),
//     nothing in `bookings` or the purchase tables to reconcile against.

const LOOKBACK_MS = 48 * 60 * 60 * 1000;
const PAGE_SIZE = 100;
const MAX_PAGES = 10; // bound: up to 1000 charges + 1000 refunds per run.

type Mismatch = {
  kind:
    | "amount_drift"
    | "refund_drift"
    | "missing_booking"
    | "missing_payout"
    | "refund_without_db_record"
    | "purchase_amount_drift"
    | "purchase_refund_drift"
    | "missing_purchase";
  payment_intent: string | null;
  charge_id?: string;
  refund_id?: string;
  booking_id?: string | null;
  purchase_id?: string | null;
  detail: string;
};

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("reconcile", async () => {
  const admin = createAdminSupabaseClient();
  const stripe = getStripe();
  const since = Math.floor((Date.now() - LOOKBACK_MS) / 1000); // Stripe `created` is unix seconds.

  const mismatches: Mismatch[] = [];
  const skipped = { walk_in: 0, voucher: 0, non_booking: 0 };
  let checked = 0;
  let checkedPurchases = 0;

  // ---- 1. Charges from the last 48h ----------------------------------------
  try {
    let startingAfter: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params: Record<string, unknown> = {
        created: { gte: since },
        limit: PAGE_SIZE,
        // Expand the PI so we can read metadata (booking_id / type) without a
        // second round-trip per charge.
        expand: ["data.payment_intent"],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const batch = await stripe.charges.list(params as any);

      for (const charge of batch.data) {
        const pi =
          charge.payment_intent && typeof charge.payment_intent !== "string"
            ? charge.payment_intent
            : null;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : pi?.id ?? null;
        const meta = pi?.metadata ?? {};

        // --- skip non-booking charges, honestly counted ---
        if (meta.type === "walk_in") {
          skipped.walk_in++;
          continue;
        }

        // --- GIFT-CARD activation reconciliation (Ring 8: the single biggest coverage
        //     gap this cron had, closed here). gift-card-handler.ts's webhook CAS
        //     (is_active false -> true) is the ONLY place a paid card is ever activated;
        //     before this check, a dropped/never-redelivered payment_intent.succeeded
        //     left real captured money with a permanently inert (is_active:false) card
        //     and NOTHING in this cron would ever notice, the charge fell straight
        //     into the "non_booking" skip bucket below. ---
        if (meta.type === "gift_card") {
          checkedPurchases++;
          const { data: card } = await admin
            .from("gift_cards")
            .select("id, is_active")
            .eq("stripe_payment_intent_id", piId)
            .maybeSingle();
          if (!card) {
            mismatches.push({
              kind: "missing_purchase",
              payment_intent: piId,
              charge_id: charge.id,
              detail: `Stripe charge ${charge.id} (PI ${piId}, type=gift_card) has no matching gift_cards row. captured=${charge.amount_captured} Rappen.`,
            });
          } else if (charge.amount_captured > 0 && !card.is_active) {
            mismatches.push({
              kind: "purchase_amount_drift",
              payment_intent: piId,
              charge_id: charge.id,
              purchase_id: card.id,
              detail: `gift_cards ${card.id} is still is_active=false despite a captured charge (webhook never activated it).`,
            });
          }
          continue;
        }
        if (meta.type === "voucher") {
          skipped.voucher++;
          continue;
        }

        // --- PACKAGE / RETAIL PURCHASE reconciliation, parallel to the booking
        //     branch below (does not touch it). "retail_purchase" is the live
        //     metadata.type (app/api/salon/retail/purchase/route.ts); "package_purchase"
        //     is checked defensively for a legacy row (see the file header note),
        //     no new charge carries it. Both tables are keyed on
        //     stripe_payment_intent_id (confirmed live columns, migration
        //     20260602100000_purchase_refunds). ---
        if (meta.type === "retail_purchase" || meta.type === "package_purchase") {
          checkedPurchases++;
          const purchaseTable = meta.type === "retail_purchase" ? "retail_purchases" : "package_purchases";
          const { data: purchase } = await admin
            .from(purchaseTable)
            .select("id, paid_amount, refunded_amount")
            .eq("stripe_payment_intent_id", piId)
            .maybeSingle();

          if (!purchase) {
            mismatches.push({
              kind: "missing_purchase",
              payment_intent: piId,
              charge_id: charge.id,
              detail: `Stripe charge ${charge.id} (PI ${piId}, type=${meta.type}) has no matching ${purchaseTable} row. captured=${charge.amount_captured} Rappen.`,
            });
            continue;
          }

          const dbPurchasePaid = purchase.paid_amount ?? 0;
          if (charge.amount_captured !== dbPurchasePaid) {
            mismatches.push({
              kind: "purchase_amount_drift",
              payment_intent: piId,
              charge_id: charge.id,
              purchase_id: purchase.id,
              detail: `captured amount drift: Stripe=${charge.amount_captured} Rappen vs ${purchaseTable}.paid_amount=${dbPurchasePaid} Rappen.`,
            });
          }

          const dbPurchaseRefunded = purchase.refunded_amount ?? 0;
          if (charge.amount_refunded !== dbPurchaseRefunded) {
            mismatches.push({
              kind: "purchase_refund_drift",
              payment_intent: piId,
              charge_id: charge.id,
              purchase_id: purchase.id,
              detail: `refunded amount drift: Stripe=${charge.amount_refunded} Rappen vs ${purchaseTable}.refunded_amount=${dbPurchaseRefunded} Rappen.`,
            });
          }
          continue;
        }

        const metaBookingId = meta.booking_id || null;
        // A booking charge is identified by metadata.type === "booking" OR a
        // booking_id in metadata. Anything else has no row in `bookings`.
        if (meta.type !== "booking" && !metaBookingId) {
          skipped.non_booking++;
          continue;
        }

        checked++;

        // --- find the matching booking: payment_intent_id (live column) first,
        //     then fall back to the PI's metadata.booking_id ---
        let booking:
          | { id: string; paid_amount: number | null; refunded_amount: number | null; status: string | null; payment_status: string | null }
          | null = null;

        if (piId) {
          const { data } = await admin
            .from("bookings")
            .select("id, paid_amount, refunded_amount, status, payment_status")
            .eq("payment_intent_id", piId)
            .maybeSingle();
          booking = data ?? null;
        }
        if (!booking && metaBookingId) {
          const { data } = await admin
            .from("bookings")
            .select("id, paid_amount, refunded_amount, status, payment_status")
            .eq("id", metaBookingId)
            .maybeSingle();
          booking = data ?? null;
        }

        if (!booking) {
          mismatches.push({
            kind: "missing_booking",
            payment_intent: piId,
            charge_id: charge.id,
            booking_id: metaBookingId,
            detail: `Stripe charge ${charge.id} (PI ${piId}) has no matching booking row. captured=${charge.amount_captured} Rappen.`,
          });
          continue;
        }

        // --- compare captured amount (both integer Rappen) ---
        const dbPaid = booking.paid_amount ?? 0;
        if (charge.amount_captured !== dbPaid) {
          mismatches.push({
            kind: "amount_drift",
            payment_intent: piId,
            charge_id: charge.id,
            booking_id: booking.id,
            detail: `captured amount drift: Stripe=${charge.amount_captured} Rappen vs bookings.paid_amount=${dbPaid} Rappen.`,
          });
        }

        // --- compare refunded amount (both integer Rappen) ---
        const dbRefunded = booking.refunded_amount ?? 0;
        if (charge.amount_refunded !== dbRefunded) {
          mismatches.push({
            kind: "refund_drift",
            payment_intent: piId,
            charge_id: charge.id,
            booking_id: booking.id,
            detail: `refunded amount drift: Stripe=${charge.amount_refunded} Rappen vs bookings.refunded_amount=${dbRefunded} Rappen.`,
          });
        }

        // --- assert a salon_payouts row exists for captured booking charges ---
        // The webhook upserts one payout row per PI on payment_intent.succeeded.
        // Only expect it when money was actually captured.
        if (charge.amount_captured > 0 && piId) {
          const { data: payout } = await admin
            .from("salon_payouts")
            .select("id")
            .eq("stripe_payment_intent_id", piId)
            .maybeSingle();
          if (!payout) {
            mismatches.push({
              kind: "missing_payout",
              payment_intent: piId,
              charge_id: charge.id,
              booking_id: booking.id,
              detail: `no salon_payouts row for captured charge ${charge.id} (PI ${piId}), captured=${charge.amount_captured} Rappen.`,
            });
          }
        }
      }

      if (!batch.has_more) break;
      startingAfter = batch.data[batch.data.length - 1]?.id;
      if (!startingAfter) break;
    }
  } catch (err) {
    console.error("[cron/reconcile] charges.list / compare failed:", err);
  }

  // ---- 2. Refunds from the last 48h ----------------------------------------
  // Catches refunds that exist in Stripe but the DB never recorded (e.g. a
  // refund issued directly in the Stripe dashboard, bypassing issueRefund + the
  // charge.refunded webhook).
  try {
    let startingAfter: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params: Record<string, unknown> = {
        created: { gte: since },
        limit: PAGE_SIZE,
      };
      if (startingAfter) params.starting_after = startingAfter;

      const batch = await stripe.refunds.list(params as any);

      for (const refund of batch.data) {
        const piId =
          typeof refund.payment_intent === "string"
            ? refund.payment_intent
            : refund.payment_intent?.id ?? null;
        if (!piId) continue; // refund not tied to a PI — nothing to map.

        const { data: booking } = await admin
          .from("bookings")
          .select("id, refunded_amount, payment_intent_id")
          .eq("payment_intent_id", piId)
          .maybeSingle();

        // No booking on this PI: it's a walk-in / voucher / non-booking refund,
        // OR a package/retail purchase refund. The charge loop above now
        // reconciles purchase refunds too, but only for a charge CREATED inside
        // the 48h lookback; a refund today against an older purchase charge is
        // NOT re-checked here (this section stays booking-only, scoped to the
        // literal ask). Here we only flag the booking-linked refunds the DB
        // under-recorded.
        if (!booking) continue;

        const dbRefunded = booking.refunded_amount ?? 0;
        // Stripe says money was refunded but the booking shows less than the
        // refund amount -> the DB never recorded (all of) it.
        if (refund.amount > dbRefunded) {
          mismatches.push({
            kind: "refund_without_db_record",
            payment_intent: piId,
            refund_id: refund.id,
            booking_id: booking.id,
            detail: `Stripe refund ${refund.id} of ${refund.amount} Rappen exceeds bookings.refunded_amount=${dbRefunded} Rappen (under-recorded refund).`,
          });
        }
      }

      if (!batch.has_more) break;
      startingAfter = batch.data[batch.data.length - 1]?.id;
      if (!startingAfter) break;
    }
  } catch (err) {
    console.error("[cron/reconcile] refunds.list / compare failed:", err);
  }

  // ---- 3. Report -----------------------------------------------------------
  for (const m of mismatches) {
    console.error(`[cron/reconcile] MISMATCH ${m.kind}:`, m.detail, {
      payment_intent: m.payment_intent,
      charge_id: m.charge_id,
      refund_id: m.refund_id,
      booking_id: m.booking_id,
      purchase_id: m.purchase_id,
    });
  }

  console.log(
    `[cron/reconcile] checked bookings=${checked} purchases=${checkedPurchases} mismatches=${mismatches.length} ` +
      `skipped(walk_in=${skipped.walk_in}, voucher=${skipped.voucher}, non_booking=${skipped.non_booking})`
  );

  if (mismatches.length > 0) {
    const adminEmail = getServerEnv().ADMIN_EMAIL;
    if (adminEmail) {
      const rows = mismatches
        .map(
          (m) =>
            `<li><strong>${m.kind}</strong> — ${m.detail}` +
            `${m.booking_id ? ` (booking ${m.booking_id})` : ""}` +
            `${m.purchase_id ? ` (purchase ${m.purchase_id})` : ""}` +
            `${m.payment_intent ? ` [PI ${m.payment_intent}]` : ""}</li>`
        )
        .join("");
      await sendEmail({
        to: adminEmail,
        subject: `[solen.ch] Reconciliation: ${mismatches.length} mismatch(es) in last 48h`,
        html:
          `<p>The daily Stripe↔DB reconciliation found <strong>${mismatches.length}</strong> ` +
          `mismatch(es) (checked ${checked} booking charge(s), ${checkedPurchases} purchase charge(s)).</p>` +
          `<p>Skipped: walk-in ${skipped.walk_in}, voucher ${skipped.voucher}, non-booking ${skipped.non_booking}.</p>` +
          `<ul>${rows}</ul>` +
          `<p>This is read-only — no auto-fix was applied. Reconcile manually in Stripe + the DB.</p>`,
      }).catch((err) => console.error("[cron/reconcile] failed to send admin digest:", err));
    } else {
      console.warn("[cron/reconcile] ADMIN_EMAIL not set — skipping mismatch digest email");
    }
  }

  return {
    checked,
    checkedPurchases,
    skipped,
    mismatches,
    processed: checked + checkedPurchases,
  };
  });
}
