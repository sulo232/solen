<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# Reviews ("Bewertungen"): section spec

**Reference:** `_measured/home-feed.json` band index 12 (this is file 11) · `CORPUS.md` section 1 row 4 (titled horizontal carousels) and section 2 row 4 (rating patterns)
**Component:** `app/[locale]/_components/homepage/Reviews.tsx`
**Layer:** 1 (chrome) + Layer 3 (star `s-star`)

## Layout

```
Bewertungen                                            (->)
+---------------------+ +---------------------+ +-----
| (LM)  Luca M        | | (AS)  Anna S        | |         avatar 40 round, sunken
|       Cuts & Culture| |       Salon ...     | |         14/600 ink + 12/400 ink-2
| ****  12.08.2026    | | ****  09.08.2026    | |         12px stars + 12/400 ink-2
| " Jonas hat genau   | | " ...               | |         14/400 ink, line-clamp-3
|   verstanden ... "  | |                     | |
+---------------------+ +---------------------+ +-----
 260 x 220, radius 16, white, 1px hairline, elevation-2
```

This is the last content band before the footer. Person-led order: identity, then stars and date, then
the quote.

## Measured

Band index 12. Box top 3189, left 0, width 390, height 304. Surface transparent, padding 0, radius 0.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Section title | 18 / 600 | Inter Tight | `rgb(10,10,10)` | 22.5 | 1 | "Bewertungen" |
| Avatar initials | 14 / 600 | Inter Tight | `rgb(107,107,107)` | 21 | 10 | "LM" |
| Reviewer name | 14 / 600 | Inter | `rgb(10,10,10)` | 16.8 | 10 | "Luca M" |
| Quote | 14 / 400 | Inter | `rgb(10,10,10)` | 21 | 10 | "Jonas hat genau verstanden, was ich wollte. Bester Fade se" |
| Salon name + date | 12 / 400 | Inter | `rgb(107,107,107)` | 18 | 20 | "Cuts & Culture" |

- Card: radius 16, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px 0px`, border 1px `rgb(228, 228, 231)`,
  background white, padding 16px, example 260 x 220, count 10.
- Full-card overlay button: radius 16, no shadow, no border, transparent, example 258 x 218, count 10.
  The 2px inset on each axis is the card's own 1px border (derived).
- Imagery: 0 images, 0 px2.
- Text elements 51, of which 21 are weight >= 600.
- 10 review cards, derived from every per-card role counting 10 (and the two-per-card role counting 20).
- Box-to-box gaps: 16px above (band 10 ends 3173) and 88px below to the footer (this band ends 3493,
  the footer starts 3581). Of that 88, 56 is `main`'s own
  `pb-[calc(56px+env(safe-area-inset-bottom))]` clearing the fixed bottom nav (`layout.tsx:123`). The
  remaining 32 is **not decomposed here**.

## Tokens

- Card: `rounded-2xl` (16), `border-s-border`, `bg-s-bg-surface` (white), `p-4`, `shadow-elevation-2`.
  All measured exactly.
- Avatar: 40 x 40 round, `bg-s-bg-sunken`, initials in `font-display` at `text-s-ink-2`.
- Stars: lucide `Star` at size 12, `fill-s-star`, `stroke="none"`, one glyph per whole star (a 4-star
  review draws 4 glyphs, not 5 with 1 empty).
- Quote: `line-clamp-3` at `leading-[1.5]`, ink not grey.

## Interaction

- Split tap, two independent targets per card. The card body is a full-bleed overlay `<button>` at
  `z-0` that routes to `/{locale}/salon/{slug}/reviews`; the salon name under the reviewer is its own
  link to `/{locale}/salon/{slug}`.
- Everything that is not one of those two carries `pointer-events-none` so the overlay stays reachable.
- Hover and focus-within both lift the card `-2px` and step it to `elevation-3`.
- Desktop only: the scroll-circle pair at `md:` (this caller passes `scrollRef`).

## Intentional deviations

- Owner pick 2026-06-29, variant B "person-led": identity leads the card, not the stars.
- The section renders whole stars only, where the salon cards render a numeric value with one star
  glyph. That is a third rating shape on this screen (the map pill is the fourth), which file 04 and
  file 10 also record.
- `CORPUS.md` has no review-carousel row: reviews on a home feed are not in the 34-screen tally set's
  dominant anatomy. This band is a Solen decision with no corpus support either way.

## Empty state

`if (reviews.length === 0) return null`. The hardcoded fallback testimonials were removed in the
2026-07-08 frontend audit: they were invented names and quotes attached to real salon slugs, and they
stayed live whenever `/api/reviews/featured` returned empty or errored. The section now waits for real
data and renders nothing.

## Provenance

- 2026-05-14: replaced the V2-D47 vertical marquee with the same `Section > SectionFrame > SectionTitle
  + ScrollRow` shape every other rail uses, which is what gives it the scroll circles for free.
- V3-D169: card shrunk from 280-300 to 260-280, `p-6` to `p-4`, min-height 320 to 220.
- Frontend audit 2026-07-08: fabricated fallback testimonials deleted.

## Against the floors

- **Display anchor >= 28px: FAIL.** Largest text 18px.
- **Anchor at least 1.8x body: FAIL at 1.29x** against this band's own 14px body (18 / 14), which is
  the weakest step of any band on the screen. Read against 12px meta it is the same 1.5x as the rails.
- **At most ~30% of text at weight >= 600: FAIL at 41.18%** (21 of 51). Each card spends 2 of its 5
  text leaves at 600 (the initials and the name).
- **At most 4 sizes and 2 weights: PASS within this band** (3 sizes, 2 weights).
- **Imagery >= 33%: FAIL, and this band is a named contributor.** 304px of document height with zero
  images. Together with the footer's 880px and Walk-in's 296px, that is 1 480 of the document's 4 517px
  carrying no photography at all.
- **Photographic focal (finished-screen pass item a): FAIL for this band in isolation.** It has no
  photograph, by design: the avatar is initials on a sunken disc, not a face.
- **Edge visibility (FLOORS LAW 4): PASS by route (c), with a caveat the contract names.** The card
  carries a 1px `#E4E4E7` hairline AND `elevation-2`. The design-contract shadow row says a card
  carrying elevation drops its border, never both. Measured here: both are present.
- **Locked radius: PASS.** 16 = `rounded-card` / `rounded-2xl`.
- **Tertiary grey ban: PASS.** Every grey is `#6B6B6B`.
- **Copy economy rule 2: the quote clamps at 3 lines with no read-more affordance.** The rule asks for
  an inline `text-s-accent` "Mehr lesen"; this card routes the whole body to the salon's reviews page
  instead, which is a different answer to the same problem and is recorded here rather than graded.
