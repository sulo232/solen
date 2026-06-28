# Concept aliases: one capability, its many names

Hand-kept alias map for the cross-session dedup system. The filename scan catches "someone
made another `deriv.ts`" and the exported-symbol scan catches "someone re-declared
`deriveHairDna`", but the costliest recurring miss is a different session rebuilding the SAME
capability under a DIFFERENT name in a DIFFERENT file. A scan can't know that "persona",
"affinity", and "scorer" all point at one hair-DNA algorithm. A human can. This file records
those equivalences so a search for ANY alias surfaces the canonical implementation.

## Format

One concept per line, each line starts with `- ` (so `exists.mjs` can parse it):

```
- alias1 / alias2 / alias3 -> path/to/canonical-file.ts (one-line description of the capability)
```

List every name the capability is plausibly searched under (English + product German,
abbreviations, synonyms). `scripts/exists.mjs` reads this file and prints matching lines under
the **Concept aliases** heading; a hit means the capability ALREADY EXISTS, so reuse / extend the
canonical file instead of building a parallel one.

When you ship a new shared capability that could be re-discovered under several names, ADD A
LINE here in the same turn. When the owner deletes/rejects a feature, that belongs in the
graveyard (`_design-system/REMOVED.md`), not here.

## Concepts

- hair-DNA / hair dna / hairdna / persona / affinity / deriv / scorer / derivation -> lib/persona/deriv.ts (the hair-DNA derivation algorithm: pure, deterministic deriveHairDna() over bookings + loyalty + formulas + onboarding selections; mirrored to mobile)
- open-now / open now / opennow / is open / opening hours / business hours / oeffnungszeiten / geoeffnet -> lib/salon-hours.ts (isOpenNow() over SHORT-day-keyed opening_hours; do not re-roll day-name handling, the long-day mismatch already bit us)
- frost glass / frosted glass / frost / glass control / over-photo control / FROST_GLASS -> lib/frost-glass.ts (shared frosted-glass recipe FROST_GLASS for a control sitting over a photo; see CONTROL_ELEVATION.md)
