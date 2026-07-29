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

// French elision "t'" (round 2 fix, item 4): "te"/"tu" elide to "t'" before a vowel sound
// ("t'attend", "t'enverrons"), but "vous" never elides, so the correct formal output needs a
// space where the apostrophe was, not just a swapped letter: "t'attend" -> "vous attend", not
// "vous'attend". This is a SAFE mechanical mapping, not a judgment call: whichever word the
// "t'" stood for (te or tu), the formal object/subject form is "vous" either way, so there is
// no ambiguity to punt to REVIEW. Checked against the corpus 2026-07-29: exactly two
// occurrences in messages/fr.json, "t'attend" and "t'enverrons", both "te" elisions, both
// grammatically fine as a straight pronoun swap: "te"/"vous" here are the OBJECT of the verb
// ("awaits you", "will send you"), and an object pronoun never drives verb agreement, only the
// subject does ("rendez-vous" in the first, "Nous" in the second), so swapping the object
// carries no verb-conjugation issue regardless of who the subject is.
const FR_ELISION_PATTERN = /(?<![\p{L}\p{N}])([Tt])['’](?=[aeiouhâàéèêëîïôûùüAEIOUHÂÀÉÈÊËÎÏÔÛÙÜ])/gu;

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
    let out = text.replace(regex, (match, _grp, offset, full) => {
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

    if (locale === "fr") {
      out = out.replace(FR_ELISION_PATTERN, (_match, letter) => {
        changed = true;
        return letter === "T" ? "Vous " : "vous ";
      });
    }

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
// because a verb was never touched, or (Italian "ti") because a pronoun resolves differently
// depending on grammatical role and a blind swap would guess wrong. These are heuristics, not
// parsers. Round 1 tuned each one toward precision over recall; round 2 (owner/reviewer,
// 2026-07-29) reversed that call after finding the precision buy-down was hiding real misses
// (a whole verb shape for German, a whole pronoun class for Italian): a noisy REVIEW list
// costs a human some reading, a quiet one ships mixed-register copy. Every detector below is
// now biased toward flagging when in doubt; the REVIEW list is a floor, not a ceiling, and the
// full --diff is still worth skimming.
// ---------------------------------------------------------------------------------------

// German (rewritten round 2, 2026-07-29): the original detector only caught a residual "-st"
// verb near Sie/Ihr, which finds the STRONG-verb informal forms ("bist", "hast", "willst")
// but has near-zero recall on the single most common failure shape in this corpus: the WEAK
// verb imperative CTA ("Wähle...", "Erstelle...", "Teile..."), which ends in "-e", not "-st",
// and often carries no pronoun at all for a proximity check to anchor on. Three signals now
// run, because no single one covers German's imperative grammar:
//
// (1) FIRST-WORD SIGNAL, the fix for the central miss. German capitalises the first word of
// EVERY sentence regardless of part of speech (nouns are capitalised too), so "is the first
// word capitalised" proves nothing by itself; what discriminates is whether that word belongs
// to a small CLOSED grammatical class that legitimately opens a German sentence without being
// a verb (article, preposition, conjunction, question word, pronoun, common adverb/
// interjection, a number, or a specific noun/adjective this corpus is confirmed to open
// sentences with). DE_NON_VERB_STARTERS is that stoplist; anything capitalised outside it is
// treated as a suspected imperative. Deliberately a BLACKLIST, not a whitelist of "known
// verbs": a verb whitelist would need to anticipate every imperative the copy ever uses and
// silently miss new ones (a false negative, a broken string ships quietly); a stoplist's
// failure mode is a false positive (one extra line a human reads and dismisses), which is the
// direction round 2 asked for. The stoplist is deliberately NOT extended to words that are
// ambiguous on inspection ("Sichere" is the adjective in "Sichere Zahlung" twice but the real
// imperative in "Sichere deinen Termin" once; "Zeigt"/"Wird"/"Enthält"/"Konnte"/"Verschoben"/
// "Passt"/"Ausgebucht" are all real 3rd-person, passive, or participle uses with no
// conjugation problem): stoplisting on ambiguous evidence is exactly the failure this round
// exists to close, so those pay the small false-positive cost instead of risking a miss.
//
// (2) "-st" PROXIMITY SIGNAL (unchanged from round 1): a residual verb ending in "-st" sitting
// within 3 words of the Sie/Ihr-family pronoun we just introduced. Stoplisted against ordinary
// non-verb "-st" words (ist, erst, Kunst, Herbst...).
//
// (3) IRREGULAR-IMPERATIVE-ANYWHERE SIGNAL: German strong verbs form an irregular du-
// imperative that never takes "-e" and often changes its stem vowel ("gehen" -> "Geh", not
// "Gehe"; "sehen" -> "Sieh"), so it does not fit signal (1)'s "-e" shape and can sit
// mid-sentence after a conjunction, invisible to a first-word check
// ("Überprüfe deine Einstellungen und geh live" carries a second imperative, "geh", that
// signal 1 alone would miss on a string whose first word WAS stoplisted). DE_IRREGULAR_
// IMPERATIVE is a small closed list of the strong-verb imperatives confirmed in this corpus
// or common enough in customer-facing UI copy to expect. A strong verb not on this list is
// still invisible to signal 3, same bounded-recall tradeoff as the Italian/French lists below.
const DE_ST_STOPLIST = new Set([
  "ist", "erst", "fast", "sonst", "meist", "nächst", "höchst", "jüngst", "einst", "zumeist",
  "möglichst", "kunst", "rest", "test", "verlust", "herbst", "august", "gerüst", "wurst",
  "frust", "ernst", "forst", "durst",
]);
const DE_PRONOUN_TOKEN = /^(Sie|Ihr|Ihre|Ihrer|Ihrem|Ihren|Ihres|Ihnen)$/;
const stripPunct = (w) => w.replace(/^[„"“(«]+/u, "").replace(/["“”.,!?;:)»]+$/u, "");

// Closed grammatical classes plus the specific nouns/adjectives/proper nouns this corpus is
// confirmed (2026-07-29, hand-checked against every distinct first word of a changed German
// string) to open a sentence with, none of them a verb in any occurrence found.
const DE_NON_VERB_STARTERS = new Set([
  // articles / determiners
  "der", "die", "das", "dem", "den", "des", "ein", "eine", "einen", "einem", "einer", "eines",
  "kein", "keine", "keiner", "keinem", "keinen", "keines", "diese", "dieser", "dieses",
  "diesem", "diesen", "jede", "jeder", "jedes", "jedem", "jeden", "alle", "alles", "welche",
  "welcher", "welchen", "welchem", "welches",
  // pronouns, incl. our own formal targets: a sentence starting with the pronoun we just
  // introduced is a subject, not a verb
  "ich", "wir", "es", "sie", "er", "man", "ihr", "ihre", "ihrer", "ihrem", "ihren", "ihres",
  "ihnen", "etwas", "nichts", "jemand", "niemand", "wer", "was",
  // prepositions
  "in", "im", "an", "am", "auf", "aus", "bei", "beim", "mit", "nach", "von", "vom", "vor",
  "über", "unter", "ohne", "durch", "um", "seit", "bis", "gegen", "für", "zu", "zum", "zur",
  "zwischen", "während", "trotz", "innerhalb", "außerhalb", "ab",
  // conjunctions
  "und", "oder", "aber", "wenn", "weil", "da", "denn", "als", "damit", "falls", "sowie",
  "sondern", "dass", "sobald", "obwohl", "bevor", "nachdem", "sodass",
  // question words
  "wie", "wann", "warum", "wonach", "wozu", "wieso", "wo", "wohin", "woher",
  // adverbs / interjections that open a sentence in this corpus without being a command
  "bitte", "bald", "schon", "so", "noch", "immer", "erneut", "automatisch", "kostenlos",
  "optional", "ja", "nein", "hi", "danke", "hier", "dort", "jetzt", "heute", "morgen",
  "gestern", "sehr", "auch", "nur", "mal", "vielleicht", "natürlich", "leider",
  // corpus-specific nouns / adjectives / proper nouns, hand-checked, none a verb
  "salons", "kunden", "coiffeur", "stripe", "wellness", "waxing", "chat", "solen", "magic",
  "updates", "arbeitszeiten", "übersicht", "vorlagen", "sichtbarkeit", "regentag",
  "vorschau-modus", "test-salons", "salon-profil", "bestätigungsmail", "zahlungen", "kalt",
  "grundlegende", "klassische", "beliebte", "beliebt", "ausgebucht", "gültig", "neu",
  "spezielle", "fuer",
]);

// Strong-verb du-imperatives that don't fit the weak-verb "-e" shape (signal 3). Closed list,
// see comment above for what it does and does not catch.
const DE_IRREGULAR_IMPERATIVE = new Set([
  "geh", "gehe", "sei", "nimm", "gib", "sieh", "lies", "iss", "hilf", "wirf", "sprich",
  "brich", "trag", "lass", "hol", "schau", "sag", "erzähl", "lehn", "bring", "vergiss",
  "miss", "empfiehl",
]);

// Strips a trailing gender-inclusive suffix ("Dein:e" -> "Dein") before a stoplist/whitelist
// lookup, so the colon notation used across this corpus doesn't defeat either list.
const normalizeWordDE = (raw) => stripPunct(raw).split(":")[0];

function isCapitalizedLetter(ch) {
  return !!ch && ch === ch.toUpperCase() && ch !== ch.toLowerCase();
}

function detectResidualVerbDE(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  // Signal 1: first word.
  const first = normalizeWordDE(words[0]);
  if (isCapitalizedLetter(first[0]) && !DE_NON_VERB_STARTERS.has(first.toLowerCase())) {
    return true;
  }

  // Signal 2: residual "-st" verb near a Sie/Ihr-family pronoun.
  for (let i = 0; i < words.length; i++) {
    const w = stripPunct(words[i]);
    if (!DE_PRONOUN_TOKEN.test(w)) continue;
    const lo = Math.max(0, i - 3);
    const hi = Math.min(words.length - 1, i + 3);
    for (let j = lo; j <= hi; j++) {
      if (j === i) continue;
      const lower = stripPunct(words[j]).toLowerCase();
      if (lower.length >= 4 && lower.endsWith("st") && !DE_ST_STOPLIST.has(lower)) return true;
    }
  }

  // Signal 3: a known irregular strong-verb imperative anywhere in the sentence.
  for (const w of words) {
    if (DE_IRREGULAR_IMPERATIVE.has(normalizeWordDE(w).toLowerCase())) return true;
  }

  return false;
}

// Italian: a suffix heuristic like German's does not work here, because Italian plural nouns
// (saloni, clienti, capelli, appuntamenti...) end in "-i" just as often as second-person-
// singular verbs do, which would flood REVIEW with mostly nothing, and regular -are verb
// imperatives ("prenota", "crea", "carica") are SPELLED IDENTICALLY to the 3rd-person
// indicative, so there is no suffix signal to key on at all. This stays a WHITELIST of
// informal verb forms, expanded round 2 (2026-07-29) by auditing every distinct first word of
// a changed Italian string by hand against messages/it.json rather than guessing (found the
// round-2-named miss "prenota" plus "trova", "crea", "mostra", "controlla", "registra",
// "condividi", "personalizza", "raggiungi", "scopri", "configura", "descrivi", "carica",
// "chatta", "inserisci", "ritira", "accedi", "porta", "modifica", "invita", "definisci",
// "esamina", "aiutaci", "prova", "raccontaci", "collega", "salva", "visualizza", "valuta",
// "conferma", "assicura", "registrati"; checked "provalo" specifically per the round-2 note
// and it does not occur in this corpus, so it is not included). Still trades recall for
// precision AT THE WORD level (a real imperative not on this list is invisible), but the
// round-2 direction is to keep widening this list over pure guessing, not to change the
// mechanism; extend it whenever a new one turns up.
const IT_VERB_WHITELIST = new Set([
  "confermi", "ricevi", "prenoti", "prenota", "scegli", "vuoi", "puoi", "devi", "vai", "dai",
  "stai", "fai", "sai", "sei", "hai", "esci", "vieni", "apri", "chiudi", "modifichi",
  "cancelli", "aggiorni", "invii", "carichi", "carica", "attivi", "disattivi", "gestisci",
  "verifichi", "completi", "inizi", "continui", "salvi", "salva", "condividi", "trovi",
  "trova", "cerchi", "clicchi", "tocchi", "scorri", "scrivi", "leggi", "guardi", "ascolti",
  "paghi", "spendi", "aggiungi", "rimuovi", "controlli", "controlla", "imposta", "seleziona",
  "crea", "mostra", "registra", "registrati", "personalizza", "raggiungi", "scopri",
  "configura", "descrivi", "chatta", "inserisci", "ritira", "accedi", "porta", "modifica",
  "invita", "definisci", "esamina", "aiutaci", "prova", "raccontaci", "collega",
  "visualizza", "valuta", "conferma", "assicura",
]);

// Round 2, item 3: standalone "ti" (informal object pronoun, "you") resolves to "La" or "Le"
// depending on whether it is a direct or indirect object, which is the same class of judgment
// call as a conjugated verb, so it is deliberately NOT added to IT_MAP as a blind swap; it is
// instead always flagged, same as an unresolved verb. "Il tuo primo appuntamento ti aspetta"
// used to convert to "Il Suo primo appuntamento ti aspetta" (a formal possessive sitting next
// to an untouched informal pronoun) with nothing telling a human to look at it; this closes
// that hole.
const IT_TI_PATTERN = /(?<![\p{L}\p{N}])ti(?![\p{L}\p{N}])/iu;

function detectResidualVerbIT(text) {
  if (IT_TI_PATTERN.test(text)) return true;
  const words = text.toLowerCase().split(/[^a-zàèéìòù]+/).filter(Boolean);
  return words.some((w) => IT_VERB_WHITELIST.has(w));
}

// French: same over-broad-suffix problem as Italian ("les", "des", "plus", "trois"... all end
// in "s"), so this is a whitelist too, plus one high-confidence structural rule: "-toi"
// glued to a verb with a hyphen (an imperative/reflexive, "Connecte-toi") is swapped to
// "-vous" by the regex above, but the verb itself still needs its formal ending
// ("Connecte-vous" is wrong, "Connectez-vous" is right), so ANY pre-swap "-toi" hyphen match
// is flagged, independent of the whitelist below.
//
// Round 3 (2026-07-29): this list was byte-identical to round 1 while DE and IT both got
// audited and widened, which is why FR's REVIEW count stayed flat when the other two roughly
// doubled, not because French had nothing left to find. Fixed by hand-reading all 51 changed
// French strings against messages/fr.json (not guessed) and adding every bare 2nd-person-
// singular imperative/future/present form found: "vérifie", "réessaie", "réserve", "essaye",
// "évalue", "saisis", "pourras" (future tense of pouvoir, "Tu pourras..."), "réponds",
// "confirme", "clique", "choisis". No separate first-word or post-"et" signal was added
// alongside this, unlike German: the word scan below already runs over EVERY word in the
// converted string, not just the first one, so widening the whitelist alone also catches the
// named mid-sentence cases ("Vérifie ta connexion et réessaie.", "...et clique sur le lien...")
// without extra plumbing. The tradeoff is unchanged from round 1: a verb not on this list is
// still invisible to this detector.
const FR_VERB_WHITELIST = new Set([
  "peux", "dois", "veux", "as", "es", "sais", "fais", "vas", "viens", "tiens", "utilises",
  "aimes", "cherches", "choisis", "reçois", "vois", "dis", "prends", "mets", "sors", "pars",
  "ouvres", "fermes", "ajoutes", "supprimes", "modifies", "confirmes", "annules", "paies",
  "payes", "gardes", "envoies", "remplis", "vérifie", "réessaie", "réserve", "essaye",
  "essaie", "évalue", "saisis", "pourras", "réponds", "confirme", "clique",
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
