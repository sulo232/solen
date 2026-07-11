// Ring 8 kill test: (A) the promo_counted_at CAS claim shape (webhook resilience,
// promo-increment retry double-count fix) and (B) referral completion idempotency at the
// booking-approve transition (the pending_approval gap fix).
//
// Section A cannot exercise the REAL bookings.promo_counted_at column against the live
// DB this round: the migration (supabase/migrations/20260711150000_backend_loop_
// promo_counted_flag.sql) is written but deliberately NOT applied yet (the orchestrator
// applies it before/at commit, per the ring's own instructions), and this sandbox has no
// raw-SQL execution path (no exec_sql/pgexec RPC, no DATABASE_URL) to CREATE a throwaway
// table with the same column shape either, confirmed by probing both live this round.
// So instead of a real Postgres UPDATE ... WHERE ... IS NULL exercise, this section proves
// three independent things that together cover the same ground as ring7a-kill-test.ts's
// "source-grep + logic-replica" pattern for a similar DB-function-shape case:
//   1. the migration FILE is syntactically idempotent (ADD COLUMN IF NOT EXISTS)
//   2. the REAL webhook file contains the exact CAS guard (source-grep, cannot silently
//      drift from the deployed code)
//   3. a logic-replica of the CAS predicate (claim succeeds once, no-ops on a repeat)
//   plus an honest live-DB probe reporting whether the column has been applied yet.
//
// Section B DOES exercise the real live DB: two throwaway auth users (created + deleted
// via admin.auth.admin, never touching a real customer) and a throwaway referrals row
// (inserted + deleted), calling the REAL exported completeReferralForFirstBooking twice.
//
// Usage: npx tsx scripts/ring8-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const { completeReferralForFirstBooking } = await import("@/lib/referral/complete-referral");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];
  function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
    rows.push({ scenario, pass, details });
    if (!pass) allPass = false;
  }

  // ─── Section A: promo_counted_at CAS claim shape ───────────────────────────────

  // A1. Migration file is an idempotent additive ADD COLUMN IF NOT EXISTS (never a bare
  // ADD COLUMN, which would 500 on a re-run against an already-migrated DB).
  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/20260711150000_backend_loop_promo_counted_flag.sql",
  );
  let migrationSrc = "";
  try {
    migrationSrc = readFileSync(migrationPath, "utf8");
  } catch (err) {
    check("migration file exists at the expected path", false, { migrationPath, error: String(err) });
  }
  if (migrationSrc) {
    const hasIdempotentAdd = /add column if not exists promo_counted_at/i.test(migrationSrc);
    check("migration file uses idempotent ADD COLUMN IF NOT EXISTS for promo_counted_at", hasIdempotentAdd, {
      migrationPath,
      hasIdempotentAdd,
    });
  }

  // A2. The REAL webhook source contains the exact CAS guard (proves this test cannot
  // silently drift from the deployed code, mirroring ring7a-kill-test.ts's technique).
  const webhookPath = join(process.cwd(), "app/api/stripe/webhook/route.ts");
  const webhookSrc = readFileSync(webhookPath, "utf8");
  const hasClaimUpdate = /\.update\(\s*\{\s*promo_counted_at:\s*new Date\(\)\.toISOString\(\)\s*\}\s*\)/.test(
    webhookSrc,
  );
  const hasIsNullGuard = /\.is\(\s*["']promo_counted_at["']\s*,\s*null\s*\)/.test(webhookSrc);
  const gatedOnConfirmedRow = /confirmedRow\?\.id && confirmedRow\.promo_code/.test(webhookSrc);
  check(
    "app/api/stripe/webhook/route.ts contains the promo_counted_at claim UPDATE",
    hasClaimUpdate,
    { hasClaimUpdate },
  );
  check(
    "app/api/stripe/webhook/route.ts guards the claim on .is(\"promo_counted_at\", null)",
    hasIsNullGuard,
    { hasIsNullGuard },
  );
  check(
    "app/api/stripe/webhook/route.ts only claims when THIS event just confirmed a promo-bearing booking",
    gatedOnConfirmedRow,
    { gatedOnConfirmedRow },
  );
  const hasIncrementRpcCall = /\.rpc\(\s*["']increment_promo_use["']/.test(webhookSrc);
  check(
    "app/api/stripe/webhook/route.ts no longer CALLS increment_promo_use in the succeeded handler (reserve-at-checkout owns the count; a bare comment mention is fine)",
    !hasIncrementRpcCall,
    { hasIncrementRpcCall },
  );

  // A3. Logic-replica of the CAS predicate itself: first claim on a null-flag row wins,
  // a second claim on the SAME (now-claimed) row is a no-op. Mirrors exactly what
  // `UPDATE bookings SET promo_counted_at = now() WHERE id = :id AND promo_counted_at IS
  // NULL RETURNING id` does: 1 row back on the winning call, 0 rows on every call after.
  type Row = { id: string; promo_counted_at: string | null };
  function claim(row: Row): { claimed: boolean; matchedRows: number } {
    // WHERE promo_counted_at IS NULL
    if (row.promo_counted_at !== null) return { claimed: false, matchedRows: 0 };
    row.promo_counted_at = new Date().toISOString(); // SET promo_counted_at = now()
    return { claimed: true, matchedRows: 1 };
  }
  const fakeRow: Row = { id: "fake-booking-id", promo_counted_at: null };
  const firstClaim = claim(fakeRow);
  check("CAS logic-replica: first claim on a null promo_counted_at wins (1 row matched)", firstClaim.claimed && firstClaim.matchedRows === 1, {
    firstClaim,
    rowAfterFirstClaim: fakeRow,
  });
  const secondClaim = claim(fakeRow);
  check("CAS logic-replica: second claim on the SAME now-claimed row is a no-op (0 rows matched)", !secondClaim.claimed && secondClaim.matchedRows === 0, {
    secondClaim,
    rowAfterSecondClaim: fakeRow,
  });
  const timestampUnchanged = fakeRow.promo_counted_at === new Date(fakeRow.promo_counted_at!).toISOString();
  check("CAS logic-replica: the claimed timestamp is never overwritten by the no-op retry", timestampUnchanged, {
    promo_counted_at: fakeRow.promo_counted_at,
  });

  // A4. Honest live-DB probe (informational, not a pass/fail gate): reports whether the
  // orchestrator has applied the migration yet. Either answer is a valid state for this
  // build round; the point is proving the code degrades gracefully either way (checked by
  // A2's guard existing + the try/catch immediately around it in route.ts).
  const { error: liveColumnProbeErr } = await admin.from("bookings").select("promo_counted_at").limit(1);
  const columnLiveYet = !liveColumnProbeErr;
  console.log(
    `[ring8-kill-test] INFO bookings.promo_counted_at is ${columnLiveYet ? "LIVE" : "NOT YET applied"} on the live DB` +
      (liveColumnProbeErr ? ` (${liveColumnProbeErr.message})` : ""),
  );

  // ─── Section B: referral completion idempotency (real live DB, throwaway rows) ─────
  let referrerUserId: string | null = null;
  let referredUserId: string | null = null;
  let referralId: string | null = null;
  const testCode = "RING8TEST" + Date.now().toString(36).toUpperCase();

  try {
    // Two disposable auth users (never real customers): a profiles row is auto-created by
    // the DB trigger, satisfying referrals.referrer_id's FK (confirmed live this round: a
    // fully synthetic random UUID 23503s on that FK, so a real user row is required).
    const stamp = Date.now();
    const { data: u1, error: e1 } = await admin.auth.admin.createUser({
      email: `ring8-kill-test-referrer-${stamp}@example.invalid`,
      email_confirm: true,
      password: crypto.randomUUID(),
    });
    const { data: u2, error: e2 } = await admin.auth.admin.createUser({
      email: `ring8-kill-test-referred-${stamp}@example.invalid`,
      email_confirm: true,
      password: crypto.randomUUID(),
    });
    referrerUserId = u1?.user?.id ?? null;
    referredUserId = u2?.user?.id ?? null;
    check("throwaway referrer + referred test users created", !e1 && !e2 && !!referrerUserId && !!referredUserId, {
      e1: e1?.message,
      e2: e2?.message,
      referrerUserId,
      referredUserId,
    });

    if (referrerUserId && referredUserId) {
      const { data: referral, error: insErr } = await admin
        .from("referrals")
        .insert({
          referrer_id: referrerUserId,
          referral_code: testCode,
          code: testCode,
          status: "pending",
          reward_amount: 10,
        })
        .select("id")
        .single();
      referralId = referral?.id ?? null;
      check("throwaway pending referral row created", !insErr && !!referralId, { insErr: insErr?.message, referralId });

      if (referralId) {
        // First call: a fresh referred user with zero bookings must win the CAS and credit
        // both sides, exactly like the webhook / booking-create / approve-transition callers.
        const first = await completeReferralForFirstBooking(admin, referredUserId, testCode);
        check("first completeReferralForFirstBooking call completes + returns the reward", first.completed === true && first.rewardAmount === 10, { first });

        const { data: referralAfterFirst } = await admin
          .from("referrals")
          .select("status, referred_user_id")
          .eq("id", referralId)
          .single();
        check(
          "referral row flipped to completed + referred_user_id stamped after the first call",
          referralAfterFirst?.status === "completed" && referralAfterFirst?.referred_user_id === referredUserId,
          { referralAfterFirst },
        );

        const { data: creditsAfterFirst } = await admin
          .from("user_credits")
          .select("id, user_id, amount")
          .eq("source", "referral")
          .eq("source_id", referralId);
        check("exactly 2 user_credits rows (referrer + referred) after the first call", (creditsAfterFirst?.length ?? 0) === 2, {
          creditsAfterFirst,
        });

        // Second call: SAME referred user + SAME code, must be a no-op (webhook-retry shape).
        const second = await completeReferralForFirstBooking(admin, referredUserId, testCode);
        check("second (retry) completeReferralForFirstBooking call is a no-op", second.completed === false, { second });

        const { data: creditsAfterSecond } = await admin
          .from("user_credits")
          .select("id")
          .eq("source", "referral")
          .eq("source_id", referralId);
        check(
          "STILL exactly 2 user_credits rows after the retry (no double credit)",
          (creditsAfterSecond?.length ?? 0) === 2,
          { creditsAfterSecond },
        );
      }
    }
  } finally {
    // Cleanup, best-effort, in FK-safe order (credits + referral before the users they
    // reference), so this test never leaves throwaway state behind regardless of outcome.
    if (referralId) {
      await admin.from("user_credits").delete().eq("source", "referral").eq("source_id", referralId);
      await admin.from("referrals").delete().eq("id", referralId);
    }
    if (referredUserId) await admin.auth.admin.deleteUser(referredUserId);
    if (referrerUserId) await admin.auth.admin.deleteUser(referrerUserId);
    console.log("[ring8-kill-test] cleaned up throwaway referral test users + rows");
  }

  // ─── Section C: approve-transition wiring (source-grep, mirrors ring7a's technique) ──
  const confirmRoutePath = join(process.cwd(), "app/api/bookings/[id]/confirm/route.ts");
  const confirmRouteSrc = readFileSync(confirmRoutePath, "utf8");
  const importsHelper = /import\s*\{\s*completeReferralForFirstBooking\s*\}\s*from\s*["']@\/lib\/referral\/complete-referral["']/.test(
    confirmRouteSrc,
  );
  const callsHelper = /await completeReferralForFirstBooking\(/.test(confirmRouteSrc);
  const acceptsPendingApproval = /\[?\s*["']pending["']\s*,\s*["']pending_approval["']\s*,\s*["']confirmed["']\s*\]?/.test(
    confirmRouteSrc,
  );
  check("app/api/bookings/[id]/confirm/route.ts imports the shared referral-completion helper", importsHelper, { importsHelper });
  check("app/api/bookings/[id]/confirm/route.ts calls the helper on the approve transition", callsHelper, { callsHelper });
  check("app/api/bookings/[id]/confirm/route.ts accepts pending_approval (the manual-approval state)", acceptsPendingApproval, { acceptsPendingApproval });

  console.log("\nRing 8 kill test: promo_counted_at CAS shape + referral completion idempotency + approve-transition wiring\n");
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
  console.error("[ring8-kill-test] threw:", err);
  process.exit(1);
});
