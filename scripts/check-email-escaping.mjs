#!/usr/bin/env node
// scripts/check-email-escaping.mjs
//
// STATIC remainder counter for typed-value HTML escaping in lib/email.ts. Same
// spirit as scripts/check-press.mjs: a regex over source text, not a full
// parser, good enough to ratchet an aggregate count and cheap enough to run
// on every turn.
//
// WHY THIS EXISTS
// --------------------------------------------------------------------------
// A sweep on 2026-08-23 escaped user-typed values in lib/email.ts and took
// the escaped count from 17 to 127. It read as complete, and a separate
// reader reviewed it, and it still left 32 raw interpolations across five
// LIVE templates: booking cancellation, reschedule, reminder, welcome email,
// and a recurring-booking notice. The reader who looked for what had been
// DONE found one of the five gaps. Counting what was LEFT would have found
// all five in a second, because a sweep is judged by its remainder, not by
// its diff. This script is that remainder counter, run any time, not just
// once after a sweep.
//
// WHAT IT CHECKS
// --------------------------------------------------------------------------
// A salon owner types their own business name and service names, and a
// customer types their own name. Those values land in an email Solen sends
// from its own address. If a typed value is dropped into an HTML email body
// unescaped, markup inside that name is rendered by the recipient's mail
// client instead of shown as plain text: a salon owner could put a <script>
// or an <a href> in their own business name and have it render live inside
// an email Solen sent.
//
// THE RULE, precisely: flag every literal `${vars.X}` where ALL of these
// hold:
//   - X is one of the typed-value names below (TYPED_VALUES)
//   - the line, AFTER any subject: segment is stripped out of it, still
//     contains an HTML tag, matched by HTML_TAG_RE
//   - the line does not start a plain `text:` field, matched by
//     TEXT_LINE_RE
//
// The match is a literal substring: `${vars.X}` with nothing else between
// the braces. `${escapeHtml(vars.X)}` never matches, because the text right
// after `${` is `escapeHtml(...`, not `vars.X`, so an already-escaped value
// is correctly never flagged. That is the whole mechanism, and it is also
// exactly why the half-applied case (one value escaped, its sibling on the
// same line left raw) is caught: each interpolation is matched on its own,
// not the line as a whole.
//
// SUBJECT IS STRIPPED AS A SEGMENT, NOT SKIPPED AS A WHOLE LINE. A first
// version of this script skipped the ENTIRE line whenever it started with
// `subject:` or `text:`. That broke on lib/email.ts's welcomeEmail, whose
// steps array puts subject and html on the SAME source line:
//   { subject: `Willkommen bei solen.ch, ${vars.name}!`, html: `<p>Hallo
//     <strong>${escapeHtml(vars.name)}</strong>,</p>...` },
// A line-start anchor never fires here at all (the line starts with `{`,
// not `subject:`), so it both reported false positives on a clean file and,
// worse, would have silently excused a genuinely raw html value on the same
// line if it HAD fired. The fix: SUBJECT_SEGMENT_RE removes every
// `subject: \`...\`` segment from the line before the HTML-tag test and the
// value scan run, so a raw value inside the removed subject text is never
// flagged (case 10 below) while a raw value in the html half of that same
// line still is (case 11 below, the one that proves the strip is not a
// blanket excuse). `text:` fields keep the older whole-line skip, since a
// plain-text field is never an HTML render context regardless of what else
// is on the line, and no text/html collision like the subject one has been
// found in this file.
//
// NEVER FLAGGED, and why:
//   - a subject value: escaping it would make the recipient read
//     "Mueller &amp; Sohn" in their inbox subject list, which is worse than
//     the thing this script is trying to prevent, and a mail client subject
//     field is not an HTML render context in the first place.
//   - a plain-text body or an SMS template: same reason, no HTML render.
//   - a date, a time, a price, a url, a slug, a code, a rating, a position:
//     none of these are typed by a user with a keyboard that can hold
//     markup. They are server-generated or formatted from numbers/ISO
//     strings. Flagging them would bury the real findings under noise and
//     train whoever reads the report to stop reading it.
//
// SHAPE (mirrors scripts/check-press.mjs)
// --------------------------------------------------------------------------
// Usage banner, single main(), report file + stdout, a --gate flag that
// exits 1 the moment any finding exists, an embedded --selftest (rule 12.5:
// build, self-test, then integrate), and a final RATCHET_RAW_EMAIL_VALUES=<n>
// line so a CI ratchet job can parse the count without scraping the report.
//
// SCOPE. This scans lib/email.ts only (EMAIL_FILES below), not a whole
// directory tree. That is the file the 2026-08-23 sweep touched and the file
// named in every one of the five live gaps it left. Widening the scan to
// lib/email-templates/** or other lib/*.ts files that build HTML strings is
// a reasonable future step, but it is out of scope for this remainder
// counter today and would need its own typed-value list per file.
//
// Usage:
//   node scripts/check-email-escaping.mjs
//   node scripts/check-email-escaping.mjs --gate
//   node scripts/check-email-escaping.mjs --selftest
//   npm run check:email-escaping
//   npm run gate:email-escaping
//
// Exit code: 0 in report-only mode, always (selftest failure aside, which
// exits 1 before the scan even runs). --gate exits 1 the moment any finding
// exists.

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
const EMAIL_FILES = ["lib/email.ts"];
const OUTPUT_PATH_REL = "_plans/email-escaping-audit/_report.md";

// The typed-value list: anything a salon owner or a customer types with a
// keyboard, that can end up inside an HTML email body. Anything NOT in this
// list is server-generated (a date, a time, a price, a url, a slug, a code,
// a rating, a position) and must never be flagged, per the file header.
const TYPED_VALUES = [
  "salon",
  "salonName",
  "service",
  "serviceName",
  "customerName",
  "stylistName",
  "senderName",
  "staffName",
  "recipientName",
  "name",
  "comment",
  "replyText",
  "message",
  "note",
  "reason",
  "address",
  "personalMessage",
  "rewardText",
  "allergyNote",
  "preview",
  "vatNumber",
];

// Built once from TYPED_VALUES. The match is anchored on both ends
// (`${vars.` ... `}` with nothing else in between), so a raw
// `${vars.customerName}` can never be mistaken for a match against the
// shorter `name` alternative in this list, or vice versa: the alternation
// only succeeds when the captured text between the dot and the closing
// brace equals one whole listed identifier, since matching starts at a
// fixed position right after `vars.` and the alternative that doesn't match
// that exact text simply fails there. Order of the alternatives does not
// matter for correctness for that reason.
const VALUE_TOKEN_RE = new RegExp(`\\$\\{vars\\.(${TYPED_VALUES.join("|")})\\}`, "g");

// An HTML tag opener anywhere on the line. Deliberately narrow to the tags
// an email body actually uses (see lib/email.ts), not every HTML5 element.
const HTML_TAG_RE = /<(p|div|span|strong|em|ul|li|a|h[1-6]|blockquote|table|td|tr|br)\b/i;

// A plain `text:` field, anchored to the start of the line (ignoring
// leading whitespace) so this only matches the field key itself, never a
// `text` word appearing later in a line. A plain-text field is never an
// HTML render context, so the whole line is skipped outright.
const TEXT_LINE_RE = /^\s*text\s*:/;

// Every `subject: \`...\`` segment on a line, wherever it sits (start of
// line or mid-line beside an html field, see the SUBJECT IS STRIPPED note
// above). Removed from the line before the HTML-tag test and the value
// scan run, so a raw value inside a subject is never flagged while a raw
// value elsewhere on that same line still is.
const SUBJECT_SEGMENT_RE = /subject\s*:\s*`(?:[^`\\]|\\.)*`/g;

// Tracks the enclosing `function name(` or `export const name =`, exactly
// the two shapes lib/email.ts's template builders are declared with (see
// the grep of the real file: every export is one of these two forms). A
// flat, non-nested tracker is enough because none of this file's template
// builders nest a function declaration inside another.
const FUNC_DECL_RE = /^\s*(?:export\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/;
const CONST_DECL_RE = /^\s*export\s+const\s+([A-Za-z0-9_$]+)\s*=/;

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  let gate = false;
  let selftest = false;
  for (const a of argv) {
    if (a === "--gate") gate = true;
    else if (a === "--selftest") selftest = true;
  }
  return { gate, selftest };
}

// ----------------------------------------------------------------------------
// Core scan: one file's content in, findings out. Line-based on purpose,
// since the rule itself is defined per line (an HTML tag on THIS line once
// any subject segment is stripped out of it, a plain text: field key at the
// START of THIS line).
// ----------------------------------------------------------------------------
function scanFileContent(content, relPath) {
  const findings = [];
  const lines = content.split("\n");
  let currentFunction = "(module scope)";

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNumber = idx + 1;

    const funcMatch = FUNC_DECL_RE.exec(line);
    const constMatch = funcMatch ? null : CONST_DECL_RE.exec(line);
    if (funcMatch) currentFunction = funcMatch[1];
    else if (constMatch) currentFunction = constMatch[1];

    if (TEXT_LINE_RE.test(line)) continue; // a plain-text field: never an HTML render context

    // Strip every subject segment out of the line BEFORE scanning, so a raw
    // value that only ever appears inside a subject is never flagged, but a
    // raw value in an html field sitting on that SAME line still is (see
    // the SUBJECT IS STRIPPED note in the file header).
    const scanLine = line.replace(SUBJECT_SEGMENT_RE, "");

    if (!HTML_TAG_RE.test(scanLine)) continue; // no HTML tag left once subject text is removed: nothing to escape into

    VALUE_TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = VALUE_TOKEN_RE.exec(scanLine)) !== null) {
      findings.push({
        file: relPath,
        line: lineNumber,
        function: currentFunction,
        value: m[1],
        lineText: line.trim(),
      });
    }
  }
  return findings;
}

function scanFiles(fileList, cwd) {
  let filesScanned = 0;
  let filesMissing = [];
  const findings = [];
  for (const relPath of fileList) {
    const fullPath = resolve(cwd, relPath);
    if (!existsSync(fullPath)) {
      filesMissing.push(relPath);
      continue;
    }
    filesScanned++;
    const content = readFileSync(fullPath, "utf8");
    findings.push(...scanFileContent(content, relPath));
  }
  return { findings, filesScanned, filesMissing };
}

// ----------------------------------------------------------------------------
// Embedded self-test (rule 12.5: build, self-test, then integrate). Writes a
// real fixture file under a temp dir so the FULL pipeline (read, split into
// lines, track the enclosing function, strip subject segments, apply the
// rule) is exercised, not a hand-simulated shortcut of it. Eleven cases,
// nine from the original brief plus two added when the first version of
// this script was caught crying wolf on welcomeEmail's real
// subject-and-html-on-one-line shape, each its own function so the
// assertions can check both the finding count AND that it landed under the
// right function name.
// ----------------------------------------------------------------------------
function selfTestEmailEscapingLogic() {
  const assertions = [];
  function assert(name, cond) {
    assertions.push({ name, pass: !!cond });
  }

  const testDir = join(process.env.TMPDIR || tmpdir(), `check-email-escaping-selftest-${process.pid}-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
  const fixturePath = join(testDir, "fixture-email.ts");

  const fixture = `
function fixtureOne() {
  // case 1: a raw salon name inside a <p>, expect 1
  return \`<p>\${vars.salon}</p>\`;
}

function fixtureTwo() {
  // case 2: the same line with escapeHtml around it, expect 0
  return \`<p>\${escapeHtml(vars.salon)}</p>\`;
}

function fixtureThree() {
  // case 3: a subject: line containing the raw value, expect 0
  return {
    subject: \`<p>\${vars.salon}</p>\`,
  };
}

function fixtureFour() {
  // case 4: a text: field with an html tag and the raw value, expect 0
  return {
    text: \`<p>\${vars.salon}</p>\`,
  };
}

function fixtureFive() {
  // case 5: the raw value with no html tag on the line, expect 0
  return \`no markup here, just \${vars.salon}\`;
}

function fixtureSix() {
  // case 6: a <p> with only non-typed values (date, time), expect 0
  return \`<p>\${vars.date} at \${vars.time}</p>\`;
}

function fixtureSeven() {
  // case 7: a <p> with two typed values, both raw, expect 2
  return \`<p>\${vars.service} at \${vars.salon}</p>\`;
}

function fixtureEight() {
  // case 8: one value wrapped, its sibling raw on the same line, expect 1.
  // this is the half-applied shape the reader missed on 2026-08-23.
  return \`<p>\${escapeHtml(vars.service)} at \${vars.salon}</p>\`;
}

function fixtureNine() {
  // case 9: a <p> with an href url interpolation, not a typed value, expect 0
  return \`<p><a href="\${vars.bookingUrl}">link</a></p>\`;
}

function fixtureTen() {
  // case 10: subject and html on ONE line (the real welcomeEmail shape),
  // html escaped, subject bare, expect 0
  return { subject: \`Hi \${vars.name}\`, html: \`<p>\${escapeHtml(vars.name)}</p>\` };
}

function fixtureEleven() {
  // case 11: subject and html on ONE line, html value RAW, expect 1.
  // this is the one that proves the subject strip is not a blanket excuse.
  return { subject: \`Hi \${vars.name}\`, html: \`<p>\${vars.name}</p>\` };
}
`;
  writeFileSync(fixturePath, fixture, "utf8");

  try {
    const { findings } = scanFiles(["fixture-email.ts"], testDir);
    const byFunction = (name) => findings.filter((f) => f.function === name);

    assert("case 1 (raw salon in <p>): exactly 1 finding", byFunction("fixtureOne").length === 1);
    assert(
      "case 1: the finding names the value 'salon'",
      byFunction("fixtureOne")[0] && byFunction("fixtureOne")[0].value === "salon",
    );

    assert("case 2 (escapeHtml-wrapped salon): 0 findings", byFunction("fixtureTwo").length === 0);

    assert("case 3 (subject: line with raw value): 0 findings", byFunction("fixtureThree").length === 0);

    assert("case 4 (text: field with html tag + raw value): 0 findings", byFunction("fixtureFour").length === 0);

    assert("case 5 (raw value, no html tag on the line): 0 findings", byFunction("fixtureFive").length === 0);

    assert("case 6 (<p> with only non-typed vars.date/vars.time): 0 findings", byFunction("fixtureSix").length === 0);

    assert("case 7 (<p> with two raw typed values): exactly 2 findings", byFunction("fixtureSeven").length === 2);
    assert(
      "case 7: both value names captured (service, salon)",
      byFunction("fixtureSeven").map((f) => f.value).sort().join(",") === "salon,service",
    );

    assert(
      "case 8 (half-applied: service escaped, salon raw, same line): exactly 1 finding - the case the reader missed",
      byFunction("fixtureEight").length === 1,
    );
    assert(
      "case 8: the surviving finding is the raw one (salon), not the escaped one (service)",
      byFunction("fixtureEight")[0] && byFunction("fixtureEight")[0].value === "salon",
    );

    assert("case 9 (href url interpolation, not a typed value): 0 findings", byFunction("fixtureNine").length === 0);

    assert(
      "case 10 (subject+html one line, html escaped, subject bare): 0 findings - the false-positive check",
      byFunction("fixtureTen").length === 0,
    );

    assert(
      "case 11 (subject+html one line, html RAW): exactly 1 finding - proves the subject strip is not a blanket excuse",
      byFunction("fixtureEleven").length === 1,
    );
    assert(
      "case 11: the finding names the value 'name', from the html half, not the subject half",
      byFunction("fixtureEleven")[0] && byFunction("fixtureEleven")[0].value === "name",
    );

    assert("total across all eleven cases: exactly 5 findings (1+0+0+0+0+0+2+1+0+0+1)", findings.length === 5);
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  const failed = assertions.filter((a) => !a.pass);
  if (failed.length > 0) {
    console.error("[check-email-escaping] SELF-TEST FAILED - the scan logic is not sound:");
    for (const f of failed) console.error(`  - ${f.name}`);
    process.exit(1);
  }
  console.log(`[check-email-escaping] self-test passed (${assertions.length} assertions, real fixture file, full scan pipeline)`);
}

// ----------------------------------------------------------------------------
// Report formatting: grouped by the enclosing function, as asked - the
// function, the line numbers, the value names, and one example line per
// finding (the line itself, which is also the example).
// ----------------------------------------------------------------------------
function formatFinding(f) {
  return `line ${f.line}: \`${f.value}\` raw - \`${f.lineText}\``;
}

function formatFunctionSection(functionName, items) {
  const lines = [`### ${functionName} (${items.length})`, ""];
  for (const f of items) lines.push("- " + formatFinding(f));
  lines.push("");
  return lines.join("\n");
}

function groupByFunction(findings) {
  const map = new Map();
  for (const f of findings) {
    if (!map.has(f.function)) map.set(f.function, []);
    map.get(f.function).push(f);
  }
  // Sort each group by line, and sort groups by first line so the report
  // reads top-to-bottom the same way the source file does.
  for (const items of map.values()) items.sort((a, b) => a.line - b.line);
  return [...map.entries()].sort((a, b) => a[1][0].line - b[1][0].line);
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
function main() {
  const { gate, selftest } = parseArgs(process.argv.slice(2));

  selfTestEmailEscapingLogic();
  if (selftest) {
    process.exit(0);
  }

  console.log(`[check-email-escaping] scanning: ${EMAIL_FILES.join(", ")}`);

  const { findings, filesScanned, filesMissing } = scanFiles(EMAIL_FILES, process.cwd());
  const groups = groupByFunction(findings);

  const header = [
    "# Email escaping checker",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Files scanned: ${filesScanned}  Files missing: ${filesMissing.length > 0 ? filesMissing.join(", ") : "none"}`,
    "",
    "Static source scan (no browser, no type-checker) for a typed value (a salon name, a service",
    "name, a customer name, and the other names in TYPED_VALUES in scripts/check-email-escaping.mjs)",
    "interpolated raw into an HTML line of a lib/email.ts template, with escapeHtml() not applied.",
    "See the file header of scripts/check-email-escaping.mjs for the full rule and why a subject",
    "line, a plain-text body, a date, a price, and a url are never flagged.",
    "",
    `Total raw findings: ${findings.length}`,
    "",
    "Fix shape: wrap the flagged value in the escapeHtml() already defined at the top of",
    "lib/email.ts, e.g. `${vars.salon}` becomes `${escapeHtml(vars.salon)}`. Do NOT wrap a",
    "subject field, a text (plain-text) field, a date, a price, or a url: none of those are an",
    "HTML render context, and escaping a subject line breaks the recipient's inbox display",
    "instead of protecting it.",
    "",
    "---",
    "",
  ].join("\n");

  const body =
    groups.length === 0
      ? "No raw typed-value interpolations found.\n"
      : groups.map(([functionName, items]) => formatFunctionSection(functionName, items)).join("\n");

  const report = header + body;
  const outputPath = resolve(process.cwd(), OUTPUT_PATH_REL);
  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(outputPath, report);

  console.log("");
  console.log(`[check-email-escaping] raw findings: ${findings.length} across ${groups.length} function(s)`);
  for (const [functionName, items] of groups) {
    console.log(`  ${functionName}: ${items.length} (lines ${items.map((f) => f.line).join(", ")})`);
  }
  console.log(`[check-email-escaping] report written to ${outputPath}`);

  if (gate) {
    console.log("");
    if (findings.length > 0) {
      console.error(
        `[check-email-escaping] GATE FAIL: ${findings.length} raw typed-value interpolation(s) found. ` +
          "Wrap each in escapeHtml() (see report for exact lines).",
      );
      console.log(`RATCHET_RAW_EMAIL_VALUES=${findings.length}`);
      process.exit(1);
    }
    console.log("[check-email-escaping] GATE: PASSED - no raw typed-value interpolation found.");
    console.log(`RATCHET_RAW_EMAIL_VALUES=${findings.length}`);
    process.exit(0);
  }

  console.log(`RATCHET_RAW_EMAIL_VALUES=${findings.length}`);
  process.exit(0);
}

main();
