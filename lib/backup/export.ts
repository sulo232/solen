// lib/backup/export.ts (Ring 6 backend loop: nightly DB backup safety net).
//
// exists-check: net-new, `npm run exists db-backup` / `db-backups` returned 0
// matches. VERIFIED 2026-07-11: the Supabase project has pitr_enabled=false and
// an EMPTY platform backups list, so this export is currently the ONLY
// restorable backup for this project (see _plans/OPS_RUNBOOK.md Backups section).
//
// Core export logic lives here (not inline in the route) so
// scripts/db-backup-kill-test.ts can call it directly against a throwaway
// prefix without going through an HTTP request.
//
// CONTRACT: a single table's SELECT or upload failure is recorded in
// errors[] and never aborts the loop, so one bad table never blocks the
// other 23 from being backed up. Callers decide what "success" means from
// the returned errors[] (see app/api/cron/db-backup/route.ts, which gates
// retention on a fully clean run).
import { createAdminSupabaseClient } from "@/lib/supabase";

export const BACKUP_BUCKET = "db-backups";
export const BACKUP_BASE_PREFIX = "backups";
export const RETENTION_DAYS = 14;

// Business-critical tables, exported nightly as one JSON array per table.
// NOT availability_slots (regenerable via /api/cron/generate-slots) and NOT
// discovery_items (media-heavy + regenerable from its own source feeds).
export const BACKUP_TABLES = [
  "salons",
  "profiles",
  "bookings",
  "services",
  "staff_members",
  "staff_services",
  "staff_schedules",
  "reviews",
  "review_replies",
  "salon_payouts",
  "promo_codes",
  "referrals",
  "user_credits",
  "credit_redemptions",
  "vouchers",
  "voucher_purchases",
  "gift_cards",
  "loyalty_cards",
  "loyalty_stamps",
  "loyalty_status",
  "salon_clients",
  "feature_flags",
  "cities",
  "service_categories",
] as const;

const PAGE_SIZE = 1000;

export interface TableBackupResult {
  table: string;
  rows: number;
  bytes: number;
}

export interface BackupExportResult {
  prefix: string;
  tables: TableBackupResult[];
  errors: string[];
  totalRows: number;
  totalBytes: number;
}

/**
 * Export every table in BACKUP_TABLES to `<BACKUP_BUCKET>/<prefix>/<table>.json`,
 * paged in PAGE_SIZE-row chunks via .range() and streamed into one JSON array
 * per table (the biggest table, bookings, is ~1k rows, so a handful of pages
 * at most). Each upload uses upsert:true so a re-run for the same prefix is
 * idempotent.
 */
export async function runDbBackupExport(prefix: string): Promise<BackupExportResult> {
  const admin = createAdminSupabaseClient();
  const tables: TableBackupResult[] = [];
  const errors: string[] = [];

  for (const table of BACKUP_TABLES) {
    try {
      const rows: Record<string, unknown>[] = [];
      let from = 0;
      for (;;) {
        const { data, error } = await admin
          .from(table)
          .select("*")
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        rows.push(...(data as Record<string, unknown>[]));
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      const json = JSON.stringify(rows);
      const path = `${prefix}/${table}.json`;
      const { error: uploadErr } = await admin.storage
        .from(BACKUP_BUCKET)
        .upload(path, json, { upsert: true, contentType: "application/json" });
      if (uploadErr) throw uploadErr;

      tables.push({ table, rows: rows.length, bytes: Buffer.byteLength(json, "utf8") });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${table}: ${message}`);
      console.error(`[lib/backup/export] table "${table}" backup failed:`, err);
    }
  }

  const totalRows = tables.reduce((sum, t) => sum + t.rows, 0);
  const totalBytes = tables.reduce((sum, t) => sum + t.bytes, 0);

  return { prefix, tables, errors, totalRows, totalBytes };
}

export interface RetentionResult {
  deletedPrefixes: string[];
  errors: string[];
}

/**
 * List `<basePrefix>/` date-folders and delete every folder older than
 * RETENTION_DAYS. Supabase Storage simulates folders as list() entries with
 * id === null; only names matching YYYY-MM-DD (the format backupPrefixForDate
 * writes) are considered, anything else is left alone (defensive against a
 * stray manual upload under the same bucket).
 */
export async function pruneOldBackups(basePrefix: string = BACKUP_BASE_PREFIX): Promise<RetentionResult> {
  const admin = createAdminSupabaseClient();
  const deletedPrefixes: string[] = [];
  const errors: string[] = [];

  const { data: entries, error: listErr } = await admin.storage
    .from(BACKUP_BUCKET)
    .list(basePrefix, { limit: 1000 });
  if (listErr) {
    errors.push(`list ${basePrefix}: ${listErr.message}`);
    return { deletedPrefixes, errors };
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);

  for (const entry of entries ?? []) {
    if (entry.id !== null) continue; // only folder entries
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.name)) continue;
    const folderDate = new Date(`${entry.name}T00:00:00Z`);
    if (Number.isNaN(folderDate.getTime()) || folderDate >= cutoff) continue;

    const folderPrefix = `${basePrefix}/${entry.name}`;
    const { data: files, error: filesErr } = await admin.storage
      .from(BACKUP_BUCKET)
      .list(folderPrefix, { limit: 1000 });
    if (filesErr) {
      errors.push(`list ${folderPrefix}: ${filesErr.message}`);
      continue;
    }
    const paths = (files ?? []).filter((f) => f.id !== null).map((f) => `${folderPrefix}/${f.name}`);
    if (paths.length === 0) continue;

    const { error: removeErr } = await admin.storage.from(BACKUP_BUCKET).remove(paths);
    if (removeErr) {
      errors.push(`remove ${folderPrefix}: ${removeErr.message}`);
      continue;
    }
    deletedPrefixes.push(folderPrefix);
  }

  return { deletedPrefixes, errors };
}

/** `backups/<YYYY-MM-DD>` for the given date (UTC), defaults to now. */
export function backupPrefixForDate(date: Date = new Date()): string {
  return `${BACKUP_BASE_PREFIX}/${date.toISOString().slice(0, 10)}`;
}
