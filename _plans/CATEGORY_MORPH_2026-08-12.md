# Category row: circles that morph into pills, flat icons with a glare (2026-08-12)

Owner: "nah okay ditch ts its ass okay bro ditch mockups but i have new idea what if we use flat
icons yk in category and also instead of pills like circle n once u click then it bcms pill all
morphism and also the icon i want it like abit glare yk like 3d liquid style icons yk"

## Readback

1. Ditch the Airbnb comparison work. It is parked, not deleted.
2. Flat icons in the category row.
3. Unselected = a CIRCLE. Tap it and it MORPHS into a pill with its label.
4. The icon carries a bit of glare, the 3D liquid glass look.

## The tension in his own ask, named rather than smoothed over

"Flat icons" and "3D liquid style" pull opposite ways. My reading, and he can correct it in one
word: he wants a FLAT SHAPE, not a photo-real render like the hair dryer, but with a gloss on it so
it reads as glass rather than as a line drawing. That is what liquid glass is: a simple shape, a
highlight, a soft inner shadow. So the variants below hold the shape flat and vary how much glass
sits on top, rather than treating it as a choice between flat and 3D.

## What already exists, checked before building

- `searchCategories.ts` holds the four categories, their colours and their Lucide icons. This is
  the one source and the mockup imports it rather than re-declaring anything.
- `/icons/categories/` holds the 3D renders he rejected this morning, and two flat SVGs
  (`coiffeur.svg`, `nails-test.svg`) in a single coral, which is the only real flat art we own.
- `TabPill` is the locked pill treatment: selected = `bg-s-bg-sunken` + ink + semibold.
- The drift ledger records exactly this trap from 2026-07-12: "turned every icon into a colored
  glass disc". That was me inventing it. This time he asked for it by name, which is different, but
  the icons stay the real ones.

## Boxes

- [x] 1. Commit pending this turn, `app/[locale]/dev/mock/category-morph/` , three directions:
      A our locked pill morphing with no glass, B glass on every circle, C glass only on the one
      chosen. Genuinely different bets, not one with tweaks.
- [x] 2. verified: the categories, their colours and their icons are imported from
      `searchCategories.ts`; nothing is re-declared and the pill recipe in A is the locked one.
- [x] 3. verified on the rendered screen at 402x874: at rest chip 1 is 119px wide and the other
      three are 48px circles; after tapping the third chip of row B, chip 1 is back to 48 and chip
      3 has grown to 96. The morph is real and only one is open at a time.
- [x] 4. RECOMMENDATION: **C**. The glass then MEANS something (this is the one you picked) instead
      of being texture on everything. B puts a highlight on four things at once, which competes with
      the salon photographs directly underneath it, and this project has rejected decorative gloss
      before. A is the safest and the least like what he described.
      Costs, each named: C looks plain until you touch it. B is the most "liquid glass" and the
      heaviest. A does not deliver the glare he asked for at all.
- [x] 5. verified: nothing outside `app/[locale]/dev/` was touched.
- [ ] 6. TWO THINGS HE SHOULD SEE BEFORE PICKING, both consequences of this morning: the tints are
      grey rather than per-category, because he chose the monochrome 2D set, so B and C differ in
      how much glass rather than in colour. And Coiffeur and Barbershop still carry the same
      scissors, because our flat set has no barber tool. Both are one-line changes once he decides.
