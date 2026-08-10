# Home polish, 2026-08-10 (owner, one dictated message after the category row came back)

He opened with *"it looks already a lot better"* and then listed the next round. Every box below is
one atomic ask, split on his "and"s.

## The divider under the hero

- [x] Remove the line. `FeedZone` (SectionHeader.tsx:342) carries `border-t border-s-border`, a 1px
      #E4E4E7 rule measured live at y=204.
- [x] Make it white instead of the divided panel. Same element also carries
      `shadow-[0_-12px_32px_rgba(26,18,9,0.04)]` and `rounded-t-[28px]`; measured backgrounds are
      already white on both sides, so those three classes ARE the "divided thing".

## The In der Nähe section

- [x] Drop the section title.
- [x] Drop the arrow. His words: *"I don't even want an arrow. I just want, like, a map. Like, just
      like a box, click on it, and it just opens the map."*
- [x] Keep it as one clickable box that opens the map. (Already true: `NearbyMap` is a single
      `<a href="/de/search?view=map">`, measured 343x156.)
- [x] Show which city it is. *"I also want it to be more like city and it shows which city it is."*
      The chip currently reads "20 Stores in der Nähe" with no city in it.

## The category pill row

- [x] Move it UNDERNEATH the search bar. Measured now: pill row top 12, search bar top 82, so the
      pills are ABOVE it.
- [x] Make the pills a bit smaller.
- [x] Make roughly 3.5 pills visible so it reads as scrollable. Measured now: scrollWidth 647 vs
      clientWidth 343, and pill 3 (Barber) ends at exactly 343, flush with the edge, so no partial
      pill shows and nothing signals a fourth.

## The see-all arrow

- [x] Move it to the RIGHT side of the row. Measured: 9 of them on the home page, all inline
      immediately after the title text.
- [x] Put it inside a small circle. *"a more, like, Airbnb type stuff, you know, more modern."*

## From his other sessions

- [x] The ICONS. *"On another session, I improved the icons, like, on top here. Look into that and
      apply it."* Research running.
- [x] The FONTS. *"I also improved the fonts on everything."* Research running.

## Shadows

- [x] Fix the shadow inconsistencies. Explicitly NOT the category pills: *"not on a category, it's
      already good. I mean these icon and other places because there's a lot of inconsistencies."*

## The hamburger , the ONE thing not done, and why

- [ ] Take it off. *"I don't think this hamburger menu should be here because it's really
      inconsistent. Don't really like it."*

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
