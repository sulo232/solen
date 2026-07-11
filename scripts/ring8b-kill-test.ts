// Ring 8b kill test: the charge.dispute.closed 'lost' branch double-decrement money bug
// (app/api/stripe/webhook/route.ts, flagged + independently verified by the ring 8
// reviewer) and its fix.
//
// THE BUG: on a webhook retry (Stripe redelivers the SAME event after the
// processed_webhook_events claim was released by a mid-flight crash, per the
// project-wide claim-release-on-error contract at the top of route.ts), the old code
// read the CURRENT salon_payouts row and subtracted dispute.amount from it AGAIN, on top
// of the decrement the first delivery already committed. Unlike charge.refunded (which
// recomputes from the Stripe-absolute charge.amount / charge.amount_refunded pair, a
// cumulative fact embedded on every refunded event, so repeated deliveries converge to
// the same value), a dispute event carries no equivalent cumulative "amount disputed"
// fact, so the fix uses a CAS idempotency marker instead (salon_payouts.lost_dispute_id,
// migration 20260711160000_backend_loop_dispute_lost_marker.sql, NOT applied yet, the
// orchestrator applies it): the decrement and the marker are claimed in the SAME
// UPDATE ... WHERE lost_dispute_id IS NULL, so only the first delivery for a given
// dispute.id ever mutates the row.
//
// This sandbox has no raw-SQL execution path (no exec_sql/pgexec RPC, no DATABASE_URL) to
// create a throwaway table with the migrated column shape, and the migration itself is
// deliberately not applied yet (the orchestrator applies it), so this mirrors
// ring8-kill-test.ts's Section A technique for the same situation: prove (1) the
// migration file is syntactically idempotent, (2) the REAL webhook file contains the
// exact CAS shape (source-grep, cannot silently drift from the deployed code), and (3) a
// logic-replica of the CAS predicate, run twice against the SAME fake row exactly like a
// webhook retry would, quoting the actual before/after numbers. Plus an honest live-DB
// probe reporting whether the column has been applied yet (informational, not a gate).
//
// Usage: npx tsx scripts/ring8b-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];
  function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
    rows.push({ scenario, pass, details });
    if (!pass) allPass = false;
  }

  // ─── Section A: migration file shape ──────────────────────────────────────────────

  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/20260711160000_backend_loop_dispute_lost_marker.sql",
  );
  let migrationSrc = "";
  try {
    migrationSrc = readFileSync(migrationPath, "utf8");
  } catch (err) {
    check("migration file exists at the expected path", false, { migrationPath, error: String(err) });
  }
  if (migrationSrc) {
    const hasIdempotentAdd = /add column if not exists lost_dispute_id/i.test(migrationSrc);
    check("migration file uses idempotent ADD COLUMN IF NOT EXISTS for lost_dispute_id", hasIdempotentAdd, {
      migrationPath,
      hasIdempotentAdd,
    });
  }

  // ─── Section B: the REAL webhook source contains the exact CAS shape ─────────────
  // (source-grep, proves this test cannot silently drift from the deployed code,
  // mirroring ring7a-kill-test.ts / ring8-kill-test.ts's technique).

  const webhookPath = join(process.cwd(), "app/api/stripe/webhook/route.ts");
  const webhookSrc = readFileSync(webhookPath, "utf8");

  // Isolate the charge.dispute.closed case body so every check below is scoped to it
  // (not, say, an unrelated .is(...) call elsewhere in this large switch).
  const disputeClosedMatch = webhookSrc.match(
    /case "charge\.dispute\.closed": \{([\s\S]*?)\n {4}case "setup_intent\.succeeded"/,
  );
  const disputeClosedBody = disputeClosedMatch?.[1] ?? "";
  check("app/api/stripe/webhook/route.ts has an isolatable charge.dispute.closed case body", disputeClosedBody.length > 0, {
    bodyLength: disputeClosedBody.length,
  });

  // The decrement fields and the idempotency marker must be claimed in the SAME
  // .update({...}) call, otherwise a crash between two separate writes reopens the exact
  // race this fix closes.
  const updateBlockMatch = disputeClosedBody.match(/\.update\(\s*\{([\s\S]*?)\}\s*\)/);
  const updateBlockBody = updateBlockMatch?.[1] ?? "";
  const updateHasGross = /gross_amount:\s*newGross/.test(updateBlockBody);
  const updateHasComm = /commission_amount:\s*newComm/.test(updateBlockBody);
  const updateHasNet = /net_amount:\s*newNet/.test(updateBlockBody);
  const updateHasMarker = /lost_dispute_id:\s*dispute\.id/.test(updateBlockBody);
  check(
    "the decrement (gross/commission/net) and the lost_dispute_id marker are claimed in ONE .update() call",
    updateHasGross && updateHasComm && updateHasNet && updateHasMarker,
    { updateHasGross, updateHasComm, updateHasNet, updateHasMarker, updateBlockBody },
  );

  // The CAS guard: the update must be gated on the marker still being unset.
  const hasIsNullGuard = /\.is\(\s*["']lost_dispute_id["']\s*,\s*null\s*\)/.test(disputeClosedBody);
  check(
    "app/api/stripe/webhook/route.ts guards the dispute-lost claim on .is(\"lost_dispute_id\", null)",
    hasIsNullGuard,
    { hasIsNullGuard },
  );

  // ledgerAdjusted must be DERIVED from whether the CAS actually matched a row
  // (claimedRow), never hardcoded true, otherwise the audit-log "ledger_adjusted" field
  // would lie on a no-op retry.
  const ledgerAdjustedIsHardcodedTrue = /ledgerAdjusted\s*=\s*true;/.test(disputeClosedBody);
  const ledgerAdjustedFromClaim = /ledgerAdjusted\s*=\s*!!claimedRow;/.test(disputeClosedBody);
  check(
    "ledgerAdjusted is derived from the CAS result (!!claimedRow), never hardcoded true",
    !ledgerAdjustedIsHardcodedTrue && ledgerAdjustedFromClaim,
    { ledgerAdjustedIsHardcodedTrue, ledgerAdjustedFromClaim },
  );

  // The old bug shape must be gone: a decrement computed straight off the row and
  // written WITHOUT any CAS guard.
  const oldBugShapeGone = !/\.update\(\{\s*\n\s*gross_amount: newGross,\s*\n\s*commission_amount: newComm,\s*\n\s*net_amount: newNet,\s*\n\s*\}\)\.eq\("id", payout\.id\);/.test(
    disputeClosedBody,
  );
  check("the old unguarded update (no CAS, no marker) is no longer present", oldBugShapeGone, { oldBugShapeGone });

  // Confirm charge.refunded itself is NOT the same relative-decrement flaw (per the
  // ring 8b task: fix both the same way if it turns out to share the bug). It recomputes
  // from the CHARGE's own Stripe-absolute amount/amount_refunded pair, never from the row.
  const refundedMatch = webhookSrc.match(/case "charge\.refunded": \{([\s\S]*?)\n {4}case "payout\.paid"/);
  const refundedBody = refundedMatch?.[1] ?? "";
  const refundedRecomputesFromCharge = /const newGross = \(charge\.amount - charge\.amount_refunded\) \/ 100;/.test(
    refundedBody,
  );
  const refundedNeverReadsPayoutGrossIntoNewGross = !/newGross\s*=\s*payout\.gross_amount/.test(refundedBody);
  check(
    "charge.refunded recomputes newGross from the CHARGE's own Stripe-absolute amount/amount_refunded (not the mutable row); no fix needed there",
    refundedRecomputesFromCharge && refundedNeverReadsPayoutGrossIntoNewGross,
    { refundedRecomputesFromCharge, refundedNeverReadsPayoutGrossIntoNewGross },
  );

  // No select("*") reintroduced on salon_payouts in the branch this ring touched (backend
  // audit 2026-07-06 rule: explicit column lists only on this table).
  const noSelectStarOnPayouts = !/salon_payouts["']\)\s*\n?\s*\.select\(\s*["']\*["']\s*\)/.test(disputeClosedBody);
  check("the dispute.closed 'lost' branch uses an explicit salon_payouts column list, not select(\"*\")", noSelectStarOnPayouts, {
    noSelectStarOnPayouts,
  });

  // ─── Section C: logic-replica of the CAS predicate, run TWICE like a real retry ──
  // Mirrors exactly what
  //   UPDATE salon_payouts
  //   SET gross_amount = :newGross, commission_amount = :newComm, net_amount = :newNet,
  //       lost_dispute_id = :disputeId
  //   WHERE id = :id AND lost_dispute_id IS NULL
  //   RETURNING id
  // does: the first delivery for a dispute_id matches and mutates the row; every later
  // delivery for the SAME dispute_id (webhook retry, or a genuine Stripe redelivery)
  // matches 0 rows and leaves the row untouched.

  type PayoutRow = {
    id: string;
    gross_amount: number;
    commission_percent: number;
    commission_amount: number;
    net_amount: number;
    lost_dispute_id: string | null;
  };

  function applyDisputeLostDelivery(
    row: PayoutRow,
    disputeAmountRappen: number,
    disputeId: string,
  ): { claimed: boolean; matchedRows: number } {
    // WHERE lost_dispute_id IS NULL
    if (row.lost_dispute_id !== null) return { claimed: false, matchedRows: 0 };
    const newGross = Math.max(0, row.gross_amount - disputeAmountRappen / 100); // Rappen → CHF
    const newComm = Math.round(newGross * (row.commission_percent / 100) * 100) / 100;
    const newNet = Math.round((newGross - newComm) * 100) / 100;
    // SET ... WHERE lost_dispute_id IS NULL (the guard above), all in the SAME update.
    row.gross_amount = newGross;
    row.commission_amount = newComm;
    row.net_amount = newNet;
    row.lost_dispute_id = disputeId;
    return { claimed: true, matchedRows: 1 };
  }

  const DISPUTE_ID = "dp_ring8b_test";
  const DISPUTE_AMOUNT_RAPPEN = 4500; // CHF 45.00, an arbitrary but realistic dispute amount.
  const fakePayout: PayoutRow = {
    id: "fake-payout-id",
    gross_amount: 100, // CHF 100.00 gross, matching a realistic booking payout row.
    commission_percent: 15,
    commission_amount: 15,
    net_amount: 85,
    lost_dispute_id: null,
  };
  const expectedGrossAfterOneDecrement = Math.max(0, 100 - DISPUTE_AMOUNT_RAPPEN / 100); // 100 - 45 = 55
  const expectedCommAfterOneDecrement = Math.round(expectedGrossAfterOneDecrement * 0.15 * 100) / 100; // 8.25
  const expectedNetAfterOneDecrement = Math.round((expectedGrossAfterOneDecrement - expectedCommAfterOneDecrement) * 100) / 100; // 46.75

  // C1. Single run: the first delivery for this dispute must decrement to the correct
  // value and claim the marker.
  const firstDelivery = applyDisputeLostDelivery(fakePayout, DISPUTE_AMOUNT_RAPPEN, DISPUTE_ID);
  console.log(
    `[ring8b-kill-test] run 1 (first delivery): claimed=${firstDelivery.claimed} matchedRows=${firstDelivery.matchedRows} ` +
      `gross_amount=${fakePayout.gross_amount} commission_amount=${fakePayout.commission_amount} net_amount=${fakePayout.net_amount} ` +
      `lost_dispute_id=${fakePayout.lost_dispute_id}`,
  );
  check(
    "single run: first delivery claims the CAS (1 row matched) and decrements to the correct value",
    firstDelivery.claimed &&
      firstDelivery.matchedRows === 1 &&
      fakePayout.gross_amount === expectedGrossAfterOneDecrement &&
      fakePayout.commission_amount === expectedCommAfterOneDecrement &&
      fakePayout.net_amount === expectedNetAfterOneDecrement,
    {
      firstDelivery,
      gross_amount: fakePayout.gross_amount,
      expectedGrossAfterOneDecrement,
      commission_amount: fakePayout.commission_amount,
      expectedCommAfterOneDecrement,
      net_amount: fakePayout.net_amount,
      expectedNetAfterOneDecrement,
    },
  );

  const rowAfterFirstDelivery = { ...fakePayout };

  // C2. Double run: a webhook retry (claim released after the write already committed
  // once) redelivers the EXACT SAME event. This must be a no-op (0 rows matched) and the
  // row must stay at the SAME value as after run 1, THE bug this fix closes (the old
  // code would decrement AGAIN here, to 55 - 45 = 10, silently underpaying the salon).
  const secondDelivery = applyDisputeLostDelivery(fakePayout, DISPUTE_AMOUNT_RAPPEN, DISPUTE_ID);
  console.log(
    `[ring8b-kill-test] run 2 (retry, SAME event): claimed=${secondDelivery.claimed} matchedRows=${secondDelivery.matchedRows} ` +
      `gross_amount=${fakePayout.gross_amount} commission_amount=${fakePayout.commission_amount} net_amount=${fakePayout.net_amount} ` +
      `lost_dispute_id=${fakePayout.lost_dispute_id}`,
  );
  check(
    "double run (retry, same event): the CAS matches 0 rows (no-op), gross_amount stays the SAME as after run 1 (idempotent)",
    !secondDelivery.claimed &&
      secondDelivery.matchedRows === 0 &&
      fakePayout.gross_amount === rowAfterFirstDelivery.gross_amount &&
      fakePayout.commission_amount === rowAfterFirstDelivery.commission_amount &&
      fakePayout.net_amount === rowAfterFirstDelivery.net_amount,
    {
      secondDelivery,
      gross_amount_after_run2: fakePayout.gross_amount,
      gross_amount_after_run1: rowAfterFirstDelivery.gross_amount,
      would_be_gross_if_bug_still_present: Math.max(0, rowAfterFirstDelivery.gross_amount - DISPUTE_AMOUNT_RAPPEN / 100),
    },
  );

  // C3. Kill-test proper: replay the OLD (buggy) shape against the same starting row and
  // prove it diverges from the fixed shape on the second delivery, i.e. this test would
  // have FAILED before the fix (and would fail again if the fix regressed).
  function applyOldBuggyDelivery(
    row: { gross_amount: number; commission_percent: number; commission_amount: number },
    disputeAmountRappen: number,
  ) {
    // The OLD code: unconditional read-current-row-and-subtract, no CAS, no marker.
    const newGross = Math.max(0, row.gross_amount - disputeAmountRappen / 100);
    const newComm = Math.round(newGross * (row.commission_percent / 100) * 100) / 100;
    row.gross_amount = newGross;
    row.commission_amount = newComm;
    return newGross;
  }
  const buggyRow = { gross_amount: 100, commission_percent: 15, commission_amount: 15 };
  applyOldBuggyDelivery(buggyRow, DISPUTE_AMOUNT_RAPPEN); // run 1: 100 - 45 = 55, correct.
  const buggyGrossAfterRun1: number = buggyRow.gross_amount;
  applyOldBuggyDelivery(buggyRow, DISPUTE_AMOUNT_RAPPEN); // run 2 (retry): 55 - 45 = 10, WRONG.
  const buggyGrossAfterRun2: number = buggyRow.gross_amount;
  console.log(
    `[ring8b-kill-test] OLD buggy shape (for contrast, not the shipped code): run1 gross=${buggyGrossAfterRun1} run2 gross=${buggyGrossAfterRun2} ` +
      `(should have stayed ${buggyGrossAfterRun1}, silently dropped to ${buggyGrossAfterRun2})`,
  );
  const buggyRun1Correct = buggyGrossAfterRun1 === 55;
  const buggyRun2Wrong = buggyGrossAfterRun2 === 10;
  const buggyDivergedOnRetry = buggyGrossAfterRun2 !== buggyGrossAfterRun1;
  check(
    "kill test: the OLD unguarded shape DOES double-decrement on a retry (proves the fix is load-bearing, not a no-op change)",
    buggyRun1Correct && buggyRun2Wrong && buggyDivergedOnRetry,
    { buggyGrossAfterRun1, buggyGrossAfterRun2 },
  );

  // ─── Section D: honest live-DB probe (informational, not a pass/fail gate) ────────
  const { error: liveColumnProbeErr } = await admin.from("salon_payouts").select("lost_dispute_id").limit(1);
  const columnLiveYet = !liveColumnProbeErr;
  console.log(
    `[ring8b-kill-test] INFO salon_payouts.lost_dispute_id is ${columnLiveYet ? "LIVE" : "NOT YET applied"} on the live DB` +
      (liveColumnProbeErr ? ` (${liveColumnProbeErr.message})` : ""),
  );

  console.log("\nRing 8b kill test: charge.dispute.closed 'lost' branch double-decrement fix\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring8b-kill-test] threw:", err);
  process.exit(1);
});
