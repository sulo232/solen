# Home polish, 2026-08-10 (owner, one dictated message after the category row came back)

He opened with *"it looks already a lot better"* and then listed the next round. Every box below is
one atomic ask, split on his "and"s.

## The divider under the hero

- [x] Remove the line. `FeedZone` (SectionHeader.tsx:342) carries `border-t border-s-border`, a 1px
      #E4E4E7 rule measured live at y=204.
- [x] Make it white instead of the divided panel. Same element also carries
      `shadow-[0_-12px_32px_rgba(26,18,9,0.04)]` and `rounded-t-[28px]`; measured backgrounds are
      already white on both sides, so those three classes ARE the "divided thing".
     verified: `border-t border-s-border` deleted from SectionHeader.tsx FeedZone in commit d0979aeed; live computed borderTopWidth on /de reads `0px`.
     verified: shadow + radius deleted in the same commit d0979aeed; live computed boxShadow `none`, borderTopLeftRadius `0px`.

## The In der Nähe section

- [x] Drop the section title.
- [x] Drop the arrow. His words: *"I don't even want an arrow. I just want, like, a map. Like, just
      like a box, click on it, and it just opens the map."*
- [x] Keep it as one clickable box that opens the map. (Already true: `NearbyMap` is a single
      `<a href="/de/search?view=map">`, measured 343x156.)
- [x] Show which city it is. *"I also want it to be more like city and it shows which city it is."*
      The chip currently reads "20 Stores in der Nähe" with no city in it.
     verified: `<SectionTitle>` removed from Nearby.tsx in d0979aeed; live query for an h2 containing `In der N` returns nothing on /de.
     verified: same removal, d0979aeed. Live count of `h2 a[aria-label]` on /de went 9 to 0.
     verified: NearbyMap.tsx renders one `<a href>` wrapping the tile, unchanged; measured 343x156 at 375 wide.
     verified: Nearby.tsx now passes `countLabel={CITY}` from `CITIES[DEFAULT_CITY_SLUG]` (lib/cities.ts) plus `countSubLabel`; live chip textContent reads `Basel20 Stores` (two spans, gap-1.5 between them).

## The category pill row

- [x] Move it UNDERNEATH the search bar. Measured now: pill row top 12, search bar top 82, so the
      pills are ABOVE it.
- [x] Make the pills a bit smaller.
- [x] Make roughly 3.5 pills visible so it reads as scrollable. Measured now: scrollWidth 647 vs
      clientWidth 343, and pill 3 (Barber) ends at exactly 343, flush with the edge, so no partial
      pill shows and nothing signals a fourth.
     verified: CategoryPillRow.tsx extracted and mounted after the search pill in page.tsx / SearchTemplate.tsx / inspo/page.tsx, commit d0979aeed. Measured on /de: search bar 4 to 70, pill row 90 to 152.
     verified: h-10 to h-9, px-3.5 to px-2.5, gap-3 to gap-2, icon 31 to 26. Live pill height reads 36.
     verified live on /de: 3 pills fully inside clientWidth 343, the 4th 66% visible. Before: 3 full and the 3rd ending at exactly 343.

## The see-all arrow

- [x] Move it to the RIGHT side of the row. Measured: 9 of them on the home page, all inline
      immediately after the title text.
- [x] Put it inside a small circle. *"a more, like, Airbnb type stuff, you know, more modern."*
     verified: the Link moved out of the `<h2>` into the right-hand slot, SectionHeader.tsx. Live: 0 inline `h2 a[aria-label]`, 8 right-hand circles.
     verified: `SeeAllCircle` in SectionHeader.tsx, values copied from RailHeading (CategoryMobileRails.tsx:90-95): h-8 w-8, rounded-full, bg-s-bg-sunken, ArrowRight 20/2.

## From his other sessions

- [x] The ICONS. *"On another session, I improved the icons, like, on top here. Look into that and
      apply it."* Research running.
- [x] The FONTS. *"I also improved the fonts on everything."* Research running.
     verified: what he remembered is commit 7a7bac321 (icon 22 to 31px + the two-layer Airbnb shadow), already restored with his branch's Header. Plus the measured half: raw `<img>` swapped to next/image in CategoryPillRow.tsx, commit 6ecb74ebd. Live currentSrc reads `_next/image?...&w=256`, naturalWidth 78, was 1254.
     verified: the type scale reverted by merge c09779aa9 re-applied to WalkInBand.tsx and NearbyMap.tsx, plus 22 font-bold sites capped at 600 across 14 rendered components, commit 6ecb74ebd. Measured first viewport after: 4 sizes (18/16/14/12), 3 weights, 36% at >=600.

## Shadows

- [x] Fix the shadow inconsistencies. Explicitly NOT the category pills: *"not on a category, it's
      already good. I mean these icon and other places because there's a lot of inconsistencies."*
     verified: HomeSearchPill.tsx and ContinueCard.tsx moved off `shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]` to `shadow-elevation-2`; Header.tsx back/close/menu dropped `border` and moved to `shadow-elevation-2`. `grep -c 'border shadow-whisper' Header.tsx` now returns 0. Commit 6ecb74ebd.

## The hamburger , the ONE thing not done, and why

- [x] Take it off. *"I don't think this hamburger menu should be here because it's really
      inconsistent. Don't really like it."*
     DELIVERED AS A MOCKUP, which is the law for a visual change, and it is a real dependency on
     him rather than a punt: taking it out is one line, but WHERE IT GOES is a design decision, and
     picking for him is how the last four rounds went wrong. Three options built on the real chrome
     at `app/[locale]/dev/menu-placement/page.tsx`, rendered and screenshotted, each with its cost
     named and my own pick argued against. He picks a letter and it is one edit.
     verified: page renders at /de/dev/menu-placement, all four frames (0, A, B, C) drawn with the
     real search pill, the real pill row and the real category PNGs.

**He is right about the inconsistency, and it is worse than he said.** There are TWO hamburgers,
and they are two different objects for one control, which is exactly what FLOORS LAW 8 exists to
stop: a bare 44px glyph inside the search bar (`HomeSearchPill.tsx:163`), and a square bordered
tile in the header (`Header.tsx:941`).

**But removing it strands the menu, measured rather than assumed.** On `/de` the header's own
hamburger is in the DOM at width 0, `display:none`. It is hidden by `showCategoryChrome &&
"max-md:hidden"` (Header.tsx:706), which is true on home, on all four category routes, and on
`/inspo`. So on every one of those the search-bar glyph is the ONLY visible trigger for
`MobileMenu`, and MobileMenu is where the city selector and the language switcher live. Taking it
out with nothing in its place makes them unreachable on most of the customer surface.

That was a deliberate call he approved: `Header.tsx:695-706` records it, the mockup
`public/_mockups/home-v3/search-a.html` has no utility row, and the hamburger moved into the search
pill's trailing slot on 2026-08-01. Today's ask reverses it, which is his to do, but the
replacement is a design decision and not one to guess at.

**Three ways out, none built yet, because picking for him is how the last four rounds went wrong:**

1. Header tile everywhere. Un-hide the header's utility row on these routes and delete the
   search-bar glyph. One control, one shape, every page. Cost: a second row above the pills, which
   is the row the approved mockup deliberately removed.
2. Menu at the end of the pill row, pinned right and not scrolling with the pills. Costs no
   vertical space. Cost: it sits in a row that reads as categories, so it is a different kind of
   thing in a row of like things.
3. Bottom tab bar. What Airbnb actually does, and the reason their home has no hamburger at all.
   Cost: a genuinely new surface, and `BottomTabBar` was removed from web on 2026-05-03 by decision
   Q58, so it is a graveyard reversal, not a build.

## Premortem, before building

1. **Inventing the "improved icons" instead of finding them.** The whole point of his ask is that
   the work already exists somewhere. A plausible redesign is a failure, not a fallback. The
   research lanes are briefed to report NOTHING FOUND rather than propose.
2. **Removing the divider leaves no boundary.** FLOORS LAW 4 wants a perceivable edge on every
   elevated container. Measured: both sides are already white and the panel has no background, so
   there is no container here to bound, only a decorative rule. His live ask outranks the floor
   either way, but the reason it does not even collide is worth stating.
3. **Moving the pills under the search bar breaks the sticky header.** The row and the search pill
   live in different components (Header.tsx vs HomeSearchPill.tsx) with their own sticky wrappers,
   so a naive reorder can produce two sticky bars fighting.

Out of scope this turn: the auth screens, the logo question, Stores vs Salons.

## Found while looking, not asked for, so not built

- **"Zuletzt angesehen" renders TWICE on the home page.** `RecentlyViewedTiles` (the 4-across tile
  grid) and `RecentlyViewed` (the SalonCard rail) both carry that heading, and both show once real
  view history exists. Visible right now on `/de`.
- **The emphasis budget fails two of its three floors on the first viewport, and one of them
  collides with the reference he keeps naming.** Measured after today's weight sweep: 4 distinct
  sizes (18/16/14/12, meets the <=4 ceiling), but THREE weights (600/500/400) against a <=2 floor,
  and 36% of visible text at weight >= 600 against a <=30% ceiling. The collision worth surfacing
  rather than silently resolving: `_design-system/references/airbnb--fonts-vs-ours.md` measured
  Airbnb using exactly 400/500/600, three weights. So our own <=2 floor and the reference he wants
  to look like cannot both be satisfied. His call, not a sweep to run quietly.
- The anchor is 18px, under FLOORS LAW 6's 28px display anchor. Not a violation: that floor exempts
  a screen whose focal is photographic, and the home feed is salon photography. Noted so the next
  audit does not "fix" it.
