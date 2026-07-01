# Map + Search refinement batch (owner 2026-07-01)

> Captured under the plan-first discipline (owner: "plan before you move, stop skipping steps").
> Most items are VISUAL -> MOCKUP-FIRST (mockup-visual-gate now enforces it). Design choices ->
> 3+ variations side by side (owner asked for ideas). Two items need the owner's reference
> screenshots (not yet in ~/solen/screenshots). One needs the council.

## Owner asks (verbatim intent, numbered)

1. **Map search bar city is STUCK.** Moving the map to Basel doesn't update the bar (still says
   Zürich); going to Zürich doesn't move it either. The bar city label should reflect / not be
   frozen. [functional] , investigate what drives the bar city vs the map viewport.

2. **Clicking a map pin/store does NOTHING.** Tapping a salon pin should open a STORE PREVIEW
   (card), not nothing. Owner will ATTACH a reference of how it should look. [feature + VISUAL]
   BLOCKED on the reference screenshot for the exact preview look.

3. **Map pin labels: show RATING (stars) + REVIEW COUNT, not from-price. And NOT black.** Owner
   dislikes Fresha's black pill. Will ATTACH a Fresha screenshot. [VISUAL -> mockup, 3+ variations]
   BLOCKED on the Fresha reference; but the from-price -> rating+count swap can be mocked now.

4. **Map search bar sizing.** Make the map-view search bar the SAME size as the normal-view
   search bar, and integrate it WITH the back button. [VISUAL -> mockup, 3+ variations]

5. **Refine each filter + a focus ring inside the filter.** Filters need refinement; there's still
   a focus ring inside the filter sheet. [VISUAL + focus-ring]

6. **FOCUS RINGS STILL NOT FIXED (owner FURIOUS, repeat).** On the HOME button (on click/hover ,
   owner thinks it's a hover state) AND on the PILLS. MEASURE live (getBoundingClientRect +
   computed style) BEFORE editing , binary-trigger. Root-cause the actual ring source (my touch
   input-halo fix did not cover buttons on the owner's device / a hover state). [a11y/CSS]

7. **Category vs City selector flow is CONFUSING.** Search -> tap Barber (category) -> location
   still shows -> tap Zürich -> the city selector "disappears in the middle". Confusing why it
   appears/disappears/stays. Also the city selector has a LOT OF OVERLAP. Owner wants IDEAS +
   wants me to ASK questions so I build what they actually want. [UX redesign -> ASK + mockup 3+]

8. **Checkout/booking: no processing state after payment** (walk-in AND normal). It snaps to the
   confirmation instantly -> no confidence "did I actually pay?". ASK THE COUNCIL. Add a
   processing/loading beat -> then the confirmation. [UX + motion -> council + mockup]

## PROGRESS 2026-07-01
- **#6 FOCUS RINGS , FIXED + hardened.** Measured (keyboard-Tab, desktop): every button/link/pill
  had `outline: 2px solid #0A0A0A` on :focus-visible (globals.css). Removed globally -> re-measured
  0 rings across 7 focusables. Commit e6af39ad1. HARDENED: no-focus-ring-gate now also catches a
  raw CSS `outline: Npx solid` (the gap that let it recur , utility patterns missed it); self-tested
  (denies re-add, passes `outline: none`).
- Remaining #1-5, #7, #8 = mockups / refs / council / Q&A (below). No real-component code yet ,
  mockup-visual-gate enforces mockup-first.

## Meta (owner demanded , DONE)
- HARDENED plan-first: plan-first-stamp.py (UserPromptSubmit) + plan-first-gate.py (PreToolUse)
  block substantive code edits until _plans/ is updated this turn. Self-tested (trips + 4 passes),
  wired.
- HARDENED mockup-first for VISUAL: mockup-visual-gate.py blocks appearance changes to real
  components without an approved mockup (diffs old/new visual tokens to avoid false positives).
  Self-tested (trips + 5 passes), wired. (Supersedes the motion-only mockup-first-gate for the
  general case.)

## Sequencing
- #6 focus rings FIRST (measure -> fix; owner most furious; a11y/CSS, not a design-choice mockup).
- #1 map-bar-city-stuck: functional investigation.
- #3 (from-price -> rating+count) + #4 (bar sizing) + #7 (selector flow): MOCKUPS, 3+ variations,
  side by side on a /dev route, owner picks. #7 also needs owner Q&A first.
- #2 (pin -> store preview) + #3-black-style: BLOCKED on owner reference screenshots.
- #8 checkout processing state: council, then mockup.

## #7 COUNCIL (2026-07-01) , owner asked for the council on the category-tap behavior
Owner already decided: pick a city -> COLLAPSE TO A CITY CHIP.
Voices 1 (IA) + 2 (Airbnb patterns) converge:
- **Category chip tap -> fill the service + AUTO-ADVANCE to the location step** (a chip tap is a
  complete commit; advancing = the Airbnb pattern). The service row stays visible as a chip above.
- **Hybrid composer**: exactly ONE field expanded at a time; every answered field COMPRESSES to a
  dismissible chip in its OWN slot; all three rows (service/location/date) always visible. Not an
  accordion (all-open overwhelms), not a hidden wizard.
- **THE rule that kills the confusion**: a field only changes state on a USER action. "City
  disappears" = the composer reacting to its OWN state change. Never REMOVE a row , COMPRESS it to
  a chip in place. Visibility = trust.
- **MAP nuance** (voice 2): on the map, a category/place pick can commit IMMEDIATELY to the map
  viewport, composer stays docked as a compact top bar for refinement (Google/Airbnb map pattern).
  -> this is a natural VARIATION to mock (compose-first vs commit-immediately-on-map).
Voice 3 (simplicity): pending , will inform whether DATE stays up-front or defers to results.
NEXT: build 2-3 MOCKUP VARIATIONS of this composer (hybrid+chips, auto-advance) side by side on a
/dev route, owner picks. Variations = (A) compose-first everywhere, (B) map commits category
immediately + docked bar, (C) leaner per voice 3.

## Open questions to ASK the owner (for #7)
- When you pick a category (Barber), should the flow auto-advance to location, or stay so you can
  also pick a service? What should happen to the city selector after you pick a city , collapse to
  a chip, stay open, or advance? (Draft options in the mockup.)

## PROGRESS pt 2 (2026-07-01)
- #7 council done + MOCKUP shipped at /dev/search-flow (3 variants A/B/C, recommend B). BLOCKED on
  owner picking a variant.
- #1 map-bar-city-stuck: ROOT CAUSE = the map bar shows cityName = the SEARCH city (activeCity/URL
  param), NOT the map's pan viewport (SearchTemplate.tsx:1524). Panning to Basel never touches it.
  This is a UX FORK, not a bug: (a) bar TRACKS the map pan (non-standard; Google/Airbnb DON'T), or
  (b) keep the bar = your search + add a "In diesem Bereich suchen" button on pan (the standard
  MapView.onAreaSearch already exists but may be unwired in the overlay). Needs owner's call / a
  mockup , NOT guess-implemented.
- #8 checkout-no-processing-state: council dispatched (owner asked). Then mockup.
BLOCKED-ON-OWNER: #7 pick (A/B/C); #2 store-preview ref; #3 Fresha rating-pill ref; #1 bar-vs-area
UX fork. NON-BLOCKED next: #8 (council->mockup), #4 bar-sizing mockup, #5 filter refine mockup.
