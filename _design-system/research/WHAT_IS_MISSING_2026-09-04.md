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
   Formula that is missing: ONE ramp, integers only, used the same way on every screen (see the
   Airbnb table below before assuming fewer sizes is the fix: Airbnb home uses six), every other
   pixel value illegal everywhere, the 463 old uses swept, not grandfathered.

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

## Airbnb, the source of truth, measured the same way (popup dismissed, 390x844, de.airbnb.com)

| screen | photo area | biggest text | text at weight >= 600 | anchor / body | distinct sizes | weights |
|---|---|---|---|---|---|---|
| Airbnb home | 32.6% | 18px ("Beliebte Unterkünfte in Baguio") | 26.8% | 1.5x | 10 11 12 13 14 18 | 400 500 600 700 |
| Solen home | 41.3% | 18px ("Für dich empfohlen") | 3.3% | 1.5x | 3 sizes | (under 2) |
| Airbnb search | 28.5% | 15px | 20.4% | 1.07x | 10 12 14 15 | 400 500 700 |
| Solen search | 63.5% | 16px (a card name) | 5.9% | 1.19x | 5 sizes in 8px | (under 2) |
| Airbnb listing | 44.4% | 26px (the title) | 4.8% | 1.86x | 12 14 16 18 26 | 400 500 700 |
| Solen salon page | 34.7% | 30px | 7.1% | 2.14x | 6 sizes, 5 in 8px | (under 2) |

**What this says, plainly.** Graded by our own six floors, Airbnb fails on its own home page
exactly where we fail (18px anchor, 1.5x, five sizes inside 4px) and fails the imagery floor on
home and search, where we pass by a wide margin. It uses three or four weights per screen where
our lock allows two. On every number our rulebook measures, we are equal to or "better" than the
source of truth, and the screens still look worse. **So the missing thing is not a floor, and the
type-scale point in item 1 has to be narrowed:** Airbnb's sizes are integers used the same way on
every screen (nine distinct integers across three screens); ours are 17 permitted integers plus
463 uses of 32 half-pixel and odd sizes, and two ramps that disagree. The lever is sameness and
integers, not fewer sizes.

What the numbers cannot see, and where the difference actually sits: Airbnb's first paint already
carries 41 text elements on home (server-rendered); our search and inspo carry 0 at 1.5 s. One
card component on every Airbnb screen; three of ours. And the nine existing rules that are broken
on our screens (item "not missing" below) have no Airbnb counterpart because Airbnb does not ship
a fallback typeface on its map or a card with both a hairline and a shadow.

## Fix order

1. Mockup at `/en/dev/design-fixes`: four stacked pairs (walk-in card, review card, saved-salon
   card, salon-page type scale). His approval, then the code.
2. Reconcile the two ramps into one (needs his word on meta 12 vs 13 and eyebrow 11 vs 12, the
   only two values that differ), then sweep the 463 off-scale uses with the existing detector.
3. Add the cross-screen card diff to `check-geometry.mjs` and the 1.5 s skeleton floor.
