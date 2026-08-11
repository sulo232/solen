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

- [x] 1. Commit 6ea21eea0 , Wo? sheet top matches the Suche sheet top.
  - [x] 1a. Commit 6ea21eea0, `SearchOverlay.tsx:2270` , the location heading is wrapped in
        `style={{ height: locHeadingH, opacity: headingContentOp }}`, the same fold the service
        heading has always used at `SearchOverlay.tsx:2155`.
  - [x] 1b. Commit 6ea21eea0, `SearchOverlay.tsx:628` , `LOC_HEADING_H = 42` with its own
        transform on the next line, not `HEADING_H = 56` from `SearchOverlay.tsx:202`, whose 56
        includes a `pt-4`/`pb-1` this card does not have.
  - [x] 1c. verified: `SearchOverlay.tsx:2270` , the same probe run against the working tree and
        against the stashed original, back to back on the running server, both return
        `cardTop 328, fieldTop 400, fieldMinusCard 72`. The unfocused Wo? step did not move.
  - [x] 1d. verified: `SearchOverlay.tsx:629` , Wo? focused measures `fieldMinusCard` 16.0 at
        402x874, against the 17.0 he measured on Suche in IMG_7120 and the 59.0 the same step
        measured in IMG_7119.
- [x] 2. verified: `SearchOverlay.tsx:946` , Wann? did not move, sheet top 68 at 874 and 59 at
      730, unchanged, because that fix takes space at the BOTTOM only.
- [x] 3. verified: commit 6ea21eea0 `--stat` touches one component plus the plan files, and the
      diff carries no value taken from the Airbnb capture. The target is his own Suche number, 17.0.
- [x] 4. Commit 6ea21eea0, `SearchOverlay.tsx:946` , the calendar no longer slices the 31 row.
      I had reported this fixed off a 780-tall desktop viewport, which carries no Safari chrome;
      re-measured at the heights his phone actually gives the page, the month needs 300 and the
      scroller had 288 at 730, 262 at 700, 236 at 670. D1 had already pulled the sheet's top as
      far up as it may go, so the space comes from the 40px rest margin at the bottom, which holds
      the settled composed sheet off the edge and has no job while a step is open and full.
      verified: month fits with nothing to scroll at 874 (465/465), 730 (330/330) and 700
      (302/302), the 31 renders, Suchen stays on screen.

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

## CORRECTION (owner 2026-08-12, "you didnt fix")

- [x] C1. verified: `lsof` on port 3000 resolves to this worktree, and the same probes run
      against the TUNNEL he is holding, in an iPhone-sized context, return the fixed numbers: Wo?
      focused `fieldMinusCard` 16.0 (59.0 on his phone), and the month fitting with nothing to
      scroll at 874 (465/465) and 730 (330/330) with the 31 rendered. Not stale code, not the
      wrong server.
- [x] C3. Commit pending this turn, `SearchOverlay.tsx:672-690` , the sheet's absolute top,
      closed by MEASURING instead of picking a side. K2 assumes `position: fixed` stays glued to
      the layout viewport while iOS scrolls the visual one out from under it, and adds the offset
      back. If that were the whole story both steps would sit at `focusedTop`, about 65 on his
      phone; he measured 112 and 168, both low, by two different amounts that look like two
      different scroll distances, which is the signature of compensating a browser that already
      compensated. Safari has re-anchored fixed elements to the visual viewport since iOS 16.
      Rather than flip a documented measurement on a theory, a probe pinned at `fixed; top: 0` now
      reports which world we are in: 0 when fixed follows the layout viewport, the scroll distance
      itself when it follows the visual one. The correction is `offsetTop - probeTop`, which is
      exact in both, gives K2 back unchanged where K2 was right, and is 0 where it was double
      counting. verified: on a keyboard-less browser probeTop 0, offsetTop 0, correction 0, and
      the panel measures sheet top 160 composed / 50 focused with `fieldMinusCard` 16, identical
      to before the change.
- [ ] C2. The one thing still open and it needs his phone: whether his Safari is holding the old
      bundle. The discriminator is the gap between the top of the white card and the top of the
      field in Wo? with the keyboard up. 59 = old bundle, 16 = new.
