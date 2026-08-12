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

- [x] 1. Commit f8a199dcb, `app/[locale]/dev/mock/category-morph/` , three directions:
      A our locked pill morphing with no glass, B glass on every circle, C glass only on the one
      chosen. Genuinely different bets, not one with tweaks.
- [x] 2. Commit f8a199dcb , verified: the categories, their colours and their icons are imported from
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
- [x] 6. Commit fcbff0e92 , SURFACED TO HIM IN THE REPLY, not left in the file: both consequences of this morning: the tints are
      grey rather than per-category, because he chose the monochrome 2D set, so B and C differ in
      how much glass rather than in colour. And Coiffeur and Barbershop still carry the same
      scissors, because our flat set has no barber tool. Both are one-line changes once he decides.

## ROUND 2 (owner: "i want the keep the structure ... i want glossy sh on the icon not the pill or circl bro")

Round 1 put the glass on the CONTAINER. Wrong surface, corrected in one sentence. The container is
now the plain locked recipe in all three, and the only thing that varies is how the GLYPH is glossed.

- [x] R1. Commit fcbff0e92, `app/[locale]/dev/mock/category-morph/Variants.tsx` , the container is identical in all
      three and carries no glass. verified on the rendered page: `boxShadow` is "none" on the chips
      in every row, while the glyph in each row paints from its own gradient (stroke `url(#gloss-a)`,
      `url(#gloss-b)`, and in C a stroke plus a `url(#gloss-c-fill)` fill).
- [x] R2. Commit fcbff0e92 , the structure he asked to keep is kept: circle at rest, the locked sunken pill when
      chosen, same sizes. verified: 121px open, 48px circles, in all three rows.
- [x] R3. Commit fcbff0e92 , three genuinely different ways to gloss a glyph rather than one turned up: A paints the
      LINE with a gradient only; B adds a white edge above and a soft shadow below so the glyph
      lifts off the surface; C fills the shape as well as drawing it.
      HOW, since this is not a colour swap: our icons are stroked SVGs using `currentColor`, and a
      gradient on a stroke needs a real paint server, so each direction defines one gradient and
      points the stroke, or the fill, at it. A CSS filter was rejected because it blurs the shape.
- [x] R4. Commit fcbff0e92 , RECOMMENDATION: **B**. The only one that reads as glossy at 22px, which is the size this
      ships at. A is honest but nearly invisible at icon size. C is genuinely liquid and is also the
      one that stops looking like our icon set, because a filled scissors is a different mark from a
      drawn one and nothing else in the product is filled.
      Costs: B adds two shadows per glyph, cheap, but a treatment nothing else in the app has. C
      would need every category glyph redrawn as a filled shape to stay consistent.
- [x] R5. DISPOSED as a real dependency on him, and it needs drawing rather than code: hair salon and barber carry the same scissors, because our flat set
      has no barber tool. Whichever gloss he picks, that stays until an icon is drawn.

## ROUND 3 (owner: "the icons ur choosing doesnt make any scence bro why diamonds etc ... generate using higgsfield ir smth")

He is right. A diamond is not a nail, and the same scissors was standing in for two categories,
because I was picking from a general-purpose glyph set that has no barber tool and no polish bottle.

- [x] G1. GENERATED instead of borrowed, and it is direction D on the same page. One prompt, four
      variants, **2 credits** preflighted before spending (balance 570, plan plus).
- [x] G2. verified on the rendered page: four generated images in row D, all loaded, one per
      category. Every object now means its own thing: shears, clippers, a polish bottle, spa stones.
      No diamond, and hair salon and barber are finally different marks.
- [x] G3. THE PICK AMONG THE FOUR GENERATED SETS, and the reason is his own instruction: two of the
      four put the gloss on a TILE behind the object, which is the exact surface he said not to
      gloss. One had no tile and the shine on the object itself. That is the one that shipped into
      the mockup; the other three are kept at `public/_mockups/_assets/gen-icons/` so the choice can
      be re-judged without spending again.
- [x] G4. Prepared for use rather than pasted: white made transparent, cut into four squares,
      centred, saved at 256px to `public/icons/categories/gloss/`.
- [ ] G5. HIS CALL: D against B. D is a made-for-us set where every object means its category, in
      one coral. B is our existing glyph set with a gloss on it, which stays consistent with every
      other icon in the product but keeps the twin scissors. He picks one and it becomes real.

## ROUND 4, and it closes the whole thread (owner: "wtf are these colors bro stop maiking dumb sh up make it black flat jst normal icons bro are u dumb")

Black. Flat. Normal. No colour, no gloss, no gradient, no lift, and no options to pick between,
because he closed the question rather than asking one. The three gloss directions and the coral set
are DELETED, not parked, and the coral files are gone from the repo.

The only thing kept from the earlier rounds is his own idea, the shape: circle at rest, the locked
pill when chosen.

- [x] B1. Icons regenerated in solid black, flat. Measured on the chosen sheet before cutting:
      **0.0% coloured pixels**. Four silhouettes, one per category: shears, clippers, a polish
      bottle, spa stones. Cut, made transparent, saved at 256px to `public/icons/categories/flat/`.
- [x] B2. verified on the rendered screen at 402x874: four chips, at rest one is 121px and three are
      48px circles; tapping the third shrinks the first to 48 and grows the third to 98. All four
      icons load. **No shadow on any chip and no filter on any icon**, which is the check that the
      gloss really is gone rather than just turned down.
- [x] B3. The mockup page is now ONE row, not four. Nothing to compare, because there is nothing
      left to decide about the treatment.
- [x] B4. The old coral set and the gloss variants are removed from the repo rather than left lying
      around to be picked up by mistake.
- [ ] B5. HIS, and the last thing open on this: whether this goes into the product. It is a mockup
      until he says so.

## WHAT THIS THREAD COST, recorded because the pattern is the lesson

Four rounds, two of them entirely wasted, and both waste came from the same habit: I answered the
part of his sentence I found most interesting instead of the whole sentence. He said "glossy sh on
the icon" and I glossed the container. He said "flat icons" in the same breath as "3d liquid" and I
built three ways to reconcile that instead of asking which word won. The generated coral set was
never requested in coral at all; he never named a colour, and I chose one.
