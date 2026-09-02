#!/usr/bin/env node
// Finds German written straight into a customer-facing component instead of coming
// from messages/*.json, so it stays German on the English, French and Italian site.
//
// WHY THIS EXISTS, 2026-08-27. A sweep that morning fixed 38 such strings and
// reported the job done. A live read of the English home page hours later found 34
// more, in 21 components. Three shapes had been invisible to that sweep, and they
// are exactly the three this file is built around:
//
//   1. INTERPOLATED. aria-label={`${name}, Termin buchen`} is not a quoted German
//      string, so a search for one never sees it. This was the biggest miss: every
//      salon card on the English home page announced itself in German, 24 times.
//   2. TERNARY. aria-label={saved ? "Gespeichert" : "Speichern"} hides two German
//      words behind a conditional.
//   3. NOT OBVIOUSLY GERMAN. Vorherige, Startseite, Weiterscrollen, Kategorien. A
//      word list built from the German a person happens to think of will not have
//      them, and each one is a real label a real customer hears.
//
// check-i18n-parity.mjs does NOT cover this and never did: it compares the four
// locale key sets against each other, so a component that never asks for a key at
// all is invisible to it. The two checks are complements, not overlaps.
//
// THIS TOOL STILL HAS BLIND SPOTS, and a tool that hides its blind spots is the
// failure it exists to prevent. An adversarial review of the widened version
// proved at least three shapes it does not catch, line-based regex cannot see
// past a variable boundary:
//
//   1. A German string assigned to a variable on one line and rendered on a
//      later one, e.g. `const label = "Noch keine Looks.";` followed by
//      `<p>{label}</p>` two lines down. REACHES_USER never sees the two joined.
//   2. JSX text on its own physical line, where the opening tag and the German
//      word are not on one line together, e.g.
//        <p>
//          Bitte melden Sie sich an
//        </p>
//      The `>` and the word never share a line, so the JSX half of REACHES_USER
//      does not fire even though a customer reads that sentence.
//   3. A German template literal returned from a plain helper function and
//      consumed as a prop somewhere else entirely, the live example being
//      app/[locale]/_components/salon/_shared.ts:380, `return { isOpen: true,
//      label: \`Geöffnet bis ${today.close}\`, nextOpen: null };`. No aria
//      attribute, no JSX on that line, so it is invisible to both halves of
//      REACHES_USER despite the file already sitting inside SCAN_DIRS.
//
// None of these three are fixed here. Fixing the detector to see across
// variables and function boundaries needs real parsing (an AST walk), not a
// wider regex, and is future work, not this change.
//
// RATCHET, not a hard zero, following copy-i18n-01's precedent. Legitimate
// exceptions exist (a German brand word, a de-only route, a dev-only page), so a
// hard zero would be switched off within a day. The baseline records what is known
// today; the check fails when the number goes UP, or when a baselined site is fixed
// and not removed from the baseline.
//
// Run: node scripts/check-hardcoded-copy.mjs
//      node scripts/check-hardcoded-copy.mjs --update-baseline   (after a real fix)

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASELINE = path.join(ROOT, "scripts", "hardcoded-copy-baseline.json");

// Customer surfaces. WIDENED 2026-08-27: this used to scan only
// app/[locale]/_components and components-legacy, so the page-route tree itself,
// every app/[locale]/<route>/page.tsx, was never opened. That is how it reported
// "OK, 3 known sites" while pages like app/[locale]/profile/favorites/page.tsx
// (six German strings passed as props) and app/[locale]/profile/looks/page.tsx
// (zero translations hooks) shipped German to every locale. Scanning
// "app/[locale]" now covers every route under it, _components included, so the
// old _components entry is folded in rather than kept as a second walk.
// app/[locale]/profile/referral/page.tsx is the same defect, zero hooks, and
// widening this directory list alone does NOT surface it: its German (e.g.
// "Teilen Sie Ihren Code...") sits on its own JSX line with no `>` on it (blind
// spot 2 below) or inside a `message=` prop that REACHES_USER's fixed attribute
// list does not check. Left in place as a real gap, not silently fixed.
const SCAN_DIRS = ["app/[locale]", "components-legacy"];
const SKIP_PATH = [
  "/dev/",
  "/_overhaul/",
  "node_modules",
  "/dashboard/",
  // Deliberately bilingual Swiss legal pages: TermsContent.tsx runs 66 <ParEn>
  // blocks next to 67 <ParDe> ones, German and English rendered side by side on
  // purpose, and both privacy/page.tsx and terms/page.tsx carry the same
  // "Zurück zur Startseite / Back to Home" link for the same reason. Verified by
  // hand before this exclusion was written; not an oversight.
  "/[locale]/terms/",
  "/[locale]/privacy/",
];

// Words that are German and are not also English, French or Italian. Every entry
// below was found rendering on a live customer page, none were invented.
const GERMAN_WORDS = [
  "Zurück", "Zuruck", "Vorherige", "Voriger", "Vorheriger", "Weiterscrollen",
  "Zurückscrollen", "Startseite", "Termin buchen", "Bewertung", "Bewertungen",
  "Prozent Rabatt", "verfügbar", "Gespeichert", "Speichern", "Teilen", "Melden",
  "Kategorien", "Suchen", "Geöffnet", "Schliessen", "schliessen", "Weniger",
  "Mehr lesen", "Alle ansehen", "Alle anzeigen", "wählen", "Anderen", "Noch keine",
];

// A literal only matters when it reaches a person: a label a screen reader speaks,
// or text a customer reads. A German word inside a variable name or a comment does
// not ship to anybody.
const REACHES_USER =
  /\b(?:aria-label|aria-description|title|placeholder|alt|aria-valuetext)\s*=|>[^<>{}]*[A-Za-zÄÖÜäöüß]/;

const GERMAN_RE = new RegExp(GERMAN_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"));

function isComment(line) {
  const s = line.trim();
  return s.startsWith("//") || s.startsWith("*") || s.startsWith("/*");
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (SKIP_PATH.some((s) => p.includes(s))) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) out.push(p);
  }
  return out;
}

function scan() {
  const hits = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const rel = path.relative(ROOT, file);
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (isComment(line)) return;
        if (!GERMAN_RE.test(line)) return;
        if (!REACHES_USER.test(line)) return;
        hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 160) });
      });
    }
  }
  return hits;
}

// KNOWN-ANSWER CONTROL. A detector that silently stops matching reports a clean
// site and is worse than no detector, which is how the first sweep came to report
// a job it had not finished. These four cases carry the three shapes that were
// missed plus one that must NOT match. If any of them comes out wrong, the
// instrument is broken and no count it produces means anything.
function selfTest() {
  const cases = [
    ['aria-label={`${name}, Termin buchen`}', true, "interpolated"],
    ['aria-label={saved ? "Gespeichert" : "Speichern"}', true, "ternary"],
    ['aria-label="Vorherige"', true, "not obviously German"],
    ['const terminBuchenHref = "/booking";', false, "identifier only, ships to nobody"],
  ];
  const failures = [];
  for (const [line, shouldMatch, why] of cases) {
    const matched = GERMAN_RE.test(line) && REACHES_USER.test(line) && !isComment(line);
    if (matched !== shouldMatch) failures.push(`${why}: expected ${shouldMatch}, got ${matched} for ${line}`);
  }
  return failures;
}

const failures = selfTest();
if (failures.length) {
  console.error("check-hardcoded-copy: THE DETECTOR ITSELF IS BROKEN, ignore any count below.");
  for (const f of failures) console.error("  " + f);
  process.exit(2);
}

const hits = scan();
const key = (h) => `${h.file}:${h.line}`;
const found = new Set(hits.map(key));

if (process.argv.includes("--update-baseline")) {
  writeFileSync(BASELINE, JSON.stringify({ sites: [...found].sort() }, null, 1) + "\n");
  console.log(`check-hardcoded-copy: baseline written, ${found.size} known site(s).`);
  process.exit(0);
}

const baseline = existsSync(BASELINE)
  ? new Set(JSON.parse(readFileSync(BASELINE, "utf8")).sites)
  : new Set();

const added = [...found].filter((k) => !baseline.has(k));
const fixed = [...baseline].filter((k) => !found.has(k));

if (added.length) {
  console.error(`check-hardcoded-copy: ${added.length} NEW hardcoded German string(s) on a customer surface.`);
  console.error("These render in German on the English, French and Italian site.");
  for (const k of added) {
    const h = hits.find((x) => key(x) === k);
    console.error(`  ${k}\n      ${h.text}`);
  }
  console.error("\nMove each into messages/*.json and call it through the file's translations hook.");
  process.exit(1);
}

if (fixed.length) {
  console.error(`check-hardcoded-copy: ${fixed.length} baselined site(s) no longer match, so the baseline is stale.`);
  for (const k of fixed) console.error(`  ${k}`);
  console.error("\nRun: node scripts/check-hardcoded-copy.mjs --update-baseline");
  process.exit(1);
}

console.log(`check-hardcoded-copy: OK (${found.size} known site(s), none new).`);
