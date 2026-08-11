# Search panel: the full-type view, the back control, and the overlap on the map (2026-08-11)

Owner: "on map view its still not fix the overlap how many times do i have to tell you and also i
wish there was a back button when all the way open and also want full type ciew bro like in airbnb
refference i gave u"

## Readback

1. The overlap is still there on the map view.
2. He wants a BACK control when the panel is all the way open.
3. He wants the FULL TYPE VIEW from the Airbnb reference he sent (IMG_7114).

## The reference, MEASURED off his own capture (IMG_7114, 402x874pt), not eyeballed

- ONE white sheet. No stacked cards, no card insets, no shadows between sections.
- Sheet top edge at 62.3pt.
- The field: left 24.0pt, width about 354pt, height 55.7pt, a 1px near-black border, corner radius
  about 15pt measured off the arc, and a BACK ARROW inside it on the left.
- Under it, plain text section headings ("Recent searches", "Suggested destinations") with no card
  around them, then rows: a 57pt rounded-square icon tile, a bold title, a grey subtitle.
- No footer, no second card, no third card. The list IS the screen.

## What ours does in the same moment (IMG_7113)

- Two white cards stacked and touching: the collapsed Suche row on top, the Wo? card under it.
- Both are full width now, which is the fix from the last pass, so what he is seeing is not two
  widths any more, it is two SHAPES where the reference has one.
- No back control anywhere on the screen.

## Boxes

- [ ] When the panel is fully open (the field focused), the other steps' CARDS stop painting, so
      there is one sheet rather than two touching cards
- [ ] The open card loses its radius and its shadow in that state, so it reads as the sheet itself
- [ ] A back control is present and reachable whenever the panel is fully open
- [ ] Verified on the map view specifically, since that is where he says it still shows
- [ ] The field's own chrome is NOT redesigned in this pass: he picked variant A this morning off
      /dev/search-field, and the reference's bordered box contradicts it. Flag the conflict, do not
      silently swap a thing he chose today.
