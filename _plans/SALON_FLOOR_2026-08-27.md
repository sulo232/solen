<!-- batch: the salon floor view, chairs placed on a plan, from the aircraft-cargo reference (owner 2026-08-27) -->
# The salon floor, chairs you can see

His words, dictated: "i want ths view too when its open like smth similar to ths n when u set up u
need to like put placement of chairs n allat n then u can see yk and instead of the airplane like
chairs or maybe square and lke on onboarding they select how many chairs is there and then yk there
is alrdy few templates but they can select em theymsleves and move arnd abit yk allat acc think it
trough and build me a mockuo the 2 refference are in teh download file"

## The reference, read not guessed
Two Instagram screenshots of a Dribbble piece, "Aircraft Dashboard Concept" by @sogasoux,
`~/Downloads/IMG_8027.PNG` and `IMG_8028.PNG`, both saved 2026-08-27 22:13.

- `IMG_8027` frame 1 of 3: a white aircraft drawn side-on, and laid over it a grid of cargo
  positions numbered 01 to 09, each cell carrying a code (AKE 532 EK) and a weight (375kg). Top
  strip of four quiet stats. A progress rail: Picking, In flight, In transit. Bottom left a single
  container card with load type, weight and temperature; bottom right the three people on the job
  with their faces and roles.
- `IMG_8028` frame 2 of 3: the same positions again, one filled cell highlighted pale green, plus a
  top-down cross-section of the fuselage with the position codes in two columns, and a load
  distribution bar (50 / 30 / 20).

WHAT THE REFERENCE IS ACTUALLY DOING, and it is the only thing worth copying: it draws the physical
object and puts its contents in their real places on it. Position 03 sits next to 04 on the screen
because it sits next to it in the aircraft. Nothing else on either screenshot is the idea.

## What already exists, so this extends rather than duplicates
- [x] `npm run exists chair` `verified:` run this turn, 11 hits. `barber_chairs` TABLE EXISTS (0
      rows, RLS on) with `chair_count`, `/api/salon/chairs` GET and PUT already shipped
      (`app/api/salon/chairs/route.ts`), and `barberChairsSchema` at `lib/validations.ts:734` caps
      it at 1 to 20. So HOW MANY CHAIRS is already built and already saved. Nowhere in it is a
      position.
- [x] `npm run exists station` `verified:` the same thing exists a second time for nail salons:
      `nail_stations` (1 row), `nail_stations.station_count`, `/api/salon/stations`,
      `nailStationSchema`, plus a `StationManager` component in `components-legacy/`. Two count-only
      concepts split by category, neither with a position.
- [x] `npm run exists "floor plan"` `verified:` zero matches. No layout, no positions, nothing
      spatial anywhere in the product.
- [x] THE OLD CHAIRS MOCKUP IS NOT THIS `verified:` `public/_mockups/dashboard-overhaul/chairs.html`,
      458 lines, is a grid of chair CARDS with a hero size modifier. Cards in a list, not chairs in
      a room. Different thing.
- [x] A GRAVEYARD HIT THAT BINDS THIS BUILD `verified:` `npm run exists chair` returns, under
      REMOVED, "the chairs.html occupied-chair green border-left", owner 2026-07-15 verbatim: "i
      hate that... this left side green thingy. never do this ever". So an occupied chair is NEVER
      marked with a coloured edge bar. State is a pill or coloured text only.
- [x] A SECOND GRAVEYARD HIT, and it does NOT block this `verified:` "terminal direction C now and
      next, chairs pinned on top with the day scrolling below" was removed 2026-08-17, but as a
      focus decision on the terminal, which he has since ditched, and this is a different shape: a
      plan of the room, not a pinned strip. He asked for it by name this turn, which is the owner
      yes the graveyard requires.

**So the net-new piece is exactly one thing: WHERE each chair is.** Everything else is an extension.

## Premortem, before any builder is dispatched
1. **Building the editor and forgetting the view.** He led with "i want ths view too when its open".
   The live floor is the headline; placing chairs is the setup that makes it possible. If only one
   ships, it is the live view.
2. **A drag-and-drop that does not work with a thumb.** Free dragging a 40px tile on a 390px phone
   is fiddly and easy to fake in a mockup while being unusable in life. Tap to pick up, tap an empty
   square to put down. No drag library, no pointer maths.
3. **Copying the reference's SKIN instead of its idea.** The reference is a dark glassy desktop
   dashboard. Web here is one light theme, no dark mode, ever. Copy the spatial idea, nothing else.
4. **Applying the wrong law.** This is an OPERATOR screen. The customer FLOORS LAW does not govern
   it: no photographic floor, no semantic-colour requirement, no sunken-tray rule (that rule is what
   produced the grey canvas he rejected six times). The merchant round in TASTE_LOG 2026-07-15
   governs: one carded hero, everything else bare text on white, binary 16 and 32 gaps, no coloured
   edge bars, a person appears in exactly one place.
5. **Fabricated occupancy.** Named fixture constants at the top of the file, the way the other flow
   files already do it, never numbers invented inline.

OUT OF SCOPE this turn, and said plainly rather than half-done: no migration, no API change, no
wiring to real data, no change to the two existing count endpoints. This is a mockup he reacts to
first, per the mockup-first rule he restated on 2026-08-12.

## The asks, atomised
Every tick below is a measurement taken on the rendered page at 390x844 and 360x800, not a reading
of the source. `app/[locale]/dev/host-flows/_flow-floor.tsx`, five frames, reachable as the fifth
pill on `/en/dev/host-flows`.

- [x] A1 The LIVE floor view `verified:` app/[locale]/dev/host-flows/_flow-floor.tsx:361 `ScreenOpen`, drawing app/[locale]/dev/host-flows/_flow-floor.tsx:311 `RoomFrame`. Frame 1. Room card 324px wide at a 390 viewport, eight
      chairs at 68.5px each, all eight measured inside the room's own box; at 360 the room is 294
      and the tiles 61, still zero chairs outside, and `document.documentElement.scrollWidth`
      equals the viewport at both widths. Reads "5 of 8 chairs are busy", each occupied tile
      carrying a name and the minutes left, with the door and "3 waiting" on the open floor between
      the two walls.
- [x] A2 Rounded SQUARES, not chair pictograms `verified:` app/[locale]/dev/host-flows/_flow-floor.tsx:255 `ChairTile`, tile classes at app/[locale]/dev/host-flows/_flow-floor.tsx:266 and app/[locale]/dev/host-flows/_flow-floor.tsx:279. Every tile is `aspect-square w-full`
      with a 12px radius and no icon inside it. The argument for it is written out in the file
      header and repeated in plain words below.
- [x] A3 The chair-count step `verified:` app/[locale]/dev/host-flows/_flow-floor.tsx:455 `ScreenCount`. Frame 3. Stepper from 1 to 20, the real cap
      `barberChairsSchema` already enforces. Measured live: taking it 8 to 12 rebuilds the floor in
      Frame 5 from a 12-cell grid to a 16-cell grid holding 12 chairs.
- [x] A4 Starting TEMPLATES `verified:` app/[locale]/dev/host-flows/_flow-floor.tsx:591 `TEMPLATES`, driven by app/[locale]/dev/host-flows/_flow-floor.tsx:518 `rowsFor`, app/[locale]/dev/host-flows/_flow-floor.tsx:569 `cellOrder` and app/[locale]/dev/host-flows/_flow-floor.tsx:576 `layoutFor`. Frame 4, four of them. Measured live, all four produce
      DIFFERENT layouts in Frame 5: two-walls puts 1-4 on the top row and 5-8 on the bottom of a
      12-cell grid; one-wall puts 1-8 on rows 0 and 1; the island puts 1-8 on rows 1 and 2; the L
      puts 1-4 along the top then 5-8 down the right-hand wall of a 20-cell, five-row grid. The
      first version of this file had a picker that changed its own fill and nothing else, the
      silent-no-op shape this project calls its number one failure mode.
- [x] A5 Moving a chair `verified:` app/[locale]/dev/host-flows/_flow-floor.tsx:683 `FloorEditor`, pick-up at app/[locale]/dev/host-flows/_flow-floor.tsx:697 `tapChair` and put-down at app/[locale]/dev/host-flows/_flow-floor.tsx:708 `tapEmpty`. Frame 5. Tap to pick up, tap an empty spot to set down, no
      drag. Measured live: chair 1 went from row 0 column 0 to row 1 column 1, and the hint line
      changed to "Tap an empty spot to place chair 1" while it was held.
- [x] A6 On the same review link, stepped frame by frame `verified:` app/[locale]/dev/host-flows/_flow-floor.tsx:809 exports `FRAMES`, and app/[locale]/dev/host-flows/page.tsx:133 lists it as the fifth flow. Wired into
      `app/[locale]/dev/host-flows/page.tsx` as a fifth flow. All five pills measured 68.8px wide
      with no text overflow on one line at 390.
- [x] A7 Why squares beat chair shapes `verified:` app/[locale]/dev/host-flows/_flow-floor.tsx:62 in the file header. Written in the file header and handed over in
      plain words: at 68px a chair glyph is unreadable, and every chair glyph looks like every
      other one, so it carries no information. A square in the same footprint holds the customer's
      name and the minutes left.

## What review caught before he saw it
Two adversarial reviewers both returned FAIL on the first build, and measuring the live render
found two more. All eight fixed and re-measured:

1. The flow was never wired into the review page, so it was unreachable in a browser.
2. The grid hardcoded 352px against a box that is really 324px, because the arithmetic counted one
   16px padding when there are two. Four chairs sat outside the drawn room at 390 and it clipped
   outright at 375 and 360. Fixed by removing the fixed width: the grid is now fluid and the tiles
   are square, so they divide whatever width the room actually has.
3. The template picker was a silent no-op.
4. A long customer name spilled into the neighbouring chair instead of truncating. A 35-character
   name now measures inside its own tile with an ellipsis.
5. Five 24px section gaps against the binary 16 and 32 the operator law asks for, in a file whose
   own header claimed compliance.
6. Frame 2's caption promised "tap any chair" and no chair had a tap handler. Every chair is a real
   button now, and tapping chair 7 was measured swapping the panel to Tom.
7. The one chair running over rendered as "8m ov...", so the only chair with a problem was the one
   you could not read. Now measured at 61px of text in a 61px box, untruncated.
8. The chair buttons in the setup editor carried no accessible name.

## A missing thing found while building the spacing check, named rather than worked around
`npm run consistency` DOES NOT EXIST on this branch, and neither do the four detector commands the
dashboard prints as if they do (`dupe-check`, `icon-check`, `type-check-scale`, `selected-check`).
Verified directly against `package.json` with node, not inferred: all five return MISSING.
`scripts/consistency-check.mjs`'s own header says "Run: npm run consistency" and its output prints
"(npm run dupe-check)" beside each detector, so the file documents five commands that are not there.

WHY, per the missing-things protocol, and it is the half-landed case rather than the killed one:
`git log --all -S'"dupe-check"' -- package.json` returns exactly one commit, `561207041`, an auto
checkpoint. `git merge-base --is-ancestor 561207041 HEAD` returns false and
`git branch -a --contains 561207041` returns only `claude/quirky-ellis-ef5559`. So the commands were
registered on a sibling branch and never merged into `claude/offline-booking-device-266b10`, which
is the branch this work sits on. The detectors themselves are here and run fine by path; only their
npm names are stranded.

NOT fixed in this batch, on purpose: it is five one-line additions to `package.json`, outside the
scope of the floor mockup, and the new gap-ladder detector registers its own commands
(`gap-ladder-check`, `gate:gap-ladder`) so nothing built this turn depends on the missing four.
Named here so the next person does not rediscover it as a bug.

## A second missing thing, found by rendering rather than by reading: a class that does not exist
`no-scrollbar` was written in 14 places across 10 files, on customer pages and dashboard pages, to
hide the grey scrollbar under a horizontally scrolling row. It is not defined anywhere. Proven in
the browser, not inferred: a scan of every loaded CSS rule for the string `no-scrollbar` returns
false, and the elements carrying it computed `scrollbar-width: auto`. The real utility is
`scrollbar-hide` at `app/globals.css:965`, with a byte-identical duplicate named `scrollbar-none`
at :976.

WHY, per the missing-things protocol: the NEVER-LANDED case, in its quietest form. There is no
graveyard entry and nothing superseded it. Nobody ever wrote the rule; the name simply reads like a
real Tailwind utility, so it passed every code review it was ever in, including mine. I copied it
into a new file this session for the same reason.

FIXED, all 14 sites, commits `76a547e79` and `afa4d410d`. Measured after at a 375 viewport: the
filter row on `/en/behandlungen/haare` carries 635px of chips in a 343px box, overflows, and
computes `scrollbar-width: none`; the status pills on `/en/dashboard/bookings` and the chair row on
`/en/dev/terminal` both compute none; zero elements anywhere still carry the dead name; and
`grep -rn "no-scrollbar" app components components-legacy` returns nothing.

HARDENED as a script that looks, not a check that scolds, because this was only ever knowable by
looking at the compiled stylesheet. `scripts/detect-dead-class.mjs` compiles the real stylesheet,
collects the 3059 class names it actually contains, and reports any literal class in the scanned
source that produces no CSS. The known-answer control is the incident itself: `no-scrollbar` comes
back dead and `scrollbar-hide` comes back alive.
