# Home polish, 2026-08-10 (owner, one dictated message after the category row came back)

He opened with *"it looks already a lot better"* and then listed the next round. Every box below is
one atomic ask, split on his "and"s.

## The divider under the hero

- [ ] Remove the line. `FeedZone` (SectionHeader.tsx:342) carries `border-t border-s-border`, a 1px
      #E4E4E7 rule measured live at y=204.
- [ ] Make it white instead of the divided panel. Same element also carries
      `shadow-[0_-12px_32px_rgba(26,18,9,0.04)]` and `rounded-t-[28px]`; measured backgrounds are
      already white on both sides, so those three classes ARE the "divided thing".

## The In der Nähe section

- [ ] Drop the section title.
- [ ] Drop the arrow. His words: *"I don't even want an arrow. I just want, like, a map. Like, just
      like a box, click on it, and it just opens the map."*
- [ ] Keep it as one clickable box that opens the map. (Already true: `NearbyMap` is a single
      `<a href="/de/search?view=map">`, measured 343x156.)
- [ ] Show which city it is. *"I also want it to be more like city and it shows which city it is."*
      The chip currently reads "20 Stores in der Nähe" with no city in it.

## The category pill row

- [ ] Move it UNDERNEATH the search bar. Measured now: pill row top 12, search bar top 82, so the
      pills are ABOVE it.
- [ ] Make the pills a bit smaller.
- [ ] Make roughly 3.5 pills visible so it reads as scrollable. Measured now: scrollWidth 647 vs
      clientWidth 343, and pill 3 (Barber) ends at exactly 343, flush with the edge, so no partial
      pill shows and nothing signals a fourth.

## The see-all arrow

- [ ] Move it to the RIGHT side of the row. Measured: 9 of them on the home page, all inline
      immediately after the title text.
- [ ] Put it inside a small circle. *"a more, like, Airbnb type stuff, you know, more modern."*

## From his other sessions

- [ ] The ICONS. *"On another session, I improved the icons, like, on top here. Look into that and
      apply it."* Research running.
- [ ] The FONTS. *"I also improved the fonts on everything."* Research running.

## Shadows

- [ ] Fix the shadow inconsistencies. Explicitly NOT the category pills: *"not on a category, it's
      already good. I mean these icon and other places because there's a lot of inconsistencies."*

## The hamburger

- [ ] Take it off. *"I don't think this hamburger menu should be here because it's really
      inconsistent. Don't really like it."*

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
