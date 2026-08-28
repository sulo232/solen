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
- [ ] A1 The LIVE floor view: the room drawn, chairs in their real places, who is in each one.
- [ ] A2 Chairs drawn as rounded SQUARES, not chair pictograms.
- [ ] A3 The setup step where the number of chairs is chosen.
- [ ] A4 A few starting TEMPLATES they can pick from.
- [ ] A5 Moving a chair around themselves after picking a template.
- [ ] A6 All of it as a mockup on the same review link, stepped frame by frame.
- [ ] A7 Say in plain words why squares beat chair shapes, since he offered it as a maybe.
