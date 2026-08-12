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
  - [x] 1a. Commit fdc7d1d7b , A, popular stores: the salon's own photo, rating and review count in the tile it
        already has. verified: rendered, 15 real images on the page, the three seeded Basel salons
        with 4.2 (11), 4.5 (10) and 4.4 (15).
  - [x] 1b. Commit fdc7d1d7b , B, categories: two options, tint only and tint plus the drawn icon. verified: rendered,
        five distinct tile colours measured on the page (the grey plus the four category colours)
        against the one grey that ships.
  - [x] 1c. Commit fdc7d1d7b , C, the for-you feed: the titles stop being cut mid-word. verified: rendered, both
        columns side by side on the same four looks.
  - [x] 1d. Commit fdc7d1d7b , verified: every proposal carries its own cost in the page, in his language, not just its upside.
- [x] 2. ANSWERED 2026-08-12: "1 proposed but wout revoew counts hst star n4.2 yk 2 B1 but acc make
      system for tint not jst random n also the icons make ot make scence and c proposed but is
      aespectcratio good like does it acc reflect the inspo page and also is it personalized and
      also how to jump to the inspo page from there". A yes without counts, B1 with a real system,
      C yes plus three questions. Round 2 boxes below.

## THE PHOTOS ARE STOCK, and that changes what option A is worth

Checked against the live snapshot rather than assumed: `salon_photos` has **0 rows**, and the
`cover_photo_url` the API returns for all three of those salons is an `images.unsplash.com` URL. So
the colour option A adds is SEED PLACEHOLDER photography, not our salons.

That does not make A wrong, because the mechanism is what is being decided: the row renders whatever
photo that salon has, and it will render the real one the day a salon uploads it. But it does mean
the mockup's prettiness right now is borrowed, the same borrowed pictures the home page already
shows, and A should be judged on "should this row carry the salon's photo at all", not on how good
these particular pictures look.

Options B and C are unaffected: B is our own category colours and our own drawn icons, C is only a
line-wrap.

## Not touched on purpose

The panel's own layout, copy, order, spacing and icons stay exactly as they are. Every frame in the
mockup is `SuggestRow` and `LookCard` copied out of SearchOverlay.tsx with ONE treatment changed.

## ROUND 2 (his answer, 2026-08-12)

### Readback

1. A yes, but WITHOUT the review counts. Just the star and the 4.2.
2. B1 yes, but make an actual SYSTEM for the tints, not four random colours, and make the icons
   make sense.
3. C yes, plus three questions: is the aspect ratio right, does it reflect the Inspo page; is it
   personalized; and how do you jump to the Inspo page from there.

### Boxes

- [x] R1. verified: the review count is gone. Measured on the rendered page, the count in brackets
      appears zero times anywhere on it; the row now carries photo, name, gold star, value, address.
- [x] R2. A TINT SYSTEM, not four picked colours, and the old set measured to prove the difference.
      ONE RULE: identical lightness and identical colourfulness on every tile, hue is the only
      thing that changes (CIE Lab, tint L*=92 C*=12, glyph L*=42 C*=38). verified by measurement:
      today's four run L* 86.94 to 95.78 on the tile and 12.85 to 59.00 on the glyph, a 46-point
      spread, and their two closest hues are 1.7 degrees apart, which is the same colour twice.
      The system's four are identical on both axes, 32 degrees apart at the closest, and the glyph
      contrast on its own tile measures 4.87, 4.86, 4.87 and 4.91 to 1, all clearing the 3:1
      graphical floor and the 4.5:1 text floor. Hue per category is reasoned in one line each, not
      spun: warm gold kept, barber terracotta, polish rose, spa green kept.
- [x] R3. Icons that mean something. Barbershop stops being a second scissors and takes a shaving
      brush; nails takes a hand instead of a diamond. verified: all 5842 icons in the installed set
      were searched for a razor or clippers and there is none, so the brush is the closest true
      barbershop tool; the obvious nails alternative is banned in this project by name. We own a
      clippers drawing if he wants that one row to use art instead.
- [x] R4. C, aspect ratio: ANSWERED WITH A MEASUREMENT, and the answer is no. verified: the live
      Inspo page renders 192x341 and 80x142, ratio 0.563 (9:16); the panel renders 179x239, ratio
      0.75. The panel crops the same look by about a quarter. The proposed frame uses 9:16 so a
      look is the same shape in both places.
- [x] R5. C, personalized: ANSWERED. Only for a signed-in viewer on a plain browse
      (`app/api/discovery/feed/route.ts:128`, `discovery_feed_for_you` runs only `if (userId &&
      isPureBrowse)`); logged out it is the popular order under a personal-sounding title. Two
      honest ways out are on the page, and which one is a copy decision that is his.
- [x] R6. C, the way into Inspo: ANSWERED. There is none today, tapping a look opens that one look.
      The proposed frame puts it on the section heading in ink with a chevron, never blue, per the
      see-all rule.
- [x] R7. APPLIED, not offered. He had already said yes to all three ("1 proposed", "2 B1", "c
      proposed") and had asked for the system and the icons himself, so building them is the order,
      not a guess. `searchCategories.ts` now carries the computed tints and Brush/Hand;
      `SearchOverlay.tsx` gained three opt-in slots on `SuggestRow` (photo, rating, tint) so every
      other caller renders byte-identically, keeps the cover and rating from the fetch it already
      made, and the look card moved to 9:16 with a two-line title and an Inspo link on the heading.
      verified on the live panel at 402x874: five tile colours where there was one grey, 11 salon
      photos, 3 gold stars, zero review counts, look ratio 0.563 (the Inspo page's own), and one
      `/de/inspo` link in the sheet.
- [x] R8. SUPERSEDED by his next message and fixed at the root. He said: "the icon palletes dont
      make any scence and doesnt resemble the icon seta that are made yk", and he is right twice
      over. A Lucide glyph in a tinted box is NOT the icon set this app owns, and a hue I reasoned
      my way to is not the colour that set is drawn in. The drift ledger had logged this exact
      mistake before ("used onboarding PHOTOS when real category ICONS existed").
      FIXED: the rows now render the drawn icons from `/icons/categories/v2/`, and each tile's tint
      is READ OFF ITS OWN ART instead of argued. Measured on the artwork (alpha>128, pixels with
      real colour, dominant hue weighted by colourfulness): the hair dryer is yellow at hue 90, the
      barber chair orange at 50, the polish bottle rose at 20, and the spa leaf green at 120, which
      is the only colour in that drawing. Same one rule as before holds the set together, tile
      L*=92 C*=12 and fallback glyph L*=42 C*=38, so only the hue moves and it now comes from the
      picture. verified on the live panel at 402x874: all four drawn icons load at 36px, and the
      four tiles measure rgb(242,231,209), rgb(254,227,215), rgb(255,225,225), rgb(229,235,212).
      The invented pass, kept as a record: hues 75 / 32 / 0 / 150, and a shaving brush that
      rendered as a paintbrush.
