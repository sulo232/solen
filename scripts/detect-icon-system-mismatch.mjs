#!/usr/bin/env node
//
// Icon-system mismatch detector. Sibling to detect-near-duplicates.mjs: report-mode ONLY,
// never a gate.
// Catches the exact class of drift no existing gate saw (owner trigger, 2026-07-23): the
// 3D illustrated category icons (public/icons/categories/*.png,
// public/illustrations/categories/*.png) mixed with Lucide line icons AS THE SAME kind of
// picker/list-item icon in one view.
//
// RULE (owner ruling 2026-07-23, _design-system/QUESTIONS.md line 599, over-consistency
// finding #9, supersedes the original homepage-only draft this file shipped with): 3D
// category icons are NOT homepage-only. The rule is ENUMERATE BLESSED SURFACES: a 3D icon
// is allowed in an enumerated set of contexts (see BLESSED CONTEXTS below) and flagged
// everywhere else. All blessed-context logic lives in scripts/lib/icon-blessed-context.mjs
// and is imported here AND by the gate, so the two can never diverge.
//
//   Run:  npm run icon-check
//   Out:  _design-system/_icon-system-report.md  +  a stdout summary

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  REPO_ROOT,
  RASTER_3D_DIRS,
  INCLUDED_SVG_ASSETS,
  EXCLUDED_SVG_ASSETS,
  isHomepageFile,
  classifyAllReferences,
} from "./lib/icon-blessed-context.mjs";

const REPORT_PATH = join(REPO_ROOT, "_design-system/_icon-system-report.md");

// GLOBAL-LAYOUT files render on EVERY page. Not a flagging signal by itself (Header.tsx's
// category-pill usage is blessed under context 3), purely an informational callout so the
// owner can see at a glance which blessed usages have the widest blast radius.
const GLOBAL_LAYOUT_PATTERNS = [/^app\/\[locale\]\/_components\/layout\/Header\.tsx$/];
function isGlobalLayout(relPath) {
  return GLOBAL_LAYOUT_PATTERNS.some((re) => re.test(relPath));
}

// Coarse surface bucket for the report, derived from the path, informational only.
function surfaceBucket(relPath) {
  if (isGlobalLayout(relPath)) return "layout (global, renders on every page)";
  const m = /^app\/\[locale\]\/_components\/([^/]+)\//.exec(relPath);
  if (m) return m[1];
  if (relPath.startsWith("app/[locale]/dev/")) return "dev sandbox (not customer-facing)";
  if (relPath.startsWith("components-legacy/")) return "components-legacy";
  if (relPath.startsWith("components/")) return "components";
  const appM = /^app\/\[locale\]\/([^/]+)\//.exec(relPath);
  if (appM) return appM[1];
  return "other";
}

// ---------------------------------------------------------------------------------------
// Walk every .tsx under app/, components/, components-legacy/. Modeled on
// detect-near-duplicates.mjs's walkTsx (same IGNORE_DIRS / Finder-copy-artifact skip),
// deliberately NOT scan-surface.mjs's scanComponents(): that helper excludes Next-reserved
// filenames like page.tsx, and this detector needs page.tsx walked (the home route itself,
// plus dev/search-model-b/page.tsx as a candidate).
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

const LUCIDE_IMPORT_RE = /from\s+["']lucide-react["']/;

// ---------------------------------------------------------------------------------------
// Classify every 3D-icon reference in every file via the SHARED helper (the same function
// the gate calls). blessed[] and flagged[] entries carry { assetPath, line, reason }.
// ---------------------------------------------------------------------------------------
const perFile = []; // { relPath, lucideMixed, blessed: [...], flagged: [...] }

for (const absPath of candidateFiles) {
  const relPath = relRoot(absPath);
  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch {
    continue;
  }
  const { blessed, flagged } = classifyAllReferences(relPath, text);
  if (!blessed.length && !flagged.length) continue;
  perFile.push({ relPath, lucideMixed: LUCIDE_IMPORT_RE.test(text), blessed, flagged });
}

const filesWithViolations = perFile.filter((f) => f.flagged.length > 0);
const filesWithBlessedOnly = perFile.filter((f) => f.flagged.length === 0 && f.blessed.length > 0);

filesWithViolations.sort((a, b) => a.relPath.localeCompare(b.relPath));
filesWithBlessedOnly.sort((a, b) => a.relPath.localeCompare(b.relPath));

// Soft, informational-only heuristic (owner explicitly: "if you cannot detect same-role
// sibling-mixing reliably, that is fine ... note it as a softer report-level heuristic, do
// NOT block on it"). Approximation: a file that both (a) has a BLESSED 3D-icon reference and
// (b) imports lucide-react. This does NOT prove same-role mixing (Header.tsx's Lucide import
// is for nav chevrons/menu, a different role than its category pills - a legitimate, non-
// violating case), it only flags "two icon systems coexist in this file, worth an eyeball".
const softMixingCandidates = perFile
  .filter((f) => f.blessed.length > 0 && f.lucideMixed)
  .sort((a, b) => a.relPath.localeCompare(b.relPath));

const totalFlaggedRefs = filesWithViolations.reduce((n, f) => n + f.flagged.length, 0);

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------
const CANONICAL_RULE =
  "3D category icons are allowed ONLY in an enumerated set of blessed contexts (owner ruling " +
  "2026-07-23, _design-system/QUESTIONS.md line 599): (1) homepage, (2) empty-state trays " +
  "(<EmptyTray>/<EmptyState> iconSrc), (3) category-navigation pill object literals. Everywhere " +
  "else is a violation. The core defect the owner was furious about was never a 3D icon existing " +
  "off the home route, it was MIXING 3D + Lucide as the icon for the SAME kind of list item / " +
  "picker (the onboarding category-pill grid).";

const BLESSED_CONTEXT_DEFS = [
  "1. Homepage: `app/[locale]/page.tsx` + `app/[locale]/_components/homepage/**`.",
  "2. Empty-state trays: the icon is an `iconSrc` prop on (or lexically inside the attribute " +
    "list of) an `<EmptyTray ...>` or `<EmptyState ...>` JSX element.",
  "3. Category-navigation pills: the icon sits inside a category-pill OBJECT LITERAL, i.e. near " +
    "a `slug:` key alongside a `route:` / `label:` / `href:` key (the shape of CATEGORY_PILLS, " +
    "HEADER_CATEGORIES, or any array with the same shape).",
];

function renderFlagged(f) {
  const parts = [];
  parts.push(`- **${f.relPath}**`);
  parts.push(`  - surface: ${surfaceBucket(f.relPath)}${isGlobalLayout(f.relPath) ? " (global layout, renders on every page)" : ""}`);
  for (const h of f.flagged) parts.push(`  - ${f.relPath}:${h.line} references \`${h.assetPath}\` (not inside any blessed context)`);
  parts.push(`  - rule: ${CANONICAL_RULE}`);
  parts.push(`  - fix: move to a Lucide line icon, or confine the 3D asset to a blessed context (homepage / EmptyTray-EmptyState / a category-pill array).`);
  return parts.join("\n");
}

const lines = [];
lines.push("# Icon-system mismatch report");
lines.push("");
lines.push("Generated by `npm run icon-check` (scripts/detect-icon-system-mismatch.mjs). Report-mode only, not a gate.");
lines.push("");
lines.push(`Canonical rule: ${CANONICAL_RULE}`);
lines.push("");
lines.push("## Blessed-context definitions (tunable, owner may bless more later)");
lines.push("");
for (const def of BLESSED_CONTEXT_DEFS) lines.push(def);
lines.push("");
lines.push("Both this detector and the PreToolUse gate import the SAME classifier (`scripts/lib/icon-blessed-context.mjs`) for this decision, so they cannot diverge.");
lines.push("");
lines.push(`3D-icon asset set: ${RASTER_3D_DIRS.map((d) => `\`/${d.replace(/^public\//, "")}/*.png\``).join(", ")} (raster, definitive per owner spec) + \`${INCLUDED_SVG_ASSETS.join("`, `")}\` (SVG, included, see decision below).`);
lines.push("");
lines.push("## SVG inspection decision (public/icons/category/*.svg)");
lines.push("");
lines.push("- `coiffeur.svg`: 17 paths, 3-tone shaded fill matching the shaded-illustration family of the PNG set, named after a real category. INCLUDED as a 3D-icon asset.");
for (const ex of EXCLUDED_SVG_ASSETS) lines.push(`- \`${ex.path.split("/").pop()}\`: EXCLUDED, ${ex.reason}.`);
lines.push("");

lines.push(`## Violations: 3D icon in a NON-blessed context (${filesWithViolations.length} file${filesWithViolations.length === 1 ? "" : "s"}, ${totalFlaggedRefs} reference${totalFlaggedRefs === 1 ? "" : "s"})`);
lines.push("");
if (!filesWithViolations.length) {
  lines.push("_none_. The codebase is currently compliant with the owner's enumerated blessed-context rule.");
} else {
  for (const f of filesWithViolations) lines.push(renderFlagged(f));
}
lines.push("");

lines.push(`## Soft heuristic: possible same-role 3D + Lucide mixing (${softMixingCandidates.length}, informational ONLY, not a violation gate)`);
lines.push("");
lines.push(
  "A file that has at least one BLESSED 3D-icon reference AND also imports lucide-react. This " +
    "does NOT prove same-role mixing (a file can legitimately use Lucide for one role, e.g. nav " +
    "chevrons, and a blessed 3D icon for an unrelated role, e.g. category pills - Header.tsx is " +
    "exactly this and is NOT a violation). Reliable same-role/same-picker detection is a semantic " +
    "judgment a static string/AST signal cannot make; this list is a pointer for a human eyeball, " +
    "not an enforced rule (the gate never blocks on this).",
);
lines.push("");
if (!softMixingCandidates.length) {
  lines.push("_none_");
} else {
  for (const f of softMixingCandidates) {
    lines.push(`- **${f.relPath}** (${f.blessed.length} blessed 3D-icon reference${f.blessed.length === 1 ? "" : "s"}, reasons: ${[...new Set(f.blessed.map((b) => b.reason))].join(", ")})`);
  }
}
lines.push("");

const totalBlessedRefs = perFile.reduce((n, f) => n + f.blessed.length, 0);
lines.push(`## Allowed usage (${totalBlessedRefs} blessed reference${totalBlessedRefs === 1 ? "" : "s"} across ${filesWithBlessedOnly.length} clean file${filesWithBlessedOnly.length === 1 ? "" : "s"}, listed for transparency)`);
lines.push("");
if (!filesWithBlessedOnly.length) {
  lines.push("_none_");
} else {
  for (const f of filesWithBlessedOnly) {
    const byReason = new Map();
    for (const h of f.blessed) {
      if (!byReason.has(h.reason)) byReason.set(h.reason, []);
      byReason.get(h.reason).push(h);
    }
    lines.push(`- **${f.relPath}**${isGlobalLayout(f.relPath) ? " (global layout, renders on every page)" : ""}`);
    for (const [reason, hits] of byReason) {
      lines.push(`  - ${reason}: ${hits.map((h) => `line ${h.line} (\`${h.assetPath}\`)`).join(", ")}`);
    }
  }
}
lines.push("");

lines.push("## Tunables");
lines.push("");
lines.push("- `ALLOWED_SURFACE_PATTERNS` (scripts/lib/icon-blessed-context.mjs): the homepage allowlist. Extend here if the owner blesses another surface (e.g. city landing pages).");
lines.push("- The empty-state tag names (`EmptyTray`, `EmptyState`) and the category-pill shape check (`slug:` + `route:`/`label:`/`href:`) live in the same shared module.");
lines.push("- `GLOBAL_LAYOUT_PATTERNS` (this file): files that render on every page, called out for transparency only, not a flagging signal.");
lines.push("- 3D-icon PNG prefixes are the two raster directories; a newly added PNG in either is picked up automatically (prefix match, no per-file enumeration needed).");
lines.push("");

writeFileSync(REPORT_PATH, lines.join("\n"));

// ---------------------------------------------------------------------------------------
// stdout summary
// ---------------------------------------------------------------------------------------
console.log("");
console.log(`Icon-system mismatch scan (blessed-context model): ${candidateFiles.length} candidate .tsx files`);
console.log(`  Violations (non-blessed 3D-icon usage): ${filesWithViolations.length} files, ${totalFlaggedRefs} references`);
console.log(`  Allowed (blessed usage): ${filesWithBlessedOnly.length} files`);
console.log(`  Soft same-role-mixing candidates (informational): ${softMixingCandidates.length}`);
console.log(`  Report: ${relRoot(REPORT_PATH)}`);
console.log("");
if (filesWithViolations.length) {
  console.log("Violations:");
  for (const f of filesWithViolations) {
    console.log(`  ${f.relPath}${isGlobalLayout(f.relPath) ? "  [GLOBAL LAYOUT]" : ""}`);
    for (const h of f.flagged) console.log(`    :${h.line}  ${h.assetPath}`);
  }
  console.log("");
} else {
  console.log("No violations: the codebase is compliant with the enumerated blessed-context rule.");
  console.log("");
}
