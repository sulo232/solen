<!-- exists-check: net-new vs the CLAUDE.md "Copy economy" block (5 rules about how MUCH to write),
     _design-system/SOURCE.md's voice section, and _rules/I18N_ROUTING.md (routing + which strings must
     be translated). Copy economy stays live and is referenced, not restated: it governs LENGTH. None of
     the three decides the REGISTER, none covers French or Italian, and none is a writing manual.
     This file is the writing law: how to write a string, in four languages. -->

# COPY LAW , how we write, in four languages

**Owner, 2026-07-29:** *"make it the Sie instead of the du ... research everything and make a whole
principle about, like, when you're writing something, how to do it."*

Precedence: tier 5, alongside the other CLAUDE.md pinned blocks. The Copy economy block in
`CLAUDE.md` still governs how MUCH to write and is not restated here. This governs HOW.

Every number in this file was measured on our own four locale files on 2026-07-29, not cited from
anyone. Where something is unmeasured it says so.

---

## 1. REGISTER , formal, in all three Romance/Germanic locales

| locale | register | pronoun set |
|---|---|---|
| de | **formal** | Sie, Ihr/Ihre/Ihren, Ihnen |
| fr | **formal** | vous, votre/vos |
| it | **formal** | Lei, Suo/Sua, La |
| en | English has one register. Write plainly; no "thou" problem to solve. | you, your |

**Owner decision, 2026-07-29.** Settled, not open.

**Where we are starting from, measured across all four files:**

| locale | informal strings | formal strings | today |
|---|---|---|---|
| de | **332** | 32 | 91% informal |
| fr | 40 | **371** | 90% formal already |
| it | **237** | **0** | 100% informal |

The three languages have been contradicting each other this whole time, and nobody noticed because
nobody reads two locales at once. French is already where the decision lands, so the sweep moves
German and Italian toward French rather than the reverse.

**The one exception, and it is the only one:** English marketing surfaces and the Inspo feed may
stay conversational, because English carries no formality marker and the constraint does not exist
there. This is not a licence to write German informally anywhere.

**The risk this decision carries, recorded once so it can be designed against rather than
re-argued:** formal German plus terse German reads institutional, and a beauty marketplace cannot
afford to read like a bank. Section 3 exists specifically to stop that. Note also, honestly, that
the general Swiss market trend runs the other way , Swiss consumer brands, including large
retailers, lean toward `du` , so this is a deliberate minority position for a services marketplace
where the salon is a professional, not a friend. The owner has the call; this is the counter-evidence
on the record, not a reopening.

---

## 2. THE SENTENCE

1. **One idea per string.** If a string needs a semicolon, it is two strings or it is a paragraph.
2. **Lead with the thing, not the preamble.** "Termin bestätigt" before "Wir freuen uns, Ihnen
   mitteilen zu können, dass Ihr Termin bestätigt wurde."
3. **Active voice, and name who acts.** "Der Salon hat den Termin bestätigt", never "Der Termin
   wurde bestätigt" when a real actor exists. Passive is legal only when the actor is genuinely the
   system and naming it would be noise.
4. **Present tense for state, perfect for a completed action.** No future tense for something that
   has already happened by the time the user reads it.
5. **Never apologise in UI copy.** "Das hat nicht geklappt" plus what to do next. Not "Es tut uns
   leid, aber leider..." The apology spends the line that should carry the fix.
6. **No German noun-stacking past two.** `Terminbestätigungsbenachrichtigung` is three nouns and a
   failure. Break it: "Benachrichtigung zur Terminbestätigung", or better, rewrite the sentence.

---

## 3. WARMTH INSIDE A FORMAL REGISTER (the anti-institution rules)

Formal address is a pronoun choice, not a personality. These stop Sie from becoming a bank.

1. **Warmth comes from verbs and specifics, never from exclamation marks.** "Ihr Platz bei Marco ist
   reserviert" is warm. "Buchung erfolgreich!" is a receipt with a party hat.
2. **Use the salon's and the stylist's real name wherever we have it.** A named human is the single
   cheapest warmth lever we own and it costs no adjectives.
3. **No corporate hedging vocabulary.** Banned by name: `bitte beachten Sie`, `wir möchten Sie
   darauf hinweisen`, `gegebenenfalls`, `diesbezüglich`, `im Rahmen`, `Vorgang`, `erfolgreich
   durchgeführt`.
4. **Second person beats third.** "Sie zahlen im Salon", not "Die Zahlung erfolgt vor Ort".
5. **Contractions and ordinary words.** Formal does not mean latinate. Prefer `nutzen` to
   `verwenden`, `zeigen` to `darstellen`, `Termin` to `Terminvereinbarung`.
6. **One human sentence per emotional moment.** The confirmation screen, the first booking, a
   cancellation. Everywhere else, be brief. (Peak-end, `PSYCHOLOGY.md` law 1.)

---

## 4. PUNCTUATION

1. **No em-dash (`,`) anywhere**, in any language, in UI copy, code, comments or commits. Use a
   period, comma, colon, parentheses, or a spaced hyphen.
2. **The spaced en-dash (` , `) is LEGAL in DE, FR and IT prose** for a parenthetical or a range,
   and remains banned in English UI copy and in code. This is a carve-out to the old blanket rule,
   which our own files broke **252 times**: measured 2026-07-29, the four locale files contain
   **222 em-dashes** and **30 en-dashes**. A rule broken 252 times by its own owner is not a rule.
   The em-dashes are a cleanup task; the en-dashes were never wrong.
3. **No exclamation marks** except in a genuine celebration string, at most one per screen.
4. **No ALL-CAPS**, and no tracked-uppercase eyebrows. Emphasis is weight and size.
5. **Ellipsis is a real character `…`**, and only for a truncation or a genuine pause, never for
   coyness.
6. **Quotation marks follow the locale:** German `„so"`, French `« so »` with non-breaking spaces,
   Italian `"so"`. Do not ship the German pair into the French file.

---

## 5. NUMBERS, DATES, MONEY

1. **Currency is `CHF 45`**, symbol before the amount, a normal space, never `45.-` and never
   `45 CHF` in UI. Prices are tabular figures so columns align.
2. **Never a bare rating.** A rating number always carries its star, and a review count in
   parentheses when we have one. (`PSYCHOLOGY.md` law 6, and a wired gate.)
3. **Never a fabricated number.** If it is not wired to a live source, the element does not ship.
   (Taste rule 1, and a wired gate.)
4. **Dates on a card are `Heute` / `Morgen` / `TT.MM.`** and never carry a time. Times live in the
   booking picker only.
5. **Swiss thousands grouping**, and the decimal comma or point follows the locale formatter, never
   a hand-written string. Format through the formatter, never with template concatenation.

---

## 6. THE SHAPE OF EACH STRING TYPE

| type | rule | example, DE formal |
|---|---|---|
| button, commit | verb, infinitive or imperative, 1-2 words | `Buchen`, `Bezahlen` |
| button, secondary | verb, no politeness padding | `Ändern`, not `Bitte ändern` |
| link | say the destination, not "hier klicken" | `Buchung verwalten` |
| section heading | noun phrase, no verb, no colon | `Ihre Termine` |
| empty state | a promise headline plus the action, never a status label | `Noch keine Termine` + a filled CTA |
| error | what happened, then what to do, in that order, no apology | `Zahlung nicht möglich. Bitte andere Karte versuchen.` |
| toast | outcome only, past tense, no punctuation at the end | `Termin abgesagt` |
| placeholder | an example, not an instruction | `z. B. Coiffeur Zürich` |
| aria-label | what the control DOES, not what it looks like | `Termin absagen` |

---

## 7. TRANSLATION MECHANICS

1. **Never hardcode a user-facing string.** `useTranslations()` / `getTranslations()`, always.
   (`_rules/I18N_ROUTING.md` Rule 33b.)
2. **A key ships in all four files at once**, with real translations, never an English or German
   copy sitting in the French file as a placeholder.
3. **Translate the meaning, not the words.** A German string that is a literal calque of the English
   is a bug even when every word is correct.
4. **ICU placeholders are never split across a sentence boundary** and never reordered into a shape
   the other three languages cannot express.

### Layout budget, measured on our own corpus, replacing the old "30% longer" rule

`_rules/I18N_ROUTING.md` Rule 35 says "German copy is typically 30% longer than English". **Measured
on 5,671 real string pairs on 2026-07-29, that is wrong for us, and it fingers the wrong language:**

| locale | median vs EN | p90 vs EN | short strings (EN 1-10 chars) |
|---|---|---|---|
| de | **1.10x** | 1.60x | 1.14x |
| fr | **1.17x** | **1.72x** | 1.17x |
| it | 1.14x | 1.58x | 1.17x |

**French is our longest language, not German**, and the typical case is +10 to +17%, not +30%.
**Design to the p90, roughly 1.7x, and test French, not German.** The rule's ACTION (never fix-width
a text container, size fluidly to a `max-w-*`) was always right and stays; only its number and its
named language change.

Honest note (unmeasured): the claim that very short strings expand 200-300% does not reproduce here.
Our shortest bucket sits at 1.14-1.17x median. It may still hold for one-word UI labels in a corpus
built differently from ours; we have no evidence either way and should not cite the figure.

---

## 8. ENFORCEMENT , what is a gate and what is judgment

Stating this per rule, because an unenforced writing rule is advice, and advice loses to task focus.

| rule | enforcement today |
|---|---|
| no em-dash | gate, wired |
| no fabricated number | gate, wired (`pre-edit-psychology-gate.py`) |
| bare rating | gate, wired (same) |
| no hardcoded string | greppable, **no gate yet** , the obvious next one |
| register (Sie/vous/Lei) | **greppable per locale, no gate yet** , a du/tu pronoun in `messages/de.json` or `it.json` is a regex away and should become one once the sweep lands |
| no ALL-CAPS, no tracked uppercase | gate, wired (mockup copy lint) |
| everything in sections 2, 3, 6 | **judgment.** Belongs on the `loop-reviewer` copy lens, not a regex |

A register gate written BEFORE the sweep would block every existing string, so the order is: sweep
first, then arm the gate as a ratchet so it can only get better.

---

## 9. OPEN

- The Italian formal register has **zero** existing examples in our files, so the first 20 Italian
  strings written under this law set the house style for the language. They deserve a native check.
- 115 German keys look unreferenced by any code (crude scan, 2026-07-28, not manually confirmed).
  Confirming that list before the sweep would cut the work by roughly a quarter.
