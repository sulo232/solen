#!/usr/bin/env node
//
// components-legacy census. For every .tsx/.ts file under components-legacy/, counts how many
// files IMPORT it (import/export-from/require/dynamic import, resolved by path, not by name),
// split into two buckets:
//   - live-tree importers: files under app/, components/, hooks/, lib/ (these prove the file
//     is genuinely reachable from something that runs)
//   - intra-legacy importers: files under components-legacy/ itself (a hit here does NOT prove
//     liveness on its own, since the importer could itself be dead, or could be a barrel
//     index.ts that a live file imports, or could be an orphan too, hence LEAF-CHECK below)
//
//   Run: node scripts/legacy-census.mjs (writes _plans/LEGACY_CENSUS.md)
//
// This is a MEMO for a later ring. It does NOT delete anything and does NOT walk the intra-legacy
// chain transitively (deliberate: verdict LEAF-CHECK means "0 live-tree importers but >=1
// intra-legacy importer, go trace that importer by hand before deleting").
//
// Ring 10 extension: also runs a lib/*/ SUBDIRECTORY orphan sweep (see below), same
// resolved-import-graph approach, appended as a second section of the same report.

import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude",
]);

/** Recursively collect files matching filterFn, skipping build/dot dirs + Finder copy artifacts. */
function walk(dir, filterFn, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue; // "route 2.ts", "trending 2/" etc.
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, filterFn, out);
    else if (filterFn(full, e.name)) out.push(full);
  }
  return out;
}

const rel = (p) => relative(REPO_ROOT, p).split(sep).join("/");
const isSrc = (_full, name) => /\.(tsx|ts)$/.test(name);

const LIVE_DIRS = ["app", "components", "hooks", "lib"].map((d) => join(REPO_ROOT, d));
const LEGACY_DIR = join(REPO_ROOT, "components-legacy");

const liveFiles = LIVE_DIRS.filter(existsSync).flatMap((d) => walk(d, isSrc));
const legacyFiles = walk(LEGACY_DIR, isSrc);

// Strips /* */ block comments and // line comments before scanning, so a DEAD, commented-out
// import ("// import Foo from '@/components-legacy/Foo'") does not falsely count as a live edge.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

// Import-specifier extraction (regex, not a real parser, good enough for a census memo).
// Covers: `import ... from '...'`, `export ... from '...'`, bare `import '...'`,
// `require('...')`, dynamic `import('...')`.
function extractSpecifiers(rawSrc) {
  const src = stripComments(rawSrc);
  const specs = [];
  const reFrom = /\bfrom\s+["']([^"']+)["']/g;
  const reBareImport = /^\s*import\s+["']([^"']+)["']/gm;
  const reRequire = /\brequire\(\s*["']([^"']+)["']\s*\)/g;
  const reDynamic = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
  for (const re of [reFrom, reBareImport, reRequire, reDynamic]) {
    let m;
    while ((m = re.exec(src))) specs.push(m[1]);
  }
  return specs;
}

const TRY_EXT = ["", ".tsx", ".ts", ".jsx", ".js"];
const TRY_INDEX = ["index.tsx", "index.ts", "index.jsx", "index.js"];

/** Resolve a local (relative or @/-aliased) specifier to an absolute file path, or null. */
function resolveLocal(specifier, importerAbsDir) {
  let base;
  if (specifier.startsWith("@/")) {
    base = join(REPO_ROOT, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = join(importerAbsDir, specifier);
  } else {
    return null; // bare package import (node_modules), not a local file
  }
  for (const ext of TRY_EXT) {
    const candidate = base + ext;
    if (existsSync(candidate)) {
      try {
        if (statSync(candidate).isFile()) return candidate;
      } catch {
        /* race/broken symlink, skip */
      }
    }
  }
  for (const idx of TRY_INDEX) {
    const candidate = join(base, idx);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// Build the importer -> target edge list.
const legacyFileSet = new Set(legacyFiles.map(rel));
// importers[targetRelPath] = { live: Set<importerRelPath>, intra: Set<importerRelPath> }
const importers = new Map();
for (const f of legacyFiles) importers.set(rel(f), { live: new Set(), intra: new Set() });

function scanImporters(files, bucket) {
  for (const f of files) {
    let src;
    try {
      src = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const importerRel = rel(f);
    const importerDir = dirname(f);
    for (const spec of extractSpecifiers(src)) {
      if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;
      const resolved = resolveLocal(spec, importerDir);
      if (!resolved) continue;
      const targetRel = rel(resolved);
      if (!legacyFileSet.has(targetRel)) continue;
      if (targetRel === importerRel) continue; // self-import guard, shouldn't happen
      importers.get(targetRel)[bucket].add(importerRel);
    }
  }
}

scanImporters(liveFiles, "live");
scanImporters(legacyFiles, "intra");

// Verdict + report.
const VERDICT_ORDER = { DEAD: 0, "LEAF-CHECK": 1, LIVE: 2 };
const rows = legacyFiles
  .map((f) => {
    const file = rel(f);
    const { live, intra } = importers.get(file);
    const liveCount = live.size;
    const intraCount = intra.size;
    let verdict;
    if (liveCount > 0) verdict = "LIVE";
    else if (intraCount > 0) verdict = "LEAF-CHECK";
    else verdict = "DEAD";
    return { file, liveCount, intraCount, verdict };
  })
  .sort((a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] || a.file.localeCompare(b.file));

const counts = rows.reduce(
  (acc, r) => {
    acc[r.verdict]++;
    acc.total++;
    return acc;
  },
  { total: 0, LIVE: 0, DEAD: 0, "LEAF-CHECK": 0 },
);

const date = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push("# components-legacy census");
lines.push("");
lines.push(
  `Auto-generated by \`node scripts/legacy-census.mjs\` (${date}). MEMO for a later ring, ` +
    "no files were deleted by this run.",
);
lines.push("");
lines.push(
  "Counts are DIRECT import edges only (path-resolved, not name-matched), not transitive. " +
    "`live` = importers under app/, components/, hooks/, lib/. `intra` = importers under " +
    "components-legacy/ itself, which only prove liveness if the importer is ITSELF live " +
    "(a barrel index.ts re-exporting a file counts as intra here even though the index.ts " +
    "may be live-imported one level up), hence the LEAF-CHECK verdict below.",
);
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- Total files scanned: ${counts.total}`);
lines.push(`- LIVE (>=1 live-tree importer): ${counts.LIVE}`);
lines.push(`- LEAF-CHECK (0 live-tree, >=1 intra-legacy importer, trace by hand): ${counts["LEAF-CHECK"]}`);
lines.push(`- DEAD (0 importers anywhere): ${counts.DEAD}`);
lines.push("");
lines.push("## Files");
lines.push("");
lines.push("| file | live-tree importers | intra-legacy importers | verdict |");
lines.push("|---|---|---|---|");
for (const r of rows) {
  lines.push(`| ${r.file} | ${r.liveCount} | ${r.intraCount} | ${r.verdict} |`);
}
lines.push("");

// ---------------------------------------------------------------------------
// lib/ SUBDIRECTORY orphan sweep (Ring 10, extends the components-legacy census
// above with the same resolved-import-graph approach). Targets are .ts/.tsx
// files under lib/*/ (subdirectories only; lib/*.ts top-level files were
// already swept in Ring 4b). Importers are scanned from every tree that can
// legitimately reference a lib helper: app/, components/, components-legacy/,
// hooks/, lib/ itself, scripts/, and supabase/ (so a helper only used by a
// still-running script or an edge function is NOT flagged as an orphan).
const isImporterSrc = (_full, name) => /\.(tsx|ts|jsx|js|mjs)$/.test(name);
const LIB_DIR = join(REPO_ROOT, "lib");
const IMPORTER_SCAN_DIRS = ["app", "components", "components-legacy", "hooks", "lib", "scripts", "supabase"]
  .map((d) => join(REPO_ROOT, d))
  .filter(existsSync);

const libSubdirFiles = walk(LIB_DIR, isSrc).filter((f) => relative(LIB_DIR, f).split(sep).length > 1);
const allImporterFiles = IMPORTER_SCAN_DIRS.flatMap((d) => walk(d, isImporterSrc));

const libFileSet = new Set(libSubdirFiles.map(rel));
const libImporters = new Map();
for (const f of libSubdirFiles) libImporters.set(rel(f), new Set());

for (const f of allImporterFiles) {
  let src;
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const importerRel = rel(f);
  const importerDir = dirname(f);
  for (const spec of extractSpecifiers(src)) {
    if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;
    const resolved = resolveLocal(spec, importerDir);
    if (!resolved) continue;
    const targetRel = rel(resolved);
    if (!libFileSet.has(targetRel)) continue;
    if (targetRel === importerRel) continue;
    libImporters.get(targetRel).add(importerRel);
  }
}

const libRows = libSubdirFiles
  .map((f) => {
    const file = rel(f);
    const importers = [...libImporters.get(file)].sort();
    return { file, importerCount: importers.length, importers };
  })
  .sort((a, b) => a.importerCount - b.importerCount || a.file.localeCompare(b.file));
const libOrphanCount = libRows.filter((r) => r.importerCount === 0).length;

lines.push("## lib/ subdirectory orphan sweep (Ring 10)");
lines.push("");
lines.push(
  "Targets: .ts/.tsx files under lib/*/ (subdirectories only; lib/*.ts top-level was Ring 4b). " +
    "Importers scanned from app/, components/, components-legacy/, hooks/, lib/, scripts/, " +
    "supabase/ (path-resolved, same regex-import approach as the census above).",
);
lines.push("");
lines.push(`- Total lib/*/ files scanned: ${libRows.length}`);
lines.push(`- 0-importer (orphan): ${libOrphanCount}`);
lines.push("");
lines.push("| file | importers |");
lines.push("|---|---|");
for (const r of libRows) {
  lines.push(`| ${r.file} | ${r.importerCount === 0 ? "0" : r.importers.join(", ")} |`);
}
lines.push("");

const outPath = join(REPO_ROOT, "_plans/LEGACY_CENSUS.md");
writeFileSync(outPath, lines.join("\n"));
console.log(
  `Wrote ${rel(outPath)}: ${counts.total} components-legacy files (${counts.LIVE} LIVE, ${counts["LEAF-CHECK"]} LEAF-CHECK, ${counts.DEAD} DEAD); ` +
    `${libRows.length} lib/*/ files (${libOrphanCount} 0-importer orphans)`,
);
