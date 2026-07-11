// Ring 6 backend loop kill test: the nightly DB backup export
// (lib/backup/export.ts, wired into app/api/cron/db-backup/route.ts).
//
// Runs the REAL export function against the LIVE DB, writing to a throwaway
// `backups-test/<ts>/` prefix (never touches the real `backups/` prefix the
// nightly cron writes), asserts >= 20 tables exported with row counts
// matching the live table counts for 3 spot tables, then deletes the whole
// test prefix and re-lists it to prove 0 leftovers.
//
// NOTE: the `db-backups` storage bucket is created by
// supabase/migrations/20260711161553_backend_loop_db_backups_bucket.sql,
// applied live by the orchestrator (this build round does not apply
// migrations itself). If the bucket does not exist yet when this runs, that
// is NOT a code bug: this script stops and reports "BUCKET-PENDING" with
// every other check it could still run, instead of faking a pass.
//
// Usage: npx tsx scripts/db-backup-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  // retention (pruneOldBackups) is exercised by the route, not this kill test:
  // it never mutates the real backups/ prefix here.
  const { runDbBackupExport, BACKUP_BUCKET, BACKUP_TABLES } = await import("@/lib/backup/export");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];
  function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
    rows.push({ scenario, pass, details });
    if (!pass) allPass = false;
  }

  function report(exitCode: number) {
    console.log("\nRing 6 kill test: nightly DB backup export (lib/backup/export.ts)\n");
    for (const row of rows) {
      console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
      console.log(`       ${JSON.stringify(row.details)}`);
    }
    console.log("");
    console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
    console.log(exitCode === 0 ? "All scenarios passed." : exitCode === 2 ? "BUCKET-PENDING." : "One or more scenarios FAILED.");
    process.exit(exitCode);
  }

  // ─── Section A: bucket-exists gate ────────────────────────────────────────────
  const { error: bucketErr } = await admin.storage.getBucket(BACKUP_BUCKET);
  if (bucketErr) {
    check(`storage bucket "${BACKUP_BUCKET}" exists (created by the migration; orchestrator applies it)`, false, {
      error: bucketErr.message,
    });
    console.log("\nBUCKET-PENDING: the db-backups bucket migration has not been applied yet.");
    console.log("Everything else in this build round is done; re-run this script once the migration is live.\n");
    report(2);
    return;
  }
  check(`storage bucket "${BACKUP_BUCKET}" exists`, true, {});

  // ─── Section B: run the REAL export against a throwaway prefix ───────────────
  const testPrefix = `backups-test/${Date.now()}`;
  const result = await runDbBackupExport(testPrefix);

  check(
    `export reports zero table-level errors (${result.errors.length} errors)`,
    result.errors.length === 0,
    { errors: result.errors },
  );
  check(
    `>= 20 tables exported (BACKUP_TABLES has ${BACKUP_TABLES.length})`,
    result.tables.length >= 20,
    { exported: result.tables.length, tableNames: result.tables.map((t) => t.table) },
  );

  // ─── Section C: 3 spot-check tables, exported row count must match a live count ──
  const SPOT_TABLES = ["salons", "bookings", "cities"] as const;
  for (const table of SPOT_TABLES) {
    const exported = result.tables.find((t) => t.table === table);
    const { count: liveCount, error: countErr } = await admin
      .from(table)
      .select("*", { count: "exact", head: true });
    if (countErr) {
      check(`spot check "${table}": live count query succeeds`, false, { error: countErr.message });
      continue;
    }
    check(
      `spot check "${table}": exported row count (${exported?.rows ?? "MISSING"}) matches live count (${liveCount})`,
      exported !== undefined && exported.rows === liveCount,
      { exportedRows: exported?.rows, liveCount },
    );
  }

  // Every exported table's upload must have actually written non-trivial bytes
  // for the tables that have live rows (a 0-byte "[]" is valid for an empty
  // table, but a table with rows > 0 must produce bytes > 2, i.e. more than "[]").
  const bytesLookCorrect = result.tables.every((t) => (t.rows === 0 ? t.bytes >= 2 : t.bytes > 2));
  check("every exported table with rows > 0 produced bytes > 2 (not an empty/truncated upload)", bytesLookCorrect, {
    tables: result.tables.map((t) => ({ table: t.table, rows: t.rows, bytes: t.bytes })),
  });

  // ─── Section D: clean up the test prefix, prove 0 leftovers ──────────────────
  const { data: filesBeforeCleanup, error: listErr } = await admin.storage.from(BACKUP_BUCKET).list(testPrefix, {
    limit: 1000,
  });
  if (listErr) {
    check(`list "${testPrefix}" before cleanup`, false, { error: listErr.message });
  } else {
    const paths = (filesBeforeCleanup ?? []).filter((f) => f.id !== null).map((f) => `${testPrefix}/${f.name}`);
    check(`test prefix has files to clean up (${paths.length} files)`, paths.length > 0, { paths });

    if (paths.length > 0) {
      const { error: removeErr } = await admin.storage.from(BACKUP_BUCKET).remove(paths);
      check("remove() the test prefix's files succeeds", !removeErr, { error: removeErr?.message });
    }

    const { data: filesAfterCleanup, error: reListErr } = await admin.storage.from(BACKUP_BUCKET).list(testPrefix, {
      limit: 1000,
    });
    const leftoverCount = reListErr ? -1 : (filesAfterCleanup ?? []).filter((f) => f.id !== null).length;
    check("re-list after cleanup proves 0 leftover files in the test prefix", leftoverCount === 0, {
      leftoverCount,
      reListError: reListErr?.message,
    });
  }

  report(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[db-backup-kill-test] threw:", err);
  process.exit(1);
});
