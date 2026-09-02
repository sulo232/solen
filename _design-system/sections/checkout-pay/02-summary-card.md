<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md sections 1 and 7 item 2
     ("provider identity above the price", which the corpus counted in 16 of 34 booking screens).
     `npm run exists "pay confirm"` returns PayConfirmStep.tsx and one graveyard entry. No
     per-section spec existed for this band. -->

# Booking summary card (who, what, when) , section spec

**Reference:** `_design-system/sections/_measured/checkout-pay.json`, `bandAnatomy.summaryCard`, and `trustFloor.c_whoYouAreBookingWith` · `CORPUS.md` section 1 slots 2 and 3, section 7 item 2
**Component:** `components-legacy/booking/PayConfirmStep.tsx:374-458`
**Layer:** 1 chrome, with layer 2 accent on the three "Ändern" links and layer 3 semantic on the star

## Layout

```
y=64  +-----------------------------------------------------+  370 x 286
      | [photo 44]  Cuts & Culture                          |  15 / 600
      |   r12       * 4.8 (16)  Elsässerstrasse 10, Basel    |  13px, count in accent
      +--------------------- hairline ----------------------+
      | (avatar 45) Jonas                          Ändern   |  15 / 600 + 13 / 600 accent
      |   round     Ihr:e Stylist:in                        |  13px ink-2
      +--------------------- hairline ----------------------+
      | (scissors)  Herrenschnitt                  Ändern   |
      |   44 slot   30 Min                                  |
      +--------------------- hairline ----------------------+
      | (calendar)  Mo., 31. August 10:00          Ändern   |
      +-----------------------------------------------------+
y=350
```

Four icon-led rows in one card, hairline separated, each row a 44px left slot plus a text column plus an optional link.

## Measured

| item | value |
|---|---|
| card | [16, 64, 370, 286], radius 16, border 1px `rgb(228, 228, 231)`, background white, padding 16, shadow `rgba(50,47,44,0.04) 0 1px 3px` + `rgba(50,47,44,0.03) 0 1px 2px` |
| salon photo | [33, 81, 44, 44], radius 12 |
| salon name | [89, 81, 280, 23], 15px / 600 / Inter Tight / ink / letter-spacing -0.15px |
| rating value | 13px / 600 / Inter / ink / count 2 across the screen / "4.8" |
| review count | 13px / 400 / Inter / `rgb(39, 110, 241)` / count 1 / "( 16 )" |
| address | [167, 106, 154, 20], 13px / 400 / `rgb(107, 107, 107)` |
| stylist avatar | [33, 150, 45, 45], radius 9999 |
| stylist name | [90, 152, 221, 23], 15px / 600 / Inter Tight |
| service name | 14px / 400 / Inter / ink / count 2 / "Herrenschnitt" (this role is shared with the price card's line item) |
| date and time | "Mo., 31. August 10:00", 15px / 600, tabular |
| Ändern links | 3 of them, [323, 163], [323, 232], [323, 301], each 46 x 20, 13px / 600, `rgb(39, 110, 241)` |
| imagery in this card | 2 images, 3961 px total (a 44x44 salon cover and a 45x45 stylist avatar) |

**The stylist avatar is 45px against the salon photo's 44.** That is deliberate and documented in place (`:409-412`): a circle beside a square of the same nominal size reads smaller, so the `Avatar` primitive's `opticalOvershoot` is applied, owner-approved 2026-07-15. Both start at x 33, so the left column stays aligned.

## Tokens

- Card: `rounded-card border border-s-border bg-white p-4 shadow-elevation-1`
- Rows after the first: `mt-3 flex items-center gap-3 border-t border-s-border pt-3`
- Salon photo: `h-11 w-11 rounded-[12px] object-cover`, with a `bg-s-bg-sunken` initial tile as the no-photo fallback (`:386-388`)
- Icon slots: a 44px `grid place-items-center text-s-ink-2` holding `Scissors` or `Calendar` at 20px `strokeWidth 2.2`, so an icon row and a photo row share one left column width
- Star: `fill-s-star text-s-star` at 13px
- Ändern: `text-[13px] font-semibold text-s-accent`, the locked small-clickable-text treatment
- Names: `font-heading text-[15px] font-semibold`, truncating

## Interaction

- Each "Ändern" calls `goToStep(...)` and nothing else: the stylist and service links both go to `'services-staff'` (step 1), the date link goes to `'datetime'`. In page, no URL change, cart preserved.
- **The links are gated on `phase === 'select'`** (`:418`, `:436`, `:452`), so they disappear once the screen switches to the Stripe card form. The user cannot edit the booking behind an open payment.
- Only the first service row gets a link (`i === 0`), so a multi-service cart shows one "Ändern" for the whole list.
- The salon row is not a link. Nothing here navigates out of the flow.

## Against the floors

- **Trust floor (FLOORS LAW 8 / hierarchy-density-05) condition (c), who you are booking with: PASS.** Checked against the rendered DOM, not the source. The salon name renders at doc y 81, its cover photo beside it, the address at y 106, and the stylist at y 152 with an avatar. All four are above the commit button (viewport y 776) both in position and in DOM order, and all four are inside the first viewport at scrollY 0, so unlike the cancellation term they cannot be scrolled past. This is a salon and a named person, not a category.
- **Locked radius: PASS.** `rounded-card` measures 16, the form or summary card literal.
- **Locked shadow: PASS.** `shadow-elevation-1` on a summary card, with the hairline kept. The contract's rule that a card carrying elevation drops its border applies to the elevated-overlay tier; the measured shadow here is the 4% and 3% two-layer whisper, which is the "card" alias, and the Edge-Visibility floor asks for the hairline on a white-on-white card.
- **Edge visibility (FLOORS LAW 4): PASS by option (c), with a note.** The card is white on a white body and keeps its hairline. It does not sit on a sunken tray, which is the floor's preferred answer for grouped content with no photo anchor.
- **FLOORS LAW 1 (d), a semantic-colour moment: PASS.** The `#FFC32B` star renders in the rating row. It is the only semantic hue on the screen. Source-confirmed for the glyph itself, since SVG is skipped by the measurement script; the row it belongs to is measured.
- **Sparse blue: PASS, and it is worth counting.** Four accent elements on the screen, all of them small clickable text or a small tappable metadata count: three "Ändern" links and the "( 16 )" review count. No CTA, price, heading or label carries blue.
- **Blue on the review count: PASS on contrast** at 4.58:1 on white, and it is the locked treatment for a review count specifically.
- **Touch target: FAIL on the three Ändern links.** 46 x 20 measured, 24px under the floor, with no padding around them.
- **FLOORS LAW 9, composed from the registry: MIXED.** `Avatar` and `Image` are composed; the row grammar is hand-built here rather than shared with the confirmation screen's near-identical detail card (`confirmation/04-detail-card.md`), which renders the same three facts with a different type ramp.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL against the confirmation screen.** The same booking, one tap apart, renders as 15px / 600 Inter Tight primary lines with 13px ink-2 secondaries here, and as 14.5px / 600 primary lines with 12.5px ink-2 secondaries there. Same three rows, same order, same icons, two type ramps.

## Intentional deviations

- **Provider identity above the price, which only 16 of 34 corpus booking screens do.** `CORPUS.md` section 7 item 2 files this as deliberate and correct: it is what makes the screen read as a booking rather than a transaction.
- **Icon-led rows rather than a label/value table.** The corpus's most repeated micro-grid is a two-column label/value table, and it is also the shape that produced its anchor-less screens. Solen's rows put the value first and the label second, which is why the card has a reading order rather than a lookup order.
- **No uppercase tracked eyebrow above the card**, named in the source comment as owner-banned, and confirmed absent in the measurement: `textTransform` is `none` on every role of this screen.

## Empty state

- **No cover photo:** the 44px tile becomes a sunken square with the salon's initial (`:386-388`). Not measured, this salon has a photo.
- **No stylist:** the whole stylist row is omitted (`{staff && ...}`), which happens when "Egal" was kept. The trust floor's condition (c) then rests on the salon row alone, which still satisfies it. Not measured; this run deliberately picked a named stylist.
- **No rating or zero reviews:** the star and count are dropped together (`:393-394`), leaving the address alone on that line.
- **Multi-service cart:** one row per service, each with its own 44px scissors slot, and only the first carrying "Ändern". Not measured, this run had one service.

## Provenance

- Mockup `booking-pay-step`, owner-approved 2026-06-11 , white icon-led rows in the walk-in-pay checkout language, Ändern links that jump back to the owning step
- Owner-approved 2026-07-15 , the `opticalOvershoot` on a circle beside a square (`RATIONALE.md:144`, `lib/optical.ts`)
- hierarchy-density-05 / LOCKFILE §17.6 , the trust floor, whose condition (c) this card answers
