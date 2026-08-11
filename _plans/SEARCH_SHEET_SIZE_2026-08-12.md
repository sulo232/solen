# The Wo? sheet is 56pt shorter than the Suche sheet (2026-08-12)

Owner, with three of his own screenshots (IMG_7119 Wo?, IMG_7120 Suche, IMG_7121 Wann?):
"u see the diffrence between em the sheet size between wo and search i like search better and also
the wann", then immediately after: "not like refference".

## Readback

1. Do I see the sheet-size difference between Wo? and Suche.
2. He likes the SUCHE one better, so Suche is the target.
3. The Wann? one too, i.e. Wann? is also on the good side of the comparison, not a third problem.
4. "not like refference": the target is OUR Suche step, NOT the Airbnb capture from earlier tonight.

## MEASURED off his own three captures, all 1206x2622px = 402x874pt at scale 3, not eyeballed

| shot | step | sheet top | first field top | field top minus sheet top |
|---|---|---|---|---|
| IMG_7120 | Suche, keyboard up | **112.0** | 129.0 | 17.0 |
| IMG_7119 | Wo?, keyboard up | **168.3** | 227.3 | 59.0 |
| IMG_7121 | Wann?, no keyboard | **119.7** | n/a | n/a |

So Wo? starts **56.3pt lower** than Suche, and Wann? starts within 8pt of Suche, which is his
sentence exactly: Suche and Wann? agree, Wo? is the odd one out.

## Root cause, and the number proves it rather than a story about iOS

`HEADING_H = 56` at `SearchOverlay.tsx:202`. The service step's heading is wrapped in
`height: headingH` (`SearchOverlay.tsx:614`, `useTransform(expand, [0, 0.55], [HEADING_H, 0])`) so
it folds to zero the moment the field takes focus. The location step's heading was a bare
`<button className="mb-3 flex shrink-0 ...">` with no height transform, so it never folded. That is
the whole 56pt: the same axis, wired on one step and not the other, and the folded constant is the
measured difference to within 0.3pt.

It also explains the second column: with the heading present the city input sits 59pt down the card
instead of 17, iOS scrolls further to clear the keyboard, and the sheet rides down with it.

## Boxes

- [x] 1. Wo? sheet top matches the Suche sheet top. Commit f0e0b7de3.
  - [x] 1a. The location heading folds on the SAME `expand` axis the service heading already uses.
        `SearchOverlay.tsx:2270`, `style={{ height: locHeadingH, opacity: headingContentOp }}`,
        where `locHeadingH` at `SearchOverlay.tsx:629` is the same `useTransform(expand, [0, 0.55],
        [...])` shape as `headingH` one line group above it.
  - [x] 1b. Its own measured height, not `HEADING_H` copied over. `LOC_HEADING_H = 42` at
        `SearchOverlay.tsx:628`: a 24px line at leading-tight (30) plus the 12 that used to be
        `mb-3`, against the service heading's 56 which includes its own `pt-4`/`pb-1`.
  - [x] 1c. The unfocused Wo? step is unchanged. verified: measured the SAME probe against the
        working tree and against the stashed original, back to back on the running server, and both
        return `cardTop 328, fieldTop 400, fieldMinusCard 72`. Nothing moved.
  - [x] 1d. verified: Wo? focused now measures `fieldMinusCard` **16.0** at 402x874, against the
        **17.0** he measured on the Suche step in IMG_7120, and against the **59.0** the same step
        measured in IMG_7119. The two steps now put their field in the same place.
- [x] 2. Wann? stays where it is. verified: the fix for box 4 deliberately takes space from the
      BOTTOM, so the date step's top is untouched, measured 68 at 874 and 59 at 730 before and
      after.
- [x] 3. Not the reference. Nothing from the Airbnb capture is applied in this pass; the target
      number is his own Suche measurement, 17.0.
- [x] 4. The calendar clipped through the 31 row on his phone. Commit f0e0b7de3. I had reported
      this fixed off a 780-tall desktop viewport, which carries no Safari chrome; re-measured at
      the heights his phone actually gives the page, the month needs 300 and the scroller had 288
      at 730, 262 at 700, 236 at 670. D1 from the previous pass had already pulled the sheet's top
      as far up as it may go, so the space came from the 40px rest margin at the BOTTOM, which
      exists to hold the settled composed sheet off the edge and has no job while a step is open
      and full (`SearchOverlay.tsx:946`, `* (1 - d)`). verified: month fits with nothing to scroll
      at 874 (465/465), 730 (330/330) and 700 (302/302), the 31 renders, and Suchen stays on
      screen at all three.

## Two costs, named rather than left for him to find

1. **It still clips below about 690pt of usable height** (measured: at 670 the month needs 300 and
   gets 274). That is an iPhone SE / mini class screen with Safari's chrome, not the phone he is
   testing on. Closing it needs either the sheet's TOP (which he just approved at 119.7 and I will
   not move) or a shorter calendar row, which is a look change he has not asked for.
2. **The empty white below the city list grows by the same 56pt** this change removes from the top,
   because the card's bottom is pinned and its top rose. W1 in `SearchOverlay.tsx` records that
   capping the location card was tried and made it worse, moving the hole above the list instead of
   removing it. The real fix is more cities in the list, and cities with no salons behind them
   would be a dead filter, so that waits for salons outside Basel.
