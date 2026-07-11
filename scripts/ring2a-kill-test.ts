// Ring 2a kill test: lib/feature-flags.ts TTL caching + the combined
// maintenance_mode + flag read (2 round-trips -> 1), and the checkUserBanned
// 10s TTL cache.
//
// The sandboxed shell cannot open outbound loopback connections (curl to
// localhost:3000 fails with "Operation not permitted"), so this exercises the
// REAL checkFeatureEnabled / checkUserBanned exports directly (no HTTP layer,
// no reimplementation) against the LIVE DB, using the same
// createAdminSupabaseClient the routes use.
//
// Scenario (a) never flips a real, feature-gating flag: it INSERTs a
// temporary "ring2a_test_flag" row, flips + deletes only that row.
// Scenario (b) uses a random (non-existent) uuid, never a real user.
// Scenario (c) times the old 2-sequential-query shape vs the new combined
// 1-query shape directly against feature_flags (read-only).
//
// Usage: npx tsx scripts/ring2a-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const TEST_FLAG_KEY = "ring2a_test_flag";

async function main() {
  const {
    checkFeatureEnabled,
    checkUserBanned,
    __getFlagDbQueryCountForTest,
    __resetFeatureFlagCacheForTest,
    __getBanDbQueryCountForTest,
    __resetBanCacheForTest,
  } = await import("@/lib/feature-flags");
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // ─── Scenario A: flag TTL caching + combined maintenance+flag read ──────
  try {
    __resetFeatureFlagCacheForTest();

    await admin.from("feature_flags").delete().eq("key", TEST_FLAG_KEY); // pre-clean, in case a prior run died mid-test
    const { error: insertError } = await admin
      .from("feature_flags")
      .insert({ key: TEST_FLAG_KEY, enabled: true, description: "ring2a kill test temp flag, deleted at end of run" });

    // Step 1: cold call -> flag enabled=true in DB -> checkFeatureEnabled proceeds (null), 1 DB query.
    const res1 = await checkFeatureEnabled(TEST_FLAG_KEY as any);
    const count1 = __getFlagDbQueryCountForTest();
    const pass1 = insertError == null && res1 === null && count1 === 1;
    rows.push({
      scenario: "A1: cold read of a real feature_flags row (enabled=true) proceeds + costs 1 DB query",
      pass: pass1,
      details: { insertError, res1, count1 },
    });
    if (!pass1) allPass = false;

    // Step 2: warm call within TTL -> still proceeds, 0 NEW DB queries (count unchanged).
    const res2 = await checkFeatureEnabled(TEST_FLAG_KEY as any);
    const count2 = __getFlagDbQueryCountForTest();
    const pass2 = res2 === null && count2 === count1;
    rows.push({
      scenario: "A2: second call within TTL is a cache hit, issues NO db query",
      pass: pass2,
      details: { res2, count1, count2 },
    });
    if (!pass2) allPass = false;

    // Step 3: flip the value in the DB (the temp test row only), call again
    // within the same TTL window -> the STALE cached value must still be
    // served (no new query), proving the cache genuinely honors its TTL
    // rather than re-checking the DB on every call.
    const { error: updateError } = await admin
      .from("feature_flags")
      .update({ enabled: false })
      .eq("key", TEST_FLAG_KEY);
    const res3 = await checkFeatureEnabled(TEST_FLAG_KEY as any);
    const count3 = __getFlagDbQueryCountForTest();
    const pass3 = updateError == null && res3 === null && count3 === count1;
    rows.push({
      scenario: "A3: DB flip mid-TTL does not affect the cached result yet (TTL respected), still NO new query",
      pass: pass3,
      details: { updateError, res3, count1, count3 },
    });
    if (!pass3) allPass = false;

    // Step 4: simulate TTL expiry (via the test-only cache reset, not a real
    // sleep) -> next call re-reads the DB, sees enabled=false, and blocks.
    __resetFeatureFlagCacheForTest();
    const res4 = await checkFeatureEnabled(TEST_FLAG_KEY as any);
    const body4 = res4 ? await res4.json() : null;
    const count4 = __getFlagDbQueryCountForTest();
    const pass4 = res4 !== null && res4.status === 503 && body4?.code === "FEATURE_DISABLED" && count4 === 1;
    rows.push({
      scenario: "A4: after TTL expiry (simulated), fresh read reflects the DB flip (503 FEATURE_DISABLED), 1 new query",
      pass: pass4,
      details: { status: res4?.status, body4, count4 },
    });
    if (!pass4) allPass = false;
  } finally {
    // Always clean up the temp row so it never gates a real feature.
    await admin.from("feature_flags").delete().eq("key", TEST_FLAG_KEY);
    __resetFeatureFlagCacheForTest();
  }

  // ─── Scenario B: checkUserBanned 10s TTL cache, non-existent user ───────
  {
    __resetBanCacheForTest();
    const fakeUserId = crypto.randomUUID();

    const res1 = await checkUserBanned(fakeUserId);
    const count1 = __getBanDbQueryCountForTest();
    const pass1 = res1 === null && count1 === 1;
    rows.push({
      scenario: "B1: cold ban check on a non-existent uuid returns not-banned (null), 1 DB query",
      pass: pass1,
      details: { res1, count1 },
    });
    if (!pass1) allPass = false;

    const res2 = await checkUserBanned(fakeUserId);
    const count2 = __getBanDbQueryCountForTest();
    const pass2 = res2 === null && count2 === count1;
    rows.push({
      scenario: "B2: second call within TTL is stable (still null) and a cache hit, NO new query",
      pass: pass2,
      details: { res2, count1, count2 },
    });
    if (!pass2) allPass = false;

    __resetBanCacheForTest();
  }

  // ─── Scenario C: timing, old (2 sequential .single()) vs new (1 .in()) ──
  {
    const ITERATIONS = 20;

    let oldTotalMs = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = Date.now();
      await admin.from("feature_flags").select("enabled").eq("key", "maintenance_mode").single();
      await admin.from("feature_flags").select("enabled").eq("key", "bookings").single();
      oldTotalMs += Date.now() - t0;
    }
    const oldAvgMs = oldTotalMs / ITERATIONS;

    let newTotalMs = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = Date.now();
      await admin.from("feature_flags").select("key, enabled").in("key", ["maintenance_mode", "bookings"]);
      newTotalMs += Date.now() - t0;
    }
    const newAvgMs = newTotalMs / ITERATIONS;

    const deltaMs = oldAvgMs - newAvgMs;
    const deltaPct = oldAvgMs > 0 ? (deltaMs / oldAvgMs) * 100 : 0;

    rows.push({
      scenario: `C: timed ${ITERATIONS}x, OLD shape (2 sequential .single() queries) vs NEW shape (1 combined .in() query)`,
      pass: true, // measurement only, not a discriminating assertion
      details: {
        oldAvgMs: Number(oldAvgMs.toFixed(2)),
        newAvgMs: Number(newAvgMs.toFixed(2)),
        deltaMs: Number(deltaMs.toFixed(2)),
        deltaPct: Number(deltaPct.toFixed(1)),
      },
    });
  }

  console.log("Ring 2a kill test: lib/feature-flags.ts caching + app/api/dashboard/today parallelization\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring2a-kill-test] threw:", err);
  process.exit(1);
});
