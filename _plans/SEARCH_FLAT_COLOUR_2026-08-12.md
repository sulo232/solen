# The search panel reads flat and grey (2026-08-12)

Owner, with four captures (IMG_7123, IMG_7124, IMG_7125, IMG_7126): "i wanna improve design sh looks
flat n no color n the fur sie ui too".

## Readback

1. Improve the design, it looks flat.
2. It has no colour.
3. The for-you section too.

## MEASURED, not eyeballed

pixel-spec-auto was run first on IMG_7123 and returned FAILURE, "could not detect a card structure",
which is the documented borderless case, so the reference was PIL-sampled directly.

Share of pixels carrying any colour at all (max channel minus min channel > 28, 1/6 scale):

| capture | what it shows | coloured pixels |
|---|---|---|
| IMG_7123 | the list he is looking at | **0.1%**, mean saturation 0.001 |
| IMG_7125 | the panel mid-open | 4.9% |
| IMG_7126 | the composed panel | 5.2% |
| IMG_7124 | the same list, scrolled to the feed | 10.0% |

So he is not describing a mood. The top of that screen is greyscale to within a rounding error, and
every coloured pixel on it arrives with the TikTok photographs further down.

Geometry, both sources agreeing so the mockup is built to numbers rather than to a look: his capture
gives a 48pt icon tile on a 68.0pt row pitch, left edge 16.0pt; the live panel gives 48x48px at
radius 16px, 68px row, name 15px/600, sub 13px/400, look card 179x239px at radius 14px.

## The cause, and why the fix is not decoration

Three things the panel ALREADY has and throws away:

1. `/api/salons?ids=` is a call the panel already makes once on open. Measured against the live
   server it returns `cover_photo_url`, `average_rating`, `review_count` and `min_price` for those
   exact three salons. The panel keeps `address`, discards the rest, and draws a grey storefront
   glyph where the salon's own photograph could go. The same salon has a photo on the home page,
   which is FLOORS LAW 8 (one thing looks the same everywhere) failing on the same screen pair.
2. `searchCategories.ts` has carried a `bg` and an `fg` per category since it was written. The panel
   passes neither, so all four tiles are the same grey, and Coiffeur and Barbershop are handed the
   identical scissors glyph, visible twice in a row in his own screenshot.
3. `/icons/categories/v2/` holds four drawn category icons already in the repo.

This is FLOORS LAW 2 by the letter: the colour arrives as CONTENT, never as an ornament with a
hardcoded src.

## Boxes

- [x] 1. Commit fdc7d1d7b, `app/[locale]/dev/search-color/` , mockup built and rendered, three
      changes each shown against what ships today, with real salons and the real feed, not drawings.
  - [x] 1a. A, popular stores: the salon's own photo, rating and review count in the tile it
        already has. verified: rendered, 15 real images on the page, the three seeded Basel salons
        with 4.2 (11), 4.5 (10) and 4.4 (15).
  - [x] 1b. B, categories: two options, tint only and tint plus the drawn icon. verified: rendered,
        five distinct tile colours measured on the page (the grey plus the four category colours)
        against the one grey that ships.
  - [x] 1c. C, the for-you feed: the titles stop being cut mid-word. verified: rendered, both
        columns side by side on the same four looks.
  - [x] 1d. Every proposal carries its own cost in the page, in his language, not just its upside.
- [ ] 2. HIS CALL, and it is a real dependency, not a punt. Three answers: A yes or no; B1, B2 or
      neither; C yes or no. Nothing is applied to the real panel until he picks (mockup-first).

## Not touched on purpose

The panel's own layout, copy, order, spacing and icons stay exactly as they are. Every frame in the
mockup is `SuggestRow` and `LookCard` copied out of SearchOverlay.tsx with ONE treatment changed.
