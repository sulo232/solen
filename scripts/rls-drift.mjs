#!/usr/bin/env node
// rls-drift , root-cause plan Phase B gate (file-based half).
//
// Root cause: a migration file can claim one RLS policy while the LIVE database has a different one,
// and nobody reconciles them (the voucher "anon-read leak" false-positive this session: the file said
// leak, live was already scoped). This snapshots live RLS truth into _inventory/_rls-policies.json and
// flags every live policy that appears in NO migration file , i.e. was created/changed out-of-band, so
// the migrations no longer describe reality.
//
// It fails only when the count of such orphaned policies EXCEEDS the committed baseline (baseline-first,
// tighten-later), so it gates NEW drift without drowning in the pre-existing backlog.
//
// The full live<->file diff (regenerating the snapshot from a fresh pg_policies dump each run) needs an
// owner-provided DB connection secret in CI , documented in _inventory/_rls-policies.json. Regenerate
// with: select json_agg(...) from pg_policies where schemaname='public'  (see that file's header).
//
// Usage:  node scripts/rls-drift.mjs [--update-baseline]
// Exit:   0 if orphaned-policy count <= baseline, 1 if it grew.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SNAP = "_inventory/_rls-policies.json";
const BASELINE = "_inventory/_rls-drift-baseline.json";
const MIG_DIR = "supabase/migrations";

if (!existsSync(SNAP)) {
  console.error(`rls-drift: ${SNAP} is missing , regenerate the live RLS snapshot (see plan Phase B).`);
  process.exit(1);
}
const snap = JSON.parse(readFileSync(SNAP, "utf8"));
const policies = snap.policies || [];
if (policies.length === 0) {
  console.error("rls-drift: RLS snapshot is empty , refusing to pass (would hide all drift).");
  process.exit(1);
}

// one big blob of all migration SQL
let migBlob = "";
for (const f of readdirSync(MIG_DIR)) {
  if (f.endsWith(".sql")) migBlob += readFileSync(join(MIG_DIR, f), "utf8") + "\n";
}

// a live policy is "orphaned" if its policyname is never mentioned in any migration file
const orphaned = policies.filter((p) => p.policyname && !migBlob.includes(p.policyname)).map((p) => `${p.tablename}.${p.policyname}`);

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")).count : null;

if (process.argv.includes("--update-baseline")) {
  writeFileSync(BASELINE, JSON.stringify({ _comment: "Count of live RLS policies not found in any migration file, as of the last accepted baseline. rls-drift.mjs fails if the live count exceeds this.", count: orphaned.length, generated: snap.generated }, null, 1) + "\n");
  console.log(`rls-drift: baseline updated to ${orphaned.length} orphaned policies.`);
  process.exit(0);
}

console.log(`rls-drift: ${orphaned.length} live policies not found in any migration file (baseline: ${baseline ?? "unset"}).`);
if (baseline === null) {
  console.error("rls-drift: no baseline , run `node scripts/rls-drift.mjs --update-baseline` once to set it.");
  process.exit(1);
}
if (orphaned.length > baseline) {
  console.error(`rls-drift: NEW drift , ${orphaned.length - baseline} live policies added with no migration file. Add the migration that creates them, or re-snapshot + re-baseline if intentional.`);
  process.exit(1);
}
console.log("rls-drift: OK , no new live-only RLS policies vs baseline.");
process.exit(0);
