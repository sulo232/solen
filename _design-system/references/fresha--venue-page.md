# Fresha venue (salon) page

Exists-check: EXTENDS `public/_pixel-refs/fresha/pdp-bottom/SPEC.md` (already captures the BOTTOM
sections: Bewertungen/reviews, Anbieter-in-der-Nahe/nearby venues, the app-download CTA, opening
hours) and `public/_pixel-refs/fresha/staff-profile/SPEC.md` (the employee-profile sheet reached
FROM this page). Neither existing file captures the TOP of the page (hero gallery, header, services
grouping, team grid) at full anatomy with a Solen port map, which is this file's job. Not a
duplicate of `_design-system/references/airbnb--profile-1to1-diff.md` or similar Airbnb docs
(different brand, and Airbnb is this project's structural source-of-truth per CLAUDE.md, not
Fresha; this file exists specifically because the owner named Fresha as the base for booking-shaped
screens, a narrower carve-out than the general Airbnb rule).

## Identity

- Brand: Fresha. Platform: iOS app + web (desktop-width). Capture date: 2026-09-05.
- Sources, all via Mobbin search_screens (direct image-to-id pairing, high confidence):
  - Web, top of page (breadcrumb, H1, rating+reviews-count+status+address, gallery, Services
    heading + tabs, sidebar Book now card): https://mobbin.com/screens/71f05473-cf92-40bc-a6eb-e9ab35d459ee (verified)
  - Web, Services list scrolled into Team heading: https://mobbin.com/screens/a4ed4d89-766a-4cd7-8e34-92f56ad08a61 (verified)
  - Web, Team grid + Reviews heading: https://mobbin.com/screens/a51b0aa9-519a-497c-ab95-65d0b6478fd2 (verified)
  - Web, Reviews list + About heading + map: https://mobbin.com/screens/34a0e21c-18a6-4ce8-8221-17386da2f1d2 (verified)
  - Web, Opening times table + Additional info + Venues nearby carousel: https://mobbin.com/screens/6d462883-4824-4027-8180-e39771d5d28f (verified)
  - iOS, top of page (photo carousel with counter, H1, rating, address, open-status, "Featured"
    pill, Services heading + tabs): https://mobbin.com/screens/daa7dd6f-8d5c-4ebe-b82c-a8838d417d80 (verified)
  - iOS, Services list (row anatomy) + "136 services available" + sticky "Book now": https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9 (verified)
  - iOS, Team grid + Reviews heading: https://mobbin.com/screens/e88ff6f4-d9e3-437e-a531-eb1eac0f7f83 (verified)
  - iOS, map + address + Venues nearby carousel: https://mobbin.com/screens/b5191eb1-9235-4bff-8117-26efee919cff (verified)

## Philosophy

Fresha orders the page by DECISION SEQUENCE, not by trust-building: photos first (what does it look
like), Services immediately after (can I book what I want), Team third (who would do it), Reviews
fourth (should I trust them), About/hours/map last (logistics, read only if still undecided). A
sticky in-page tab bar (Photos / Services / Team / Reviews / About) lets a user JUMP the sequence
once they know what they want, so the linear order and the jump-menu coexist rather than compete.
"Book now" is never more than one scroll-height away: it lives in a sticky sidebar card on desktop
and a persistent bottom bar on mobile, both showing the SAME button copy at every scroll position.

## Measured (ordered element list, web, top to bottom)

1. Breadcrumb trail: Home > Beauty Salons > [city] > [neighborhood] > [venue name] (verified).
2. H1 venue name, bold, largest text on the page (verified).
3. Meta row directly under H1, single line: star rating (filled black stars) + "(review count)" in
   accent-blue/purple + a dot + open/closed status (orange when closed) + a dot + neighborhood, city
   + "Get directions" as a separate accent-colored link at the end of the row (verified).
4. Icon row top-right of the meta block: share icon + heart/favorite icon, both plain outline, no
   circle background (verified).
5. Gallery: one large photo left (roughly 60% width) + a 2x2-ish grid of four smaller photos right,
   the last small photo carrying a "See all images" overlay label (verified, web). iOS instead uses
   a single full-bleed swipeable photo carousel with a "1/10" counter pill bottom-right (verified,
   iOS).
6. "Services" H2, then a horizontal category-tab chip row (Featured / Head Spa / Make up / Eyebrow
   Microblading / ... ), first chip ink-filled/selected, rest outline (verified, web and iOS both).
7. Service rows: name (bold) top-left, duration + price stacked grey underneath, a "Book" button
   (outline pill, web; ink pill, iOS) on the right, hairline divider between rows, an optional green
   "Save X%" tag appears next to a bundled/discounted price (verified, web).
8. "See all" text link (web) / "N services available" plain text (iOS) closing the services block,
   directly followed by the sticky "Book now" bar reappearing at this scroll depth too (verified).
9. "Team" H2, then a horizontal row of circular avatar discs (pastel background + initial letter
   when no photo, real photo when available) + name (bold) + role (grey) underneath each, iOS shows
   a small yellow-star rating chip under an avatar that has reviews and a "See all" link top-right
   of the heading (verified).
10. "Reviews" H2, aggregate star row + "rating (count)" directly under it, then individual review
    cards: avatar-initial disc + reviewer first name + timestamp, a 5-star row, review text with a
    "Read more" truncation link (verified).
11. "About" H2 (web only in this capture; iOS instead calls this tab "About" too but I did not reach
    its body text this pass, tag: assume it mirrors web) + one paragraph describing the venue
    (verified, web).
12. Map: a static embedded map with a single pin, address text above it, "Get directions" link
    (verified, both platforms).
13. "Opening times" heading, one row per weekday, a colored dot (green = open that day) + hours
    range, today's row bolded (verified, web).
14. "Additional information" heading: short feature list, e.g. "Instant Confirmation", "Pay by app",
    each with a small checkmark or icon (verified, web).
15. "Venues nearby" H2, horizontal carousel of other venue cards (photo, name, rating+count, one
    category tag) (verified, both platforms).
16. "Treat yourself anytime, anywhere" H2 (web only): a segmented control ("Other businesses in
    [neighborhood]" / "Other businesses around [neighborhood]") above a plain multi-column list of
    SEO category links, no cards, no icons, just text links (verified, web).
17. Sidebar (desktop, sticky, present at every scroll position captured): venue name + rating,
    black "Book now" button, open/closed status + hours, full address + "Get directions" link
    (verified). Mobile equivalent: a persistent bottom bar that was NOT independently re-captured
    this pass but is already documented as present in `public/_pixel-refs/fresha/booking-services/00-venue.png`
    (tag: assume, existing local capture, not re-verified this session).

## Port map (Fresha element -> Solen file)

Solen's actual current top-to-bottom order, read directly from
`app/[locale]/_components/salon/SalonDetailV3.tsx` (463 lines): SalonBreadcrumb -> SalonStickyTabNav
-> SalonHero -> SalonHeader -> (SalonModeToggle / SalonWalkInPanel when in walk-in mode) ->
**SalonAbout** -> SalonServices -> SalonBundles -> SalonTeam -> SalonReviews -> SalonPortfolio ->
SalonBuy -> SalonLocation -> SalonOpeningTimes -> SalonAdditionalInfo -> SalonContact ->
SalonOtherLocations -> SalonRecentlyViewed -> SalonVenuesNearby, plus a persistent
`SalonMobileBookBar.tsx` and a `SalonSidebar.tsx`.

- Fresha gallery -> `SalonHero.tsx`.
- Fresha meta row (rating, status, address) -> `SalonHeader.tsx`.
- Fresha Services block (tabs + rows) -> `SalonServices.tsx` (grouping) + `SalonBundles.tsx`
  (Fresha's discounted/bundled row with the green "Save X%" tag maps to this file, not to
  SalonServices, per the project's own card-badge memory: SalonCard discount = pale-green -X% pill).
- Fresha Team row -> `SalonTeam.tsx` (a comment at line ~328 in SalonDetailV3.tsx already warns
  "rendering browse-profile SalonTeam here too would be a SECOND stylist section," so Solen is
  already deliberately avoiding a Fresha-style duplicate team block; read that comment before
  touching this section).
- Fresha Reviews -> `SalonReviews.tsx`, already translated from Fresha's own anatomy per
  `public/_pixel-refs/fresha/pdp-bottom/SPEC.md` ("SalonReviews -> Fresha anatomy: histogram
  dropped, blue count, avatar+name rows" - already done, do not redo).
  - Fresha's `SalonReviews` note added 2026-06-12: no histogram, count in accent color, avatar+name
    rows. THIS FILE'S REVIEWS SECTION MATCHES THAT ALREADY. No new work implied here.
- Fresha About paragraph -> `SalonAbout.tsx`.
- Fresha map + address -> `SalonLocation.tsx` (mapDesign "clean-white" per the code).
- Fresha Opening times table -> `SalonOpeningTimes.tsx`.
- Fresha Additional information checklist -> `SalonAdditionalInfo.tsx`.
- Fresha Venues nearby carousel -> `SalonVenuesNearby.tsx`, already translated per pdp-bottom/SPEC.md
  ("SalonVenuesNearby -> 46vw cards, sentence-case meta" - already done).
- Fresha sidebar Book now card -> `SalonSidebar.tsx` (desktop) + `SalonMobileBookBar.tsx` (mobile
  sticky bar, already the project's locked sticky-CTA implementation for this surface per
  hierarchy-density-06).
- Fresha's in-page jump tabs (Photos/Services/Team/Reviews/About) -> `SalonStickyTabNav.tsx`,
  already present and already occupies the same job.

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [About section position]: Fresha places About/map/hours LAST, after Reviews. Solen's
  SalonDetailV3.tsx deliberately moved SalonAbout to the TOP of the right column on 2026-08-15 (its
  own code comment at line ~358: "SalonAbout used to render HERE. Moved to the top of this column
  on 2026-08-15..."), i.e. directly after the header, well BEFORE Services. If the owner wants the
  page's placement to follow Fresha as the base, this is the single biggest structural reversal:
  either move About back down near Reviews (matching Fresha) or explicitly keep the 2026-08-15
  decision and treat Fresha's order as informing everything EXCEPT this one dated call. Owner call,
  since two dated project decisions (the 08-15 move and "Fresha is the base") now point opposite
  ways on this one section.
- CONFLICT [service-row "Save X%" tag color]: Fresha's discount tag reads plain green text next to
  the price. Solen's card-badge rule already specifies a pale-green PILL (not plain text) for this
  exact discount pattern (project memory `project_card_badges`: "SalonCard discount = pale-green
  -X% pill right slot"). This is not a new conflict needing a decision, it is an ALREADY-DECIDED
  divergence from Fresha, noted here so nobody "fixes" Solen's pill back toward Fresha's plain text
  while treating this doc as instruction to copy Fresha everywhere.
- No conflict on the sticky Book-now bar or the in-page jump tabs: both already exist in Solen with
  the same job Fresha gives them.
