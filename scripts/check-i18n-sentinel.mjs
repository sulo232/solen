#!/usr/bin/env node
// copy-i18n-01: catches a live sentinel/TODO key (e.g. `_todo_translate: true`)
// sitting in a messages/*.json namespace, and ratchets the identical-to-en
// string count per locale so a newly-added untranslated namespace fails CI
// instead of shipping silently. Mirrors the tsc/lint ratchet pattern already
// used in .github/workflows/quality.yml.
//
// Hard zero: any non-string leaf value anywhere in messages/*.json. A JSON
// message tree must only ever contain strings at the leaves; a boolean/number
// sentinel means someone left a TODO marker as data instead of removing it
// before merge, and no other gate (typecheck, lint, invariants) can see it.
//
// Ratchet: identical-to-en string count per non-en locale. Many identical
// strings are legitimate (brand names, "CHF", "PDF", city names, numbers), so
// this is not a hard zero; it only fails when the count goes UP versus the
// checked-in baseline below, same shape as the tsc/lint jobs in quality.yml.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOCALES = ["de", "en", "fr", "it"];
const SOURCE_LOCALE = "en";

// Baseline identical-to-en counts, measured 2026-07-27 after copy-i18n-01
// (refundFlow translated). Lower this number as further namespaces get
// translated; raising it requires a named reason in the PR description.
// 2026-07-27 (copy-i18n-04): fr +1 for Profile.salonsCount, "{count, plural, one {#
// salon} other {# salons}}" , genuinely identical, French "salon"/"salons" happens
// to share the English spelling for this word, not an untranslated placeholder.
// 2026-07-27 (copy-i18n-07): de +1 for salon.topSalon = "Top Salon" in both, added
// while closing the messages/*.json key-parity gap , German borrows the English
// word "Top" for this exact badge phrase, so the two locales genuinely coincide.
const IDENTICAL_BASELINE = {
  de: 466,
  fr: 368,
  it: 220,
};

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function loadFlat(locale) {
  const raw = readFileSync(path.join(ROOT, "messages", `${locale}.json`), "utf8");
  return flatten(JSON.parse(raw));
}

let failed = false;

// 1. Hard zero: non-string leaf values (sentinel/TODO markers) in ANY locale.
//
// EXCEPT an array of strings, which next-intl supports via t.raw() and which this repo
// legitimately uses (dashboard.approvalsPage.checklistItems, the admin approval checklist,
// consumed as a list). Before 2026-07-27 this check rejected it, so the `i18n` job in
// .github/workflows/quality.yml was RED on all four locale files, permanently. A gate that
// is always red is a gate everyone learns to scroll past, which is worse than no gate: it
// would have hidden a real sentinel leaf behind the noise. The sentinel this rule exists to
// catch is a boolean/number/null marker (`_todo_translate: true`), and that is still a hard
// zero. An array is only accepted when EVERY element is a non-empty string, so a TODO marker
// cannot smuggle itself in inside one.
const isAllowedLeaf = (v) =>
  typeof v === "string" ||
  (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim() !== ""));

for (const locale of LOCALES) {
  const flat = loadFlat(locale);
  const nonString = Object.entries(flat).filter(([, v]) => !isAllowedLeaf(v));
  if (nonString.length > 0) {
    failed = true;
    console.error(`\n[FAIL] messages/${locale}.json has ${nonString.length} non-string leaf value(s):`);
    for (const [k, v] of nonString) {
      console.error(`  ${k} = ${JSON.stringify(v)}`);
    }
    console.error("A message tree may only contain strings at the leaves. Remove the sentinel/TODO key before merging.");
  }
}

// 2. Ratchet: identical-to-en string count per non-en locale.
const en = loadFlat(SOURCE_LOCALE);
for (const locale of LOCALES) {
  if (locale === SOURCE_LOCALE) continue;
  const flat = loadFlat(locale);
  const identical = Object.entries(flat).filter(
    ([k, v]) => typeof v === "string" && v.trim() !== "" && en[k] === v,
  );
  const baseline = IDENTICAL_BASELINE[locale] ?? 0;
  console.log(`messages/${locale}.json: ${identical.length} strings identical to en.json (baseline ${baseline})`);
  if (identical.length > baseline) {
    failed = true;
    console.error(`[FAIL] ${locale}.json identical-to-en count went UP: ${identical.length} > ${baseline} baseline.`);
    console.error("New keys added identical to the English placeholder. Translate them, or if genuinely locale-invariant (a brand name, a code, a number), raise IDENTICAL_BASELINE in scripts/check-i18n-sentinel.mjs with a one-line reason in the PR.");
    const newOnes = identical.slice(0, 20).map(([k]) => k);
    console.error(`First offenders: ${newOnes.join(", ")}`);
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("check-i18n-sentinel: OK");
}
