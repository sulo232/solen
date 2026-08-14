#!/usr/bin/env node
// type-scale-gate.mjs (PreToolUse: Edit | Write)
//
// Owner ruling ("wire gates for what's decided"): the locked type scale
// (_design-system/LOCKFILE.md section 2 + section 2.5, project CLAUDE.md "text size" row) is
// a decided rule, so a NET-NEW off-scale text-[Npx] / text-[N.Npx] utility gets blocked at
// edit time, not just surfaced later in a report. This gate imports the SAME shared allowed-
// scale module the report-mode detector (scripts/detect-type-scale-outliers.mjs) uses
// (scripts/lib/type-scale-allowed.mjs), so the two can never diverge, per the owner's own
// "wire gates for what's decided" instruction (same pattern as icon-blessed-context-gate.mjs
// / icon-blessed-context.mjs).
//
// Scope: app/**/*.tsx and components/**/*.tsx (Edit/Write only; net-new only, same discipline
// as icon-blessed-context-gate.mjs / pre-edit-drift-gate.sh: the codebase already has 422
// existing off-scale usages across 117 files per the detector's last run, and pre-existing
// violations in a file must NEVER block an unrelated edit to that file).
//
// NET-NEW check: reconstruct the file's FULL text after the edit would apply (Edit: current
// on-disk text with old_string -> new_string substituted once; Write: tool_input's content
// directly), count off-scale text-[Npx] occurrences in both the current (pre-edit) and the
// reconstructed (post-edit) full text via the shared offScaleValues(), and block only if the
// post-edit count is HIGHER. A count comparison (not a line-diff) survives line-shift noise
// from an edit elsewhere in the file and cannot be tricked by an edit that merely moves an
// existing off-scale value around.
//
// Both Hero H1 clamp endpoints (28 and 40) are allowed straight from the shared ALLOWED_PX
// (the parked LOCKFILE section 2 vs section 2.5 contradiction, _design-system/QUESTIONS.md
// "Consistency-system research tensions" item 2); this gate does not re-decide that.
//
// Escape hatches (a false positive must never trap you):
//   Per line:  add `type-scale-ok: <reason>` on the offending line.
//   This turn: touch .claude/type-scale-gate-skip.flag        # 30-minute TTL
//   Session:   export SOLEN_TYPE_SCALE_GATE=0
//
// FAIL-OPEN: any error (bad JSON, unreadable file, unexpected tool shape) -> allow. A gate
// bug must never brick editing.
//
// Self-test: pipe {"tool_name":"Write","tool_input":{"file_path":"...tsx","content":"..."}}
// on stdin and check the exit code (0 = allow, 2 = block).

import { existsSync, readFileSync, statSync } from "node:fs";
import { relative, sep, join } from "node:path";
import { REPO_ROOT } from "../lib/scan-surface.mjs";
import { offScaleValues, nearestAllowedPx } from "../lib/type-scale-allowed.mjs";

function allow() {
  process.exit(0);
}
function block(message) {
  process.stderr.write(message);
  process.exit(2);
}

if ((process.env.SOLEN_TYPE_SCALE_GATE ?? "1") === "0") allow();

const FLAG = join(REPO_ROOT, ".claude", "type-scale-gate-skip.flag");
try {
  if (existsSync(FLAG)) {
    const ageMs = Date.now() - statSync(FLAG).mtimeMs;
    if (ageMs <= 30 * 60 * 1000) allow();
  }
} catch {
  // ignore, fail open below via normal flow
}

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  allow();
}

let data;
try {
  data = JSON.parse(raw);
} catch {
  allow();
}

const tool = data.tool_name || "";
const ti = data.tool_input || {};
const filePath = String(ti.file_path || "");
if (!filePath) allow();

// Scope: app/**/*.tsx and components/**/*.tsx only, same literal scope as the icon gate
// (components-legacy intentionally NOT included here, unlike the report-mode detector's
// wider scan; easy to extend if the owner wants it gated too).
const relPath = relative(REPO_ROOT, filePath).split(sep).join("/");
const inScope = /^(app|components)\/.*\.tsx$/.test(relPath);
if (!inScope) allow();
if (relPath.includes("/node_modules/") || relPath.includes("/.next/")) allow();

let oldFullText = "";
let newFullText = null;

try {
  if (tool === "Edit") {
    const oldString = ti.old_string ?? "";
    const newString = ti.new_string ?? "";
    if (existsSync(filePath)) oldFullText = readFileSync(filePath, "utf8");
    const idx = oldFullText.indexOf(oldString);
    if (oldString && idx !== -1) {
      newFullText = oldFullText.slice(0, idx) + newString + oldFullText.slice(idx + oldString.length);
    } else {
      // old_string not found verbatim (unusual - the real Edit tool would itself error).
      // Fail open rather than guess.
      allow();
    }
  } else if (tool === "MultiEdit") {
    const edits = ti.edits || [];
    if (existsSync(filePath)) oldFullText = readFileSync(filePath, "utf8");
    let cur = oldFullText;
    for (const e of edits) {
      const oldString = e.old_string ?? "";
      const newString = e.new_string ?? "";
      const idx = cur.indexOf(oldString);
      if (!oldString || idx === -1) {
        allow();
      }
      cur = cur.slice(0, idx) + newString + cur.slice(idx + oldString.length);
    }
    newFullText = cur;
  } else if (tool === "Write") {
    if (existsSync(filePath)) oldFullText = readFileSync(filePath, "utf8");
    newFullText = ti.content ?? "";
  } else {
    allow();
  }
} catch {
  allow();
}

if (newFullText === null) allow();

// Per-line escape hatch: a line carrying `type-scale-ok: <reason>` is exempted from counting
// as an off-scale value (mirrors `icon-ok:` / `drift-ok:` / `selected-ok:` conventions
// elsewhere in this repo).
function stripOkLines(text) {
  return text
    .split("\n")
    .map((line) => (/type-scale-ok\s*:/i.test(line) ? "" : line))
    .join("\n");
}

let oldValues = [];
let newValues = [];
try {
  oldValues = offScaleValues(stripOkLines(oldFullText));
  newValues = offScaleValues(stripOkLines(newFullText));
} catch {
  allow();
}

if (newValues.length <= oldValues.length) allow();

// Report the added off-scale value(s): the tail of newValues beyond oldValues.length is not
// necessarily "what's new" positionally once lines shift, so instead report every DISTINCT
// raw value whose count increased between old and new (a real net-new addition, not just
// relocation of an existing one).
function countByRaw(list) {
  const m = new Map();
  for (const v of list) m.set(v.raw, (m.get(v.raw) ?? 0) + 1);
  return m;
}
const oldCounts = countByRaw(oldValues);
const newCounts = countByRaw(newValues);
const added = [];
for (const [raw, count] of newCounts) {
  const prev = oldCounts.get(raw) ?? 0;
  if (count > prev) added.push({ raw, delta: count - prev, px: newValues.find((v) => v.raw === raw).px });
}
added.sort((a, b) => b.delta - a.delta);

function renderAdded(a) {
  const nearest = nearestAllowedPx(a.px);
  const nearestLabel = nearest.map((n) => `text-[${n}px]`).join(" or ");
  return `  ${a.raw} is off-scale (added ${a.delta}x); nearest allowed = ${nearestLabel}`;
}

const msg = [
  "TYPE-SCALE GATE (owner ruling: wire gates for what's decided):",
  "",
  "  This edit adds a NET-NEW off-scale text-[Npx] font-size utility, outside the locked",
  "  type scale (_design-system/LOCKFILE.md section 2 + section 2.5).",
  `  file: ${relPath}`,
  "",
  ...(added.length ? added.map(renderAdded) : [`  post-edit off-scale count rose from ${oldValues.length} to ${newValues.length}`]),
  "",
  "  Pick the nearest locked role/size instead of an arbitrary value. Full scale + citations:",
  "  _design-system/_type-scale-report.md (appendix) or LOCKFILE.md section 2 / 2.5.",
  "",
  "  Genuine false positive? add `type-scale-ok: <reason>` on the line, or",
  "  `touch .claude/type-scale-gate-skip.flag` for this turn.",
].filter(Boolean);
block(msg.join("\n") + "\n");
