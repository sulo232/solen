#!/usr/bin/env node
// icon-blessed-context-gate.mjs (PreToolUse: Edit | Write)
//
// Owner ruling (2026-07-23, _design-system/QUESTIONS.md line 599, over-consistency finding
// #9): 3D category icons are allowed ONLY in an enumerated set of blessed contexts (see
// scripts/lib/icon-blessed-context.mjs). This gate BLOCKS an Edit/Write that adds a NET-NEW
// 3D-icon reference outside those contexts. It imports the SAME classifier the report-mode
// detector (scripts/detect-icon-system-mismatch.mjs) uses, so the two can never diverge,
// per the owner's own "wire gates for what's decided" instruction.
//
// Scope: app/**/*.tsx and components/**/*.tsx (Edit/Write only; net-new only, same
// discipline as pre-edit-drift-gate.sh and no-black-selected-gate.py: pre-existing
// violations in a file never block an unrelated edit to that file).
//
// NET-NEW check: reconstruct the file's FULL text after the edit would apply (Edit:
// current on-disk text with old_string -> new_string substituted once; Write: tool_input's
// content directly), classify EVERY 3D-icon reference in both the current (pre-edit) and
// the reconstructed (post-edit) full text, and block only if the post-edit VIOLATION COUNT
// is higher than the pre-edit one. A count comparison (not a line-diff) survives line-shift
// noise from an edit elsewhere in the file and cannot be tricked by an edit that merely
// moves an existing violation around.
//
// Escape hatches (a false positive must never trap you):
//   Per line:  add `icon-ok: <reason>` on the offending line.
//   This turn: touch .claude/icon-gate-skip.flag        # 30-minute TTL
//   Session:   export SOLEN_ICON_GATE=0
//
// FAIL-OPEN: any error (bad JSON, unreadable file, unexpected tool shape) -> allow. A gate
// bug must never brick editing.
//
// Self-test: pipe {"tool_name":"Write","tool_input":{"file_path":"...tsx","content":"..."}}
// on stdin and check the exit code (0 = allow, 2 = block).

import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, classifyAllReferences } from "../lib/icon-blessed-context.mjs";

const HOOK_DIR = dirname(fileURLToPath(import.meta.url));

function allow() {
  process.exit(0);
}
function block(message) {
  process.stderr.write(message);
  process.exit(2);
}

if ((process.env.SOLEN_ICON_GATE ?? "1") === "0") allow();

const FLAG = join(REPO_ROOT, ".claude", "icon-gate-skip.flag");
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

// Scope: app/**/*.tsx and components/**/*.tsx only (literal scope per the owner's
// instruction; components-legacy is intentionally NOT included here, unlike the report-mode
// detector's wider scan - easy to extend if the owner wants it gated too).
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

// Per-line escape hatch: a line carrying `icon-ok: <reason>` is exempted from counting as
// a violation (mirrors `drift-ok:` / `selected-ok:` conventions elsewhere in this repo).
function stripOkLines(text) {
  return text
    .split("\n")
    .map((line) => (/icon-ok\s*:/i.test(line) ? "" : line))
    .join("\n");
}

let oldCount = 0;
let newCount = 0;
let newViolations = [];
try {
  oldCount = classifyAllReferences(relPath, stripOkLines(oldFullText)).flagged.length;
  const newCls = classifyAllReferences(relPath, stripOkLines(newFullText));
  newCount = newCls.flagged.length;
  newViolations = newCls.flagged;
} catch {
  allow();
}

if (newCount <= oldCount) allow();

const worst = newViolations[0];
const msg = [
  "ICON-BLESSED-CONTEXT GATE (owner ruling 2026-07-23, _design-system/QUESTIONS.md line 599):",
  "",
  "  This edit adds a 3D category-icon reference outside every blessed context.",
  `  file: ${relPath}${worst ? `:${worst.line}` : ""}`,
  worst ? `  asset: ${worst.assetPath}` : "",
  "",
  "  BLESSED contexts (the only places a 3D icon is allowed):",
  "    1. Homepage: app/[locale]/page.tsx + app/[locale]/_components/homepage/**",
  "    2. Empty-state trays: an iconSrc prop on <EmptyTray ...> / <EmptyState ...>",
  "    3. Category-navigation pills: inside an object literal with slug: + route:/label:/href:",
  "",
  "  fix: use a Lucide line icon instead, or move the 3D asset into one of the contexts above.",
  "",
  "  Genuine false positive? add `icon-ok: <reason>` on the line, or",
  "  `touch .claude/icon-gate-skip.flag` for this turn.",
].filter(Boolean);
block(msg.join("\n") + "\n");
