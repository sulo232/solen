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
      - [x] The "translated from German / show original" affordance , BUILT and toggled on the
            live tunnel at /fr/salon/atelier-haarwerk. Translated: "Absolument ravi, ma coupe
            est parfaite !" with "Traduit de l'allemand / Voir l'original". One click back:
            "Absolut begeistert, mein Schnitt sitzt perfekt!" with "Voir la traduction".
            The provenance line renders ONLY when a translation is actually showing, so a
            German reader never sees it and a failed fetch never claims something happened.
      Original plan: **Review translation, on-read + cached.** Needs a cache location, a "translated from
      X" affordance, and the original always reachable.
- [x] **S8, the customer-facing half , DONE. The owner caught what I had missed: ENGLISH.**
      I had been checking /fr and /it and calling it a French-and-Italian job, because English
      service names were already populated so the page LOOKED right. The chrome was not: the
      footer said Für Salons / Hilfe / Rechtliches on /en, the sticky tab nav said
      Bewertungen, and every amenity said Sofortbestätigung. `verified:` all three locales now
      fetch clean , a regex over the served HTML of /en, /fr and /it for twelve German strings
      returns ZERO hits on each, all 200.
      Swept: 8 PDP section headings, the 7 sticky-tab labels, 12 amenity labels, the footer's
      4 column headings + 12 link labels + tagline + newsletter band, and 12 German
      aria-labels across 8 files.
      TWO STRUCTURAL FIXES, not string swaps: `COLUMNS` in Footer.tsx and `TAB_SECTIONS` in
      _shared.ts are module-level constants OUTSIDE any component, so no hook can reach them.
      Both now carry a labelKey resolved at the render site, with `as const` so next-intl's
      literal-key union still type-checks , a typo is a build error rather than a raw dotted
      path shown to a customer, which the hardcoded German could never catch.
      Was: **The 281 hardcoded German literals across 90 files.** Measured, not estimated.
      Worst: TermsContent (43), PrivacyContent (11), reset-password (9), business (9),
      fuer-salons (9). These render one language to all four audiences.
- [x] **S9. DONE, with a deliberate limit.** `verified:` fetched both pages in all four
      locales. de = German only. en = English only. fr and it = the binding German plus an
      explicit notice in their own language. Zero pages now stack two languages.
      THE LIMIT, and it is a choice not an omission: French and Italian readers get the
      GERMAN text, not a machine translation. Auto-translating binding terms or a privacy
      notice and publishing them is a legal risk rather than a quality one, and a privacy
      notice is specifically the document a data subject relies on to exercise a right. The
      notice names German as the version that governs, which is the standard Swiss pattern
      and the honest one. Remove the notice per locale the moment a REVIEWED translation of
      that locale exists , the machinery is already there.
      The last leak was the inline "German / English" article heading, which put both
      languages in one line on every locale and survived the paragraph-level fix.
      Was: **/terms and /privacy render German AND English stacked, on all four locales**, while
      the page advertises hreflang alternates for fr and it. A privacy notice an Italian data
      subject cannot read is a compliance problem, not only an ugly one.

## Standing rules for this run

- A measured number or a file:line on every claim. Three of my reports today were subagent
  claims I had not checked, and all three were wrong.
- Never overwrite a good German source with a failed translation: `""` is dropped, the column
  stays empty, the fallback renders German.
- Nothing auto-translated is authoritative over a salon's own edit.

## Found while verifying, not part of the ask

- [ ] **A salon with only rating-only reviews shows "Alle (0)" beside "11 avis".** Measured on
      muse-beauty-studio: 11 visible reviews, and by SQL ZERO of them have a comment or a
      display name. The anti-wall filter (SalonReviews.tsx:97, owner 2026-06-12) correctly
      hides rating-only anonymous rows, but the segmented chip still reads "Alle (0)" next to a
      review COUNT of 11, and the group renders "Noch keine Bewertungen in dieser Gruppe". Two
      true numbers that contradict each other on screen. Pre-existing, not from this sweep.
      The fix is a product call about what a rating-only salon should show, so it is written
      down rather than guessed at.
- [x] **PDP section headings , DONE.** `verified:` on the live Italian PDP, zero German
      headings remain: Recensioni, Chi siamo, Posizione, Orari di apertura, Informazioni
      aggiuntive, Contatti, Scopri altri saloni, Resta aggiornato. French the same pass.
      SIX of the eight already had a translated key in `salonDetail` sitting unused beside a
      hardcoded German string; only two were genuinely missing copy. Still German and NOT yet
      done: the FOOTER COLUMN HEADINGS (Solen / Für Salons / Hilfe / Rechtliches) and their
      link labels, which live in a module-level COLUMNS constant outside any component, so
      they need the array restructured rather than a string swapped.
      Was: **Every PDP section heading is still German on /fr and /it.** Measured on the live French
      PDP: Bewertungen, Über uns, Standort, Öffnungszeiten, Zusatzinformationen, Weitere Salons
      entdecken, Bleib auf dem Laufenden. This is the highest-traffic customer surface in the
      product and it is the next literals batch.
