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

## Open questions to ASK the owner (for #7)
- When you pick a category (Barber), should the flow auto-advance to location, or stay so you can
  also pick a service? What should happen to the city selector after you pick a city , collapse to
  a chip, stay open, or advance? (Draft options in the mockup.)
