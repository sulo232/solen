// Kill test: lib/cron-heartbeat.ts findOverdueCrons (A11-cron-heartbeat, 2026-07-27).
//
// Pure-function test, no Supabase read or write: findOverdueCrons takes a
// { name -> last ran_at ISO string } map and "now" as plain arguments, so the
// discriminate check can run against fabricated inputs instead of the live
// cron_runs table. Three scenarios:
//   1. Every expected cron present and fresh -> stays quiet (0 overdue).
//   2. One name absent from the map entirely (the "never ran" case this item
//      exists for) -> reported overdue, everything else stays quiet.
//   3. One name present but its last run is older than 2x its own interval
//      (the "used to run, then died" case) -> also reported overdue.
//
// Usage: npx tsx scripts/cron-heartbeat-kill-test.ts
import { EXPECTED_CRON_INTERVALS_MS, findOverdueCrons } from "@/lib/cron-heartbeat";

function main() {
  const names = Object.keys(EXPECTED_CRON_INTERVALS_MS);
  const now = Date.parse("2026-07-27T12:00:00.000Z");
  const probeName = "auto-complete"; // 15-min cron, easiest to reason about
  const probeIntervalMs = EXPECTED_CRON_INTERVALS_MS[probeName];

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // --- Scenario 1: all names present and fresh (1 minute ago) -----------
  {
    const fresh = new Date(now - 60_000).toISOString();
    const lastRanAtByName: Record<string, string> = {};
    for (const name of names) lastRanAtByName[name] = fresh;

    const overdue = findOverdueCrons(lastRanAtByName, now);
    const pass = overdue.length === 0;
    if (!pass) allPass = false;
    rows.push({ scenario: "all crons present + fresh -> quiet", pass, details: { overdue } });
  }

  // --- Scenario 2: probeName never ran (absent from the map entirely) ---
  {
    const fresh = new Date(now - 60_000).toISOString();
    const lastRanAtByName: Record<string, string> = {};
    for (const name of names) {
      if (name === probeName) continue; // deliberately absent
      lastRanAtByName[name] = fresh;
    }

    const overdue = findOverdueCrons(lastRanAtByName, now);
    const pass = overdue.length === 1 && overdue[0] === probeName;
    if (!pass) allPass = false;
    rows.push({
      scenario: `"${probeName}" absent from cron_runs entirely -> reported missing, nothing else flagged`,
      pass,
      details: { overdue },
    });
  }

  // --- Scenario 3: probeName ran once, then went stale (> 2x its interval) ---
  {
    const fresh = new Date(now - 60_000).toISOString();
    const stale = new Date(now - probeIntervalMs * 2 - 60_000).toISOString(); // just past the 2x threshold
    const lastRanAtByName: Record<string, string> = {};
    for (const name of names) lastRanAtByName[name] = fresh;
    lastRanAtByName[probeName] = stale;

    const overdue = findOverdueCrons(lastRanAtByName, now);
    const pass = overdue.length === 1 && overdue[0] === probeName;
    if (!pass) allPass = false;
    rows.push({
      scenario: `"${probeName}" last ran > 2x its own interval ago -> reported stale, nothing else flagged`,
      pass,
      details: { overdue, probeIntervalMs, staleAgeMs: now - Date.parse(stale) },
    });
  }

  // --- Scenario 4: probeName ran within 2x its interval (should NOT flag) ---
  {
    const fresh = new Date(now - 60_000).toISOString();
    const justInTime = new Date(now - probeIntervalMs * 2 + 60_000).toISOString(); // just inside the 2x threshold
    const lastRanAtByName: Record<string, string> = {};
    for (const name of names) lastRanAtByName[name] = fresh;
    lastRanAtByName[probeName] = justInTime;

    const overdue = findOverdueCrons(lastRanAtByName, now);
    const pass = overdue.length === 0;
    if (!pass) allPass = false;
    rows.push({
      scenario: `"${probeName}" last ran just inside 2x its interval -> stays quiet`,
      pass,
      details: { overdue },
    });
  }

  console.log("Cron heartbeat kill test: lib/cron-heartbeat.ts findOverdueCrons\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main();
