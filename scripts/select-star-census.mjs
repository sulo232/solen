#!/usr/bin/env node
//
// performance-01 census. Walks every app/api/**/*.ts file and counts occurrences
// of Supabase's `select("*")` / `select('*')` over-fetch shape, the single most
// repeated performance-and-security bug shape in this codebase (SWEEP_BACKLOG
// independently found and fixed the identical pattern on at least 5 routes,
// each time re-discovered by a human/agent reading code, never caught
// mechanically). A file listed in select-star-allowlist.json (one line, one
// reason, e.g. an owner-only admin export that genuinely needs every column)
// is EXCLUDED from the count, so a legitimate full-row read does not force the
// baseline up for everyone else.
//
// This is a CENSUS, not a type-checker: a regex over the source text, same
// heuristic tier as scripts/api-contracts-census.mjs and scripts/ratelimit-census.mjs.
// Good enough to ratchet an aggregate count in CI, not a substitute for a real parser.
//
//   Run: node scripts/select-star-census.mjs
//   Machine-readable summary printed on the last line as a KEY=VAL pair for the
//   CI ratchet job to parse: RATCHET_SELECT_STAR=<n>

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude"]);
const SELECT_STAR_RE = /select\(\s*(["'])\*\1\s*\)/g;

function walk(dir, filterFn, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, filterFn, out);
    else if (filterFn(full, e.name)) out.push(full);
  }
  return out;
}

const rel = (p) => relative(REPO_ROOT, p).split(sep).join("/");

let allowlist = [];
try {
  allowlist = JSON.parse(readFileSync(join(REPO_ROOT, "scripts", "select-star-allowlist.json"), "utf8")).map((e) => e.file);
} catch {
  allowlist = [];
}

const apiFiles = walk(join(REPO_ROOT, "app", "api"), (full, name) => name.endsWith(".ts"));

let total = 0;
const perFile = [];
for (const f of apiFiles) {
  const relPath = rel(f);
  if (allowlist.includes(relPath)) continue;
  const text = readFileSync(f, "utf8");
  const matches = text.match(SELECT_STAR_RE);
  if (matches && matches.length > 0) {
    total += matches.length;
    perFile.push({ file: relPath, count: matches.length });
  }
}

perFile.sort((a, b) => b.count - a.count);
console.log(`select("*") / select('*') occurrences under app/api (allowlist-excluded): ${total}`);
console.log(`files affected: ${perFile.length}`);
for (const { file, count } of perFile.slice(0, 20)) {
  console.log(`  ${count.toString().padStart(3)}  ${file}`);
}
if (perFile.length > 20) console.log(`  ... and ${perFile.length - 20} more files`);
console.log(`RATCHET_SELECT_STAR=${total}`);
