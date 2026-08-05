# HOME + CLOSE FIXES (owner dictation 2026-08-05, with annotated screenshots)

Screens: `/Users/sulo/.claude/uploads/1c4aafb4-f426-493f-b8e6-885ee10cdf1b/` (4 shots, one with a red
circle around the divider under the search bar).

- [x] A1. The search overlay CLOSE is still weird. The lingering box is smaller but NOT gone.
      DONE, and it reaches ZERO rather than shrinking again. Full write-up + every number:
      `_plans/SEARCH_MORPH.md`, section "J2". SearchOverlay.tsx `SCRIM_KNEE` + `morphIn` +
      `scrimOpacity`. Measured on real CDP compositor frames at BOTH 375x812 and 402x874:
      the largest white surface sticking out past the resting bar, in the window where the page
      is already mostly legible (scrim < 0.30), goes 25px -> **0.0px** at 375x812 and
      29px -> **0.0px** at 402x874, and the count of such frames goes 7 -> **0** at both.
      The last oversized frame now precedes the first sharp frame by 142ms (375) / 166ms (402);
      before, it TRAILED it by 8ms (375) and the 402 gap was 18ms with 29px still on screen.
- [x] A2. Remove the dividing line under the search bar on the home page (his red circle).
      DONE. What drew it: `border-b border-s-border` on the sticky search wrapper,
      `app/[locale]/page.tsx:235` (now :247). Not a shadow, not a hairline element: a 1px solid
      s-border BORDER on the full-bleed wrapper itself. Measured live at 375x812 and 402x874:
      border-bottom `1px solid rgb(228,228,231)` -> `0px`, wrapper height 79 -> 78, its bottom edge
      y=157 -> y=156, and the count of full-viewport-width horizontal edges in the top 400px goes
      2 -> 1 (the one left is the pill's own rounded border, 343/370px wide, which stays).
      What the screen KEEPS as pinned-chrome boundary: measured at scrollY=600, the pill still
      carries `1px solid s-border` + `rgba(0,0,0,0.07) 0 2px 8px` at 9999px radius, and the feed
      scrolls under it (elementFromPoint just below the bar = the map canvas).
- [ ] A3. MOCKUPS FIRST, he asked to SEE options ("can you show me different mockups"). Fix the fonts on the home page. He says he never approved them and they are nothing like
      Airbnb's rounded, welcoming type. CONFLICT TO SURFACE, NOT SILENTLY RESOLVE: the design contract
      locks Inter Tight (display) + Inter (body) and bans Geist. Airbnb's own face is Cereal, which we
      do not license. So this needs either a named alternative or an explicit unlock from him.
- [x] A4. "In der Nähe": remove the store cards, leave JUST the map. Owner overruled my objection
      that the bookable tap-through disappears with them, verbatim 2026-08-05: "I want to actually
      remove the in your near, make it just a map, so people just gonna click on the map and open
      it". So the MAP ITSELF must be the tap target and open the map view.
      DONE. `Nearby.tsx` (the `ScrollRow` + `SalonCard` block that was lines 119-137) now renders
      title + `NearbyMap` and nothing else. The map ALREADY was the tap target and did not need
      wiring: `NearbyMap.tsx:175-188` renders the whole tile as one `<a href>` to
      `/{locale}/search?view=map`, measured unchanged at 343x156 (375) and 370x156 (402).
      Measured, both viewports: cards 15 -> **0**, the card row (249.6px tall at 375 / 264px at
      402) is gone, section height 464.1 -> **210.5** at 375 and 478.5 -> **210.5** at 402.
      Map markers **15 total / 13 visible** after (the 2 hidden are NearbyMap's own de-collide),
      i.e. every salon that had a card still has a marker: the map's completeness gate is the same
      name/slug/category check the card rail used, kept verbatim so the marker set could not move.
      Went WITH the cards because they were its only consumer (leaving it = a silent no-op): the
      V3-D348 `useCustomerPrefs` fetch + `sortByCategoryPicks` bend (its only remaining output was
      the ORDER of the map array, and NearbyMap re-sorts that itself by review count while its
      centre is a plain mean) and the unused `prefsOverride` seam.
      ONE unasked-for side effect, found by measuring and then fixed: dropping the now-dead
      `scrollRef` (no row left to scroll; keeping it would ship 2 desktop scroll buttons that
      scroll nothing) pushed SectionTitle into its text-link branch, so at 402 the header rendered
      the chevron AND a visible "Alle in deiner Nähe" link to the same href, where 8 of 9 rails
      show the chevron alone. Fixed with an additive `linkPlacement="inline"` prop on SectionTitle
      (default "auto" keeps all seven other callers byte-identical, verified: "Beliebte Looks"
      keeps its text link, "Top auf Solen" keeps its 2 desktop scroll circles). Header now renders
      exactly as before the cards were removed, and desktop 1440 shows no dead scroll arrows.
- [x] A5. DONE. `NearbyMap.tsx` badge now sources the shared `FROST_GLASS` util
      (`lib/frost-glass.ts`) instead of its own inline recipe: the dictated values ARE that
      util verbatim, and it is what `HeartButton.tsx` renders, so the badge and the heart are
      now the same object rather than two copies that can drift. Measured on the live badge,
      before -> after: `backdrop-filter` blur(12px) -> **blur(4px)**; border `0px` ->
      **1px solid rgba(255,255,255,0.6)**; box-shadow `rgba(0,0,0,0.12) 0 2px 10px` ->
      **rgba(0,0,0,0.10) 0 1px 3px + rgba(255,255,255,0.4) 0 1px 0 inset**; background
      rgba(255,255,255,0.8) unchanged (it already matched). Radius 9999px, font 12.5px/600,
      padding 6px 12px all unchanged. Box grows 173.41x30.75 -> 175.41x32.75, which is just
      the new 1px border on each side. Identical at 375x812 and 402x874.
      Original ask: the "20 Stores in der Nähe" badge becomes liquid glass, matching the heart
      overlay's treatment (measured from the live heart: `rgba(255,255,255,0.80)`,
      `backdrop-filter: blur(4px)`, `1px solid rgba(255,255,255,0.6)`, `0 1px 3px rgba(0,0,0,0.10)`
      plus an inset white top edge).
- [x] A6. Remove the "Bald frei" section.
      DONE. It was `AvailableThisWeek.tsx` (title = `TITLES.soon` from `CategoryBrowseRails.tsx`),
      mounted only in `app/[locale]/page.tsx` (one call site, grepped). UNMOUNTED there, and its
      server fetch `getAvailableThisWeekSalonIds` left the page's `Promise.all` and its ids left
      the `salonCardData` batch, so no `salons_with_slot_in_hours` RPC runs for it any more.
      Measured, both viewports: section present -> **absent**, 9 cards -> 0, section height
      304.1px (375) / 318.5px (402) reclaimed; page height 4883 -> **4310** at 375 and
      5018 -> **4417** at 402 (A4 + A6 together). The feed now reads Nearby -> Top Coiffeur.
      Other usages: none. The category routes keep their OWN 7-day rails
      (`CategoryMobileRails.tsx` / `CategoryBrowseRails.tsx`, same `TITLES.soon` copy) and were
      not touched. Component file + data function + doc kept on disk for revert, same convention
      as V3-D104 / V3-D106 / V3-D150; registry row and `components/AvailableThisWeek.md` both now
      say UNMOUNTED so nobody re-mounts it by reading the docs.
- [x] A7. DONE. The right comparison is the star's PAINTED ink vs the numeral's CAP height, not
      box vs font-size: the lucide star only paints 0.7947 of its box (measured `getBBox` on the
      live 24x24 viewBox, y 2.000 -> 21.072), so an 11px star was 8.74px of actual ink against a
      9.46px cap = **0.924**, i.e. measurably smaller. He was right.
      The target came from this system, not from taste: the search card and the PDP header both
      already ship 13px star / 14px numeral = **1.014**, two independent surfaces agreeing on
      ~1.01. At a 13px numeral that needs a **12px** box (ink 9.54 / cap 9.46 = **1.008**). 13px
      would have overshot to 1.092 and made the home star read LARGER against its number than the
      search card's does.
      Implemented as `COMPACT_STAR_PX` in `RatingStars.tsx`, applied to **compact mode only**
      (the one mode with a numeral to match). `five` and `interactive` stars stand alone and keep
      `STAR_PX`, so review star rows did not move. Colour untouched (`fill-s-star` #FFC32B).
      Home is now internally consistent: all five card rails at 1.008, and Walk-in's hand-rolled
      11px star was already at 1.001 against its 12px numeral, so it correctly did not move.
      NOT moved, deliberately, and worth a decision: the PDP sidebar (`lg`, 16px star vs 20px/700
      numeral) measures **0.874**, a worse mismatch than the one he flagged. Out of scope for a
      home-page ask; say the word and it goes to 20px (ink 15.89 / cap 14.55 = 1.09) or 19px (1.04).

- [ ] A8. Build font mockups for A3: the same real home screen rendered in 3 or more type directions,
      behind one switcher, so he picks by looking. Every direction must name a face we can actually
      license. Airbnb's own Cereal is theirs, so it is a target feel and not an option.
