#!/usr/bin/env node
//
// observability-6 census. Walks every app/ and lib/ file and counts
// console.error/warn/log calls that interpolate a raw email or phone number
// into their metadata object, e.g.
//   console.error("[x] failed:", err, { email: user.email })
// This is the exact live violation _plans/OPS_RUNBOOK.md already documents as
// settled convention ("console.error carries ids not PII, keep it that way")
// but had zero enforcement, so it quietly broke once
// (app/api/admin/tos/notify/route.ts, fixed 2026-07-27). Log the internal id
// (user_id, booking_id) instead; look the record up in the access-controlled
// DB when investigating.
//
// This is a CENSUS, not a type-checker: a regex over the source text, same
// heuristic tier as scripts/select-star-census.mjs and
// scripts/api-contracts-census.mjs. Good enough to ratchet an aggregate count
// in CI, not a substitute for a real parser. A metadata object naming a
// variable that only LOOKS like it holds PII (a false positive) gets a
// one-line entry in scripts/pii-log-allowlist.json (file + reason), mirroring
// the select-star-census allowlist shape.
//
//   Run: node scripts/check-pii-logs.mjs
//   Machine-readable summary printed on the last line as a KEY=VAL pair for a
//   CI ratchet job to parse: RATCHET_PII_IN_LOGS=<n>

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude"]);
// Matches console.error/warn/log(...{ ...email: or ...phone: ...): a metadata
// object literal passed as an argument that names an email/phone field.
const PII_LOG_RE = /console\.(error|warn|log)\([^)]*\{[^}]*\b(email|phone)\s*:/g;

function walk(dir, filterFn, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, filterFn, out);
    else if (filterFn(full, e.name)) out.push(full);
  }
  return out;
}

const rel = (p) => relative(REPO_ROOT, p).split(sep).join("/");

let allowlist = [];
try {
  allowlist = JSON.parse(readFileSync(join(REPO_ROOT, "scripts", "pii-log-allowlist.json"), "utf8")).map((e) => e.file);
} catch {
  allowlist = [];
}

const files = [
  ...walk(join(REPO_ROOT, "app"), (full, name) => name.endsWith(".ts") || name.endsWith(".tsx")),
  ...walk(join(REPO_ROOT, "lib"), (full, name) => name.endsWith(".ts") || name.endsWith(".tsx")),
];

let total = 0;
const perFile = [];
for (const f of files) {
  const relPath = rel(f);
  if (allowlist.includes(relPath)) continue;
  const text = readFileSync(f, "utf8");
  const matches = text.match(PII_LOG_RE);
  if (matches && matches.length > 0) {
    total += matches.length;
    perFile.push({ file: relPath, count: matches.length });
  }
}

perFile.sort((a, b) => b.count - a.count);
console.log(`console.error/warn/log calls interpolating a raw email/phone (allowlist-excluded): ${total}`);
console.log(`files affected: ${perFile.length}`);
for (const { file, count } of perFile.slice(0, 20)) {
  console.log(`  ${count.toString().padStart(3)}  ${file}`);
}
if (perFile.length > 20) console.log(`  ... and ${perFile.length - 20} more files`);
console.log(`RATCHET_PII_IN_LOGS=${total}`);
