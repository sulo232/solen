// Ring 1b kill test: cron failure alerting (lib/cron-run.ts withCronRun).
//
// The sandboxed shell cannot open outbound loopback connections (curl to
// localhost:3000 fails with "Operation not permitted"), so this exercises the
// REAL withCronRun export directly (no HTTP layer, no reimplementation) against
// the LIVE cron_runs table, using the same createAdminSupabaseClient the routes
// use. Two scenarios: a handler that succeeds (ok:true, 200) and a handler that
// throws (ok:false, 500), each asserted against the row withCronRun itself wrote
// to cron_runs. Test rows are deleted afterward so cron_runs / the digest cron
// never see fake failures.
//
// Usage: npx tsx scripts/ring1b-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { withCronRun } = await import("@/lib/cron-run");
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  const successName = "kill-test-ring1b-success";
  const failureName = "kill-test-ring1b-failure";

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // --- Scenario 1: handler succeeds -----------------------------------
  {
    const res = await withCronRun(successName, async () => ({ processed: 3, sent: 3 }));
    const body = await res.json();
    const { data: dbRow } = await admin
      .from("cron_runs")
      .select("name, ok, processed, errors")
      .eq("name", successName)
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const pass =
      res.status === 200 &&
      body.ok === true &&
      body.processed === 3 &&
      body.sent === 3 &&
      dbRow?.ok === true &&
      dbRow?.processed === 3;

    if (!pass) allPass = false;
    rows.push({ scenario: "handler succeeds", pass, details: { status: res.status, body, dbRow } });
  }

  // --- Scenario 2: handler throws ---------------------------------------
  {
    const res = await withCronRun(failureName, async () => {
      throw new Error("kill-test forced failure");
    });
    const body = await res.json();
    const { data: dbRow } = await admin
      .from("cron_runs")
      .select("name, ok, processed, errors")
      .eq("name", failureName)
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const pass =
      res.status === 500 &&
      body.ok === false &&
      Array.isArray(body.errors) &&
      body.errors.some((e: string) => e.includes("kill-test forced failure")) &&
      dbRow?.ok === false &&
      Array.isArray(dbRow?.errors);

    if (!pass) allPass = false;
    rows.push({ scenario: "handler throws", pass, details: { status: res.status, body, dbRow } });
  }

  // Clean up the fake rows so cron_runs / the digest never see them.
  await admin.from("cron_runs").delete().in("name", [successName, failureName]);

  console.log("Ring 1b kill test: lib/cron-run.ts withCronRun\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring1b-kill-test] threw:", err);
  process.exit(1);
});
