#!/usr/bin/env node
//
// Gap-ladder drift detector. Fifth sibling to detect-near-duplicates.mjs / detect-icon-system-
// mismatch.mjs / detect-type-scale-outliers.mjs / detect-selected-state-divergence.mjs:
// report-mode by default (always exits 0). A --gate flag switches it to a blocking check that
// exits non-zero on any finding or any unreadable path, the same convention scripts/check-press.mjs
// and its siblings already use (--gate = exit 1 on failure, 0 on pass).
//
// WHAT IT CATCHES. The binary 16-and-32 spacing law (the operator round in _design-system/
// TASTE_LOG.md 2026-07-15, Round D1, generalised in _design-system/TERMINAL_PRINCIPLES.md
// section 3) shipped twice in one session with the file's own header claiming compliance while
// the code carried illegal 24px gaps: app/[locale]/dev/host-flows/_flow-floor.tsx (five mt-6)
// and app/[locale]/dev/host-flows/page.tsx (two mt-6). Both are fixed now.
//
// SECOND ROUND, three independent reviewers, two defects reproduced by hand and confirmed
// before this round started. Eight defects fixed here, each named at its own fix below:
//   A1 (false positive) the utility regex scanned the WHOLE file, so an import path
//      ("./mt-6/helper"), a decoy string, and plain JSX text all reported as real utilities.
//   B1 (fail open) an unreadable/missing DIRECTORY (not just a file) was silently swallowed by
//      walkTsx's own try/catch, the same shape a placeholder scanner shipped with earlier.
//   C1 em/pt arbitrary units were dropped entirely with no signal at all.
//   C2/C3/C4 a class value built by string concatenation, a template literal broken across
//      lines, or a template literal with a numeric interpolation were all invisible, total
//      silence, indistinguishable from clean.
//   C5 .jsx files were never discovered even under a recognised operator path.
//   C6 the four claim markers had no fallback, so a file naming the same law in slightly
//      different words (the exact document, the exact date, no "Round D1") dropped out of
//      governance entirely.
//
// THIRD ROUND, one defect found by the coordinator opening the files directly, same class as
// the eight above: FIX B2, a bare "TERMINAL_PRINCIPLES.md" filename mention counted as a strong
// claim even when the surrounding prose was a CITATION disclaiming binding governance, not a
// claim of being governed. See hasStrongClaim() below.
//
// GOVERNED, now in THREE separate classes, reported loudest to quietest (a file that states a
// law and breaks it is worse than one that names it loosely, which is worse than one never told
// at all, only sitting under the right path):
//
//   1. CLAIM (strong)  - the file's own text contains "binary 16 and 32", "Round D1", or
//                        "SCREEN CLASS: operator screen" (self-sufficient on their own), OR a
//                        "TERMINAL_PRINCIPLES.md" mention sitting on the same line or an adjacent
//                        line as a self-referential word ("governed", "operator screen", "SCREEN
//                        CLASS", "follows", "binds"). FIX B2 (round three): a bare
//                        TERMINAL_PRINCIPLES.md filename used to count on its own, so a CITATION
//                        that disclaims governance in the same breath ("the nearest things are
//                        TERMINAL_PRINCIPLES.md (design law, not product options)") fired the same
//                        loud bucket as a genuine claim ("governed by ... TERMINAL_PRINCIPLES.md").
//                        See hasStrongClaim() below for the exact co-occurrence check.
//   2. WEAK-CLAIM      - FIX C6. The file's own text names the law in looser words: "merchant"
//                        co-occurring with the 2026-07-15 date (this repo's own prose calls the
//                        law "the 2026-07-15 merchant round"; neither "Round D1" nor
//                        "TERMINAL_PRINCIPLES.md" is spelled out), or a bare case-insensitive
//                        "operator screen" anywhere. TIGHTENED from a bare TASTE_LOG.md-plus-date
//                        co-occurrence after a live-repo run put SEVEN real customer files
//                        (Footer.tsx, Header.tsx, both legal pages, impressum, sicherheit,
//                        terms/discovery) into governance, all citing an unrelated same-day
//                        TASTE_LOG.md:187 decision (border-radius, not this law); see the marker
//                        definition below for the full account. This is deliberately a WEAKER,
//                        separately reported signal, not promoted to the loud claim-breaking
//                        bucket: a bare "operator screen" substring can be negated ("this is NOT
//                        an operator screen") with no way for a text scan to tell, so it earns its
//                        own bucket rather than the loudest one. Named limitation, not fixed
//                        further.
//   3. PATH            - the file sits under a real operator surface, per CLAUDE.md's scope
//                        block ("/dashboard/*, the merchant terminal, the queue display") plus
//                        this dev review route, confirmed present on disk before writing: any
//                        "dashboard/" path segment (app/[locale]/dashboard incl. queue-display,
//                        components-legacy/dashboard, app/[locale]/_components/dashboard),
//                        app/terminal/, app/[locale]/dev/terminal*/ (the terminal preview
//                        family), app/[locale]/dev/host-flows/. The customer-facing walk-in
//                        tracker app/[locale]/queue/[token]/page.tsx (rating, tip flow, the
//                        customer's own place in line) is deliberately NOT matched.
//
//   A file matching none of the three is a customer screen (4pt scale, 24px legal) or an
//   unrelated file, and is skipped outright: flagging it would be the "worthless noise" this
//   detector was explicitly told never to produce.
//
// ILLEGAL, deliberately conservative, MARGIN/GAP/SPACE utilities only: mt- mb- my- ms- me- gap-
// gap-x- gap-y- space-y- space-x-, plus arbitrary-value forms (mt-[24px], gap-[1.5rem],
// mt-[20pt]). PADDING (p- pt- pb- px- py-) is never scanned, it is not a gap. A value computing
// to MORE than 16px that is not EXACTLY 32px flags: 20, 24, 28, 36, 40, 48 flag; 4, 8, 12, 16,
// 32 do not. A negative-margin variant (-mt-6, a position nudge, not a gap between two blocks)
// is never flagged.
//
// FIX A1, SCANNED POSITIONS NOW CONSTRAINED. The illegal-utility scan no longer runs over the
// whole file. It runs ONLY inside real class-value string content: a className attribute's
// plain string, template literal, or braced expression (className="...", className={`...`},
// className={cond ? "..." : "..."}), and the argument list of a cn(...) or clsx(...) call
// anywhere in the file (so a call assigned to a variable before being spread into className
// still fires, exactly the case a reviewer named as currently working and told not to break).
// No AST: brace/paren/quote depth is tracked by hand (findMatchingDelimiter below), matching
// this file's existing "deliberately simple" posture. An import path, a decoy string never used
// as a class, and plain JSX text between tags are never inside any of these positions, so none
// of them can fire any more.
//
// FIX B1, DIRECTORY READ FAILURES NO LONGER SWALLOWED. walkTsx's own readdirSync catch now
// pushes into the SAME `unreadable` list a file-read failure uses, so an unreadable or missing
// directory (including a missing --root itself) is reported exactly as loudly, counts in the
// report, and trips --gate exactly the same way a single unreadable file does. It is never
// silently skipped and never counted as clean.
//
// FIX C1, PT CONVERTS, EM DOES NOT. pt is a fixed, unambiguous, context-free CSS unit (1pt =
// 4/3 px, always, everywhere), so mt-[20pt] converts and is judged like any other value. em is
// genuinely NOT context-free: it resolves against the COMPUTED font-size of the element it is
// applied to, which this static text scanner cannot know (it could be 13px, 30px, anything
// inherited), so guessing a root 16px would be presenting an invented number as a measured one,
// exactly what this project's own "don't invent" rule forbids. mt-[1.5em] is instead routed to
// the new review bucket below rather than silently dropped.
//
// FIX C2/C3/C4, A THIRD BUCKET: "review by hand", counted separately, NEVER a finding, NEVER
// tripping --gate. No static tool can resolve a class value built by runtime string
// concatenation, a template literal with a token split across a raw line break, or a template
// literal with a numeric interpolation, and pretending otherwise would be worse than saying so.
// Three narrow, precise regexes catch the shape of each (a recognised prefix ending immediately
// before a string's closing quote then a `+`; a recognised prefix immediately before a raw
// newline; a recognised prefix immediately before `${`), run across the WHOLE governed file
// rather than only inside a className/cn/clsx position: their trigger shapes are specific enough
// (they require the literal characters of the concatenation/interpolation/newline immediately
// adjacent to one of the ten prefixes) that widening them to the whole file does not reintroduce
// FIX A1's false positives, and it is the only way to catch a class value assembled in a bare
// variable (`const cls = "mt-" + "6 gap-8";`) before it is later spread into a className. Named,
// accepted limitation: the concatenation check only catches a split landing immediately after
// the prefix's own hyphen, the exact shape reproduced; a split elsewhere in the token is a
// residual, acknowledged gap in the same "no static tool can resolve these" family.
//
// FIX C5, .jsx DISCOVERED. walkTsx now matches .tsx and .jsx, the same pair this repo's own
// scripts/lib/scan-surface.mjs already matches for page.tsx/page.jsx. Zero .jsx files exist in
// the repo today, so this was a dormant hole, not an active miss; it no longer is one.
//
//   Run:   npm run gap-ladder-check                          (report mode, always exits 0)
//   Gate:  node scripts/detect-gap-ladder-drift.mjs --gate    (exits 1 on any finding or any
//                                                               unreadable file/directory)
//   Out:   _design-system/_gap-ladder-report.md  +  a stdout summary
//
// A file OR DIRECTORY this detector cannot read is reported LOUDLY, in its own section of both
// the stdout summary and the report, and counts as a --gate failure. It is never silently
// skipped and never counted as clean: a sibling tool shipped earlier this session printed "safe
// to hand over" for a path it could not read, which is the exact failure this detector must not
// repeat.
//
// Test-only CLI extension, used by scripts/verify/gap-ladder-suite.mjs and never by the real repo
// run: `--root <dir>` replaces the default app/ + components/ + components-legacy/ roots with a
// single directory, so the self-test can build a synthetic tree (e.g. <tmp>/app/[locale]/
// dashboard/x.tsx) and exercise the same path-governance regex the live repo uses. In this mode
// the report file is NEVER written, so a self-test run can never clobber the real repo's report.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const REPORT_PATH = join(REPO_ROOT, "_design-system/_gap-ladder-report.md");

// ---------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------
function parseArgs(argv) {
  let gate = false;
  let root = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--gate") gate = true;
    else if (argv[i] === "--root") { root = argv[i + 1]; i++; }
  }
  return { gate, root };
}
const { gate: GATE_MODE, root: ROOT_OVERRIDE } = parseArgs(process.argv.slice(2));

// ---------------------------------------------------------------------------------------
// Governance markers (tunables, edit here only, never inline below).
// ---------------------------------------------------------------------------------------
// FIX B2 (round three). A bare "TERMINAL_PRINCIPLES.md" mention used to fire the strong claim on
// its own, so a CITATION ("the nearest things are `_design-system/TERMINAL_PRINCIPLES.md` (design
// law, not product options)", app/[locale]/dev/outside-bookings/page.tsx:6, explicitly disclaiming
// binding governance in the same breath) was indistinguishable from a genuine claim of being bound
// by it (app/[locale]/dev/host-flows/_flow-phone.tsx:10, "governed by _design-system/
// TERMINAL_PRINCIPLES.md"). Three markers stay self-sufficient because they are already
// self-referential by construction, no other document can be quoted next to them and mean
// something else: "binary 16 and 32" and "Round D1" both name THIS law specifically, and
// "SCREEN CLASS: operator screen" is this file's own governance-declaration header line. The
// fourth, a bare "TERMINAL_PRINCIPLES.md" filename, is not self-referential on its own, a prose
// paragraph can cite the file while explaining why it does NOT apply. It now only counts as a
// strong claim when a self-referential word ("governed", "operator screen", "SCREEN CLASS",
// "follows", "binds") sits on the same line as the mention or on an adjacent line either side.
const SELF_SUFFICIENT_CLAIM_RE = /binary 16[\s-]and[\s-]32|Round D1|SCREEN CLASS:\s*operator screen/i;
const TERMINAL_PRINCIPLES_MENTION_RE = /TERMINAL_PRINCIPLES\.md/i;
const SELF_REFERENTIAL_WORD_RE = /governed|operator screen|SCREEN CLASS|follows|binds/i;

function hasStrongClaim(text) {
  if (SELF_SUFFICIENT_CLAIM_RE.test(text)) return true;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!TERMINAL_PRINCIPLES_MENTION_RE.test(lines[i])) continue;
    const windowStart = Math.max(0, i - 1);
    const windowEnd = Math.min(lines.length - 1, i + 1);
    const window = lines.slice(windowStart, windowEnd + 1).join("\n");
    if (SELF_REFERENTIAL_WORD_RE.test(window)) return true;
  }
  return false;
}

// FIX C6. A weaker, separately-bucketed signal: "merchant" co-occurring with the 2026-07-15 date
// (the file's own prose for this law elsewhere in this repo calls it "the 2026-07-15 merchant
// round"; the reviewer's own reproduction case read "Governed by the merchant round in
// _design-system/TASTE_LOG.md 2026-07-15"), or a bare "operator screen" mention, case-insensitive.
//
// TIGHTENED after a live-repo run, not left at the literal "TASTE_LOG plus the date" instruction:
// a bare TASTE_LOG.md + 2026-07-15 co-occurrence, with no "merchant" required, put SEVEN real
// customer files into governance (Footer.tsx, Header.tsx, impressum, both legal pages,
// sicherheit, terms/discovery). Every one cites `TASTE_LOG.md:187 2026-07-15`, an entirely
// unrelated border-radius/prose-sweep decision, not the spacing law. Grep confirmed TASTE_LOG.md
// logs at least FIVE distinct, unrelated decisions dated 2026-07-15 (Taste Lab round 1, Taste
// Book approved, STRANDED DECISIONS surfaced, Wave-1 fix pairs, and Round D1 itself), so the bare
// date is not a marker on this document, it is a date many unrelated rounds share. "merchant" is
// required alongside it because that is the one word both the reviewer's own example and this
// repo's own prose use to name THIS law specifically, and it is absent from all seven false
// positives (checked directly, zero hits).
const WEAK_CLAIM_MARKER_RE =
  /merchant[^\n]{0,100}2026-07-15|2026-07-15[^\n]{0,100}merchant|operator screen/i;

const OPERATOR_PATH_RE =
  /(^|\/)dashboard\/|^app\/terminal\/|^app\/\[locale\]\/dev\/terminal[^/]*\/|^app\/\[locale\]\/dev\/host-flows\//;

// ---------------------------------------------------------------------------------------
// Detection (tunables).
// ---------------------------------------------------------------------------------------
const UTILITY_RE =
  /\b(gap-x|gap-y|space-y|space-x|gap|mt|mb|my|ms|me)-(\[[^\]]+\]|[A-Za-z0-9.]+)/g;

// Returns { px, review }. px is a number when the value is a definite, countable length; null
// otherwise. review is a human string when the value COULD be a real spacing utility but cannot
// be safely resolved (em, FIX C1), null when the value is either a resolved length or is
// confidently not a length at all (auto/full/screen/percentages/var(), silently skipped exactly
// as before, false-negative on purpose per this detector's whole "false-negatives over false-
// positives" posture, matching the sibling type-scale detector's own stated instruction).
function utilityToPx(rawValue) {
  if (rawValue === "px") return { px: 1, review: null };
  const arbitrary = /^\[\s*(-?[\d.]+)\s*(px|rem|pt|em)\s*\]$/i.exec(rawValue);
  if (arbitrary) {
    const num = parseFloat(arbitrary[1]);
    const unit = arbitrary[2].toLowerCase();
    if (unit === "px") return { px: num, review: null };
    if (unit === "rem") return { px: num * 16, review: null };
    if (unit === "pt") return { px: num * (4 / 3), review: null }; // fixed, context-free: 1pt = 4/3 px.
    if (unit === "em") {
      return {
        px: null,
        review:
          "em resolves against the element's own computed font-size, not a fixed root size, " +
          "cannot be statically converted to px",
      };
    }
  }
  if (/^-?\d+(\.\d+)?$/.test(rawValue)) return { px: parseFloat(rawValue) * 4, review: null };
  return { px: null, review: null };
}

function isIllegal(px) {
  return px !== null && px > 16 + 1e-6 && Math.abs(px - 32) > 1e-6;
}

// Display only: 20pt converts to 26.666666666666664px in raw floating point. isIllegal above
// already ran on the raw value before this is ever called, so rounding here never changes a
// verdict, only how the number reads in the report and stdout.
function roundPx(px) {
  return Math.round(px * 100) / 100;
}

// FIX C2/C3/C4, "review by hand" pattern detectors. Run across the whole governed file (not
// scoped to a className/cn/clsx position, see the FIX C2/C3/C4 header note above for why that is
// safe here). Each requires one of the ten prefixes immediately adjacent to the literal
// character sequence that breaks static resolution, so none of them can match an import path,
// a decoy string, or plain JSX text (FIX A1's false-positive shapes never contain a "+" right
// after a prefix's own hyphen, a raw newline right after one, or a "${" right after one).
const CONCAT_SUSPECT_RE =
  /\b(gap-x|gap-y|space-y|space-x|gap|mt|mb|my|ms|me)-["'`]\s*\+/g;
const TEMPLATE_NEWLINE_SUSPECT_RE =
  /\b(gap-x|gap-y|space-y|space-x|gap|mt|mb|my|ms|me)-[ \t]*\n/g;
const TEMPLATE_INTERP_SUSPECT_RE =
  /\b(gap-x|gap-y|space-y|space-x|gap|mt|mb|my|ms|me)-\$\{/g;

// ---------------------------------------------------------------------------------------
// Comment stripper. Replaces the BODY of every // and /* */ comment with whitespace (newlines
// kept as newlines) so line numbers of everything else survive unchanged. Tracks string/template
// literal state so a "//" or "/*" INSIDE a string is never mistaken for a comment start, and a
// real className string is never stripped.
// ---------------------------------------------------------------------------------------
function stripComments(text) {
  let out = "";
  let i = 0;
  const n = text.length;
  let inLineComment = false;
  let inBlockComment = false;
  let inString = null; // "'" | '"' | "`" | null
  while (i < n) {
    const c = text[i];
    const c2 = i + 1 < n ? text[i + 1] : "";
    if (inLineComment) {
      if (c === "\n") { inLineComment = false; out += "\n"; } else out += " ";
      i++;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && c2 === "/") { inBlockComment = false; out += "  "; i += 2; continue; }
      out += c === "\n" ? "\n" : " ";
      i++;
      continue;
    }
    if (inString) {
      if (c === "\\") { out += c + c2; i += 2; continue; }
      if (c === inString) { inString = null; out += c; i++; continue; }
      out += c;
      i++;
      continue;
    }
    if (c === "/" && c2 === "/") { inLineComment = true; out += "  "; i += 2; continue; }
    if (c === "/" && c2 === "*") { inBlockComment = true; out += "  "; i += 2; continue; }
    if (c === "'" || c === '"' || c === "`") { inString = c; out += c; i++; continue; }
    out += c;
    i++;
  }
  return out;
}

function lineOf(text, idx) {
  let n = 1;
  for (let k = 0; k < idx; k++) if (text[k] === "\n") n++;
  return n;
}

// ---------------------------------------------------------------------------------------
// FIX A1. Real class-name-position extraction, no AST: hand-rolled delimiter matching, the same
// simplicity posture the sibling detectors already use for their own ternary/ID scans.
// ---------------------------------------------------------------------------------------

// From an opening delimiter at openIdx (openChar), returns the index of its matching closeChar,
// skipping over any string/template literal content in between (so a "}" or ")" inside a nested
// string can never end the match early). Returns text.length on an unterminated delimiter.
function findMatchingDelimiter(text, openIdx, openChar, closeChar) {
  let depth = 0;
  let i = openIdx;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n) {
        if (text[i] === "\\") { i += 2; continue; }
        if (text[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return n;
}

// text[quoteIdx] is an opening quote/backtick. Returns the index of its matching closing
// delimiter (text.length if unterminated).
function findStringEnd(text, quoteIdx) {
  const quote = text[quoteIdx];
  let i = quoteIdx + 1;
  const n = text.length;
  while (i < n) {
    if (text[i] === "\\") { i += 2; continue; }
    if (text[i] === quote) return i;
    i++;
  }
  return n;
}

// Every string/template literal CONTENT span (excluding the quotes themselves) found anywhere
// within [rangeStart, rangeEnd) of text.
function stringLiteralSpansWithin(text, rangeStart, rangeEnd) {
  const spans = [];
  let i = rangeStart;
  while (i < rangeEnd) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") {
      const closeIdx = Math.min(findStringEnd(text, i), rangeEnd);
      spans.push({ start: i + 1, end: closeIdx });
      i = closeIdx + 1;
      continue;
    }
    i++;
  }
  return spans;
}

// The real class-value positions in a file: every string/template literal CONTENT span that
// sits inside a className attribute (plain string, template literal, or braced expression) or
// inside a cn(...) / clsx(...) call's argument list anywhere in the file. A cn(...)/clsx(...)
// call already nested inside a className={...} attribute is not double-counted: its range is a
// subset of the attribute's own range, and the standalone-call pass below skips anything already
// covered by an attribute container found first.
function findClassValueSpans(text) {
  // Two different things: a DIRECT span (className="...", the string's own content is already
  // the final answer, its delimiting quotes sit OUTSIDE the span so a nested search would find
  // nothing) versus a CONTAINER range (className={...} or a cn(/clsx( argument list, which needs
  // a further search for the string/template literals living inside it). Conflating the two was
  // a real bug caught while smoke-testing this fix: className="mt-6" produced zero spans because
  // stringLiteralSpansWithin was run on a range that no longer contained any quote characters.
  const directSpans = [];
  const containerRanges = [];

  const classNameAttrRe = /\bclassName\s*=\s*/g;
  let m;
  while ((m = classNameAttrRe.exec(text))) {
    const after = m.index + m[0].length;
    const c = text[after];
    if (c === '"' || c === "'" || c === "`") {
      const closeIdx = findStringEnd(text, after);
      directSpans.push({ start: after + 1, end: closeIdx });
      classNameAttrRe.lastIndex = closeIdx + 1;
    } else if (c === "{") {
      const closeIdx = findMatchingDelimiter(text, after, "{", "}");
      containerRanges.push({ start: after + 1, end: closeIdx });
      classNameAttrRe.lastIndex = closeIdx + 1;
    }
    // else: className={someIdentifier} with no literal string directly inside; nothing to scan.
  }

  const callRe = /\b(?:cn|clsx)\s*\(/g;
  while ((m = callRe.exec(text))) {
    const openIdx = m.index + m[0].length - 1;
    const closeIdx = findMatchingDelimiter(text, openIdx, "(", ")");
    const insideExisting = containerRanges.some((r) => openIdx >= r.start && closeIdx <= r.end);
    if (!insideExisting) containerRanges.push({ start: openIdx + 1, end: closeIdx });
    callRe.lastIndex = closeIdx + 1;
  }

  const spans = [...directSpans];
  for (const r of containerRanges) spans.push(...stringLiteralSpansWithin(text, r.start, r.end));
  return spans;
}

// ---------------------------------------------------------------------------------------
// File walk. Same IGNORE_DIRS / Finder-copy-artifact skip as the sibling detectors. FIX C5:
// .jsx included, matching scripts/lib/scan-surface.mjs's own page.tsx/page.jsx pattern.
// ---------------------------------------------------------------------------------------
const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude",
]);

const SCAN_ROOT = ROOT_OVERRIDE ? resolve(ROOT_OVERRIDE) : REPO_ROOT;
function relRoot(absPath) {
  return relative(SCAN_ROOT, absPath).split(sep).join("/");
}
// Same as relRoot, but never returns an empty string (which relRoot does when absPath IS
// SCAN_ROOT itself, e.g. a missing --root path). Used only for unreadable entries, so a missing
// scan root still prints something a human can act on instead of a blank line.
function relRootSafe(absPath) {
  const r = relRoot(absPath);
  return r === "" ? absPath : r;
}

// FIX B1. unreadable is declared before walkTsx runs (it is only READ inside walkTsx at call
// time, after this line has already executed, so the closure is safe) so a directory readdirSync
// failure lands in the exact same list a file readFileSync failure does.
const unreadable = []; // { relPath, error }

function walkTsx(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    unreadable.push({ relPath: relRootSafe(dir), error: err.code || err.message || "unknown read error" });
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue; // Finder/iCloud copy artifacts
    const full = join(dir, e.name);
    if (e.isDirectory()) walkTsx(full, out);
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".jsx")) out.push(full);
  }
  return out;
}

const candidateFiles = ROOT_OVERRIDE
  ? walkTsx(SCAN_ROOT)
  : walkTsx(join(REPO_ROOT, "app")).concat(
      walkTsx(join(REPO_ROOT, "components")),
      walkTsx(join(REPO_ROOT, "components-legacy")),
    );

// ---------------------------------------------------------------------------------------
// Scan.
// ---------------------------------------------------------------------------------------
const findings = { claim: [], weakClaim: [], path: [] }; // each entry: { relPath, line, raw, px }
const unparseable = []; // { relPath, line, raw, reason } - FIX C1/C2/C3/C4, never a finding, never gates.
let filesScanned = 0;
let filesGoverned = 0;

for (const absPath of candidateFiles) {
  const relPath = relRoot(absPath);
  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch (err) {
    unreadable.push({ relPath: relRootSafe(absPath), error: err.code || err.message || "unknown read error" });
    continue;
  }
  filesScanned++;

  const claimsStrong = hasStrongClaim(text);
  const claimsWeak = !claimsStrong && WEAK_CLAIM_MARKER_RE.test(text);
  const pathGoverned = OPERATOR_PATH_RE.test(relPath);
  if (!claimsStrong && !claimsWeak && !pathGoverned) continue; // not governed by this law, never flagged.
  filesGoverned++;

  const stripped = stripComments(text);

  // Illegal-utility scan, constrained to real class-value positions (FIX A1).
  for (const span of findClassValueSpans(stripped)) {
    const slice = stripped.slice(span.start, span.end);
    for (const um of slice.matchAll(UTILITY_RE)) {
      const absIdx = span.start + um.index;
      if (absIdx > 0 && stripped[absIdx - 1] === "-") continue; // negative variant: a nudge, not a gap.
      const raw = `${um[1]}-${um[2]}`;
      const { px, review } = utilityToPx(um[2]);
      if (review) {
        unparseable.push({ relPath, line: lineOf(stripped, absIdx), raw, reason: review });
        continue;
      }
      if (!isIllegal(px)) continue;
      const entry = { relPath, line: lineOf(stripped, absIdx), raw, px: roundPx(px) };
      if (claimsStrong) findings.claim.push(entry);
      else if (claimsWeak) findings.weakClaim.push(entry);
      else findings.path.push(entry);
    }
  }

  // Review-by-hand scans, whole governed file (FIX C2/C3/C4, see the header note on why this
  // scope is safe).
  for (const cm of stripped.matchAll(CONCAT_SUSPECT_RE)) {
    unparseable.push({
      relPath,
      line: lineOf(stripped, cm.index),
      raw: cm[0].trim(),
      reason: "class value split by string concatenation (+) right after a spacing prefix, cannot statically resolve the combined utility",
    });
  }
  for (const nm of stripped.matchAll(TEMPLATE_NEWLINE_SUSPECT_RE)) {
    unparseable.push({
      relPath,
      line: lineOf(stripped, nm.index),
      raw: nm[0].trim(),
      reason: "a spacing prefix is immediately followed by a raw newline, a utility token inside a template literal may be split across lines",
    });
  }
  for (const im of stripped.matchAll(TEMPLATE_INTERP_SUSPECT_RE)) {
    unparseable.push({
      relPath,
      line: lineOf(stripped, im.index),
      raw: im[0],
      reason: "a spacing prefix is immediately followed by a template interpolation, cannot statically resolve the utility",
    });
  }
}

const totalClaim = findings.claim.length;
const totalWeakClaim = findings.weakClaim.length;
const totalPath = findings.path.length;
const totalIllegal = totalClaim + totalWeakClaim + totalPath;
const unreadableCount = unreadable.length;
const unparseableCount = unparseable.length;

// ---------------------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------------------
function renderEntry(f) {
  return `- **${f.relPath}:${f.line}** \`${f.raw}\` (${f.px}px, illegal: over 16px and not exactly 32px)`;
}

function renderSection(title, description, list) {
  const lines = [`## ${title} (${list.length})`, "", description, ""];
  if (!list.length) lines.push("_none_");
  else for (const f of list) lines.push(renderEntry(f));
  return lines.join("\n");
}

function renderReviewEntry(f) {
  return `- **${f.relPath}:${f.line}** \`${f.raw}\`: ${f.reason}`;
}

const reportLines = [];
reportLines.push("# Gap-ladder drift report");
reportLines.push("");
reportLines.push(
  "Report-mode only unless run with --gate (scripts/detect-gap-ladder-drift.mjs, npm run " +
    "gap-ladder-check). Flags an illegal margin/gap/space utility (over 16px, not exactly 32px) " +
    "on a file governed by the binary 16-and-32 spacing law: the merchant round in " +
    "_design-system/TASTE_LOG.md 2026-07-15 (Round D1), generalised in " +
    "_design-system/TERMINAL_PRINCIPLES.md section 3.",
);
reportLines.push("");
reportLines.push(`Generated: ${new Date().toISOString()}`);
reportLines.push(`Files scanned (app/ + components/ + components-legacy/, .tsx/.jsx): ${filesScanned}`);
reportLines.push(`Files governed by this law (claim, weak-claim, or path): ${filesGoverned}`);
reportLines.push("");

reportLines.push("## Summary");
reportLines.push("");
reportLines.push(`- Total illegal gap-ladder utilities: **${totalIllegal}**`);
reportLines.push(`  - claim-breaking (the file's own header claims this law): ${totalClaim}`);
reportLines.push(`  - weak-claim (the law named more loosely, own bucket, see below): ${totalWeakClaim}`);
reportLines.push(`  - path-governed only (a real operator surface, never claimed the law): ${totalPath}`);
reportLines.push(`- Review by hand (em/concatenation/broken-template, never a finding, never gates): ${unparseableCount}`);
reportLines.push(`- Unreadable files or directories (never counted clean): ${unreadableCount}`);
reportLines.push("");

reportLines.push(
  renderSection(
    "Claim-breaking, loudest",
    "The file's own header text contains one of the four marker phrases (TERMINAL_PRINCIPLES.md, " +
      "\"binary 16 and 32\", Round D1, \"SCREEN CLASS: operator screen\") while the code carries " +
      "an illegal gap. A file that states this law and breaks it, worse than one never told.",
    findings.claim,
  ),
);
reportLines.push("");
reportLines.push(
  renderSection(
    "Weak-claim",
    "The file's own header text names the same law more loosely (\"merchant\" co-occurring with " +
      "2026-07-15, this repo's own prose for it, or a bare \"operator screen\" mention) rather " +
      "than one of the four exact marker phrases. Reported separately since a bare \"operator " +
      "screen\" substring could in principle be negated (\"this is NOT an operator screen\") " +
      "with no way for a text scan to tell; still a real illegal utility if listed here, just a " +
      "softer signal for WHY the file is governed.",
    findings.weakClaim,
  ),
);
reportLines.push("");
reportLines.push(
  renderSection(
    "Path-governed only",
    "A real operator surface (app/[locale]/dashboard/**, app/terminal/**, " +
      "app/[locale]/dev/terminal*/**, app/[locale]/dev/host-flows/**) carrying an illegal gap, " +
      "with no explicit claim of the law in the file's own header.",
    findings.path,
  ),
);
reportLines.push("");

reportLines.push(`## Review by hand (${unparseableCount})`);
reportLines.push("");
reportLines.push(
  "Never a finding, never counted toward the total above, never trips --gate. No static text " +
    "scanner can safely resolve an em arbitrary value (font-size-relative, not fixed), a class " +
    "value built by runtime string concatenation, or a template literal whose token is split by " +
    "a raw newline or a numeric interpolation. Saying nothing here would be indistinguishable " +
    "from clean, which is worse than naming the file and line and asking for a human look.",
);
reportLines.push("");
if (!unparseableCount) reportLines.push("_none_");
else for (const f of unparseable) reportLines.push(renderReviewEntry(f));
reportLines.push("");

reportLines.push(`## Unreadable files or directories (${unreadableCount})`);
reportLines.push("");
reportLines.push(
  "Never counted clean. A path this detector could not open (a file OR a directory it could not " +
    "list) was never actually checked, so it is reported here instead of silently passing.",
);
reportLines.push("");
if (!unreadableCount) reportLines.push("_none_");
else for (const u of unreadable) reportLines.push(`- **${u.relPath}**: ${u.error}`);
reportLines.push("");

reportLines.push("## Tunables");
reportLines.push("");
reportLines.push("- `hasStrongClaim` / `WEAK_CLAIM_MARKER_RE` (top of this file): the claim phrases, strong and weak.");
reportLines.push("- `OPERATOR_PATH_RE`: the real operator-surface path patterns, verified present on disk before writing.");
reportLines.push("- `UTILITY_RE` / `utilityToPx`: the ten scanned prefixes and the px conversion (px/rem/pt fixed, em routed to review).");
reportLines.push("- `CONCAT_SUSPECT_RE` / `TEMPLATE_NEWLINE_SUSPECT_RE` / `TEMPLATE_INTERP_SUSPECT_RE`: the three review-by-hand shapes.");
reportLines.push("- `isIllegal`: over 16px and not exactly 32px.");
reportLines.push("- `findClassValueSpans`: the real class-name positions the illegal-utility scan is constrained to.");
reportLines.push("- Scan roots: `app/`, `components/`, `components-legacy/`, `.tsx`/`.jsx` only, same as the sibling detectors.");
reportLines.push("");

if (!ROOT_OVERRIDE) writeFileSync(REPORT_PATH, reportLines.join("\n"));

// ---------------------------------------------------------------------------------------
// stdout summary.
// ---------------------------------------------------------------------------------------
console.log("");
console.log(`Gap-ladder scan: ${filesScanned} candidate .tsx/.jsx files (${filesGoverned} governed by claim, weak-claim, or path)`);
console.log(
  `  Total illegal gap-ladder utilities: ${totalIllegal} (${totalClaim} claim-breaking, ${totalWeakClaim} weak-claim, ${totalPath} path-governed-only)`,
);
console.log(`  Review by hand (never a finding, never gates): ${unparseableCount}`);
console.log(`  Unreadable files or directories (never counted clean): ${unreadableCount}`);
console.log(
  `  Report: ${relative(REPO_ROOT, REPORT_PATH).split(sep).join("/")}` +
    (ROOT_OVERRIDE ? " (not written this run, --root test mode)" : ""),
);
console.log("");

if (totalClaim) {
  console.log("Claim-breaking (the file's own header claims this law, loudest):");
  for (const f of findings.claim) console.log(`FINDING claim ${f.relPath}:${f.line} ${f.raw} ${f.px}px`);
  console.log("");
}
if (totalWeakClaim) {
  console.log("Weak-claim (the law named more loosely):");
  for (const f of findings.weakClaim) console.log(`FINDING weakclaim ${f.relPath}:${f.line} ${f.raw} ${f.px}px`);
  console.log("");
}
if (totalPath) {
  console.log("Path-governed only (a real operator surface, never claimed the law in its own header):");
  for (const f of findings.path) console.log(`FINDING path ${f.relPath}:${f.line} ${f.raw} ${f.px}px`);
  console.log("");
}
if (unparseableCount) {
  console.log("REVIEW by hand (never a finding, never gates):");
  for (const f of unparseable) console.log(`REVIEW ${f.relPath}:${f.line} ${f.raw} :: ${f.reason}`);
  console.log("");
}
if (unreadableCount) {
  console.log("UNREADABLE, reported loudly, never counted clean:");
  for (const u of unreadable) console.log(`UNREADABLE ${u.relPath} ${u.error}`);
  console.log("");
}
if (!totalIllegal && !unreadableCount && !unparseableCount) {
  console.log("No illegal gap-ladder utilities found on a governed file, and every candidate path was readable.");
  console.log("");
}

if (GATE_MODE) {
  process.exit(totalIllegal > 0 || unreadableCount > 0 ? 1 : 0);
}
process.exit(0);
