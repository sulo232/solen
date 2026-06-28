// scripts/lib/scan-surface.mjs
//
// Dependency-free repo scanner. The FILESYSTEM is the source of truth for "what exists":
// a page.tsx at a path proves a route; an `export async function POST` proves an endpoint.
// Both inventory.mjs (writes the map) and exists.mjs (live keyword check) import this, so
// the "what exists" answer is GENERATED on every run and can never go stale like a hand-doc.
//
// The one exception is the DB: migration files drift from the live DB (the schema-drift bug),
// so tables come from a committed live-introspection snapshot (_inventory/_db-snapshot.json),
// not from parsing supabase/migrations.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// scripts/lib/scan-surface.mjs -> repo root is three levels up.
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude",
]);

/** Recursively collect files matching filterFn. Skips dot-dirs (incl. .claude worktrees) + build output. */
function walk(dir, filterFn, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    // Skip Finder/iCloud copy artifacts: "route 2.ts", "trending 2/", "de 2.json", "page 3.tsx".
    // No legitimate source file in this repo ends in " <number>"; these are dead duplicates that
    // would otherwise show up as phantom routes/endpoints/components ("ALREADY EXISTS — reuse it").
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, filterFn, out);
    else if (filterFn(full, e.name)) out.push(full);
  }
  return out;
}

const rel = (p) => relative(REPO_ROOT, p).split(sep).join("/");

/** Next App Router: app/<...>/page.tsx -> URL. Drops route groups (..), keeps [params]. */
export function scanRoutes() {
  const appDir = join(REPO_ROOT, "app");
  return walk(appDir, (_full, name) => name === "page.tsx" || name === "page.jsx")
    .map((f) => {
      const r = rel(f);
      let url = r.replace(/^app\//, "").replace(/\/page\.(tsx|jsx)$/, "");
      url = url
        .split("/")
        .filter((seg) => seg && !/^\(.*\)$/.test(seg)) // drop route groups like (marketing)
        .join("/");
      url = "/" + url;
      if (url === "/") url = "/ (root)";
      return { url, file: r };
    })
    .sort((a, b) => a.url.localeCompare(b.url));
}

const METHOD_RE =
  /export\s+(?:async\s+function|const|function)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;

/** Route handlers: app/<...>/route.ts -> URL + the HTTP methods it actually exports. */
export function scanEndpoints() {
  const appDir = join(REPO_ROOT, "app");
  return walk(appDir, (_full, name) => name === "route.ts" || name === "route.js")
    .map((f) => {
      const r = rel(f);
      let url = r.replace(/^app\//, "").replace(/\/route\.(ts|js)$/, "");
      url = url
        .split("/")
        .filter((seg) => seg && !/^\(.*\)$/.test(seg))
        .join("/");
      url = "/" + url;
      let src = "";
      try {
        src = readFileSync(f, "utf8");
      } catch {
        /* unreadable -> methods unknown */
      }
      const methods = [...new Set([...src.matchAll(METHOD_RE)].map((m) => m[1]))];
      return { url, methods: methods.length ? methods : ["?"], file: r };
    })
    .sort((a, b) => a.url.localeCompare(b.url));
}

// Next.js reserved filenames — these are routing/metadata files, not reusable components.
const NEXT_SPECIAL = new Set([
  "page.tsx", "layout.tsx", "loading.tsx", "error.tsx", "not-found.tsx", "template.tsx",
  "default.tsx", "global-error.tsx", "opengraph-image.tsx", "twitter-image.tsx",
  "icon.tsx", "apple-icon.tsx",
]);

/**
 * Every reusable .tsx component. Walks the whole app/ tree (catches COLOCATED components like
 * app/[locale]/compare/ComparePageClient.tsx — not just the _components dirs) plus the legacy
 * homes, deduped by path, minus Next reserved files. (Colocated components were a false-negative
 * blind spot: `exists ComparePageClient` returned 0 even though it exists.)
 */
export function scanComponents() {
  const dirs = [join(REPO_ROOT, "app"), join(REPO_ROOT, "components-legacy"), join(REPO_ROOT, "components")];
  const seen = new Map();
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of walk(d, (_full, name) => name.endsWith(".tsx") && !NEXT_SPECIAL.has(name))) {
      const r = rel(f);
      if (!seen.has(r)) seen.set(r, { name: basename(f).replace(/\.tsx$/, ""), file: r });
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Every module under lib/ and hooks/ (the two non-component code homes). Excludes type decls. */
export function scanLib() {
  const dirs = [join(REPO_ROOT, "lib"), join(REPO_ROOT, "hooks")];
  const out = [];
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of walk(
      d,
      (_full, name) => (name.endsWith(".ts") || name.endsWith(".tsx")) && !name.endsWith(".d.ts"),
    )) {
      out.push({ name: basename(f).replace(/\.tsx?$/, ""), file: rel(f) });
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

// Top-level EXPORTED symbols. Catches CONCEPT/SIGNATURE duplication that the filename scan
// misses: a new session rebuilding logic around an existing algorithm (e.g. deriveHairDna in
// lib/persona/deriv.ts) under a different filename. Matches the four export forms below; the
// leading-^ anchor keeps it to TOP-LEVEL exports (no re-exports buried mid-block, no indented
// inner declarations). `export default function NAME` is captured when it has a name.
const EXPORT_RE =
  /^export\s+(?:async\s+)?function\s+([A-Za-z_]\w*)|^export\s+(?:const|let|var)\s+([A-Za-z_]\w*)|^export\s+(?:abstract\s+)?class\s+([A-Za-z_]\w*)|^export\s+default\s+(?:async\s+)?function\s+([A-Za-z_]\w*)/gm;

/**
 * Every top-level exported symbol (function / const / class / default-function) across lib/** and
 * app/** .ts/.tsx. This is the CONCEPT layer of the dedup system: filenames catch "someone made
 * another deriv.ts", but the real recurring miss is "someone rebuilt the hair-DNA logic under a
 * fresh name" — `exists deriveHairDna` / `exists hair dna` now surfaces lib/persona/deriv.ts via
 * the exported symbol even though the file is named deriv.ts. Regex-based + skips node_modules/.next
 * (via walk's IGNORE_DIRS), so it stays fast. Returns { name, file }.
 */
export function scanExports() {
  const dirs = [join(REPO_ROOT, "lib"), join(REPO_ROOT, "app")];
  const seen = new Map();
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of walk(
      d,
      (_full, name) => (name.endsWith(".ts") || name.endsWith(".tsx")) && !name.endsWith(".d.ts"),
    )) {
      let src = "";
      try {
        src = readFileSync(f, "utf8");
      } catch {
        continue; // unreadable -> no symbols
      }
      const r = rel(f);
      for (const m of src.matchAll(EXPORT_RE)) {
        const name = m[1] || m[2] || m[3] || m[4];
        if (!name) continue;
        const key = `${name}${r}`; // same symbol can appear once per file; dedupe per (name,file)
        if (!seen.has(key)) seen.set(key, { name, file: r });
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const RPC_RE = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?["']?([a-zA-Z_]\w*)/gi;

/**
 * Postgres functions / RPCs defined in migrations. These are duplicate-prone (an agent re-creates
 * an existing RPC) and were a critical blind spot: `exists resequence_walkin_queue` returned
 * "safe to build" for a function that exists and is called via .rpc() in app code. Function bodies
 * don't drift from the live DB the way tables do, so reading the migration files is accurate here.
 */
export function scanRpcs() {
  const d = join(REPO_ROOT, "supabase/migrations");
  if (!existsSync(d)) return [];
  const seen = new Map();
  for (const f of walk(d, (_full, name) => name.endsWith(".sql"))) {
    let src = "";
    try {
      src = readFileSync(f, "utf8");
    } catch {
      /* unreadable */
    }
    for (const m of src.matchAll(RPC_RE)) {
      const name = m[1];
      if (!seen.has(name)) seen.set(name, { name, file: rel(f) }); // first definition proves existence
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Live DB tables from the committed snapshot (NOT migrations — those drift). */
export function loadDbTables() {
  const snap = join(REPO_ROOT, "_inventory/_db-snapshot.json");
  if (!existsSync(snap)) {
    return { tables: [], capturedAt: null, note: "no snapshot — refresh _inventory/_db-snapshot.json" };
  }
  try {
    return JSON.parse(readFileSync(snap, "utf8"));
  } catch {
    return { tables: [], capturedAt: null, note: "snapshot unreadable (bad JSON)" };
  }
}

/**
 * Live DB columns per table from the committed snapshot. Lets `exists <col>` answer
 * column-level questions — the deeper version of the tips-table miss (an agent re-adding
 * an existing column, or assuming a drifted-away column exists). Returns { table: [cols] }.
 */
export function loadDbColumns() {
  const f = join(REPO_ROOT, "_inventory/_db-columns.json");
  if (!existsSync(f)) return { byTable: {}, capturedAt: null };
  try {
    const j = JSON.parse(readFileSync(f, "utf8"));
    const byTable = {};
    for (const [t, cols] of Object.entries(j.columns || {})) {
      byTable[t] = String(cols).split(",").map((c) => c.trim()).filter(Boolean);
    }
    return { byTable, capturedAt: j.capturedAt ?? null };
  } catch {
    return { byTable: {}, capturedAt: null };
  }
}
