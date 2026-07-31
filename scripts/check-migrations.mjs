#!/usr/bin/env node
// scripts/check-migrations.mjs
//
// Migration drift detector: is supabase/migrations/*.sql still a faithful
// record of the live schema.
//
// WHY THIS EXISTS
// --------------------------------------------------------------------------
// All schema changes go through the Supabase MCP `apply_migration` tool
// (_rules/DB_SCHEMA.md section 7, "additive-idempotent apply_migration").
// That call applies the SQL live AND records it in
// `supabase_migrations.schema_migrations` (version, name, statements[]), but
// it does NOT write a local file under supabase/migrations/. Every apply
// that isn't followed by a manual backfill widens the gap between "what the
// live DB actually has" and "what a fresh checkout of this repo can
// reproduce". Measured 2026-07-29: 310 versions live, 283 since the
// timestamped (14-digit) era began, only 119 local timestamped files - 205
// live versions (72% of the timestamped set) had no local file at all.
// This script is the permanent guard against that drift recurring; the
// backfill itself is a one-off (see _rules/DB_SCHEMA.md section 7 recipe).
//
// HOW "LIVE" DATA REACHES THIS SCRIPT
// --------------------------------------------------------------------------
// Investigated before writing this: every scripts/*.ts / *.mjs file that
// touches the database goes through @supabase/supabase-js
// (createClient + .from("table")...), which talks to PostgREST against the
// `public` schema (see scripts/gdpr-deletion-completeness-check.ts,
// scripts/ring*-kill-test.ts). None of them hold a direct Postgres
// connection - there is no `pg`/`postgres` package dependency in
// package.json and no DATABASE_URL/POSTGRES_URL env var in .env.local.
// `supabase_migrations.schema_migrations` is a Supabase-internal schema and
// is not exposed through PostgREST's default schema list, so the
// supabase-js pattern the rest of scripts/ uses cannot reach it either.
//
// The house already has an established answer to exactly this shape of gap:
// scripts/lib/scan-surface.mjs's loadDbTables()/loadDbColumns() read a
// COMMITTED live-introspection snapshot (_inventory/_db-snapshot.json,
// _inventory/_db-columns.json) instead of connecting live, with the file
// refreshed by hand via the Supabase MCP tools ("Refresh TOGETHER with
// _db-columns.json, then `npm run inventory`" per that file's own _note).
// This script follows the SAME mechanism rather than inventing a new one:
// it reads live migration versions from a snapshot file
// (LIVE_SNAPSHOT_PATH below), not from a live connection.
//
// Refresh recipe for the snapshot (run by whoever/whatever session has
// Supabase MCP access - the DB is never written by this script):
//   select version, name from supabase_migrations.schema_migrations
//   order by version;
// then write the result as JSON to the snapshot path in this shape:
//   {
//     "_note": "Live snapshot of supabase_migrations.schema_migrations ...",
//     "capturedAt": "<ISO timestamp>",
//     "versions": [ { "version": "20260728155748", "name": "..." }, ... ]
//   }
//
// If the snapshot file is missing, this script does NOT guess "no drift" -
// it exits 2 (distinct from the 0/1 drift contract below) and says so. A
// silent "0 findings" from missing data would be worse than no report at
// all (CLAUDE.md "no fabricated data" applied to tooling, not just UI).
//
// WHAT IT REPORTS
// --------------------------------------------------------------------------
// Three sets, comparing local supabase/migrations/*.sql filenames (version =
// the 14-digit prefix before the first underscore) against the live
// snapshot's version list:
//   A. live, no local file    - the drift this script exists to catch.
//   B. local file, no live version - a stub written under an invented
//      version prefix that was never actually applied (_rules/DB_SCHEMA.md
//      section 7 step 5 warns about this class by name).
//   C. healthy intersection   - versions present on both sides.
// Local files whose name does NOT start with a 14-digit prefix (the legacy
// 001_, 002_, ... numeric convention that predates the timestamped
// migration era) are out of scope for this comparison - they cannot appear
// in schema_migrations under that shape and are not part of the drift this
// script measures. Two local files sharing the same 14-digit version prefix
// are reported separately as DUPLICATE LOCAL VERSION (the two-files-one-
// version case section 7 step 5 also warns about) since that is a repo-only
// defect the live-vs-local set comparison alone would not surface.
//
// Usage:
//   node scripts/check-migrations.mjs
//   node scripts/check-migrations.mjs --gate
//   node scripts/check-migrations.mjs --live-file <path> --local-dir <path>
//   npm run check:migrations
//   npm run gate:migrations
//
// Exit codes:
//   0  plain mode, ran to completion (reports regardless of drift found)
//   0  --gate mode, zero live-no-local drift
//   1  --gate mode, one or more live-no-local versions found
//   2  could not run (snapshot file missing/unreadable, local dir missing) -
//      applies in BOTH modes, since there is nothing honest to report/gate.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const REPO_ROOT = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const DEFAULT_LIVE_SNAPSHOT_PATH = join(REPO_ROOT, "_inventory/_migrations-snapshot.json");
const DEFAULT_LOCAL_DIR = join(REPO_ROOT, "supabase/migrations");

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  let gate = false;
  let liveFile = process.env.MIGRATIONS_LIVE_SNAPSHOT || DEFAULT_LIVE_SNAPSHOT_PATH;
  let localDir = DEFAULT_LOCAL_DIR;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--gate") gate = true;
    else if (a === "--live-file") liveFile = resolve(argv[++i]);
    else if (a === "--local-dir") localDir = resolve(argv[++i]);
  }
  return { gate, liveFile, localDir };
}

// ----------------------------------------------------------------------------
// Local migration files
// ----------------------------------------------------------------------------
const TIMESTAMPED_RE = /^(\d{14})_(.+)\.sql$/;

/**
 * Reads supabase/migrations/*.sql and returns:
 *   byVersion: Map<version, filename[]>  (more than one entry = duplicate)
 *   legacyCount: number of non-14-digit-prefixed .sql files (out of scope,
 *     counted only so the report can say they were seen, not silently drop them)
 */
function listLocalMigrations(localDir) {
  const byVersion = new Map();
  let legacyCount = 0;
  let entries;
  try {
    entries = readdirSync(localDir, { withFileTypes: true });
  } catch (err) {
    throw new Error(`could not read local migrations dir ${localDir}: ${err.message}`);
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".sql")) continue;
    const m = TIMESTAMPED_RE.exec(entry.name);
    if (!m) {
      legacyCount++;
      continue;
    }
    const [, version, name] = m;
    if (!byVersion.has(version)) byVersion.set(version, []);
    byVersion.get(version).push({ filename: entry.name, name });
  }
  return { byVersion, legacyCount };
}

// ----------------------------------------------------------------------------
// Live snapshot
// ----------------------------------------------------------------------------
/**
 * Reads the live-version snapshot file. Returns { versions: Map<version, name> }.
 * Throws (caller turns this into exit 2) if the file is missing/unreadable/malformed -
 * this script never treats "no snapshot" as "no drift".
 */
function loadLiveSnapshot(liveFilePath) {
  if (!existsSync(liveFilePath)) {
    throw new Error(
      `no live snapshot at ${liveFilePath}. Generate it via the Supabase MCP execute_sql tool ` +
        `(select version, name from supabase_migrations.schema_migrations order by version) and write ` +
        `the result as { versions: [{ version, name }, ...] } to that path - see this file's header for the exact shape.`,
    );
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(liveFilePath, "utf8"));
  } catch (err) {
    throw new Error(`live snapshot at ${liveFilePath} is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(raw.versions)) {
    throw new Error(`live snapshot at ${liveFilePath} has no "versions" array`);
  }
  const versions = new Map();
  for (const row of raw.versions) {
    if (!row || typeof row.version !== "string") continue;
    versions.set(row.version, row.name ?? "");
  }
  return { versions, capturedAt: raw.capturedAt ?? null };
}

// ----------------------------------------------------------------------------
// Core comparison (pure function - this is what the self-test exercises
// directly, and what main() calls against the real files/snapshot)
// ----------------------------------------------------------------------------
function computeSets(localByVersion, liveVersions) {
  const localVersionSet = new Set(localByVersion.keys());
  const liveVersionSet = new Set(liveVersions.keys());

  const liveNoLocal = [...liveVersionSet]
    .filter((v) => !localVersionSet.has(v))
    .sort()
    .map((v) => ({ version: v, name: liveVersions.get(v) }));

  const localNoLive = [...localVersionSet]
    .filter((v) => !liveVersionSet.has(v))
    .sort()
    .flatMap((v) => localByVersion.get(v).map((f) => ({ version: v, filename: f.filename })));

  const healthy = [...localVersionSet]
    .filter((v) => liveVersionSet.has(v))
    .sort();

  const duplicateLocalVersions = [...localByVersion.entries()]
    .filter(([, files]) => files.length > 1)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([version, files]) => ({ version, filenames: files.map((f) => f.filename) }));

  return { liveNoLocal, localNoLive, healthy, duplicateLocalVersions };
}

// ----------------------------------------------------------------------------
// Embedded self-test (rule 12.5: build, self-test, THEN integrate). Exercises
// the exact same computeSets() the real run uses, plus a full subprocess run
// against synthetic fixtures to prove --gate really exits 1 with drift and
// would exit 0 without it. Cleans up after itself.
// ----------------------------------------------------------------------------
function selfTestMigrationsLogic() {
  const assertions = [];
  function assert(name, cond) {
    assertions.push({ name, pass: !!cond });
  }

  // --- Part 1: computeSets() unit assertions -------------------------------
  const localByVersion = new Map([
    ["20260101000000", [{ filename: "20260101000000_a.sql", name: "a" }]], // healthy
    ["20260102000000", [{ filename: "20260102000000_b.sql", name: "b" }]], // local-no-live (stub)
    ["20260103000000", [
      { filename: "20260103000000_c_one.sql", name: "c_one" },
      { filename: "20260103000000_c_two.sql", name: "c_two" },
    ]], // duplicate local version, also happens to be healthy
  ]);
  const liveVersions = new Map([
    ["20260101000000", "a"], // healthy
    ["20260103000000", "c_two"], // healthy (duplicate case)
    ["20260104000000", "d"], // live-no-local (the drift case)
  ]);
  const result = computeSets(localByVersion, liveVersions);

  assert("liveNoLocal finds exactly the one live-only version", result.liveNoLocal.length === 1 && result.liveNoLocal[0].version === "20260104000000");
  assert("localNoLive finds exactly the one local-only (stub) version", result.localNoLive.length === 1 && result.localNoLive[0].version === "20260102000000");
  assert("healthy contains both versions present on both sides", result.healthy.length === 2 && result.healthy.includes("20260101000000") && result.healthy.includes("20260103000000"));
  assert("duplicateLocalVersions catches the two-files-one-version case", result.duplicateLocalVersions.length === 1 && result.duplicateLocalVersions[0].version === "20260103000000" && result.duplicateLocalVersions[0].filenames.length === 2);

  // --- Part 2: real subprocess run against synthetic fixtures, proving the
  // actual exit codes (not a simulated boolean) for all four code paths.
  const testRoot = join(process.env.TMPDIR || tmpdir(), `check-migrations-selftest-${process.pid}-${Date.now()}`);
  const driftLocalDir = join(testRoot, "drift", "migrations");
  const cleanLocalDir = join(testRoot, "clean", "migrations");
  mkdirSync(driftLocalDir, { recursive: true });
  mkdirSync(cleanLocalDir, { recursive: true });

  // drift fixture: live has one version local doesn't
  writeFileSync(join(driftLocalDir, "20260101000000_a.sql"), "select 1;\n");
  const driftLiveFile = join(testRoot, "drift", "live.json");
  writeFileSync(
    driftLiveFile,
    JSON.stringify({ versions: [{ version: "20260101000000", name: "a" }, { version: "20260102000000", name: "b" }] }),
  );

  // clean fixture: local and live match exactly
  writeFileSync(join(cleanLocalDir, "20260101000000_a.sql"), "select 1;\n");
  const cleanLiveFile = join(testRoot, "clean", "live.json");
  writeFileSync(cleanLiveFile, JSON.stringify({ versions: [{ version: "20260101000000", name: "a" }] }));

  try {
    const scriptPath = new URL(import.meta.url).pathname;

    const driftGate = spawnSync(process.execPath, [scriptPath, "--gate", "--live-file", driftLiveFile, "--local-dir", driftLocalDir, "--skip-self-test"], { encoding: "utf8" });
    assert("subprocess: --gate exits 1 when live-no-local drift exists", driftGate.status === 1);

    const cleanGate = spawnSync(process.execPath, [scriptPath, "--gate", "--live-file", cleanLiveFile, "--local-dir", cleanLocalDir, "--skip-self-test"], { encoding: "utf8" });
    assert("subprocess: --gate exits 0 when there is no live-no-local drift", cleanGate.status === 0);

    const driftPlain = spawnSync(process.execPath, [scriptPath, "--live-file", driftLiveFile, "--local-dir", driftLocalDir, "--skip-self-test"], { encoding: "utf8" });
    assert("subprocess: plain mode exits 0 even with drift present (report-only)", driftPlain.status === 0);

    const missingSnapshot = spawnSync(process.execPath, [scriptPath, "--live-file", join(testRoot, "does-not-exist.json"), "--local-dir", cleanLocalDir, "--skip-self-test"], { encoding: "utf8" });
    assert("subprocess: missing snapshot file exits 2 in plain mode (never fabricates 'no drift')", missingSnapshot.status === 2);

    const missingSnapshotGate = spawnSync(process.execPath, [scriptPath, "--gate", "--live-file", join(testRoot, "does-not-exist.json"), "--local-dir", cleanLocalDir, "--skip-self-test"], { encoding: "utf8" });
    assert("subprocess: missing snapshot file exits 2 in gate mode too", missingSnapshotGate.status === 2);
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  const failed = assertions.filter((a) => !a.pass);
  if (failed.length > 0) {
    console.error("[check-migrations] SELF-TEST FAILED - drift comparison logic is not sound:");
    for (const f of failed) console.error(`  - ${f.name}`);
    process.exit(1);
  }
  console.log(`[check-migrations] self-test passed (${assertions.length} assertions, incl. real subprocess exit-code checks)`);
}

// ----------------------------------------------------------------------------
// Report formatting
// ----------------------------------------------------------------------------
function formatReport({ liveNoLocal, localNoLive, healthy, duplicateLocalVersions }, legacyCount, liveCapturedAt, liveFile, localDir) {
  const lines = [];
  lines.push("[check-migrations] supabase/migrations/ drift report");
  lines.push(`  local dir:     ${localDir}`);
  lines.push(`  live snapshot: ${liveFile}${liveCapturedAt ? ` (capturedAt: ${liveCapturedAt})` : ""}`);
  lines.push(`  legacy (non-14-digit-prefix) local files, out of scope: ${legacyCount}`);
  lines.push("");
  lines.push(`A. LIVE, NO LOCAL FILE (${liveNoLocal.length}) - the drift this script exists to catch`);
  if (liveNoLocal.length === 0) lines.push("   none");
  else for (const v of liveNoLocal) lines.push(`   - ${v.version}  ${v.name}`);
  lines.push("");
  lines.push(`B. LOCAL FILE, NO LIVE VERSION (${localNoLive.length}) - possible invented-prefix stub (DB_SCHEMA.md section 7 step 5)`);
  if (localNoLive.length === 0) lines.push("   none");
  else for (const v of localNoLive) lines.push(`   - ${v.version}  ${v.filename}`);
  lines.push("");
  lines.push(`C. HEALTHY (present both sides) (${healthy.length})`);
  lines.push("");
  if (duplicateLocalVersions.length > 0) {
    lines.push(`D. DUPLICATE LOCAL VERSION - two+ files share one version prefix (${duplicateLocalVersions.length})`);
    for (const d of duplicateLocalVersions) lines.push(`   - ${d.version}: ${d.filenames.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
function main() {
  const argv = process.argv.slice(2);
  if (!argv.includes("--skip-self-test")) selfTestMigrationsLogic();

  const { gate, liveFile, localDir } = parseArgs(argv);

  let localByVersion, legacyCount, liveVersions, capturedAt;
  try {
    ({ byVersion: localByVersion, legacyCount } = listLocalMigrations(localDir));
    ({ versions: liveVersions, capturedAt } = loadLiveSnapshot(liveFile));
  } catch (err) {
    console.error(`[check-migrations] cannot run: ${err.message}`);
    process.exit(2);
  }

  const sets = computeSets(localByVersion, liveVersions);
  console.log(formatReport(sets, legacyCount, capturedAt, liveFile, localDir));

  if (gate) {
    if (sets.liveNoLocal.length > 0) {
      console.error(`[check-migrations] GATE FAILED: ${sets.liveNoLocal.length} live version(s) have no local file.`);
      process.exit(1);
    }
    console.log("[check-migrations] GATE PASSED: every live version has a local file.");
    process.exit(0);
  }

  process.exit(0);
}

main();
