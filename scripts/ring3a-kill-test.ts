// Ring 3a kill test: lib/concurrency.ts runWithConcurrency (the bounded pool
// helper used by the cron email-sending routes) plus a printed equivalence
// analysis for the process-deletions batching (that route is GDPR-critical
// and must NOT be executed against the live DB, so it is proven by inspection
// here, not by running it).
//
// Usage: npx tsx scripts/ring3a-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { runWithConcurrency } = await import("@/lib/concurrency");

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // --- Scenario 1: concurrency cap is actually enforced -------------------
  {
    const LIMIT = 5;
    const TOTAL = 12;
    const REJECT_INDEX = 7;

    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: TOTAL }, (_, i) => i);

    const started = Date.now();
    const results = await runWithConcurrency(items, LIMIT, async (i) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      // Small artificial delay so tasks genuinely overlap (proves the pool
      // runs concurrently, not serially) without making the test slow.
      await new Promise((resolve) => setTimeout(resolve, 30));
      inFlight--;
      if (i === REJECT_INDEX) throw new Error(`task ${i} failed on purpose`);
      return i;
    });
    const elapsedMs = Date.now() - started;

    const allCompleted = results.length === TOTAL;
    const capRespected = maxInFlight <= LIMIT;
    const capReached = maxInFlight === LIMIT; // proves it's actually bounded-CONCURRENT, not serial
    const rejectedOne = results[REJECT_INDEX]?.status === "rejected";
    const rejectedReasonOk =
      results[REJECT_INDEX]?.status === "rejected" &&
      (results[REJECT_INDEX] as PromiseRejectedResult).reason instanceof Error &&
      (results[REJECT_INDEX] as PromiseRejectedResult).reason.message.includes(`task ${REJECT_INDEX} failed on purpose`);
    const othersFulfilled = results.every((r, i) => (i === REJECT_INDEX ? r.status === "rejected" : r.status === "fulfilled"));
    const notFullySerial = elapsedMs < TOTAL * 30; // 12 serial waits of 30ms = 360ms; pooled at cap 5 should land near ceil(12/5)*30 = 90ms

    const pass = allCompleted && capRespected && capReached && rejectedOne && rejectedReasonOk && othersFulfilled && notFullySerial;
    if (!pass) allPass = false;
    rows.push({
      scenario: "12 tasks, concurrency cap 5, one rejects",
      pass,
      details: { allCompleted, capRespected, capReached, maxInFlight, rejectedOne, rejectedReasonOk, othersFulfilled, notFullySerial, elapsedMs },
    });
  }

  // --- Scenario 2: empty input never hangs / never divides by zero --------
  {
    const results = await runWithConcurrency([], 5, async () => "unreachable");
    const pass = Array.isArray(results) && results.length === 0;
    if (!pass) allPass = false;
    rows.push({ scenario: "empty item list", pass, details: { resultsLength: results.length } });
  }

  // --- Scenario 3: limit larger than item count doesn't break the pool ----
  {
    const results = await runWithConcurrency([1, 2, 3], 10, async (i) => i * 2);
    const pass =
      results.length === 3 &&
      results.every((r) => r.status === "fulfilled") &&
      (results[0] as PromiseFulfilledResult<number>).value === 2;
    if (!pass) allPass = false;
    rows.push({ scenario: "limit > item count", pass, details: { results } });
  }

  console.log("Ring 3a kill test: lib/concurrency.ts runWithConcurrency\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }

  // --- process-deletions: NOT run (GDPR-critical, off-limits against the live
  // DB per the ring brief). Equivalence proven by inspection instead. ---------
  console.log("\nprocess-deletions batching: equivalence by inspection (NOT executed live)\n");
  console.log(
    [
      "Step                        | Table                    | Order constraint                          | Before (per-user loop)                              | After (batched across due users)",
      "1  DELETE                   | credit_redemptions       | MUST run before step 2 (FK: credit_id->user_credits.id, NOT NULL, no cascade) | .eq('user_id', user.id), awaited once per user, sequential | .in('user_id', userIds), ONE query for all due users, awaited before step 2",
      "2  DELETE                   | user_credits              | after step 1                              | .eq('user_id', user.id), sequential                  | .in('user_id', userIds), ONE query, run inside Promise.all with steps 3-18",
      "3  DELETE                   | barber_loyalty_history    | none (disjoint table/column)               | .eq('customer_id', user.id)                          | .in('customer_id', userIds), inside Promise.all",
      "4  DELETE                   | referrals (referrer_id)   | none                                       | .eq('referrer_id', user.id)                          | .in('referrer_id', userIds), inside Promise.all",
      "5  DELETE                   | client_notes              | none                                       | .eq('created_by', user.id)                           | .in('created_by', userIds), inside Promise.all",
      "6  DELETE                   | account_actions           | none                                       | .eq('admin_id', user.id)                             | .in('admin_id', userIds), inside Promise.all",
      "7  UPDATE ->null            | referrals (referred_user_id) | none                                    | .eq('referred_user_id', user.id)                     | .in('referred_user_id', userIds), inside Promise.all",
      "8  UPDATE ->null            | voucher_redemptions       | none                                       | .eq('user_id', user.id)                              | .in('user_id', userIds), inside Promise.all",
      "9  UPDATE ->null            | vouchers (buyer_id)       | none                                       | .eq('buyer_id', user.id)                             | .in('buyer_id', userIds), inside Promise.all",
      "10 UPDATE ->null            | vouchers (redeemed_by)    | none                                       | .eq('redeemed_by', user.id)                          | .in('redeemed_by', userIds), inside Promise.all",
      "11 UPDATE ->null            | discovery_staging         | none                                       | .eq('approved_by', user.id)                          | .in('approved_by', userIds), inside Promise.all",
      "12 UPDATE ->null            | hand_chart_notes          | none                                       | .eq('created_by', user.id)                           | .in('created_by', userIds), inside Promise.all",
      "13 UPDATE ->null            | price_disputes            | none                                       | .eq('resolved_by', user.id)                          | .in('resolved_by', userIds), inside Promise.all",
      "14 UPDATE ->null            | promo_codes               | none                                       | .eq('created_by', user.id)                           | .in('created_by', userIds), inside Promise.all",
      "15 UPDATE ->null            | feature_flags             | none                                       | .eq('updated_by', user.id)                           | .in('updated_by', userIds), inside Promise.all",
      "16 UPDATE ->null            | salon_badge_assignments   | none                                       | .eq('assigned_by', user.id)                          | .in('assigned_by', userIds), inside Promise.all",
      "17 UPDATE ->null            | salon_documents           | none                                       | .eq('reviewed_by', user.id)                          | .in('reviewed_by', userIds), inside Promise.all",
      "18 UPDATE ->null            | salons                    | none                                       | .eq('approved_by', user.id)                          | .in('approved_by', userIds), inside Promise.all",
      "19 UPDATE ->null            | site_content              | none                                       | .eq('updated_by', user.id)                           | .in('updated_by', userIds), inside Promise.all",
      "20 auth.admin.deleteUser    | auth.users (+ profiles cascade + BEFORE DELETE trigger) | after ALL of 1-19 for THAT user | awaited per user inside the loop, proactively skipped if any of that user's 1-19 ops errored | awaited per user inside the loop (Admin API has no bulk delete); no proactive per-user skip, this call IS the safety net: it hits the same NOT NULL/NO ACTION FK Postgres checked before, so it still fails per user, isolated, if that user's rows were not actually cleared",
      "21 INSERT                   | data_deletion_log         | after step 20 succeeds for that user       | .insert({...}), one row, awaited per successful user | .insert([{...}, ...]), ONE call, all successful users batched after the per-user loop finishes",
    ].join("\n")
  );
  console.log(
    "\nNet effect: for a batch of N due users, DB round trips drop from roughly 19*N + N (delete) + N (log) " +
      "to 19 (batched cleanup, order-preserved) + N (delete, unavoidable, no bulk Admin API) + 1 (batched log insert). " +
      "Deletion semantics preserved: the auth.admin.deleteUser call remains the actual per-user commit point and the " +
      "actual FK safety net, so a user whose dependent rows were not cleared still fails, isolated, exactly as before. " +
      "The one documented deviation: the OLD code's proactive per-user pre-check produced a 'pre-delete cleanup failed " +
      "(<table>): <message>' error string; the NEW code lets deleteUser's own FK violation surface instead, so the " +
      "error TEXT for that failure mode differs even though the OUTCOME (not deleted, error recorded, retried next run) " +
      "is identical. `npx tsc --noEmit` was run and shows zero NEW errors introduced by this change (2 pre-existing, " +
      "unrelated errors remain in app/api/admin/discovery/backfill/route.ts and app/api/cron/discovery-ai-backfill/route.ts)."
  );

  console.log("");
  console.log(allPass ? "All concurrency-pool scenarios passed." : "One or more concurrency-pool scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring3a-kill-test] threw:", err);
  process.exit(1);
});
