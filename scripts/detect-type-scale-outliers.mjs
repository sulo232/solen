#!/usr/bin/env node
//
// Type-scale one-off detector. Sibling to detect-near-duplicates.mjs / detect-icon-system-mismatch.mjs:
// report-mode ONLY, never a gate. Catches the drift class the per-file drift gate does not
// systematically surface: an arbitrary text-[Npx] / text-[N.Npx] font-size utility whose pixel
// value sits OUTSIDE the locked type scale (_design-system/LOCKFILE.md section 2 + section 2.5,
// project CLAUDE.md "text size" design-contract row). Roughly 15 distinct off-scale sizes across
// the app: a cluster of half-pixel sizes (text-[12.5px], text-[13.5px], text-[14.5px], text-[11.5px],
// text-[10.5px]) plus an odd-integer tail (text-[17px], text-[19px], text-[21px], text-[25px],
// text-[46px], text-[48px], text-[80px], and more) that are not in the locked scale.
//
//   Run:  npm run type-check-scale
//   Out:  _design-system/_type-scale-report.md  +  a stdout summary
//
// Deliberately simple, same "do not over-engineer it" posture as detect-icon-system-mismatch.mjs:
// a line-based regex scan for text-[Npx] / text-[N.Npx] / text-[Nrem] / text-[N.Nrem], no AST,
// no scoring, no thresholds to calibrate. clamp() usages (text-[clamp(14px,3.5vw,16px)]) are
// NOT matched by design, since the regex requires a digit immediately after the opening bracket;
// clamp-based type is how the locked roles themselves are written, so it is not the drift this
// detector targets. The ALLOWED_PX set + the off-scale scanner live in scripts/lib/type-scale-
// allowed.mjs (same pattern as scripts/lib/icon-blessed-context.mjs).

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";
import { ALLOWED_PX, HERO_H1_CONTRADICTION_NOTE, SUB_FLOOR_PX, SUB_FLOOR_NOTE, offScaleValues } from "./lib/type-scale-allowed.mjs";

const REPORT_PATH = join(REPO_ROOT, "_design-system/_type-scale-report.md");

// ---------------------------------------------------------------------------------------
// File walk. Modeled on detect-near-duplicates.mjs / detect-icon-system-mismatch.mjs's own
// walkTsx (same IGNORE_DIRS, same Finder/iCloud copy-artifact skip). Scans app/, components/,
// components-legacy/ per the task scope.
// ---------------------------------------------------------------------------------------
const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude",
]);

function walkTsx(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue; // Finder/iCloud copy artifacts
    const full = join(dir, e.name);
    if (e.isDirectory()) walkTsx(full, out);
    else if (e.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function relRoot(absPath) {
  return relative(REPO_ROOT, absPath).split(sep).join("/");
}

const candidateFiles = walkTsx(join(REPO_ROOT, "app")).concat(
  walkTsx(join(REPO_ROOT, "components")),
  walkTsx(join(REPO_ROOT, "components-legacy")),
);

// ---------------------------------------------------------------------------------------
// Detection: offScaleValues() from the shared lib (text-[Npx] / text-[N.Npx] / text-[Nrem] /
// text-[N.Nrem], requires a digit immediately after the opening bracket so text-[clamp(...)]
// never matches). Same function the gate uses for its net-new count, by import, not copy.
// ---------------------------------------------------------------------------------------
const findings = []; // { raw, px, unit, file, line }
const filesScanned = candidateFiles.length;

for (const absPath of candidateFiles) {
  const relPath = relRoot(absPath);
  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch {
    continue;
  }
  for (const hit of offScaleValues(text)) {
    findings.push({ raw: hit.raw, px: hit.px, unit: hit.unit, file: relPath, line: hit.line });
  }
}

// ---------------------------------------------------------------------------------------
// Group by RAW utility string (e.g. "text-[12.5px]"), the report's spine per the task's own
// instruction: one section per off-scale value, not a flat per-usage list.
// ---------------------------------------------------------------------------------------
const groups = new Map(); // raw -> { raw, px, hits: [{file, line}], files: Map(file -> lines[]) }
for (const f of findings) {
  if (!groups.has(f.raw)) groups.set(f.raw, { raw: f.raw, px: f.px, hits: [], files: new Map() });
  const g = groups.get(f.raw);
  g.hits.push({ file: f.file, line: f.line });
  if (!g.files.has(f.file)) g.files.set(f.file, []);
  g.files.get(f.file).push(f.line);
}

const allGroups = [...groups.values()];
// Half-pixel sizes (fractional px, the clearest drift per the task) first, then the
// odd-integer tail, each bucket ranked by usage count descending.
const halfPixelGroups = allGroups
  .filter((g) => Math.abs(g.px - Math.round(g.px)) > 1e-6)
  .sort((a, b) => b.hits.length - a.hits.length);
const integerTailGroups = allGroups
  .filter((g) => Math.abs(g.px - Math.round(g.px)) <= 1e-6)
  .sort((a, b) => b.hits.length - a.hits.length);

const distinctFiles = new Set(findings.map((f) => f.file));

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------
function renderGroup(g) {
  const parts = [];
  const fileCount = g.files.size;
  parts.push(`### ${g.raw} (${g.hits.length} use${g.hits.length === 1 ? "" : "s"} across ${fileCount} file${fileCount === 1 ? "" : "s"})`);
  parts.push("");
  if (g.px === SUB_FLOOR_PX) {
    parts.push(SUB_FLOOR_NOTE);
    parts.push("");
  }
  const fileList = [...g.files.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  for (const [file, lineList] of fileList) {
    const sortedLines = [...lineList].sort((a, b) => a - b);
    parts.push(`- **${file}** (${sortedLines.length}x): ${sortedLines.map((l) => `${file}:${l}`).join(", ")}`);
  }
  return parts.join("\n");
}

const lines = [];
lines.push("# Type-scale one-off report");
lines.push("");
lines.push(
  "Report-mode only (no gating). Generated by `npm run type-check-scale` " +
    "(scripts/detect-type-scale-outliers.mjs). Flags arbitrary `text-[Npx]` / `text-[N.Npx]` " +
    "font-size utilities whose pixel value is outside the locked type scale " +
    "(_design-system/LOCKFILE.md section 2 + section 2.5, project CLAUDE.md \"text size\" row).",
);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Files scanned (app/ + components/ + components-legacy/, .tsx): ${filesScanned}`);
lines.push("");
lines.push(`${HERO_H1_CONTRADICTION_NOTE}`);
lines.push("");

lines.push("## Summary");
lines.push("");
lines.push(`- Total off-scale usages: ${findings.length}`);
lines.push(`- Distinct off-scale values: ${allGroups.length} (${halfPixelGroups.length} half-pixel, ${integerTailGroups.length} odd-integer)`);
lines.push(`- Files touched: ${distinctFiles.size}`);
lines.push("");
if (allGroups.length) {
  lines.push("Top 5 by volume:");
  const top5 = [...allGroups].sort((a, b) => b.hits.length - a.hits.length).slice(0, 5);
  for (const g of top5) lines.push(`- ${g.raw}: ${g.hits.length} uses`);
  lines.push("");
}

lines.push(`## Half-pixel sizes (${halfPixelGroups.length} distinct values, the clearest drift)`);
lines.push("");
lines.push(
  "A fractional px value (text-[12.5px], text-[13.5px], ...) has no half-pixel role anywhere " +
    "in the locked type scale; every role in LOCKFILE section 2 / 2.5 is defined in whole " +
    "pixels. These are listed first, ranked by usage count.",
);
lines.push("");
if (!halfPixelGroups.length) {
  lines.push("_none_");
  lines.push("");
} else {
  for (const g of halfPixelGroups) {
    lines.push(renderGroup(g));
    lines.push("");
  }
}

lines.push(`## Odd-integer tail (${integerTailGroups.length} distinct values)`);
lines.push("");
lines.push(
  "A whole-number px value not present anywhere in ALLOWED_PX below (17, 19, 21, 25, 46, 48, " +
    "80, and similar), ranked by usage count.",
);
lines.push("");
if (!integerTailGroups.length) {
  lines.push("_none_");
  lines.push("");
} else {
  for (const g of integerTailGroups) {
    lines.push(renderGroup(g));
    lines.push("");
  }
}

lines.push("## Allowed scale (appendix, not a violation list)");
lines.push("");
lines.push(
  "Every px value this detector treats as locked, so a reader can see the target scale " +
    "without opening LOCKFILE.md. Ambiguous entries are marked; they are included as ALLOWED " +
    "per this detector's own false-negatives-over-false-positives instruction.",
);
lines.push("");
const sortedAllowed = [...ALLOWED_PX.keys()].sort((a, b) => a - b);
for (const px of sortedAllowed) {
  lines.push(`- **${px}px**`);
  for (const citation of ALLOWED_PX.get(px)) lines.push(`  - ${citation}`);
}
lines.push("");
lines.push(`- ${SUB_FLOOR_NOTE}`);
lines.push("");

lines.push("## Tunables");
lines.push("");
lines.push("- `ALLOWED_PX` (top of script): the locked type scale. Extend here only with a citation to a LOCKFILE / CLAUDE.md row, never a guessed value.");
lines.push("- `TEXT_SIZE_RE`: the detection regex. Matches `text-[Npx]`, `text-[N.Npx]`, `text-[Nrem]`, `text-[N.Nrem]`; does not match `text-[clamp(...)]` by design.");
lines.push("- Scan roots: `app/`, `components/`, `components-legacy/`, `.tsx` only, same as the sibling detectors.");
lines.push("");

writeFileSync(REPORT_PATH, lines.join("\n"));

// ---------------------------------------------------------------------------------------
// stdout summary
// ---------------------------------------------------------------------------------------
console.log("");
console.log(`Type-scale scan: ${filesScanned} candidate .tsx files`);
console.log(`  Total off-scale usages: ${findings.length}`);
console.log(`  Distinct off-scale values: ${allGroups.length} (${halfPixelGroups.length} half-pixel, ${integerTailGroups.length} odd-integer)`);
console.log(`  Files touched: ${distinctFiles.size}`);
console.log(`  Report: ${relRoot(REPORT_PATH)}`);
console.log("");
if (allGroups.length) {
  console.log("Top 5 by volume:");
  const top5 = [...allGroups].sort((a, b) => b.hits.length - a.hits.length).slice(0, 5);
  for (const g of top5) console.log(`  ${g.raw}: ${g.hits.length} uses`);
  console.log("");
}
console.log(HERO_H1_CONTRADICTION_NOTE);
console.log("");
