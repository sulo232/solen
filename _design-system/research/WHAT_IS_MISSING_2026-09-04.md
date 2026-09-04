# What is actually missing (owner 2026-09-04: "mainly design, what formula, what principle is missing, because it's so ass")

Every number here was measured on 2026-09-04 in this session, on the dev server at phone size
(390x844), or by counting the code. Sources: `scratchpad/DESIGN_WALK.md` (six screens, all 200),
`scripts/detect-type-scale-outliers.mjs`, `scripts/lib/type-scale-allowed.mjs`, and grep counts.

## The short answer

Three things are missing, and none of them is another floor.

1. **A type SCALE. What exists is a permission list.** The lock allows 17 pixel sizes
   (10 11 12 13 14 15 16 18 20 22 24 26 28 30 34 40 64), seven of them consecutive integers
   from 10 to 16. A scale has steps; a list of every integer has none. So a screen can obey the
   lock and still fail the lock's own "size variety is not range" rule at the same time, because
   five legal sizes fit inside one 8px band. Measured: 4 of 6 screens fail that rule
   (search 5 sizes in 8px, salon page 6 sizes with 5 in 8px, profile 7 sizes, home passes with 3).
   On top of the 17 legal sizes there are 463 uses of 32 illegal ones in 143 files
   (12.5px x170, 13.5px x119, 17px x48, 14.5px x39, 19px x16), grandfathered because the gate
   only refuses new ones. And the lock carries two ramps that disagree with each other: the
   "Core ramp" (22/18/16/14/13/12) and the CLAUDE.md contract row (name 14, meta 12, CTA 15,
   eyebrow 11). Meta is 13 in one and 12 in the other; eyebrow is 12 in one and 11 in the other.
   Formula that is missing: ONE ramp of at most 6 roles with a ratio between steps (the lock's
   own 28px anchor over a 14px body is 2.0; the ramp under it should step 28 / 22 / 18 / 14 / 12,
   nothing in between), every other pixel value illegal everywhere, old uses swept, not
   grandfathered.

2. **A relationship rule with teeth.** FLOORS LAW 8 ("the same thing looks the same
   everywhere") was written on 2026-07-29 and it is the most-broken rule in the system: the
   salon card, the one entity a customer sees on every screen, has THREE implementations
   (homepage `SalonCard.tsx` 578 lines, `components-legacy/SalonCard.tsx` 394 lines used by the
   saved-salons list, and the hand-built card in `WalkInBand.tsx`), with different photo ratio,
   radius, name size and price treatment. Every per-screen floor passes on each of them. Nothing
   measures the DIFFERENCE between two screens, so nothing fails. Formula that is missing: one
   component per entity, a registry variant for every density, and a check that renders the same
   salon on home, search and saved and diffs the three boxes (photo ratio, radius, name px, price
   px). Today that check does not exist.

3. **A time floor for the first paint.** Two customer screens (search, inspo) are 100 percent
   grey skeleton for 2 to 4 seconds and the dashboard for up to 8 seconds; both measuring tools
   graded the skeleton and not the page. The design law says what a skeleton must look like and
   nothing about how long it may stand there. Formula that is missing: above-the-fold content is
   rendered on the server (Airbnb's feed arrives with the HTML), and a route that shows only
   skeleton past 1.5 s at phone size fails.

## What was NOT missing (so it is not the answer)

9 of the 13 findings on the six screens are an existing rule being broken, not a hole:
the map markers in a fallback typeface (one class, named on 2026-07-30, still open), the
walk-in card hand-built, the walk-in wait time in success green, the review card carrying a
hairline AND a shadow, the saved-salons card duplicate, and the size-spread breaks. Writing a new
principle would not have fixed any of these; they need the existing rule applied and a check
that sweeps old code instead of only refusing new code.

The four real holes: no type scale (1 above), no cross-screen check (2 above), no skeleton
duration floor (3 above), and the display-anchor floor asking list screens (search, inspo) for
a 28px heading they structurally do not have. The last one is a scope fix, not a principle:
exempt list-type screens by name, the way the imagery floor already exempts forms and receipts.

## Airbnb, the source of truth, measured the same way

(filled in from `scratchpad/airbnb/COMPARISON.md` when the capture finishes; the first home
measurement was contaminated by a price-notice popup and is not used.)

## Fix order

1. Mockup at `/en/dev/design-fixes`: four stacked pairs (walk-in card, review card, saved-salon
   card, salon-page type scale). His approval, then the code.
2. Reconcile the two ramps into one (needs his word on meta 12 vs 13 and eyebrow 11 vs 12, the
   only two values that differ), then sweep the 463 off-scale uses with the existing detector.
3. Add the cross-screen card diff to `check-geometry.mjs` and the 1.5 s skeleton floor.
