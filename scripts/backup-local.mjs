#!/usr/bin/env node
/**
 * backup-local , run the nightly database backup from THIS MACHINE. No deploy, no GitHub.
 *
 * Owner 2026-07-28: "github turn it on but i dont want to deploy".
 *
 * WHY THIS EXISTS AND THE GITHUB ROUTE DOES NOT WORK, measured rather than assumed:
 *   1. GitHub's registered workflow is `disabled_inactivity`. Re-enabling it is a one-command,
 *      no-deploy action , BUT the remote copy of cron-jobs.yml has NO db-backup job. Its 18
 *      jobs are reminders, SMS, pre-charge, no-show, release-payments and friends. Enabling it
 *      would start firing those against seed data on a pre-launch product, and it still would
 *      not back anything up.
 *   2. `curl https://solen.ch/api/cron/db-backup` returns 200 with content-type text/html ,
 *      the Next catch-all page, not the route. Compare /api/health, which returns
 *      application/json. So the backup ROUTE is not on the deployed build either.
 * Getting the scheduled job onto GitHub therefore needs the workflow file on the default
 * branch, and getting the route to answer needs a build. Both are deploys.
 *
 * This script skips all of it: it talks straight to Supabase with the service-role key from
 * .env.local, exactly like the deployed route would, and writes the same JSON-per-table shape
 * to the same `db-backups` bucket. Same table list, same retention, same layout , so when the
 * deployed job does eventually run, it picks up where this left off instead of forking.
 *
 *   node scripts/backup-local.mjs              write today's folder + prune old ones
 *   node scripts/backup-local.mjs --dry-run    count rows, write nothing
 *   node scripts/backup-local.mjs --local-copy also write a copy under ~/solen/backups/
 *
 * To run it nightly on this Mac without any server:
 *   bash scripts/install-local-backup.sh       (installs a launchd job at 03:45)
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Kept in sync BY HAND with lib/backup/export.ts (BACKUP_TABLES / BACKUP_BUCKET /
// RETENTION_DAYS). A node script cannot resolve the app's TS path aliases without a build
// step, and adding one for a backup script would defeat the point of not needing a build.
const BACKUP_TABLES = [
  "salons", "profiles", "bookings", "services", "staff_members", "staff_services",
  "staff_schedules", "reviews", "review_replies", "salon_payouts", "promo_codes",
  "referrals", "user_credits", "credit_redemptions", "vouchers", "voucher_purchases",
  "gift_cards", "loyalty_cards", "loyalty_stamps", "loyalty_status", "salon_clients",
  "feature_flags", "cities", "service_categories",
];
const BUCKET = "db-backups";
const RETENTION_DAYS = 14;
const PAGE_SIZE = 1000;

const DRY = process.argv.includes("--dry-run");
const LOCAL_COPY = process.argv.includes("--local-copy");

function loadEnv() {
  for (const p of [".env.local", "/Users/sulo/Documents/solen/.env.local"]) {
    if (!fs.existsSync(p)) continue;
    const out = {};
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const i = line.indexOf("=");
      if (i < 1 || line.trim().startsWith("#")) continue;
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
    return out;
  }
  throw new Error("no .env.local found , run this from the repo root");
}

const env = loadEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Paged so a table larger than PostgREST's default limit is not silently truncated. */
async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db.from(table).select("*").range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

const today = new Date().toISOString().slice(0, 10);
const folder = `backups/${today}`;
let totalRows = 0, written = 0, failed = [];

console.log(`${DRY ? "DRY RUN" : "BACKUP"}  ${today}  ->  ${BUCKET}/${folder}`);

for (const table of BACKUP_TABLES) {
  try {
    const rows = await fetchAll(table);
    totalRows += rows.length;
    const body = JSON.stringify(rows);
    console.log(`  ${String(rows.length).padStart(6)}  ${table}`);
    if (DRY) continue;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(`${folder}/${table}.json`, new Blob([body], { type: "application/json" }), {
        contentType: "application/json",
        upsert: true,
      });
    if (error) throw new Error(error.message);
    written++;

    if (LOCAL_COPY) {
      const dir = path.join(os.homedir(), "solen", "backups", today);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${table}.json`), body);
    }
  } catch (e) {
    failed.push(`${table}: ${String(e.message ?? e).slice(0, 110)}`);
    console.error(`  FAIL    ${table}: ${String(e.message ?? e).slice(0, 110)}`);
  }
}

// PRUNE ONLY AFTER A FULLY CLEAN RUN. If any table failed, today's folder is incomplete, and
// deleting an older COMPLETE folder to make room for an incomplete one is how a backup system
// ends up with nothing. This is not hypothetical: the one folder that existed on 2026-07-11
// was two days past this cutoff, so the first successful run would have deleted the only
// backup the project had.
if (!DRY && failed.length === 0) {
  const { data: folders } = await db.storage.from(BUCKET).list("backups", { limit: 200 });
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  const stale = (folders ?? []).filter((f) => f.name < cutoff.toISOString().slice(0, 10));
  for (const f of stale) {
    const { data: files } = await db.storage.from(BUCKET).list(`backups/${f.name}`, { limit: 200 });
    const paths = (files ?? []).map((x) => `backups/${f.name}/${x.name}`);
    if (paths.length) await db.storage.from(BUCKET).remove(paths);
    console.log(`  pruned ${f.name} (${paths.length} files)`);
  }
} else if (failed.length) {
  console.log("  prune SKIPPED , this run was incomplete, so no old backup is deleted");
}

console.log(`\ntables ${written}/${BACKUP_TABLES.length}  rows ${totalRows}  failures ${failed.length}`);
if (failed.length) {
  failed.forEach((f) => console.error(`  ! ${f}`));
  process.exit(1);
}
