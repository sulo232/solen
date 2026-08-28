#!/usr/bin/env node
//
// Dead-class detector. Finds a literal class token that Tailwind's JIT never generated CSS for,
// the same shape as the no-scrollbar incident: written in 14 places across 10 files, on customer
// and dashboard pages, to hide a scrollbar; the real class is scrollbar-hide (app/globals.css:965).
// It read exactly like a real utility and was invisible in code review; found once by rendering a
// page and looking. Fixed by hand, commit afa4d410d.
//
// WHAT "DEAD" MEANS, and what it does NOT mean. This detector proves ONE fact: the token produces
// no CSS rule. It never claims the element it sits on is "broken" or "unstyled", because that
// depends on every OTHER class on the same element, which no static text scan can know. Worked
// example, found while grading this detector against the live repo: `prose` and `prose-s-ink`
// are dead (no @tailwindcss/typography plugin is installed: `plugins: []` in tailwind.config.js,
// no typography package in package.json, neither name in the compiled CSS) and cost NOTHING,
// because /en/privacy styles every heading, paragraph and list item with its own explicit
// utilities regardless. A dead class can be load-bearing or free; this tool cannot tell you
// which, so it never guesses. Read "review by hand" and "bucket B" the same way: lower
// confidence, not lower severity.
//
// THE ALGORITHM (proven by hand before this file was written, do not redesign it). Tailwind's
// JIT only emits a rule for a class it actually found in the scanned source, so: compile the
// real stylesheet, collect every class selector it contains, and any literal class token in the
// scanned source that is not in that set produces no CSS.
//
//   node_modules/.bin/tailwindcss -i app/globals.css -o <tmp> --minify        (~1.8-2s, verified)
//   const re = /\.((?:[\w-]|\\.)+)/g;  then set.add(m[1].replace(/\\(.)/g, "$1"));   (unescape is
//   load-bearing: Tailwind writes .px-1\.5, .w-\[352px\], .md\:hidden)
//
// KNOWN-ANSWER CONTROL, run before believing anything else this script prints: on the real
// compiled stylesheet, scrollbar-hide, scrollbar-none, group, peer, md:hidden, w-[352px],
// px-1.5, hover:bg-white, aspect-square, font-heading, text-s-ink, group-hover:opacity-100 all
// come back EXISTS; no-scrollbar comes back DEAD. Verified by hand against 3059 real class names
// before this file was written.
//
// SCAN SCOPE, exactly the files Tailwind scanned, no others. tailwind.config.js content:
// ./app/**/*.{js,ts,jsx,tsx,mdx}, ./components/**/*.{js,ts,jsx,tsx}, ./components-legacy/**,
// ./lib/**. A class in a file outside those globs was never seen by Tailwind's JIT, so it would
// look dead when it is not; this detector walks exactly those four roots with exactly those
// extension sets (mdx only under app/), matching scripts/detect-gap-ladder-drift.mjs's own
// .tsx/.jsx discovery plus the two extra extensions the real config actually lists.
//
// REAL CLASS POSITIONS ONLY, same posture as detect-gap-ladder-drift.mjs's FIX A1: className="...",
// className={...}, and the argument list of a cn(...) or clsx(...) call. Comments (// and /* */,
// including the JSX {/* ... */} shape, which is a literal /* */ sequence the same character-level
// stripper already catches) are blanked out BEFORE any position is searched, so a class mentioned
// in prose, in an import path, or in plain JSX text is never read as a class.
//
// THE cn()/clsx() OBJECT-KEY TRAP, found grading this detector against the live repo, fixed here.
// A naive "grab every quoted string between the parens" reading of cn(...)/clsx(...) sweeps up
// COMPARISON OPERANDS that happen to sit inside the same call, not just real class arguments. Real
// case, app/[locale]/_components/dashboard/DashboardUI.tsx:230-235:
//   const base = cn(
//     ...,
//     variant === "primary" && "bg-s-accent-bright text-white hover:bg-s-accent",
//     variant === "secondary" && "bg-white text-s-ink border border-s-border hover:bg-s-bg-sunken",
//     variant === "ghost" && "text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken",
//   );
// "primary", "secondary", "ghost" sit inside the SAME cn(...) call as real class strings; a scan
// that reads every quoted string in the call reports all three as dead classes, plus every other
// enum-style comparison string (confirmed the same shape for "up"/"down" in the same file's delta
// arrows, "open" in dashboard/refunds status checks, "default"/"error"/"warning" in FieldHelper's
// tone prop, "accent"/"success"/"done" in RewardsView, and more, each one `x === "word"`). THE
// RULE: a quoted string is never read as a class-value position when it is immediately preceded
// (skipping whitespace) by a comparison operator (===, !==, ==, !=), a bracket property/lookup
// access ([), or the `case` keyword. This is a narrow, evidence-grounded exclusion, not a general
// downgrade of cn()/clsx() coverage: a bare string argument, the right side of `cond && "..."`,
// and both branches of a ternary (`cond ? "a" : "b"`) all still scan exactly as before; only the
// LEFT side of a comparison inside the same call is excluded. See isExcludedOperand() below.
//
// TEMPLATE LITERAL INTERPOLATION, resolved where it CAN be, reviewed where it cannot. A backtick
// template literal is decomposed (findTemplateSpans below): each literal text run between
// interpolations is its own span, and each ${...} body is recursively searched the SAME way a
// cn()/clsx() argument list is, so a ternary of two complete strings INSIDE an interpolation still
// resolves both branches. Real case this catches, components-legacy/shared/ClientSelectorDropdown
// .tsx:107: `...items-center ${value === c.user_id ? 'bg-s-ink/10 text-s-accent font-bold' :
// 'hover:bg-s-ink/5:bg-white/5 text-s-ink'}`. The outer template's literal text (ending in a
// space, not glued to the interpolation) checks normally; the two nested single-quoted branches
// are found by recursion and checked as complete strings. `hover:bg-s-ink/5:bg-white/5` is a
// mangled leftover of the dark-mode strip (dark:bg-white/5 lost its dark:), does not exist, and
// has no near neighbour, so it reports in bucket B.
// A token is only ever "review by hand", never silently dropped and never a false dead-class
// finding, when it is TEXTUALLY GLUED (no separating whitespace) to something this scanner
// genuinely cannot resolve: the start or end of a ${...} interpolation (`text-${x}` -> "text-"
// reviewed, the interpolation's own expression is not itself a string so nothing more to check),
// or a string-concatenation `+` join between two adjacent quoted arguments (`"mt-" + "6 gap-8"` ->
// "mt-" and "6" both reviewed, "gap-8" checked normally since it is not glued to anything dynamic).
// A raw newline splitting one token inside a template literal (no interpolation involved at all,
// e.g. a literal `mt-\n6`) is handled the same way, scoped to template-text segments only (the
// only shape that can legally contain a raw newline in valid JS/TS source).
//
// TWO BUCKETS, gate trips on one only (unchanged from the brief, and from detect-gap-ladder-
// drift.mjs's own report/--gate split). Bucket A: the dead token shares a WORD with a real class
// (split on non-alphanumeric runs, length >= 3, and the shared word must appear in at most
// RARE_WORD_THRESHOLD real classes, see the tunable below for the measured reasoning) or sits
// within Levenshtein edit distance 2 of one. Real neighbours are printed beside every bucket A
// entry. Bucket B: no neighbour found, reported under its own heading, lower confidence, never
// trips --gate.
//
// FAIL CLOSED, LOUDLY, exit code 2, distinct from --gate's exit 1. A path or directory this
// detector cannot read, or a tailwind compile that exits non-zero, means nothing here is proven
// either way: it always exits 2, in BOTH report mode and --gate mode (unlike the sibling
// detector's own --gate-only unreadable handling), because a partial scan has no business
// reporting a clean bill of health under either mode. Whatever WAS readable is still scanned and
// reported; the exit code is what says "not fully checked", not the absence of output.
//
//   Run:   npm run dead-class-check                        (report mode, exit 0 unless the fail-
//                                                             closed case above fires, then 2)
//   Gate:  node scripts/detect-dead-class.mjs --gate        (also exits 1 on any bucket A finding)
//   Out:   _design-system/_dead-class-report.md  +  a stdout summary
//
// Test-only CLI extension, used by scripts/verify/dead-class-suite.mjs and never by the real repo
// run: `--root <dir>` replaces the four default content-glob roots with a single directory (all
// five extensions) so the self-test can build a synthetic tree. The REAL app/globals.css is still
// compiled in this mode (only the SOURCE files being scanned for class usage change), because the
// suite needs the real, live class universe to grade dead/alive and bucket A/B correctly. The
// report file is never written in this mode.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const REPORT_PATH = join(REPO_ROOT, "_design-system/_dead-class-report.md");
const CSS_INPUT_PATH = join(REPO_ROOT, "app/globals.css");

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
// Step 1: compile the real stylesheet, collect the real class set. Fail closed, loudly, exit 2,
// if the compiler is missing or exits non-zero. This always compiles the REAL app/globals.css,
// even under --root test mode, see the header note above.
// ---------------------------------------------------------------------------------------
function compileClassSet() {
  const binPath = join(REPO_ROOT, "node_modules/.bin/tailwindcss");
  if (!existsSync(binPath)) {
    console.error(`FATAL: tailwindcss binary not found at ${relative(REPO_ROOT, binPath)}. Run npm install.`);
    console.error("Nothing here is proven either way.");
    process.exit(2);
  }
  if (!existsSync(CSS_INPUT_PATH)) {
    console.error(`FATAL: ${relative(REPO_ROOT, CSS_INPUT_PATH)} not found. Nothing here is proven either way.`);
    process.exit(2);
  }
  const outDir = mkdtempSync(join(tmpdir(), "dead-class-css-"));
  const outPath = join(outDir, "compiled.css");
  const result = spawnSync(binPath, ["-i", CSS_INPUT_PATH, "-o", outPath, "--minify"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    console.error("FATAL: tailwind compile exited non-zero, cannot build the real class set.");
    console.error((result.stderr || result.stdout || "").trim().split("\n").slice(-15).join("\n"));
    console.error("Nothing here is proven either way.");
    rmSync(outDir, { recursive: true, force: true });
    process.exit(2);
  }
  let css;
  try {
    css = readFileSync(outPath, "utf8");
  } catch (err) {
    console.error(`FATAL: compiled CSS at ${outPath} could not be read: ${err.code || err.message}`);
    console.error("Nothing here is proven either way.");
    rmSync(outDir, { recursive: true, force: true });
    process.exit(2);
  }
  rmSync(outDir, { recursive: true, force: true });

  const set = new Set();
  // FIX, found grading this detector against the live repo: a comma inside an arbitrary value
  // (transition-[colors,transform], text-[clamp(18px,2vw,20px)], shadow-[...rgba(0,0,0,.18)])
  // is written by Tailwind's own CSS serializer as the CSS hex escape \2c (backslash, the hex
  // code point of a comma, then an optional single trailing whitespace terminator), NOT as a
  // plain \, single-character escape. The brief's own capture regex (\\.) only consumes ONE
  // character after the backslash, so it read "\2c " as "\2" plus a bare literal "c", then
  // stopped at the following space, silently truncating "transition-[colors,transform]" into
  // "transition-[colors2c" and losing "transform]" entirely, which is not in the real class set.
  // Reproduced directly against a standalone tailwindcss compile before this fix, confirmed by
  // reading the real selector text: `.transition-\[colors\2c transform\]`,
  // `.text-\[clamp\(18px\2c 2vw\2c 20px\)\]`, `.shadow-\[0_2px_8px_rgba\(0\2c 0\2c 0\2c 0\.18\)\]`.
  // A plain period is already a single-character escape (`0\.18`) and needed no change.
  const re = /\.((?:[\w-]|\\[0-9a-fA-F]{1,6}\s?|\\.)+)/g;
  function unescapeCssIdent(raw) {
    return raw.replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (_match, hex, ch) =>
      hex !== undefined ? String.fromCodePoint(parseInt(hex, 16)) : ch,
    );
  }
  let m;
  while ((m = re.exec(css))) set.add(unescapeCssIdent(m[1]));
  return set;
}

const classSet = compileClassSet();

// ---------------------------------------------------------------------------------------
// Neighbour computation: word-share (rare words only) + edit distance <= 2.
// ---------------------------------------------------------------------------------------
const EDIT_DISTANCE_THRESHOLD = 2;

// Measured over the real compiled class set (3059 classes) before this threshold was picked:
// "scrollbar" appears in 4 real classes, "flex" in 17, both meaningful near-miss signals. "group"
// appears in 47, "rounded" in 88, "white" in 64, "ink" in 123, "border" in 169, "hover" in 151,
// "text" in 246. Any threshold above roughly 20 starts admitting those structural, near-universal
// words, which would turn "shares a word" into "shares a hyphen", putting almost every dead token
// that contains a common prefix into bucket A regardless of whether it is a genuine near-miss.
const RARE_WORD_THRESHOLD = 20;

function splitWords(token) {
  return token.toLowerCase().split(/[^a-z0-9]+/i).filter((w) => w.length >= 3);
}

const wordIndex = new Map(); // word -> Set<realClass>, built once
for (const cls of classSet) {
  for (const w of new Set(splitWords(cls))) {
    if (!wordIndex.has(w)) wordIndex.set(w, new Set());
    wordIndex.get(w).add(cls);
  }
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

// Returns Map<realClass, reasonString>, word-share entries first, edit-distance entries after.
function findNeighbours(token) {
  const out = new Map();
  for (const w of splitWords(token)) {
    const matches = wordIndex.get(w);
    if (!matches || matches.size > RARE_WORD_THRESHOLD) continue;
    for (const cls of matches) if (!out.has(cls)) out.set(cls, `shares "${w}"`);
  }
  for (const cls of classSet) {
    if (out.has(cls)) continue;
    if (Math.abs(cls.length - token.length) > EDIT_DISTANCE_THRESHOLD) continue;
    const d = levenshtein(token, cls);
    if (d <= EDIT_DISTANCE_THRESHOLD) out.set(cls, `edit distance ${d}`);
  }
  return out;
}

// ---------------------------------------------------------------------------------------
// Comment stripper. Replaces the BODY of every // and /* */ comment (including the JSX
// {/* ... */} shape, which is a literal /* */ sequence at the character level) with whitespace,
// newlines kept as newlines so line numbers survive.
//
// FIX, found grading this detector against the live repo: a flat inString flag (the shape
// detect-gap-ladder-drift.mjs's own stripComments uses) treats an ENTIRE backtick template
// literal as opaque string content until the matching backtick, so a comment WRITTEN INSIDE a
// ${...} interpolation, which is real code, not string data, never gets stripped. Real case,
// app/[locale]/_components/search/SearchOverlay.tsx:2689:
//   className={`... ${selected ? "bg-s-ink font-bold text-white" /* selected-ok: owner
//   2026-08-12 "tapped is blue it should be black", overruling ... */ : isToday ? ... }`}
// The quoted string INSIDE that comment ("tapped is blue it should be black") was still visible
// to the span scanner, and its individual words ("is", "blue", "it", "be", "black") showed up as
// five separate fake dead-class findings. Fixed with an explicit context STACK instead of one
// flag: entering a template literal pushes a "template" frame; hitting ${ inside one pushes a
// fresh "code" frame (its own interpDepth counter, since the interpolation's own braces can
// nest); reaching that frame's matching } pops back to the enclosing template's literal text.
// Comments and strings are stripped/tracked identically whether the current frame is top-level
// code or a template interpolation, so a comment inside a ${...} is now real code and gets
// stripped exactly like one anywhere else.
// ---------------------------------------------------------------------------------------
function stripComments(text) {
  let out = "";
  let i = 0;
  const n = text.length;
  const stack = [{ type: "code" }];

  while (i < n) {
    const ctx = stack[stack.length - 1];
    const c = text[i];
    const c2 = i + 1 < n ? text[i + 1] : "";

    if (ctx.type === "string") {
      if (c === "\\") { out += c + c2; i += 2; continue; }
      if (c === ctx.quote) { stack.pop(); out += c; i++; continue; }
      out += c;
      i++;
      continue;
    }

    if (ctx.type === "template") {
      if (c === "\\") { out += c + c2; i += 2; continue; }
      if (c === "`") { stack.pop(); out += c; i++; continue; }
      if (c === "$" && c2 === "{") { stack.push({ type: "code", interpDepth: 1 }); out += c + c2; i += 2; continue; }
      out += c;
      i++;
      continue;
    }

    // ctx.type === "code": either top-level code or inside a template's ${...} (ctx.interpDepth
    // set in the latter case, tracked so the interpolation's OWN matching } pops back to the
    // enclosing template's literal text rather than being read as part of the code).
    if (ctx.interpDepth !== undefined) {
      if (c === "{") { ctx.interpDepth++; out += c; i++; continue; }
      if (c === "}") {
        ctx.interpDepth--;
        out += c;
        i++;
        if (ctx.interpDepth === 0) stack.pop();
        continue;
      }
    }
    if (c === "/" && c2 === "/") {
      out += "  ";
      i += 2;
      while (i < n && text[i] !== "\n") { out += " "; i++; }
      continue;
    }
    if (c === "/" && c2 === "*") {
      out += "  ";
      i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) {
        out += text[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < n) { out += "  "; i += 2; }
      continue;
    }
    if (c === "'" || c === '"') { stack.push({ type: "string", quote: c }); out += c; i++; continue; }
    if (c === "`") { stack.push({ type: "template" }); out += c; i++; continue; }
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
// Delimiter matching, unchanged from detect-gap-ladder-drift.mjs (same simplicity posture, no
// AST: brace/paren/quote depth tracked by hand).
// ---------------------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------------------
// FIX (cn/clsx object-key trap). A quoted string immediately preceded, skipping whitespace, by a
// comparison operator (===, !==, ==, !=), a bracket lookup ([), or the `case` keyword is a
// comparison operand or a lookup key, never a class-value position. See the header note for the
// real DashboardUI.tsx example this was built against.
// ---------------------------------------------------------------------------------------
const COMPARISON_OPERAND_RE = /(={2,3}|!={1,2}|\[)\s*$/;
const CASE_KEYWORD_RE = /\bcase\s*$/;
function isExcludedOperand(text, quoteIdx) {
  const lookback = text.slice(Math.max(0, quoteIdx - 12), quoteIdx);
  return COMPARISON_OPERAND_RE.test(lookback) || CASE_KEYWORD_RE.test(lookback);
}

// SECOND FIX (the same object-key trap, a different shape), found the same grading pass. A
// quoted string can also sit as the argument, or nested inside a ternary argument, of some OTHER
// named function call sitting inside a cn()/clsx() call or a className={...} expression, not
// cn/clsx itself. Real cases: app/[locale]/_components/primitives/ServiceDisclosureRow.tsx:102
// `cn("min-w-0 flex-1 text-left", butterPress("row"), className)`, three more call sites of the
// same `butterPress("icon"|"cta")` helper (CondenseBar.tsx, ServicesStaffStep.tsx, StaffStep.tsx),
// and app/[locale]/rewards/RewardsView.tsx:204 `chipClass(active ? p.chip : "mut")`. "row",
// "icon", "cta", "mut" are typed lookup keys into an internal Record (butterPress's own
// `PressTier` union, motion.ts:148), never rendered as classes themselves; only the CALLEE's
// return value is. A static scanner cannot know what a named helper returns, so the same
// treatment already used for a comparison operand applies: the entire argument list of a call to
// anything OTHER than cn/clsx is excluded before it is ever considered a class-value position,
// found by matching parens (findMatchingDelimiter), not just a preceding-character lookback,
// since the string can sit anywhere inside that call's arguments (a bare argument, or nested in a
// ternary), not only immediately after the opening paren.
const CALL_IDENT_RE = /\b([A-Za-z_$][\w$]*)\s*\(/g;
function findExcludedCallRanges(text, rangeStart, rangeEnd) {
  const ranges = [];
  CALL_IDENT_RE.lastIndex = rangeStart;
  let m;
  while ((m = CALL_IDENT_RE.exec(text)) && m.index < rangeEnd) {
    const ident = m[1];
    const openIdx = m.index + m[0].length - 1;
    if (openIdx >= rangeEnd) break;
    if (ident === "cn" || ident === "clsx") continue; // full coverage stays, never excluded
    const closeIdx = findMatchingDelimiter(text, openIdx, "(", ")");
    const end = Math.min(closeIdx + 1, rangeEnd);
    ranges.push({ start: openIdx, end });
    CALL_IDENT_RE.lastIndex = end;
  }
  return ranges;
}
function excludedRangeAt(ranges, i) {
  return ranges.find((r) => i >= r.start && i < r.end);
}

function skipTemplateLiteral(text, backtickIdx, rangeEnd) {
  let j = backtickIdx + 1;
  while (j < rangeEnd) {
    const c = text[j];
    if (c === "\\") { j += 2; continue; }
    if (c === "`") return j + 1;
    if (c === "$" && text[j + 1] === "{") {
      const closeBrace = findMatchingDelimiter(text, j + 1, "{", "}");
      j = closeBrace + 1;
      continue;
    }
    j++;
  }
  return rangeEnd;
}

// Decomposes a backtick template literal (text[backtickIdx] === "`") into literal-text spans,
// recursively searching every ${...} body for nested string/template literals (a ternary branch,
// a nested cn()/clsx() call's own string args). precededByInterp/followedByInterp mark whether a
// literal-text segment sits immediately against an interpolation boundary with NO separating
// whitespace, which is what makes its first/last token unresolvable (see header note). Returns
// the index just past the closing backtick (or rangeEnd if unterminated within range).
function findTemplateSpans(text, backtickIdx, rangeEnd, spans) {
  let j = backtickIdx + 1;
  let segmentStart = j;
  let afterInterpolation = false;
  while (j < rangeEnd) {
    const c = text[j];
    if (c === "\\") { j += 2; continue; }
    if (c === "`") {
      if (j > segmentStart) {
        spans.push({ start: segmentStart, end: j, kind: "template-text", precededByInterp: afterInterpolation, followedByInterp: false, startFusedByConcat: false, endFusedByConcat: false });
      }
      return j + 1;
    }
    if (c === "$" && text[j + 1] === "{") {
      if (j > segmentStart) {
        spans.push({ start: segmentStart, end: j, kind: "template-text", precededByInterp: afterInterpolation, followedByInterp: true, startFusedByConcat: false, endFusedByConcat: false });
      }
      const closeBrace = findMatchingDelimiter(text, j + 1, "{", "}");
      const innerEnd = Math.min(closeBrace, rangeEnd);
      findLiteralSpans(text, j + 2, innerEnd, spans);
      j = closeBrace + 1;
      segmentStart = j;
      afterInterpolation = true;
      continue;
    }
    j++;
  }
  if (rangeEnd > segmentStart) {
    spans.push({ start: segmentStart, end: rangeEnd, kind: "template-text", precededByInterp: afterInterpolation, followedByInterp: false, startFusedByConcat: false, endFusedByConcat: false });
  }
  return rangeEnd;
}

// Scans [rangeStart, rangeEnd) for real class-value spans: a plain '/" string becomes ONE
// complete "plain" span (JS strings of those two delimiters cannot contain interpolation); a `
// template literal is decomposed by findTemplateSpans above. A string immediately preceded by a
// comparison operator/bracket/case keyword is skipped entirely (isExcludedOperand). Recurses into
// every ${...} body it finds, so this single function handles className={...} containers,
// cn()/clsx() argument lists, and any nested interpolation, all the same way.
function findLiteralSpans(text, rangeStart, rangeEnd, spans = []) {
  const excludedCallRanges = findExcludedCallRanges(text, rangeStart, rangeEnd);
  let i = rangeStart;
  while (i < rangeEnd) {
    const excl = excludedRangeAt(excludedCallRanges, i);
    if (excl) { i = excl.end; continue; }
    const c = text[i];
    if (c === '"' || c === "'") {
      const excluded = isExcludedOperand(text, i);
      const closeIdx = Math.min(findStringEnd(text, i), rangeEnd);
      if (!excluded) {
        spans.push({ start: i + 1, end: closeIdx, kind: "plain", precededByInterp: false, followedByInterp: false, startFusedByConcat: false, endFusedByConcat: false });
      }
      i = closeIdx + 1;
      continue;
    }
    if (c === "`") {
      if (isExcludedOperand(text, i)) {
        i = skipTemplateLiteral(text, i, rangeEnd);
        continue;
      }
      i = findTemplateSpans(text, i, rangeEnd, spans);
      continue;
    }
    i++;
  }
  return spans;
}

// A `+` immediately joining two adjacent quoted arguments' outer quotes, nothing else between
// them, is a runtime string concatenation: "mt-" + "6 gap-8". Only PLAIN (non-template) spans are
// checked, and only immediate array neighbours from the SAME findLiteralSpans call, so an
// unrelated pair separated by a comma, a paren, or any other code never matches.
const CONCAT_GAP_RE = /^["'`]\s*\+\s*["'`]$/;
function markConcatJoins(text, spans) {
  for (let k = 0; k < spans.length - 1; k++) {
    const a = spans[k];
    const b = spans[k + 1];
    if (a.kind !== "plain" || b.kind !== "plain") continue;
    const gap = text.slice(a.end, b.start);
    if (CONCAT_GAP_RE.test(gap)) {
      a.endFusedByConcat = true;
      b.startFusedByConcat = true;
    }
  }
}

// Top-level orchestration: className="...", className={...}, cn(...)/clsx(...). Returns an array
// of GROUPS (one group per attribute/call site, each an ordered array of spans), matching FIX A1's
// posture from the sibling detector: an import path, a decoy string, and plain JSX text sit
// outside all three of these positions and are never read as a class.
function findClassValueSpans(text) {
  const groups = [];
  const containerRanges = [];

  const classNameAttrRe = /\bclassName\s*=\s*/g;
  let m;
  while ((m = classNameAttrRe.exec(text))) {
    const after = m.index + m[0].length;
    const c = text[after];
    if (c === '"' || c === "'") {
      const closeIdx = findStringEnd(text, after);
      groups.push([{ start: after + 1, end: closeIdx, kind: "plain", precededByInterp: false, followedByInterp: false, startFusedByConcat: false, endFusedByConcat: false }]);
      classNameAttrRe.lastIndex = closeIdx + 1;
    } else if (c === "{") {
      const closeIdx = findMatchingDelimiter(text, after, "{", "}");
      containerRanges.push({ start: after + 1, end: closeIdx });
      classNameAttrRe.lastIndex = closeIdx + 1;
    }
    // else: className={someIdentifier} with no literal string directly inside, or an odd
    // className=`...` (not valid JSX without braces), nothing to scan either way.
  }

  const callRe = /\b(?:cn|clsx)\s*\(/g;
  while ((m = callRe.exec(text))) {
    const openIdx = m.index + m[0].length - 1;
    const closeIdx = findMatchingDelimiter(text, openIdx, "(", ")");
    const insideExisting = containerRanges.some((r) => openIdx >= r.start && closeIdx <= r.end);
    if (!insideExisting) containerRanges.push({ start: openIdx + 1, end: closeIdx });
    callRe.lastIndex = closeIdx + 1;
  }

  for (const r of containerRanges) {
    const spans = findLiteralSpans(text, r.start, r.end);
    if (spans.length) {
      markConcatJoins(text, spans);
      groups.push(spans);
    }
  }
  return groups;
}

// ---------------------------------------------------------------------------------------
// File walk. Exactly the four tailwind.config.js content globs: app/**/*.{js,ts,jsx,tsx,mdx},
// components/**/*.{js,ts,jsx,tsx}, components-legacy/**, lib/**. --root test mode replaces this
// with one directory scanned for all five extensions.
// ---------------------------------------------------------------------------------------
const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude",
]);

const SCAN_ROOT = ROOT_OVERRIDE ? resolve(ROOT_OVERRIDE) : REPO_ROOT;
function relRoot(absPath) {
  return relative(SCAN_ROOT, absPath).split(sep).join("/");
}
function relRootSafe(absPath) {
  const r = relRoot(absPath);
  return r === "" ? absPath : r;
}

const unreadable = []; // { relPath, error }, both file and directory read failures land here

function walkFiles(dir, extSet, out = []) {
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
    if (e.isDirectory()) walkFiles(full, extSet, out);
    else {
      const dotIdx = e.name.lastIndexOf(".");
      const ext = dotIdx >= 0 ? e.name.slice(dotIdx) : "";
      if (extSet.has(ext)) out.push(full);
    }
  }
  return out;
}

const APP_EXTS = new Set([".js", ".ts", ".jsx", ".tsx", ".mdx"]);
const OTHER_EXTS = new Set([".js", ".ts", ".jsx", ".tsx"]);

const candidateFiles = ROOT_OVERRIDE
  ? walkFiles(SCAN_ROOT, APP_EXTS)
  : [
      ...walkFiles(join(REPO_ROOT, "app"), APP_EXTS),
      ...walkFiles(join(REPO_ROOT, "components"), OTHER_EXTS),
      ...walkFiles(join(REPO_ROOT, "components-legacy"), OTHER_EXTS),
      ...walkFiles(join(REPO_ROOT, "lib"), OTHER_EXTS),
    ];

// ---------------------------------------------------------------------------------------
// Scan.
// ---------------------------------------------------------------------------------------
const bucketA = []; // { relPath, line, raw, neighbours: [{cls, reason}] }
const bucketB = []; // { relPath, line, raw }
const unparseable = []; // { relPath, line, raw, reason }
let filesScanned = 0;

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

  const stripped = stripComments(text);
  const groups = findClassValueSpans(stripped);

  for (const group of groups) {
    for (const span of group) {
      const content = stripped.slice(span.start, span.end);
      const tokenRe = /\S+/g;
      let tm;
      while ((tm = tokenRe.exec(content))) {
        const token = tm[0];
        const isFirst = tm.index === 0;
        const isLast = tm.index + token.length === content.length;
        const absIdx = span.start + tm.index;
        const line = lineOf(stripped, absIdx);

        const fusedInterp = (isFirst && span.precededByInterp) || (isLast && span.followedByInterp);
        const fusedConcat = (isFirst && span.startFusedByConcat) || (isLast && span.endFusedByConcat);
        if (fusedInterp || fusedConcat) {
          unparseable.push({
            relPath,
            line,
            raw: token,
            reason: fusedInterp
              ? "adjacent to a template literal interpolation (${...}) with no separating whitespace, cannot statically resolve this token"
              : "adjacent to a string concatenation (+) with no separating whitespace, cannot statically resolve this token",
          });
          continue;
        }

        if (classSet.has(token)) continue; // exists, produces CSS, fine

        const neighbours = findNeighbours(token);
        const entry = { relPath, line, raw: token, neighbours };
        if (neighbours.size > 0) bucketA.push(entry);
        else bucketB.push(entry);
      }
    }
  }
}

// ---------------------------------------------------------------------------------------
// Fail closed, loudly. exit 2, both modes, if anything was unreadable. Whatever WAS readable is
// still reported below; the exit code is what says "not fully checked".
// ---------------------------------------------------------------------------------------
const hadUnreadable = unreadable.length > 0;

// ---------------------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------------------
function renderNeighbours(neighbours) {
  const entries = [...neighbours.entries()];
  entries.sort((x, y) => {
    const xWord = x[1].startsWith("shares") ? 0 : 1;
    const yWord = y[1].startsWith("shares") ? 0 : 1;
    return xWord - yWord;
  });
  const shown = entries.slice(0, 5).map(([cls, reason]) => `\`${cls}\` (${reason})`);
  const extra = entries.length > 5 ? `, +${entries.length - 5} more` : "";
  return shown.join(", ") + extra;
}

function renderBucketAEntry(f) {
  return `- **${f.relPath}:${f.line}** \`${f.raw}\` produces no CSS. Neighbours: ${renderNeighbours(f.neighbours)}`;
}
function renderBucketBEntry(f) {
  return `- **${f.relPath}:${f.line}** \`${f.raw}\` produces no CSS. No neighbour found.`;
}
function renderReviewEntry(f) {
  return `- **${f.relPath}:${f.line}** \`${f.raw}\`: ${f.reason}`;
}

const reportLines = [];
reportLines.push("# Dead-class report");
reportLines.push("");
reportLines.push(
  "Report-mode only unless run with --gate (scripts/detect-dead-class.mjs, npm run " +
    "dead-class-check). Flags a literal class token that Tailwind's JIT compiled with zero matching " +
    "CSS rule: it produces no CSS, and that fact alone. This never means the element carrying it " +
    "is broken or unstyled, that depends on every other class on the same element, which no static " +
    "scan can know. Worked example: `prose` and `prose-s-ink` are dead (no typography plugin " +
    "installed) and cost nothing, because /en/privacy styles every element with its own explicit " +
    "utilities regardless.",
);
reportLines.push("");
reportLines.push(`Generated: ${new Date().toISOString()}`);
reportLines.push(`Real class names in the compiled stylesheet: ${classSet.size}`);
reportLines.push(`Files scanned (app/+components/+components-legacy/+lib/, per tailwind.config.js content globs): ${filesScanned}`);
reportLines.push("");

reportLines.push("## Summary");
reportLines.push("");
reportLines.push(`- Total dead classes, bucket A (near neighbour exists, gate-tripping): **${bucketA.length}**`);
reportLines.push(`- Total dead classes, bucket B (no neighbour, informational only, never gates): ${bucketB.length}`);
reportLines.push(`- Review by hand (glued to an interpolation or a concatenation, never a finding, never gates): ${unparseable.length}`);
reportLines.push(`- Unreadable files or directories (never counted clean): ${unreadable.length}`);
reportLines.push("");

reportLines.push("## Bucket A: near-miss, the typo shape (" + bucketA.length + ")");
reportLines.push("");
reportLines.push(
  "The dead token shares a rare word (appears in at most " + RARE_WORD_THRESHOLD + " real classes) " +
    "with a real class, or sits within edit distance 2 of one. This is the shape the no-scrollbar " +
    "incident had: a name that reads exactly like a real utility. --gate trips on this bucket only.",
);
reportLines.push("");
if (!bucketA.length) reportLines.push("_none_");
else for (const f of bucketA) reportLines.push(renderBucketAEntry(f));
reportLines.push("");

reportLines.push("## Bucket B: no neighbour, lower confidence (" + bucketB.length + ")");
reportLines.push("");
reportLines.push(
  "No real class shares a rare word or sits within edit distance 2. Could be a hook or a script " +
    "querying by name, a class from a third-party stylesheet, a disabled-plugin class (see the " +
    "prose worked example above), or a genuinely dead name with no obvious fix. Reported plainly, " +
    "never trips --gate.",
);
reportLines.push("");
if (!bucketB.length) reportLines.push("_none_");
else for (const f of bucketB) reportLines.push(renderBucketBEntry(f));
reportLines.push("");

reportLines.push(`## Review by hand (${unparseable.length})`);
reportLines.push("");
reportLines.push(
  "Never a finding, never counted toward either bucket, never trips --gate. A token glued (no " +
    "separating whitespace) to a template interpolation or a string concatenation cannot be " +
    "statically resolved. Saying nothing here would be indistinguishable from clean, which is " +
    "worse than naming the file and line and asking for a human look.",
);
reportLines.push("");
if (!unparseable.length) reportLines.push("_none_");
else for (const f of unparseable) reportLines.push(renderReviewEntry(f));
reportLines.push("");

reportLines.push(`## Unreadable files or directories (${unreadable.length})`);
reportLines.push("");
reportLines.push(
  "Never counted clean. A path this detector could not open (a file OR a directory it could not " +
    "list) was never actually checked, so the whole run exits 2, both in report mode and --gate " +
    "mode: nothing here is proven either way.",
);
reportLines.push("");
if (!unreadable.length) reportLines.push("_none_");
else for (const u of unreadable) reportLines.push(`- **${u.relPath}**: ${u.error}`);
reportLines.push("");

reportLines.push("## Tunables");
reportLines.push("");
reportLines.push("- `RARE_WORD_THRESHOLD` / `EDIT_DISTANCE_THRESHOLD` (top of this file): bucket A neighbour thresholds, see the header note for the measured word-frequency reasoning.");
reportLines.push("- `isExcludedOperand` / `COMPARISON_OPERAND_RE` / `CASE_KEYWORD_RE`: the cn()/clsx() comparison-operand exclusion, see the header note for the real DashboardUI.tsx example.");
reportLines.push("- `findExcludedCallRanges`: the cn()/clsx() object-key trap's other shape, a string argument nested inside a call to some OTHER function (butterPress/chipClass real examples).");
reportLines.push("- `findLiteralSpans` / `findTemplateSpans`: the real class-name positions, including recursive interpolation resolution.");
reportLines.push("- `markConcatJoins`: the string-concatenation fusion check.");
reportLines.push("- Scan roots: `app/` (+ .mdx), `components/`, `components-legacy/`, `lib/`, per tailwind.config.js content globs.");
reportLines.push("");

if (!ROOT_OVERRIDE) writeFileSync(REPORT_PATH, reportLines.join("\n"));

// ---------------------------------------------------------------------------------------
// stdout summary.
// ---------------------------------------------------------------------------------------
console.log("");
console.log(`Dead-class scan: ${filesScanned} candidate files, ${classSet.size} real class names in the compiled stylesheet`);
console.log(`  Total dead classes (bucket A, near-miss, gate-tripping): ${bucketA.length}`);
console.log(`  Total dead classes (bucket B, no neighbour, informational only): ${bucketB.length}`);
console.log(`  Review by hand (never a finding, never gates): ${unparseable.length}`);
console.log(`  Unreadable files or directories (never counted clean): ${unreadable.length}`);
console.log(
  `  Report: ${relative(REPO_ROOT, REPORT_PATH).split(sep).join("/")}` +
    (ROOT_OVERRIDE ? " (not written this run, --root test mode)" : ""),
);
console.log("");

if (bucketA.length) {
  console.log("Bucket A (near-miss, the typo shape, gate-tripping):");
  for (const f of bucketA) console.log(`FINDING bucketA ${f.relPath}:${f.line} ${f.raw}  neighbours: ${renderNeighbours(f.neighbours)}`);
  console.log("");
}
if (bucketB.length) {
  console.log("Bucket B (no neighbour, lower confidence, never gates):");
  for (const f of bucketB) console.log(`FINDING bucketB ${f.relPath}:${f.line} ${f.raw}`);
  console.log("");
}
if (unparseable.length) {
  console.log("REVIEW by hand (never a finding, never gates):");
  for (const f of unparseable) console.log(`REVIEW ${f.relPath}:${f.line} ${f.raw} :: ${f.reason}`);
  console.log("");
}
if (unreadable.length) {
  console.log("UNREADABLE, reported loudly, never counted clean:");
  for (const u of unreadable) console.log(`UNREADABLE ${u.relPath} ${u.error}`);
  console.log("");
}
if (!bucketA.length && !bucketB.length && !unparseable.length && !unreadable.length) {
  console.log("No dead classes found on a scanned file, and every candidate path was readable.");
  console.log("");
}

if (hadUnreadable) {
  console.log("Exiting 2: at least one path was unreadable, nothing here is proven either way.");
  process.exit(2);
}
if (GATE_MODE) {
  process.exit(bucketA.length > 0 ? 1 : 0);
}
process.exit(0);
