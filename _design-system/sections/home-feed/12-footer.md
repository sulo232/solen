<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# Footer: section spec

**Reference:** `_measured/home-feed.json` band index 13 (this is file 12), with bands 14 and 15 folded in (see Measured) · `CORPUS.md` has no footer row: the sweep read first viewports, so the footer is outside its evidence
**Component:** `app/[locale]/_components/layout/Footer.tsx`, mounted site-wide via `FooterGate` from `app/[locale]/layout.tsx:145`
**Layer:** 1 (chrome) + Layer 3 (the Swiss flag's real red)

## Layout

```
+--------------------------------------------------+   sunken strip
|  Bleib auf dem Laufenden                          |   17/600 ink
|  Neue Salons, Trends und Tipps. Einmal im Monat.  |   13/400 ink-2
|  [ E-Mail-Adresse                        (->) ]   |   350 x 50, radius 12
+--------------------------------------------------+
|  Solen                                            |   22/700 Inter Tight, white area
|  Fuer Ihre Stadt. Fuer die Schweiz.               |   13/400 ink-2
|  [] [] []                                         |   social, 36 x 36, radius 12
|                                                   |
|  Unternehmen        Rechtliches                   |   14/700 ink, 2 columns
|  link               link                          |   13/400 ink-2
|  link               link                          |
|  ---------------------------------------------    |   border-t s-border
|  (c) 2026 Solen.ch Schweiz [flag]        DE       |   12/700 ink-2  +  13/500 ink-2
+--------------------------------------------------+
```

## Measured

Band index 13. Box top 3581, left 0, width 390, height 880. Surface background `rgb(255, 255, 255)`,
padding 0, radius 0.

**Bands 14 and 15 are folded into this file.** Band 14 is an unclassed `div` (top 3609, 350 x 47)
carrying only the newsletter heading and sub-line; band 15 is the newsletter `<form>` (top 3672,
350 x 50) carrying only the input. Both are strict subsets of this band, and neither is a nameable
section of the screen on its own. Band 15 is a `<form>`, which is a landmark tag, which is why the
extractor emitted it.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Wordmark | 22 / 700 | Inter Tight | `rgb(10,10,10)` | 22 | 1 | "Solen" |
| Newsletter title | 17 / 600 | Inter Tight | `rgb(10,10,10)` | 25.5 | 1 | "Bleib auf dem Laufenden" |
| Screen-reader input label | 16 / 400 | Inter | `rgb(10,10,10)` | 24 | 1 | "E-Mail-Adresse" |
| Column heading | 14 / 700 | Inter | `rgb(10,10,10)` | 21 | 4 | "Unternehmen" |
| Links + newsletter sub | 13 / 400 | Inter | `rgb(107,107,107)` | 19.5 | 13 | "Neue Salons, Trends und Tipps. Einmal im Monat." |
| Brand line | 13 / 400 | Inter | `rgb(107,107,107)` | 21.13 | 1 | "Fuer Ihre Stadt. Fuer die Schweiz." |
| Locale button | 13 / 500 | Inter | `rgb(107,107,107)` | 19.5 | 1 | "DE" |
| Copyright | 12 / 700 | Inter | `rgb(107,107,107)` | 18 | 1 | "(c) 2026 Solen.ch Schweiz" |

- Newsletter input: radius 12, no shadow, border 1px `rgb(228, 228, 231)`, background white,
  padding `12px 48px 12px 16px`, example 350 x 50, count 1. The asymmetric right padding is the inset
  submit button's clearance.
- Imagery: 0 images, 0 px2.
- Text elements 23, of which 7 are weight >= 600.
- 4 link columns and 12 links, derived: the 4-count column-heading role, and the 13-count 13 / 400 role
  minus the newsletter sub-line it samples.
- Document height reconciles exactly: footer top 3581 plus height 880 is 4461, plus the 56px
  `pb-[calc(56px+env(safe-area-inset-bottom))]` on the `FooterGate` wrapper gives the measured
  `documentHeight` of 4517.

## Tokens

- Newsletter strip `bg-s-bg-sunken`; the body `bg-white`. The sunken-to-white handoff is the one
  boundary, with the previous `border-b` deliberately dropped.
- Input radius 12 with a 1px `s-border` line and a white fill, which is the locked input recipe
  (design contract: height 48, radius 12, white fill, resting `#E4E4E7` line, nothing visible on focus).
  Measured height is 50 against the locked 48.
- Submit button `bg-s-ink`, 36 x 36, radius 6, inset `right-[6px] top-[6px]`. The inner radius follows
  the 12 minus 6 formula.
- Social buttons 36 x 36, `rounded-xl` (12), `bg-s-bg-sunken`, `text-s-ink-2`, hover inverts to
  `bg-s-ink` white. Below the extractor's 60 x 32 card floor, so **not measured**.
- Swiss flag: a real red rounded square, 13 x 13, intentionally the one chromatic non-token colour.

## Interaction

- Newsletter submit posts JSON `{ email }` to `POST /api/newsletter` and swaps the form for a 14px
  status line with `role="status"`.
- Errors render at 12px in `text-s-error` with `role="alert"`.
- Every column link is a plain anchor with a 150ms colour transition to `s-ink` on hover.

## Intentional deviations

- The footer is the only band on the screen carrying weight 700 (three roles: wordmark, column
  headings, copyright) and the only one carrying 22px and 17px. It is chrome, not feed content, and it
  is the single largest contributor to the screen's size and weight overflow.
- The 16px screen-reader label is invisible and still counts as a distinct size in the screen totals,
  because `extractSections` measures any element with non-empty own text and a non-zero rect, and
  `sr-only` clips to 1 x 1 rather than to zero.
- N2 (2026-08-11): the footer sits outside `main`, so it needed `main`'s bottom padding copied onto
  its wrapper. Before that the floating nav sat permanently on top of the last footer row, and the
  measured overlap was 30px of a 40px control, with `elementFromPoint` at the button's centre returning
  the nav's own link.

## Empty state

None. Every element is static chrome except the newsletter form, which has its own submitted and error
states.

## Provenance

- V2-D46 (2026-05-09): mounted at locale-layout level so it renders site-wide.
- 2026-07-15 geometry sweep: social buttons snapped from `rounded-[10px]` to `rounded-xl` (12), on-ladder.
- N2 (2026-08-11): bottom padding matched to `main`'s expression so the two cannot drift apart.

## Against the floors

- **Display anchor >= 28px: FAIL, and this band holds the screen's largest text.** The 22px wordmark is
  the biggest text anywhere in the document, 6px short of the 28 floor and 8px short of the 30px target
  ladder. It is also chrome, so it would not satisfy the floor even at 28: the floor asks for a display
  anchor on the customer screen, not a logo in the footer.
- **Anchor at least 1.8x body: FAIL at 1.69x** within this band (22 / 13).
- **At most ~30% of text at weight >= 600: PASS at 30.43%** (7 of 23), the only band on the screen at
  or near the ceiling, and it lands there by being mostly links.
- **At most 4 sizes and 2 weights per screen: this band is the single biggest offender.** It alone
  spends 6 of the screen's 9 sizes (22, 17, 16, 14, 13, 12) and 4 of its 4 weights (400, 500, 600, 700).
  Three of the four weight-700 roles on the entire screen are here, and both the 22 and the 17 exist
  nowhere else.
- **Imagery >= 33%: FAIL, and this band is the largest single contributor by height.** 880px of the
  4 517px document, 19.5%, with zero images.
- **Locked radius: PASS on the input (12) and the social buttons (12).** The submit button's 6 is a
  derived inner radius, not a ladder rung.
- **Locked hairline: PASS.** `#E4E4E7` on the input and on the bottom-bar top border.
- **Input recipe: measured height 50 against the locked 48.** The extra 2 is the 1px border on each
  edge added to the 48px content box (derived from `py-[12px]` plus a 24px line-box plus 2 x 1px).
- **Tertiary grey ban: PASS.** Every grey is `#6B6B6B`.
