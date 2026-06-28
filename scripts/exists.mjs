#!/usr/bin/env node
//
// "Does it already exist?" — the 5-second check to run BEFORE building anything new.
//   Usage:  npm run exists <keyword>        e.g.  npm run exists walk-in
//
// Scans LIVE code on every run (not the cached SURFACE.json), so it is never stale.
// Matching is fuzzy on separators: "walk-in", "walkin" and "walk_in" all match each other.

import { readFileSync, existsSync } from "node:fs";
import {
  scanRoutes,
  scanEndpoints,
  scanComponents,
  scanLib,
  scanExports,
  scanRpcs,
  loadDbTables,
  loadDbColumns,
} from "./lib/scan-surface.mjs";

const term = process.argv.slice(2).join(" ").trim();
if (!term) {
  console.error("Usage: npm run exists <keyword>   (e.g. npm run exists walk-in)");
  process.exit(2);
}

const norm = (s) => String(s).toLowerCase().replace(/[-_\s/]/g, "");
const needle = norm(term);
const hit = (...vals) => vals.some((v) => norm(v).includes(needle));

const routes = scanRoutes().filter((r) => hit(r.url, r.file));
const endpoints = scanEndpoints().filter((e) => hit(e.url, e.file));
const components = scanComponents().filter((c) => hit(c.name, c.file));
const lib = scanLib().filter((m) => hit(m.name, m.file));
const rpcs = scanRpcs().filter((r) => hit(r.name, r.file));
const db = loadDbTables();
const tables = (db.tables || []).filter((t) => hit(t.name));

// EXPORTED SYMBOLS: top-level exported names across lib/** + app/**. Catches CONCEPT/SIGNATURE
// duplication (a session rebuilding logic around an existing algorithm under a fresh filename),
// e.g. `exists deriveHairDna` / `exists hair dna` surfaces lib/persona/deriv.ts. Capped so a
// broad term doesn't flood the report.
const SYM_CAP = 30;
const symbolsAll = scanExports().filter((s) => hit(s.name));
const symbols = symbolsAll.slice(0, SYM_CAP);

// CONCEPT ALIASES: hand-kept _inventory/CONCEPTS.md maps a capability to its many names so a
// search for ANY alias surfaces the canonical file (the cross-session dedup the symbol/filename
// scans can't fully cover: different name, different file, same logic).
const CONCEPTS_PATH = new URL("../_inventory/CONCEPTS.md", import.meta.url).pathname;
const conceptHits = existsSync(CONCEPTS_PATH)
  ? readFileSync(CONCEPTS_PATH, "utf8")
      .split("\n")
      .filter((l) => l.startsWith("- ") && hit(l))
      .map((l) => l.slice(2))
  : [];

// Column-level matches (table.column). Capped so a broad term ("status", "id") doesn't flood.
const dbc = loadDbColumns();
const colHitsAll = [];
for (const [table, cols] of Object.entries(dbc.byTable || {})) {
  for (const c of cols) if (hit(c)) colHitsAll.push({ table, col: c });
}
const COL_CAP = 25;
const colHits = colHitsAll.slice(0, COL_CAP);

// PAGE SECTIONS: inline JSX section comments inside page files — catches sections
// that are not named components (e.g. the /fuer-salons comparison chart), which the
// component scan can't see.
import { execSync } from "node:child_process";
let sectionHits = [];
try {
  const raw = execSync(
    `grep -rn --include=page.tsx '{/\\*' app | head -800`,
    { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  sectionHits = raw
    .split("\n")
    .filter((l) => l && hit(l))
    .map((l) => {
      const [file, line, ...rest] = l.split(":");
      const comment = rest.join(":").replace(/.*\{\/\*\s*/, "").replace(/\s*\*\/.*/, "").trim();
      return `${comment}   →  ${file}:${line}`;
    })
    .slice(0, 20);
} catch { /* grep exit 1 = no matches */ }

// 🪦 Graveyard: things the owner DELETED/REJECTED on purpose. A hit here outranks
// every other section — "exists" tooling that only knows what IS misses what was
// deliberately removed (the #1 post-compression failure: rebuilding deleted features).
const REMOVED_PATH = new URL("../_design-system/REMOVED.md", import.meta.url).pathname;
const removedHits = existsSync(REMOVED_PATH)
  ? readFileSync(REMOVED_PATH, "utf8")
      .split("\n")
      .filter((l) => l.startsWith("- ") && hit(l))
      .map((l) => l.slice(2))
  : [];

const total =
  routes.length + endpoints.length + components.length + lib.length + rpcs.length +
  tables.length + colHitsAll.length + removedHits.length + sectionHits.length +
  symbolsAll.length + conceptHits.length;

console.log(`\n🔎  "${term}"  —  ${total} existing match${total === 1 ? "" : "es"}\n`);

function section(title, items, fmt) {
  if (!items.length) return;
  console.log(`  ${title}  (${items.length})`);
  for (const it of items) console.log("    " + fmt(it));
  console.log("");
}

section("🪦 REMOVED — DO NOT REBUILD", removedHits, (l) => l);
section("Concept aliases", conceptHits, (l) => l);
section("ROUTES (pages)", routes, (r) => `${r.url}   →  ${r.file}`);
section("PAGE SECTIONS (inline)", sectionHits, (l) => l);
section("API ENDPOINTS", endpoints, (e) => `${e.url}  [${e.methods.join(", ")}]   →  ${e.file}`);
section("DB TABLES", tables, (t) => `${t.name}   (${t.rows ?? "?"} rows, RLS ${t.rls ? "on" : "OFF"})`);
section("DB COLUMNS", colHits, (h) => `${h.table}.${h.col}`);
if (colHitsAll.length > COL_CAP) console.log(`    …and ${colHitsAll.length - COL_CAP} more column matches (narrow the term)\n`);
section("DB FUNCTIONS / RPCs", rpcs, (r) => `${r.name}()   →  ${r.file}`);
section("COMPONENTS", components, (c) => `${c.name}   →  ${c.file}`);
section("lib / hooks MODULES", lib, (m) => `${m.file}`);
section("Exported symbols", symbols, (s) => `${s.name}   →  ${s.file}`);
if (symbolsAll.length > SYM_CAP) console.log(`    …and ${symbolsAll.length - SYM_CAP} more exported-symbol matches (narrow the term)\n`);

if (total === 0) {
  console.log("  ✗  Nothing found. Likely safe to build new — but try a synonym before you do.\n");
} else {
  if (removedHits.length) {
    console.log("  🪦  REMOVED hits above were DELETED ON PURPOSE — do not re-propose without an explicit owner yes.");
  }
  console.log("  ⚠️   These ALREADY EXIST. Reuse / extend before building anything new.");
  if (!db.capturedAt) {
    console.log("  (DB tables skipped: no live snapshot — refresh _inventory/_db-snapshot.json)");
  }
  console.log("");
}
