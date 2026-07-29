#!/usr/bin/env node
//
// Swap informal address (du/tu) for formal address (Sie/Lei/vous) in one locale file.
//   node scripts/register-sweep.mjs de            dry run (default, writes nothing)
//   node scripts/register-sweep.mjs de --write     applies to messages/de.json
//   node scripts/register-sweep.mjs de --diff      also prints the full before/after
//   REGISTER_SWEEP_DIFF=1 node scripts/register-sweep.mjs de   same as --diff
//
// Why this exists: the owner locked the register to formal in all three Romance/Germanic
// locales on 2026-07-29 (_design-system/COPY_LAW.md section 1). Measured that day: de had
// 332 informal strings, it had 237 (and zero formal ones), fr had 40 stragglers.
//
// WHAT THIS DOES NOT DO: conjugate verbs. Swapping only the pronoun/possessive breaks any
// sentence whose verb is inflected for the second person singular, e.g. German "du buchst"
// naively becomes "Sie buchst", which is wrong (correct: "Sie buchen"); French "tu utilises"
// becomes "vous utilises" (wrong: "vous utilisez"). A regex cannot conjugate reliably, so
// instead of shipping broken grammar, every string where the post-swap text still looks like
// it carries a residual second-person-singular verb is listed under REVIEW with its key and
// new value, so a human fixes those individually. See detectResidualVerb* below for exactly
// what each locale's heuristic catches and misses; none of them is a real parser, and reading
// the REVIEW list (or the full --diff) yourself is still required before trusting a --write.

import { readFileSync, writeFileSync } from "node:fs";

const LOCALES = ["de", "it", "fr"];
const [, , localeArg, ...flags] = process.argv;

if (!localeArg || !LOCALES.includes(localeArg)) {
  console.error(`Usage: node scripts/register-sweep.mjs <${LOCALES.join("|")}> [--write] [--diff]`);
  process.exit(1);
}

const WRITE = flags.includes("--write");
const SHOW_DIFF = flags.includes("--diff") || !!process.env.REGISTER_SWEEP_DIFF;
const FILE_PATH = new URL(`../messages/${localeArg}.json`, import.meta.url).pathname;

// ---------------------------------------------------------------------------------------
// Mapping tables. Longest form first within each locale so "deinem" is matched whole and
// never partially eaten by a shorter alternative like "dein" (regex alternation tries
// alternatives left to right, not longest-match, so order here is load-bearing).
//
// German and Italian targets are FIXED-CASE regardless of the source word's casing: the
// formal pronoun/possessive is always capitalised by convention in both languages ("Sie",
// "Ihr", "Ihnen" in German; "Lei", "Suo", "Sua" in Italian), even mid-sentence. That is why
// "deine" and "Deine" both map to "Ihre", and "tu" and "Tu" both map to "Lei". French has no
// such convention ("vous"/"votre"/"vos" are ordinary lowercase words), so the French table
// preserves the matched word's original capitalisation on the target instead.
// ---------------------------------------------------------------------------------------

const DE_MAP = [
  ["deinen", "Ihren"],
  ["deinem", "Ihrem"],
  ["deiner", "Ihrer"],
  ["deines", "Ihres"],
  ["deine", "Ihre"],
  ["dein", "Ihr"],
  ["dich", "Sie"],
  ["dir", "Ihnen"],
  ["du", "Sie"],
];

const IT_MAP = [
  ["tuoi", "Suoi"],
  ["tue", "Sue"],
  ["tuo", "Suo"],
  ["tua", "Sua"],
  ["tu", "Lei"],
];

// fr targets keep the source's case (see note above): "Ton" -> "Votre", "tu" -> "vous".
const FR_MAP = [
  ["tes", "vos"],
  ["ton", "votre"],
  ["toi", "vous"],
  ["ta", "votre"],
  ["tu", "vous"],
];

const MAPS = { de: DE_MAP, it: IT_MAP, fr: FR_MAP };
// de/it targets never change with source case; fr does (see note above).
const FIXED_CASE_TARGET = { de: true, it: true, fr: false };

function capitalizeLike(sample, word) {
  if (!sample) return word;
  const firstIsUpper = sample[0] !== sample[0].toLowerCase();
  return firstIsUpper ? word[0].toUpperCase() + word.slice(1) : word;
}

// fr-only: "ton"/"ta"/"tes" glued to another word with a hyphen is a strong signal of a
// compound noun, not the possessive "your" ("sous-ton" = hair-colour undertone, measured in
// messages/fr.json; there is no French construction where the possessive determiner "ton"
// legitimately sits on either side of a hyphen). "tu"/"toi" are excluded from this guard
// because inverted questions genuinely use them that way ("veux-tu ?", "Connecte-toi") and
// those ARE real pronoun occurrences, just ones that also need a verb fix (see REVIEW below).
const FR_HYPHEN_COMPOUND_GUARD = new Set(["ton", "ta", "tes"]);

function buildRegex(map) {
  const sourceForms = map.map(([from]) => from).sort((a, b) => b.length - a.length);
  const alternation = sourceForms.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  // Unicode-aware word boundary via lookaround, not \b: JS's \b only treats [A-Za-z0-9_] as
  // a "word" character, so it misfires on accented letters (e.g. \b would find "tes" inside
  // French "êtes" because "ê" is not \w, creating a false boundary). \p{L}/\p{N} cover the
  // accented letters our four locales actually use.
  return new RegExp(`(?<![\\p{L}\\p{N}])(${alternation})(?![\\p{L}\\p{N}])(?!@)`, "giu");
}

function makeReplacer(locale) {
  const map = MAPS[locale];
  const lookup = new Map(map.map(([from, to]) => [from.toLowerCase(), to]));
  const fixedCase = FIXED_CASE_TARGET[locale];
  const regex = buildRegex(map);

  return function replace(text) {
    let changed = false;
    const out = text.replace(regex, (match, _grp, offset, full) => {
      const key = match.toLowerCase();
      const target = lookup.get(key);
      if (!target) return match; // should not happen, alternation is built from the map keys

      if (locale === "fr" && FR_HYPHEN_COMPOUND_GUARD.has(key)) {
        const before = full[offset - 1];
        const after = full[offset + match.length];
        if (before === "-" || after === "-") return match; // leave the compound alone
      }

      changed = true;
      return fixedCase ? target : capitalizeLike(match, target);
    });
    return { text: out, changed };
  };
}

// ---------------------------------------------------------------------------------------
// ICU placeholder guard. "{count}" / "{name}" and nested plural/select forms like
// "{count, plural, one {Buchung} other {Buchungen}}" must never be touched. Rather than a
// regex that assumes no nesting (which breaks on the plural/select form above, since the
// naive "{[^}]*}" stops at the FIRST "}", i.e. the inner one), this walks brace depth and
// treats an entire top-level {...} span, nesting included, as protected. Checked against
// every plural/select string in all three locale files (2026-07-29): none of them carries a
// du/tu-family word inside the braces, so this is not known to drop any real conversion in
// this corpus; a future string that puts pronoun prose inside a nested branch would need a
// smarter split, which this script does not attempt.
// ---------------------------------------------------------------------------------------
function splitProtected(text) {
  const segments = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0 && i > start) segments.push({ protected: false, text: text.slice(start, i) });
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        segments.push({ protected: true, text: text.slice(start, i + 1) });
        start = i + 1;
      }
    }
  }
  if (start < text.length) segments.push({ protected: false, text: text.slice(start) });
  return segments;
}

function convertString(locale, replacer, value) {
  const segments = splitProtected(value);
  let changed = false;
  let reviewableText = "";
  const out = segments
    .map((seg) => {
      if (seg.protected) return seg.text;
      const { text, changed: segChanged } = replacer(seg.text);
      if (segChanged) changed = true;
      reviewableText += text + " ";
      return text;
    })
    .join("");
  return { value: out, changed, reviewableText };
}

// ---------------------------------------------------------------------------------------
// REVIEW detectors: catch strings whose post-swap text still looks grammatically broken
// because a verb was never touched. These are heuristics, not parsers. Each is deliberately
// tuned toward precision over recall for its language's own reason (documented per locale),
// so the REVIEW list is a floor, not a ceiling: skim the --diff output too.
// ---------------------------------------------------------------------------------------

// German: the residual signal the task calls out is a verb ending in "-st" sitting near the
// pronoun we just introduced ("Sie"/"Ihr"-family). "-st" is also the ending of ordinary,
// non-verb German words (ist, erst, sonst, Kunst, Herbst...), so those are stoplisted. This
// will MISS a residual verb that doesn't end in "-st" (irregular forms like "bist", "hast",
// "willst" DO end in -st and are caught; "isst", imperatives with no visible pronoun like
// bare "Buche" are not, because there is nothing to swap in that sentence, so the string
// never shows up as changed in the first place and this script cannot see it at all).
const DE_ST_STOPLIST = new Set([
  "ist", "erst", "fast", "sonst", "meist", "nächst", "höchst", "jüngst", "einst", "zumeist",
  "möglichst", "kunst", "rest", "test", "verlust", "herbst", "august", "gerüst", "wurst",
  "frust", "ernst", "forst", "durst",
]);
const DE_PRONOUN_TOKEN = /^(Sie|Ihr|Ihre|Ihrer|Ihrem|Ihren|Ihres|Ihnen)$/;
const stripPunct = (w) => w.replace(/^[„"“(«]+/u, "").replace(/["“”.,!?;:)»]+$/u, "");

function detectResidualVerbDE(text) {
  const words = text.split(/\s+/).map(stripPunct).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    if (!DE_PRONOUN_TOKEN.test(words[i])) continue;
    const lo = Math.max(0, i - 3);
    const hi = Math.min(words.length - 1, i + 3);
    for (let j = lo; j <= hi; j++) {
      if (j === i) continue;
      const lower = words[j].toLowerCase();
      if (lower.length >= 4 && lower.endsWith("st") && !DE_ST_STOPLIST.has(lower)) return true;
    }
  }
  return false;
}

// Italian: a suffix heuristic like German's does not work here, because Italian plural nouns
// (saloni, clienti, capelli, appuntamenti...) end in "-i" just as often as second-person-
// singular verbs do, which would flood REVIEW with mostly nothing. Instead this is a small
// WHITELIST of the informal verb forms actually seen or plausible in this corpus. Trades
// recall for precision on purpose: a verb form not on the list will pass through unflagged,
// so treat this as a floor and extend the list when a new one turns up in practice.
const IT_VERB_WHITELIST = new Set([
  "confermi", "ricevi", "prenoti", "scegli", "vuoi", "puoi", "devi", "vai", "dai", "stai",
  "fai", "sai", "sei", "hai", "esci", "vieni", "apri", "chiudi", "modifichi", "cancelli",
  "aggiorni", "invii", "carichi", "attivi", "disattivi", "gestisci", "verifichi", "completi",
  "inizi", "continui", "salvi", "condividi", "trovi", "cerchi", "clicchi", "tocchi", "scorri",
  "scrivi", "leggi", "guardi", "ascolti", "paghi", "spendi", "aggiungi", "rimuovi", "controlli",
  "imposta", "seleziona",
]);

function detectResidualVerbIT(text) {
  const words = text.toLowerCase().split(/[^a-zàèéìòù]+/).filter(Boolean);
  return words.some((w) => IT_VERB_WHITELIST.has(w));
}

// French: same over-broad-suffix problem as Italian ("les", "des", "plus", "trois"... all end
// in "s"), so this is a whitelist too, plus one high-confidence structural rule: "-toi"
// glued to a verb with a hyphen (an imperative/reflexive, "Connecte-toi") is swapped to
// "-vous" by the regex above, but the verb itself still needs its formal ending
// ("Connecte-vous" is wrong, "Connectez-vous" is right), so ANY pre-swap "-toi" hyphen match
// is flagged, independent of the whitelist below.
const FR_VERB_WHITELIST = new Set([
  "peux", "dois", "veux", "as", "es", "sais", "fais", "vas", "viens", "tiens", "utilises",
  "aimes", "cherches", "choisis", "reçois", "vois", "dis", "prends", "mets", "sors", "pars",
  "ouvres", "fermes", "ajoutes", "supprimes", "modifies", "confirmes", "annules", "paies",
  "payes", "gardes", "envoies", "remplis",
]);

function detectResidualVerbFR(originalText, convertedText) {
  if (/-toi\b/iu.test(originalText)) return true;
  const words = convertedText.toLowerCase().split(/[^a-zàâçéèêëîïôûùü]+/).filter(Boolean);
  return words.some((w) => FR_VERB_WHITELIST.has(w));
}

const REVIEW_DETECTORS = {
  de: (original, converted) => detectResidualVerbDE(converted),
  it: (original, converted) => detectResidualVerbIT(converted),
  fr: (original, converted) => detectResidualVerbFR(original, converted),
};

// ---------------------------------------------------------------------------------------
// Walk the nested messages object, converting every leaf string.
// ---------------------------------------------------------------------------------------
function sweep(locale, data) {
  const replacer = makeReplacer(locale);
  const detectReview = REVIEW_DETECTORS[locale];
  const changes = [];
  const reviews = [];

  function walk(node, path) {
    for (const key of Object.keys(node)) {
      const value = node[key];
      const keyPath = path ? `${path}.${key}` : key;
      if (typeof value === "string") {
        const { value: newValue, changed, reviewableText } = convertString(locale, replacer, value);
        if (changed) {
          changes.push({ key: keyPath, before: value, after: newValue });
          node[key] = newValue;
          if (detectReview(value, reviewableText.trim())) {
            reviews.push({ key: keyPath, before: value, after: newValue });
          }
        }
      } else if (value && typeof value === "object") {
        walk(value, keyPath);
      }
    }
  }

  walk(data, "");
  return { changes, reviews };
}

// ---------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------
const raw = readFileSync(FILE_PATH, "utf8");
const data = JSON.parse(raw);
const { changes, reviews } = sweep(localeArg, data);

console.log(`register-sweep ${localeArg}: ${WRITE ? "WRITE" : "DRY RUN"}`);
console.log(`  ${changes.length} string(s) changed`);
console.log(`  ${reviews.length} need a human pass (residual verb suspected)\n`);

if (reviews.length > 0) {
  console.log("REVIEW (verb likely needs conjugation, fix by hand):");
  for (const r of reviews) {
    console.log(`  ${r.key}`);
    console.log(`    before: ${r.before}`);
    console.log(`    after:  ${r.after}\n`);
  }
}

if (SHOW_DIFF) {
  console.log("Full before/after:");
  for (const c of changes) {
    console.log(`  ${c.key}`);
    console.log(`    - ${c.before}`);
    console.log(`    + ${c.after}\n`);
  }
} else if (changes.length > 0) {
  console.log(`(pass --diff, or set REGISTER_SWEEP_DIFF=1, to print all ${changes.length} before/after pairs)`);
}

if (WRITE) {
  // JSON.stringify(obj, null, 2) reproduces messages/*.json byte-for-byte on the untouched
  // file (checked 2026-07-29 against all three locales), so it is safe to round-trip through
  // here without a hand-rolled serializer: object key order is preserved by the engine.
  writeFileSync(FILE_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${FILE_PATH}`);
} else {
  console.log("\nDry run, nothing written. Pass --write to apply.");
}

process.exit(0);
