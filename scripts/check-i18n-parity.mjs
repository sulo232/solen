#!/usr/bin/env node
// copy-i18n-07: no CI check ever compared the four messages/*.json key sets against
// each other, so a key added to one locale and forgotten in another shipped silently.
// next-intl's default behavior for a missing key is to console.error and render the
// bare dotted key path (e.g. "onboarding.services.aiSuggestions") as the visible
// fallback text, so the first evidence anyone got was a French/Italian/English
// visitor seeing raw key paths on a live screen.
//
// Hard zero, by name: de.json is the source-of-truth locale (every feature lands
// there first). Any key present in de.json but missing from en/fr/it.json fails CI
// with the exact dotted path named, not just a count -- and any key present in a
// non-de locale but missing from de.json (a stray addition that skipped the source
// locale) fails the same way. No ratchet: a translation-key set is a closed
// invariant (the four files describe the same UI), unlike identical-to-en strings
// (copy-i18n-01's script) or `de-CH` literals (copy-i18n-05's ESLint rule), which
// have legitimate exceptions and so use a baseline ratchet instead.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOCALES = ["de", "en", "fr", "it"];
const SOURCE_LOCALE = "de";

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

const flatByLocale = {};
for (const locale of LOCALES) {
  flatByLocale[locale] = loadFlat(locale);
}

const allKeys = new Set();
for (const locale of LOCALES) {
  for (const key of Object.keys(flatByLocale[locale])) allKeys.add(key);
}

let failed = false;
const perLocaleMissing = Object.fromEntries(LOCALES.map((l) => [l, []]));

for (const key of allKeys) {
  const missingFrom = LOCALES.filter((locale) => !(key in flatByLocale[locale]));
  if (missingFrom.length === 0) continue;
  failed = true;
  for (const locale of missingFrom) perLocaleMissing[locale].push(key);
}

if (failed) {
  console.error(`\n[FAIL] messages/*.json key parity broken (source of truth: ${SOURCE_LOCALE}.json):\n`);
  for (const locale of LOCALES) {
    const missing = perLocaleMissing[locale];
    if (missing.length === 0) continue;
    console.error(`messages/${locale}.json is missing ${missing.length} key(s) that another locale has:`);
    for (const key of missing.sort()) console.error(`  ${key}`);
    console.error("");
  }
  console.error(
    "Every key in messages/de.json must exist, translated, in en/fr/it.json (and vice versa). " +
      "Add the missing key(s) with a real translation before merging -- an untranslated or " +
      "missing key renders the bare dotted key path to the visitor at runtime.",
  );
  process.exit(1);
} else {
  console.log(`check-i18n-parity: OK (${allKeys.size} keys, all 4 locales in sync)`);
}
