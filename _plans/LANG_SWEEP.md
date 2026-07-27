# All-language sweep (de / en / fr / it) , workstream 46

Owner, 2026-07-27: *"make an all lang sweep english german italian and french"*, then
*"we alsp need full translation stuff like for salon yk cz salon cant rlly translte every
service they have yk like auto translate dont w ehave api for that ... how should we do the
ahto translation part where we cant control like text between customer and salon or reviews
section or salon services or desicriptuon"*, then *"ima go to sleep continue autonomously"*.

Running unattended. Every item lands DONE with evidence or BLOCKED with a named dependency.
Nothing waits for an answer that I can reason out myself.

## The three content classes, and why each gets a different mechanism

Written down because the owner asked the architecture question directly, and because getting
this wrong is expensive in a different way for each class.

| class | example | when to translate | why |
|---|---|---|---|
| **Salon-authored, write-once read-many** | service name, service description, salon description, badges | **on SAVE**, store all four | The salon types German once. A read-time translation would run thousands of times for one write. Cost is bounded and the salon can overwrite. |
| **Customer-authored, read-sometimes** | reviews (260 live) | **on first READ in a foreign locale, then cache** | Most reviews will never be read in another language, so translating all 260 upfront is waste. The original must stay visible: a machine translation must never silently become what the customer said. |
| **Conversational** | customer to salon chat | **N/A , the feature does not exist** | Chat was turned off 2026-06-13 and graveyarded (`_design-system/REMOVED.md:63-64,67`). The `conversations`/`messages` tables survive with zero live callers. Not a translation problem; a feature decision. |

**Priority follows the owner's own point** (*"most ppl are gnna see german when in german
speaking oart"*): German is the SOURCE and English is already handled, so French and Italian
are the entire remaining job. That bounds the work.

## Done

- [x] **S1. The 13 missing DB columns.** commit `504d82ae8`. Six tables were de+en only, so
      once live a French customer would read German service names regardless of any work in
      `messages/*.json`. Verified live via information_schema: all six now carry a complete set.
- [x] **S2. One read helper, ten call sites.** commit `504d82ae8`. `lib/i18n/localized-field.ts`,
      fallback chain requested-locale -> de -> en. The ten sites hardcoded
      `locale === "en" ? x_en : x_de`, which is why the gap was invisible: with no fr/it branch
      there is nothing to notice missing.
- [x] **S3. Auto-translate generalised.** commit `504d82ae8`. `lib/ai/translate.ts` already had
      Gemini wired for ONE field in ONE direction; now four locales, any short field, same
      injection fencing. FIELD_RULE keeps a service NAME a name (proven live: Herrenschnitt ->
      "Coupe messieurs" / "Taglio Uomo", not a sentence). REGISTER follows the catalogue so
      machine output cannot contradict the hand-written UI.
- [x] **S4. Service CREATE auto-translates.** commit `504d82ae8`.

## Queue, in customer-impact order

- [x] **S5.** commit `a803daa60`; `verified:` re-translates only when name_de/description_de
      changes, and a salon's explicit name_fr/name_it always wins over the machine.
      **Service UPDATE must translate too.** Without it, editing a German name leaves stale
      French and Italian attached to it, which is worse than none: a wrong translation looks
      authoritative. Re-translate when `name_de`/`description_de` changes, and only then.
- [x] **S6.** commit `c2ad50605`; `verified:` live SQL after the run , 263 of 264 service rows
      now carry French and Italian names (the one gap is a row whose German name is empty).
      Translated per DISTINCT German name: 59 calls instead of 264, and the same service reads
      identically across salons. **Backfill the existing rows.** 263 services and 28 salon descriptions currently have
      no fr/it at all. This is the single biggest visible change for a French or Italian
      visitor, since every seeded salon is affected.
- [x] **S7. DONE and MEASURED.** `verified:` on the live tunnel with three real German
      reviews, French target , cold 7,726ms translating 3, warm 209ms served from cache
      (`cached: true`). 37x, which is the entire argument for on-read-plus-cache.
      Sample: "Jonas hat genau verstanden, was ich wollte" -> "Jonas a exactement compris ce
      que je voulais".
      - [x] Cache location: a SEPARATE `review_translations` table, not comment_fr columns on
            reviews. A machine translation sitting in the same row, in a column that looks
            like the real one, is how it quietly becomes "what they said". Verified live:
            6 columns, 2 policies, RLS on. Public read, service-role write only , a client
            must never be able to author a "translation" of someone else's review.
      - [x] Endpoint: `POST /api/reviews/translate`, zod-validated (proved: a bad uuid returns
            400 `ids.0: Invalid UUID`), bounded to 20 ids so one request cannot fan out into
            unbounded model calls, and it re-checks `is_hidden` so a moderated-away review
            cannot be translated back into visibility.
      - [x] A failed translation is NEVER cached: a cached failure is permanent, and showing
            the original instead is true.
      - [ ] The "translated from German / show original" affordance in the review list , the
            data path is proven, the UI is the remaining half.
      Original plan: **Review translation, on-read + cached.** Needs a cache location, a "translated from
      X" affordance, and the original always reachable.
- [ ] **S8. The 281 hardcoded German literals across 90 files.** Measured, not estimated.
      Worst: TermsContent (43), PrivacyContent (11), reset-password (9), business (9),
      fuer-salons (9). These render one language to all four audiences.
- [ ] **S9. /terms and /privacy render German AND English stacked, on all four locales**, while
      the page advertises hreflang alternates for fr and it. A privacy notice an Italian data
      subject cannot read is a compliance problem, not only an ugly one.

## Standing rules for this run

- A measured number or a file:line on every claim. Three of my reports today were subagent
  claims I had not checked, and all three were wrong.
- Never overwrite a good German source with a failed translation: `""` is dropped, the column
  stays empty, the fallback renders German.
- Nothing auto-translated is authoritative over a salon's own edit.
