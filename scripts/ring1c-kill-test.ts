// Ring 1c kill test: central error reporting (lib/error-report.ts reportError)
// + the /api/health dependency probes (lib/health.ts).
//
// The sandboxed shell cannot open outbound loopback connections (curl to
// localhost:3000 fails with "Operation not permitted", see scripts/ring1b-kill-test.ts's
// header note), so this exercises the REAL exports directly, function-level, no HTTP
// layer, no reimplementation of the logic under test.
//
// reportError throttling is proven WITHOUT sending real emails: reportError's 4th
// param is a test-only alertFn injection seam (default = the real alertAdmin), so
// this test passes a counter function instead of monkey-patching the alert-admin
// module (unsafe under Node ESM's read-only module namespace bindings).
//
// The DB probe failure path uses a REAL @supabase/ssr client pointed at an invalid
// host (never localhost), so the network call genuinely fails or times out, no
// mock of probeDb's internals.
//
// Usage: npx tsx scripts/ring1c-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { reportError } = await import("@/lib/error-report");
  const { probeDb, probeRedis, probeEnv, runHealthProbes } = await import("@/lib/health");
  const { createServerClient } = await import("@supabase/ssr");

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // --- Scenario 1: same-scope calls throttle to one alert attempt -------------
  {
    let alertCalls = 0;
    const lastSubjects: string[] = [];
    const counterAlertFn = async (subject: string) => {
      alertCalls++;
      lastSubjects.push(subject);
    };

    await reportError("kill-test-ring1c-scope-a", new Error("boom1"), undefined, counterAlertFn);
    const afterFirst = alertCalls;
    await reportError("kill-test-ring1c-scope-a", new Error("boom2"), undefined, counterAlertFn);
    const afterSecondSameScope = alertCalls;

    const pass = afterFirst === 1 && afterSecondSameScope === 1;
    if (!pass) allPass = false;
    rows.push({
      scenario: "reportError: 2 calls same scope = 1 alert attempt (throttled)",
      pass,
      details: { afterFirst, afterSecondSameScope, subjects: lastSubjects },
    });
  }

  // --- Scenario 2: a DIFFERENT scope is NOT throttled by scope-a's window -----
  {
    let alertCalls = 0;
    const counterAlertFn = async () => {
      alertCalls++;
    };
    await reportError("kill-test-ring1c-scope-b", new Error("boom3"), undefined, counterAlertFn);
    const pass = alertCalls === 1;
    if (!pass) allPass = false;
    rows.push({
      scenario: "reportError: new scope (scope-b) alerts immediately, isolated from scope-a's throttle",
      pass,
      details: { alertCalls },
    });
  }

  // --- Scenario 3: reportError never throws, even if the alertFn itself throws --
  {
    const throwingAlertFn = async () => {
      throw new Error("kill-test: alertFn itself failed");
    };
    let threw = false;
    try {
      await reportError("kill-test-ring1c-scope-c", new Error("boom4"), undefined, throwingAlertFn);
    } catch {
      threw = true;
    }
    const pass = threw === false;
    if (!pass) allPass = false;
    rows.push({ scenario: "reportError: never throws even when alertFn throws", pass, details: { threw } });
  }

  // --- Scenario 4: db probe against a broken (invalid-host) Supabase client -> fail --
  {
    const brokenAdmin = createServerClient(
      "https://kill-test-invalid-host-does-not-exist.example",
      "kill-test-fake-service-role-key-00000000",
      {
        cookies: { getAll: () => [], setAll: () => {} },
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
    const result = await probeDb(brokenAdmin as any);
    const pass = result.status === "fail";
    if (!pass) allPass = false;
    rows.push({ scenario: "probeDb: broken Supabase URL -> status 'fail'", pass, details: { result } });
  }

  // --- Scenario 5: runHealthProbes with the same broken client -> ok:false (would 503) --
  {
    const brokenAdmin = createServerClient(
      "https://kill-test-invalid-host-does-not-exist.example",
      "kill-test-fake-service-role-key-00000000",
      {
        cookies: { getAll: () => [], setAll: () => {} },
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
    const report = await runHealthProbes(brokenAdmin as any);
    const pass = report.ok === false && report.deps.db.status === "fail";
    if (!pass) allPass = false;
    rows.push({
      scenario: "runHealthProbes: broken DB -> ok:false (route would return 503)",
      pass,
      details: { ok: report.ok, deps: report.deps },
    });
  }

  // --- Scenario 6: probeRedis reports 'unconfigured' (not 'fail') with Upstash unset --
  {
    const result = await probeRedis();
    // This dev process has no UPSTASH_REDIS_REST_URL/TOKEN set (confirmed against
    // .env.local before writing this test), so the real contract under test is
    // "unset env -> 'unconfigured'", not a mocked client.
    const pass = result.status === "unconfigured" || result.status === "ok";
    if (!pass) allPass = false;
    rows.push({ scenario: "probeRedis: reports 'unconfigured' or 'ok', never 'fail' on missing/valid config", pass, details: { result } });
  }

  // --- Scenario 7: probeEnv is 'ok' outside a real production boot ------------
  {
    const result = probeEnv();
    // CONTEXT/NODE_ENV are not both 'production' in this dev/test process, so
    // probeEnv must not report a hard failure regardless of which PROD_REQUIRED_VARS
    // are actually set locally.
    const pass = result.status === "ok";
    if (!pass) allPass = false;
    rows.push({ scenario: "probeEnv: 'ok' when not a real production boot", pass, details: { result, CONTEXT: process.env.CONTEXT, NODE_ENV: process.env.NODE_ENV } });
  }

  console.log("Ring 1c kill test: lib/error-report.ts reportError + lib/health.ts probes\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring1c-kill-test] threw:", err);
  process.exit(1);
});
