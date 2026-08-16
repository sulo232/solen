# The stretched pill, the small stars, and the missing hierarchy (2026-08-16)

Owner, verbatim: *"You're, like, really, like, elongating this pill. It's, like, just a little bit.
So it looks like it has, like, a sharp corner. And I don't like how the stars here, like, are just
so fucking small. And, yeah, I mean, overall, I just... I don't like it. I mean, I like... on the...
on my screenshot thing, yeah, I like how the icon is bigger and everything, but there is just no
hierarchy and balance. You know?"*

## The asks

- [x] 1. Stretched pill (commit f0ab90328) · verified: live getComputedStyle gives 135.6x44 at a
      3.08 ratio with a fixed 22px corner, so 91 of those 135px are straight. Fix at
      `app/[locale]/dev/round5/Round5Client.tsx:111`, measured after as radius 9999px -> 16px
- [x] 2. Row stars (commit f0ab90328) · verified: measured 13x13px live, against Fresha's 12.7px
      (PIL, his screenshot) and Airbnb's 9px (`airbnb--reviews.md`), so BOTH references are smaller
      than ours and this is his call past both. Fix at `Round5Client.tsx:113`, measured 13 -> 18
- [x] 3. Bigger photo kept (commit f0ab90328) · verified: carried into the combined option at
      `Round5Client.tsx:106`, measured live as 44 -> 62px when the option is tapped
- [x] 4. Hierarchy (commit f0ab90328) · verified: six sizes in the first viewport (28/18/16/15/14/13,
      with 13px used eight times), a range of 2.15x against Airbnb's measured 7.2x. Fix at
      `Round5Client.tsx:116`, measured as the score going 16px -> 44px so it outranks the heading
- [ ] 5. BLOCKED ON HIM, a real dependency and not a punt: whether "All four fixed" is the one to
      apply. Applying it edits `CLAUDE.md`'s radius row (every button and chip in the product is a
      capsule by that line) and the shared TabPill that 29 files import, so it moves every screen
      at once. His by name, and not guessable.

## MEASURED FIRST, live at 390x844, before any edit

**1. He is right about the pill, and the number says why.** Every control is `h-11` (44px) with a
9999px radius, so the corner radius is 22px no matter how wide the pill gets. The round ends are
therefore always 44px of the total width, and everything else is a straight line:

| pill | size | ratio | how much of the outline is straight |
|---|---|---|---|
| "Now" | 60.3 x 44 | 1.37 | 16px, so it reads round |
| "Just the text" | 111.1 x 44 | 2.52 | 67px |
| "Your screenshot" | 135.6 x 44 | 3.08 | **91px, two thirds of it** |

A capsule whose straight section is two thirds of its length does not read as a capsule. It reads as
a rectangle with rounded ends, and the eye lands on the junction, which is what he is calling a
sharp corner. He is describing a real geometric fact, not a rendering artifact.

**2. The stars are 13x13px in a review row**, against 26px in the summary row above them.

WORTH SAYING PLAINLY: on this one, the references do NOT back him.
- Fresha's review-row star, PIL-measured off his own screenshot: **12.7px**. Ours is already bigger.
- Airbnb's, from `airbnb--reviews.md`: **9x9px**, and black rather than gold.
Both references put row stars SMALLER than ours. So making them bigger is his taste going past both,
which is a completely legitimate reason and is recorded as his call, not as a reference match.

**3. Hierarchy, measured.** Six distinct sizes in the first viewport: 28, 18, 16, 15, 14, 13, with
13px used eight times. Biggest over smallest is **2.15x**. Airbnb's reviews screen runs 10px to 72px,
a range of **7.2x**. Same finding as the clutter round, now on this screen too: the sizes are packed
into a narrow band, so nothing leads.

## THE COMBINED OPTION

He approved the bigger photo disc by name. The new option keeps it and adds the three measured
fixes: the pill stops being a stretched capsule and becomes a deliberate 16px-corner shape, which is
also what Airbnb's own chips are; the row stars grow; and the rating becomes the anchor so the screen
has one clearly biggest thing.
