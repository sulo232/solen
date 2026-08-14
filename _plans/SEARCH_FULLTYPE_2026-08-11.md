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

- [x] One sheet instead of two touching cards , DONE. Commit d1e6d4d51, verified: four visible
      white shapes before, ONE after, measured on the sheet's own children. The service card now
      folds on the same axis its two neighbours already used.
- [x] NOT NEEDED, checked rather than assumed. Commit d1e6d4d51, verified: with the other cards
      gone the open one already runs edge to edge, so its radius reads as the sheet's own top corners,
      which is what the reference has too (its sheet is rounded at the top). Nothing to remove.
- [x] Back control present , DONE. Commit d1e6d4d51, verified: the field carries the same back
      arrow the service field already had, tapping it returns to the composed view (four cards, no
      keyboard), and the collapse chevron hides while focused so there is exactly one way back.
- [x] Verified ON THE MAP VIEW, which is where he said it still showed. Commit d1e6d4d51,
      verified at /de/search?view=map: open the panel from the map's own bar, open Wo?, focus the
      field, and the sheet renders ONE white shape with the back arrow in the field. Note for next
      time: the map's bar is a button INSIDE a div that also carries the same aria-label, and
      clicking the div does nothing. That cost several attempts.
- [x] Conflict flagged, not resolved behind his back. Commit d1e6d4d51, verified: the field is
      untouched. HIS CALL: this morning he picked a filled grey capsule with the chevron OUTSIDE it;
      the reference he sent tonight uses a white box with a 1px border and the arrow INSIDE. Both are
      his. The panel now matches the reference's SHAPE (one sheet, list fills it) and keeps his own
      field. If he wants the field to match too, that is one more change and it undoes a pick he
      made today, so it needs him to say so.
