#!/usr/bin/env node
//
// Selected-state divergence detector. Sibling to detect-icon-system-mismatch.mjs /
// detect-type-scale-outliers.mjs: report-mode ONLY, never a gate. The design system locks
// ONE selected/active treatment for pills/chips/tabs/options (project CLAUDE.md design-contract
// "selected / active" row): `bg-s-bg-sunken` (#F4F4F5) + `text-s-ink` + semibold, over a WHITE
// unselected, the TabPill treatment. But selected states drift across screens (the graveyarded
// customer-overhaul missed exactly this, owner trigger 2026-07-23). This detector surfaces
// divergences from the canonical for review.
//
// A `no-black-selected-gate.py` PreToolUse gate already blocks NET-NEW black/ink-fill (and, via
// the same regex, blue bg-s-accent/border-s-accent) selected states going forward. It cannot see
// pre-existing drift already in the tree (net-new only, by design). This detector is the
// retroactive sweep: it surfaces EXISTING divergences, including a blind spot the gate does not
// cover at all (a canonical gray fill with blue TEXT instead of ink text, e.g. SearchAutocomplete).
//
//   Run:  npm run selected-check
//   Out:  _design-system/_selected-state-report.md  +  a stdout summary
//
// Deliberately simple, same "do not over-engineer it" posture as the sibling detectors: a
// line-based ternary-string regex scan (modeled on no-black-selected-gate.py's INK_TERNARY), no
// AST, no scoring. Tunables live at the top of this file.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const REPORT_PATH = join(REPO_ROOT, "_design-system/_selected-state-report.md");

// ---------------------------------------------------------------------------------------
// Tunables (edit here, not inline below).
// ---------------------------------------------------------------------------------------

// Files excluded outright: the avatar SelectedCheckBadge is a named, LOCKED exception (ink
// border for photo contrast) per the design contract "selected / active" row.
const FILE_EXCLUDE_RE = /selectedcheckbadge|\/avatar\.tsx$/i;

// A condition matching one of these is NOT a selection test at all (variant/lifecycle/status
// words), regardless of an "active"/"selected" substring elsewhere in the line. Ported from
// no-black-selected-gate.py's NOT_SELECTION, minus the date/slot/calendar/time words (those are
// a SANCTIONED selection, not a non-selection - handled separately as an exception, see below).
const HARD_EXCLUDE_RE =
  /\b(variant|isPrimary|primary|commit|submit|cta|disabled|isDisabled|loading|isLoading|pending|error|invalid|danger|destructive|today|isToday)\b/i;

// Booking date/time-slot selection is the ONE sanctioned blue-fill exception (design contract
// "selected / active" row: "booking date/slot stays blue"). Report it for transparency, never as
// a hard divergence.
const BOOKING_CONTEXT_RE = /\b(date|slot|calendar|time|booking|buchen|zeit)\b/i;

// The ONE locked DateTimePicker primitive (project CLAUDE.md "date / time" design-contract row:
// "ONE DateTimePicker primitive... NO bespoke date UI"). Every selection ternary inside this file
// is booking date/slot selection by construction, even where the immediate condition text (e.g. a
// `selectedTone` prop check) has no literal "date"/"slot" word within the proximity window.
const BOOKING_FILE_RE = /datetimepicker/i;

// Dictionary words that legitimately CONTAIN the substring "active" but are not a selection
// signal (inactive/reactive status flags, "interactive" UI copy, etc). Stripped before the
// substring test so they can never manufacture a false selection-signal match.
const ACTIVE_DICTIONARY_NOISE_RE =
  /\b(inactive|reactive|interactive|attractive|proactive|retroactive|hyperactive|radioactive)\b/gi;

// A DATA-STATUS property access (`promo.is_active`, `program.is_active`, `status === 'active'`)
// is a semantic status field, not a selection control (task false-positive exclusion #2).
// Stripped before the substring test.
const STATUS_FIELD_STRIP_RE =
  /[\w$]+(?:\?\.|\.)\s*is_active\b|[\w$]+(?:\?\.|\.)\s*active\b|\bstatus\s*===?\s*['"]active['"]|\bstate\s*===?\s*['"]active['"]/gi;

// Tailwind PRESS PSEUDO (`active:scale-*`, `active:brightness-*`): a colon-suffixed variant
// prefix, never a selected-state signal (task false-positive exclusion #1). Stripped before the
// substring test as a safety net (it should never reach a JS condition, but guard anyway).
const ACTIVE_PSEUDO_STRIP_RE = /\bactive:\s*/gi;

// A ternary can pair two string literals that are NOT className treatments at all (aria text,
// API method verbs, inline-style pixel/rgba/hex values, i18n copy). Require the selected branch
// to actually contain a recognizable Tailwind utility token before it is treated as a "selected
// treatment" candidate at all; otherwise the report fills with noise like "verfügbar" / "PATCH" /
// "0 2px 6px rgba(...)" that this detector was never meant to grade.
const CLASS_LIKE_RE =
  /(^|[\s"'`])(bg|text|border|ring|scale|rounded|shadow|opacity|font|gap|flex|grid|transition|duration|hover|focus|outline|tracking|leading|w|h|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|inset|z|min|max)-[a-z0-9]/i;

// ---------------------------------------------------------------------------------------
// File walk. Modeled on the sibling detectors' walkTsx (same IGNORE_DIRS, same Finder/iCloud
// copy-artifact skip). Scans app/, components/, components-legacy/, same scope as the siblings.
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
// Detection: a ternary whose CONDITION reads as a selection test and whose TRUE-branch string
// literal is the selected-state treatment. Modeled on no-black-selected-gate.py's INK_TERNARY:
// the condition capture spans up to a bounded window so a prettier-formatted multiline ternary
// (condition, newline(s), `?`) still matches.
// ---------------------------------------------------------------------------------------
const TERNARY_RE =
  /([^?]{0,200}?)\?\s*[`"']([^`"']{0,300})[`"']\s*:\s*[`"']([^`"']{0,300})[`"']/g;

function lineOf(text, idx) {
  let n = 1;
  for (let i = 0; i < idx; i++) if (text[i] === "\n") n++;
  return n;
}

// Real selection signal per the task's INCLUDE list: isSelected, selected === , selected.has(,
// aria-selected, data-selected, data-state="active"/"selected", isActive (camelCase identifiers
// like activeIndex/activeBoard are substring-caught by the plain "active" test below, since a
// regex \b boundary does not fire inside a continuous camelCase token).
function selectionSignal(rawCondition) {
  let stripped = rawCondition
    .replace(ACTIVE_DICTIONARY_NOISE_RE, "§")
    .replace(STATUS_FIELD_STRIP_RE, "§")
    .replace(ACTIVE_PSEUDO_STRIP_RE, "§");
  const statusFieldStripped = stripped !== rawCondition && !/active|selected/i.test(stripped);
  const hasSignal = /active|selected|aria-selected|data-selected|data-state/i.test(stripped);
  return { hasSignal, statusFieldStripped };
}

// Image/avatar SELECTION tile: the true-branch className belongs to a <button>/<div> whose
// FIRST child (immediately after this tag's own closing `>`) is an <Image>/<img>. Task
// exclusion #3: report separately as a likely exception, never as a hard divergence. The `>`
// search excludes an arrow-function `=>` (negative lookbehind) so an onClick before className
// never gets mistaken for the tag close.
function isImageSelectionTile(text, matchEnd) {
  const rest = text.slice(matchEnd, matchEnd + 600);
  const closeRel = rest.search(/(?<!=)>/);
  if (closeRel === -1) return false;
  const after = rest.slice(closeRel + 1, closeRel + 1 + 300);
  return /^\s*(?:\{\s*\/\*[^*]*\*\/\s*\}\s*)?<\s*(Image|img)\b/.test(after);
}

function classifyBranch(branchRaw) {
  const b = branchRaw.toLowerCase();
  const hasBlueBg = b.includes("bg-s-accent");
  const hasBlueBorder = b.includes("border-s-accent") || b.includes("ring-s-accent");
  const hasBlueText = b.includes("text-s-accent");
  const hasBlueHex = b.includes("#276ef1");
  const hasAnyBlue = hasBlueBg || hasBlueBorder || hasBlueText || hasBlueHex;
  const hasInkFill = b.includes("bg-s-ink") && (b.includes("text-white") || b.includes("text-s-bg"));
  const isCanonical =
    b.includes("bg-s-bg-sunken") && b.includes("text-s-ink") && !hasAnyBlue && !hasInkFill;
  const isContentTabUnderline =
    /border-b(-2)?\b/.test(b) &&
    b.includes("border-s-ink") &&
    !b.includes("bg-s-") &&
    !hasAnyBlue &&
    !hasInkFill;
  return { hasBlueBg, hasBlueBorder, hasBlueText, hasBlueHex, hasAnyBlue, hasInkFill, isCanonical, isContentTabUnderline };
}

const findings = {
  compliantCount: 0,
  excludedStatusFieldCount: 0,
  excludedHardKeywordCount: 0,
  excludedNotClassLikeCount: 0,
  alreadyGated: [], // ink-fill, see no-black-selected
  exceptionBookingSlot: [],
  exceptionImageSelection: [],
  exceptionContentTab: [],
  blueFill: [],
  blueBorder: [],
  blueText: [],
  otherDivergent: [],
};

for (const absPath of candidateFiles) {
  const relPath = relRoot(absPath);
  if (FILE_EXCLUDE_RE.test(relPath)) continue;
  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch {
    continue;
  }

  for (const m of text.matchAll(TERNARY_RE)) {
    const [full, condRaw, trueBranch, falseBranch] = m;
    const cond = condRaw.trim();
    if (!cond) continue;

    const { hasSignal, statusFieldStripped } = selectionSignal(cond);
    if (!hasSignal) {
      if (statusFieldStripped) findings.excludedStatusFieldCount++;
      continue;
    }
    if (HARD_EXCLUDE_RE.test(cond)) {
      findings.excludedHardKeywordCount++;
      continue;
    }
    if (!CLASS_LIKE_RE.test(trueBranch)) {
      findings.excludedNotClassLikeCount++;
      continue;
    }

    const matchStart = m.index;
    const matchEnd = matchStart + full.length;
    const line = lineOf(text, matchStart);
    const cls = classifyBranch(trueBranch);
    const entry = {
      relPath,
      line,
      condition: cond.replace(/\s+/g, " ").slice(0, 120),
      trueBranch: trueBranch.trim(),
      falseBranch: falseBranch.trim(),
    };

    if (cls.isCanonical) {
      findings.compliantCount++;
      continue;
    }

    if (cls.hasInkFill) {
      entry.note = cls.hasAnyBlue
        ? "ink-fill selected state (also carries a blue border/ring), already covered by no-black-selected-gate.py"
        : "ink-fill selected state, already covered by no-black-selected-gate.py";
      findings.alreadyGated.push(entry);
      continue;
    }

    if (
      BOOKING_FILE_RE.test(relPath) ||
      BOOKING_CONTEXT_RE.test(cond) ||
      BOOKING_CONTEXT_RE.test(text.slice(Math.max(0, matchStart - 200), matchStart))
    ) {
      entry.note = "booking date/time-slot selection, the one sanctioned blue-fill exception (design-contract row)";
      findings.exceptionBookingSlot.push(entry);
      continue;
    }

    if (isImageSelectionTile(text, matchEnd)) {
      entry.note = "selection tile directly wraps an <Image>/<img> (avatar/photo-selection exception family)";
      findings.exceptionImageSelection.push(entry);
      continue;
    }

    if (cls.isContentTabUnderline) {
      entry.note = "ink underline treatment (content-tab exception: title + 2px ink underline, no fill)";
      findings.exceptionContentTab.push(entry);
      continue;
    }

    if (cls.hasBlueBg) {
      findings.blueFill.push(entry);
    } else if (cls.hasBlueBorder) {
      findings.blueBorder.push(entry);
    } else if (cls.hasBlueText || cls.hasBlueHex) {
      findings.blueText.push(entry);
    } else {
      findings.otherDivergent.push(entry);
    }
  }
}

// Informational-only, codebase-wide counts of the two named false-positive traps, independent
// of the ternary parse above, so the report can show the scale of what the guards are protecting
// against (not just "0 flagged", but "N present, all correctly excluded").
let activePseudoFileCount = 0;
let statusFieldFileCount = 0;
for (const absPath of candidateFiles) {
  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch {
    continue;
  }
  if (/\bactive:[a-z-]/i.test(text)) activePseudoFileCount++;
  if (/\bis_active\b/.test(text)) statusFieldFileCount++;
}

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------
const CANONICAL_RULE =
  "Selected/active for a pill/chip/option/filter = `bg-s-bg-sunken` (#F4F4F5) + `text-s-ink` + " +
  "semibold, over a WHITE unselected (the TabPill treatment, project CLAUDE.md design-contract " +
  "\"selected / active\" + \"filter pill\" rows). Sanctioned exceptions: (1) content tabs = " +
  "title + 2px ink underline, no fill; (2) booking date/time-slot = blue fill; (3) avatar " +
  "SelectedCheckBadge = ink border (photo contrast); (4) the ONE commit button = ink fill.";

function renderEntry(f) {
  return (
    `- **${f.relPath}:${f.line}**\n` +
    `  - condition: \`${f.condition}\`\n` +
    `  - selected-branch: \`${f.trueBranch}\`\n` +
    `  - unselected-branch: \`${f.falseBranch}\`\n` +
    (f.note ? `  - note: ${f.note}\n` : "") +
    `  - fix: canonical selected = \`bg-s-bg-sunken text-s-ink font-semibold\` over a white unselected.`
  );
}

function renderSection(title, description, list) {
  const lines = [`## ${title} (${list.length})`, "", description, ""];
  if (!list.length) {
    lines.push("_none_");
  } else {
    for (const f of list) {
      lines.push(renderEntry(f));
      lines.push("");
    }
  }
  return lines.join("\n");
}

const totalFlagged =
  findings.blueFill.length + findings.blueBorder.length + findings.blueText.length + findings.otherDivergent.length;
const totalExceptions =
  findings.exceptionBookingSlot.length + findings.exceptionImageSelection.length + findings.exceptionContentTab.length;

const lines = [];
lines.push("# Selected-state divergence report");
lines.push("");
lines.push(
  "Report-mode only (no gating). Generated by `npm run selected-check` " +
    "(scripts/detect-selected-state-divergence.mjs). Surfaces a conditional className tied to a " +
    "SELECTION state whose selected-branch treatment diverges from the canonical gray-sunken " +
    "recipe and is not a sanctioned exception.",
);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Files scanned (app/ + components/ + components-legacy/, .tsx): ${candidateFiles.length}`);
lines.push("");
lines.push(`Canonical rule: ${CANONICAL_RULE}`);
lines.push("");
lines.push(
  "A `no-black-selected-gate.py` PreToolUse gate already blocks NET-NEW black/ink-fill (and blue " +
    "bg-s-accent/border-s-accent) selected states. It cannot see pre-existing drift (net-new only " +
    "by design), and it does not see a canonical gray fill with blue TEXT (no bg/border token to " +
    "match on) at all. Ink-fill hits below are noted, not re-reported as a hard divergence.",
);
lines.push("");

lines.push("## Summary");
lines.push("");
lines.push(`- Hard divergences (blue-fill + blue-border + blue-text + other-divergent): **${totalFlagged}**`);
lines.push(`  - blue-fill: ${findings.blueFill.length}`);
lines.push(`  - blue-border: ${findings.blueBorder.length}`);
lines.push(`  - blue-text: ${findings.blueText.length}`);
lines.push(`  - other-divergent: ${findings.otherDivergent.length}`);
lines.push(`- Already-gated (ink-fill, see no-black-selected): ${findings.alreadyGated.length}`);
lines.push(`- Likely-exception, reported for transparency: ${totalExceptions}`);
lines.push(`  - booking date/time-slot: ${findings.exceptionBookingSlot.length}`);
lines.push(`  - image-selection: ${findings.exceptionImageSelection.length}`);
lines.push(`  - content-tab underline: ${findings.exceptionContentTab.length}`);
lines.push(`- Compliant selected-state ternaries (canonical gray fill, skipped): ${findings.compliantCount}`);
lines.push(
  `- False-positive exclusions: ${findings.excludedStatusFieldCount} status-field/press-pseudo ` +
    `condition(s) correctly skipped, ${findings.excludedHardKeywordCount} variant/lifecycle ` +
    `condition(s) correctly skipped, ${findings.excludedNotClassLikeCount} non-className string ` +
    `ternary(s) (aria text, API verbs, inline-style values) correctly skipped`,
);
lines.push(
  `- Codebase-wide scale of the two named traps (informational, not a per-candidate count): ` +
    `${activePseudoFileCount} file(s) contain a Tailwind \`active:\` press pseudo, ` +
    `${statusFieldFileCount} file(s) contain an \`is_active\` data-status field`,
);
lines.push("");

lines.push(
  renderSection(
    "Blue-fill selected",
    "`bg-s-accent` on the selected branch of a selection pill/chip/option, not in a booking-slot context.",
    findings.blueFill,
  ),
);
lines.push("");
lines.push(
  renderSection(
    "Blue-border selected",
    "`border-s-accent` or `ring-s-accent` on the selected branch, not in a booking-slot context.",
    findings.blueBorder,
  ),
);
lines.push("");
lines.push(
  renderSection(
    "Blue-text selected",
    "`text-s-accent` (or the literal `#276EF1`) on the selected branch. This is the blind spot the " +
      "existing no-black-selected-gate.py cannot see: a canonical `bg-s-bg-sunken` fill with blue " +
      "text instead of ink text.",
    findings.blueText,
  ),
);
lines.push("");
lines.push(
  renderSection(
    "Other-divergent selected",
    "A selected-branch treatment that is neither the canonical gray-sunken recipe nor a blue-accent " +
      "token nor a sanctioned exception (a different gray shade, a bare border with no fill, a scale " +
      "transform, etc).",
    findings.otherDivergent,
  ),
);
lines.push("");

lines.push(`## Already-gated (${findings.alreadyGated.length})`);
lines.push("");
lines.push(
  "Black/ink-fill selected states (`bg-s-ink` + `text-white`/`text-s-bg`). A " +
    "`no-black-selected-gate.py` PreToolUse gate already exists for this class; listed here for " +
    "transparency only, not counted in the hard-divergence total above.",
);
lines.push("");
if (!findings.alreadyGated.length) {
  lines.push("_none_");
} else {
  for (const f of findings.alreadyGated) {
    lines.push(renderEntry(f));
    lines.push("");
  }
}
lines.push("");

lines.push(`## Likely-exception, reported for transparency (${totalExceptions})`);
lines.push("");
lines.push("Not hard divergences. Each sub-section maps to a named sanctioned exception.");
lines.push("");
lines.push(
  renderSection(
    "Booking date/time-slot (sanctioned blue)",
    "The one sanctioned blue-fill exception (design-contract row: \"booking date/slot stays blue\").",
    findings.exceptionBookingSlot,
  ),
);
lines.push("");
lines.push(
  renderSection(
    "Image-selection (likely avatar/photo-tile exception)",
    "A selected-branch ink/blue border+ring directly on a tile that wraps an `<Image>`/`<img>`. The " +
      "design-contract avatar exception is narrower (the SelectedCheckBadge component specifically); " +
      "these are reported separately, not auto-approved, so the owner can confirm each one belongs " +
      "in the same family.",
    findings.exceptionImageSelection,
  ),
);
lines.push("");
lines.push(
  renderSection(
    "Content-tab (ink underline, no fill)",
    "An ink `border-b` underline with no background fill and no blue token: the sanctioned content-" +
      "tab treatment (title + 2px ink underline, active = 600 ink + underline).",
    findings.exceptionContentTab,
  ),
);
lines.push("");

lines.push("## Tunables");
lines.push("");
lines.push("- `FILE_EXCLUDE_RE` (top of this file): files excluded outright (the avatar SelectedCheckBadge).");
lines.push("- `HARD_EXCLUDE_RE`: variant/lifecycle/status conditions that are never a selection test.");
lines.push("- `BOOKING_CONTEXT_RE`: keywords that route a hit to the booking-slot exception section instead of a hard divergence.");
lines.push("- `ACTIVE_DICTIONARY_NOISE_RE` / `STATUS_FIELD_STRIP_RE` / `ACTIVE_PSEUDO_STRIP_RE`: the three false-positive guards (dictionary words containing \"active\", `.is_active` data-status property access, Tailwind `active:` press pseudo).");
lines.push("- `TERNARY_RE`: the detection regex. Ternary-only (no `clsx({...})` object-literal form, no non-ternary co-occurrence scan), same simplicity posture as the sibling detectors.");
lines.push("- Scan roots: `app/`, `components/`, `components-legacy/`, `.tsx` only, same as the sibling detectors.");
lines.push("");

writeFileSync(REPORT_PATH, lines.join("\n"));

// ---------------------------------------------------------------------------------------
// stdout summary
// ---------------------------------------------------------------------------------------
console.log("");
console.log(`Selected-state divergence scan: ${candidateFiles.length} candidate .tsx files`);
console.log(`  Hard divergences: ${totalFlagged} (blue-fill ${findings.blueFill.length}, blue-border ${findings.blueBorder.length}, blue-text ${findings.blueText.length}, other-divergent ${findings.otherDivergent.length})`);
console.log(`  Already-gated (ink-fill): ${findings.alreadyGated.length}`);
console.log(`  Likely-exception (transparency only): ${totalExceptions} (booking-slot ${findings.exceptionBookingSlot.length}, image-selection ${findings.exceptionImageSelection.length}, content-tab ${findings.exceptionContentTab.length})`);
console.log(`  Compliant (canonical gray fill, skipped): ${findings.compliantCount}`);
console.log(`  False-positive exclusions: ${findings.excludedStatusFieldCount} status-field/press-pseudo, ${findings.excludedHardKeywordCount} variant/lifecycle, ${findings.excludedNotClassLikeCount} non-className string`);
console.log(`  Report: ${relRoot(REPORT_PATH)}`);
console.log("");
if (totalFlagged) {
  console.log("Hard divergences:");
  for (const [label, list] of [
    ["blue-fill", findings.blueFill],
    ["blue-border", findings.blueBorder],
    ["blue-text", findings.blueText],
    ["other-divergent", findings.otherDivergent],
  ]) {
    for (const f of list) console.log(`  [${label}] ${f.relPath}:${f.line}`);
  }
  console.log("");
} else {
  console.log("No hard divergences found.");
  console.log("");
}
