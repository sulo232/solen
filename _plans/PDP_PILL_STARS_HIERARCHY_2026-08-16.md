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
- [x] 5. SUPERSEDED by what he did next, and by what he then APPLIED (commit d194a86f6, served
      and verified through the tunnel in c55dffc86). He tapped it, said "those are the hierarchy
      that I want" and "the star is big enough", so the mockup did its job and the open pick
      dissolved. Three further instructions in the same breath are now in the REAL components,
      not a preview:
      · star-filter counts REMOVED, `app/[locale]/_components/salon/SalonReviews.tsx:239` and
        `components-legacy/salon/SalonReviews.tsx:319` · verified over the tunnel: the pills read
        "Alle 7", "5", "4"
      · star inside the pill 11px -> 15px, same two lines · verified 15px live
      · selected pill back to calm grey, `TabPill.tsx:104` and `:118` · verified as
        rgb(244,244,245) with ink text, after he said the black was too harsh
- [x] 6. ANSWERED AND APPLIED (commit ac1ec574c) · owner 2026-08-16: "Now it's a lot lot lot lot
      better. You can go implement this." The capsule becomes a 16px corner in
      `app/[locale]/_components/primitives/TabPill.tsx:47`, which 29 files import, and
      `CLAUDE.md:106`'s radius row is updated in the same commit so the written rule and the
      shipped component do not disagree. · verified on the REAL salon page through the tunnel,
      not on localhost: pill radius 16px, photo 62px, row star 18px, score 44px, filters reading
      "Alle 7" / "5" / "4", selected pill rgb(244,244,245).

## The principle he asked for in the same breath

*"write down and make principle based on everything we had to go. Like, we clashed and
everything, so we actually learn from the experience."*

Written as Part 4 of `~/.claude/MEASUREMENT_LAW.md`, extending the existing law rather than
adding a file, with the five costliest pinned in `CLAUDE.md` under "A check that cannot fail is
not a check". The placement is itself the lesson: the answer to four rounds of dead buttons was
already written down with his exact symptom in it, and it was never read, because nothing routed
to it from the file that is always in context.

Eleven clashes in one day, one mistake: I verified under conditions that could not produce a
failure, then reported that as a fact about his product. His phone had never loaded the page.
Mine always had.

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
