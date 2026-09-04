// exists-check: net-new, `npm run exists db-backup` returned 0 matches.
//
// Ring 6 backend loop: nightly DB backup safety net. VERIFIED 2026-07-11: the
// Supabase project has pitr_enabled=false and an EMPTY platform backups list,
// so this cron is currently the ONLY restorable backup for this project (see
// _plans/OPS_RUNBOOK.md Backups section for the restore procedure).
//
// Exports every table in lib/backup/export.ts's BACKUP_TABLES to the private
// `db-backups` storage bucket as `backups/<YYYY-MM-DD>/<table>.json`, then
// (only if the export was fully clean) deletes date-folders older than 14
// days. Scheduled daily 03:45 UTC in .github/workflows/cron-jobs.yml.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";
import { BACKUP_TABLES, backupPrefixForDate, pruneOldBackups, runDbBackupExport } from "@/lib/backup/export";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const adminAuth = request.headers.get("Authorization");
  // Same convention as every other cron route: CRON_SECRET bearer, sent by
  // .github/workflows/cron-jobs.yml's ping-cron action.
  if (!(await verifyCronSecret(adminAuth, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("db-backup", async () => {
    const prefix = backupPrefixForDate();
    const exportResult = await runDbBackupExport(prefix);

    // Retention only runs after a fully clean export, so a partially-failed
    // night never deletes an older, complete backup out from under us.
    const retention =
      exportResult.errors.length === 0
        ? await pruneOldBackups()
        : { deletedPrefixes: [] as string[], errors: [] as string[] };

    const errors = [...exportResult.errors, ...retention.errors];

    return {
      message: `Backed up ${exportResult.tables.length}/${BACKUP_TABLES.length} tables to ${prefix}`,
      prefix,
      tables: exportResult.tables,
      totalRows: exportResult.totalRows,
      totalBytes: exportResult.totalBytes,
      retentionDeleted: retention.deletedPrefixes,
      processed: exportResult.totalRows,
      ...(errors.length ? { errors } : {}),
    };
  });
}
