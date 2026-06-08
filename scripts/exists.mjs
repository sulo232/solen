#!/usr/bin/env node
//
// "Does it already exist?" — the 5-second check to run BEFORE building anything new.
//   Usage:  npm run exists <keyword>        e.g.  npm run exists walk-in
//
// Scans LIVE code on every run (not the cached SURFACE.json), so it is never stale.
// Matching is fuzzy on separators: "walk-in", "walkin" and "walk_in" all match each other.

import {
  scanRoutes,
  scanEndpoints,
  scanComponents,
  scanLib,
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

// Column-level matches (table.column). Capped so a broad term ("status", "id") doesn't flood.
const dbc = loadDbColumns();
const colHitsAll = [];
for (const [table, cols] of Object.entries(dbc.byTable || {})) {
  for (const c of cols) if (hit(c)) colHitsAll.push({ table, col: c });
}
const COL_CAP = 25;
const colHits = colHitsAll.slice(0, COL_CAP);

const total =
  routes.length + endpoints.length + components.length + lib.length + rpcs.length +
  tables.length + colHitsAll.length;

console.log(`\n🔎  "${term}"  —  ${total} existing match${total === 1 ? "" : "es"}\n`);

function section(title, items, fmt) {
  if (!items.length) return;
  console.log(`  ${title}  (${items.length})`);
  for (const it of items) console.log("    " + fmt(it));
  console.log("");
}

section("ROUTES (pages)", routes, (r) => `${r.url}   →  ${r.file}`);
section("API ENDPOINTS", endpoints, (e) => `${e.url}  [${e.methods.join(", ")}]   →  ${e.file}`);
section("DB TABLES", tables, (t) => `${t.name}   (${t.rows ?? "?"} rows, RLS ${t.rls ? "on" : "OFF"})`);
section("DB COLUMNS", colHits, (h) => `${h.table}.${h.col}`);
if (colHitsAll.length > COL_CAP) console.log(`    …and ${colHitsAll.length - COL_CAP} more column matches (narrow the term)\n`);
section("DB FUNCTIONS / RPCs", rpcs, (r) => `${r.name}()   →  ${r.file}`);
section("COMPONENTS", components, (c) => `${c.name}   →  ${c.file}`);
section("lib / hooks MODULES", lib, (m) => `${m.file}`);

if (total === 0) {
  console.log("  ✗  Nothing found. Likely safe to build new — but try a synonym before you do.\n");
} else {
  console.log("  ⚠️   These ALREADY EXIST. Reuse / extend before building anything new.");
  if (!db.capturedAt) {
    console.log("  (DB tables skipped: no live snapshot — refresh _inventory/_db-snapshot.json)");
  }
  console.log("");
}
