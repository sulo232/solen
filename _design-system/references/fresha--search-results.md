# Fresha search results

Exists-check: net-new. No `fresha--search-results.md` or Fresha search capture exists anywhere
under `_design-system/references/` or `public/_pixel-refs/fresha/`. Distinct from
`_design-system/references/nearby-map--markers.md` (that file, if it covers Fresha at all, is about
map-marker treatment specifically; confirmed by listing the directory this pass, that file is not
in this repo's `references/` folder, only `nearby-map--markers.md` exists there and its content was
not read this pass since the title alone marks it as marker-styling, not full search-page anatomy).
This file is the first full search-results anatomy capture from Fresha in this project.

## Identity

- Brand: Fresha. Platform: web ONLY (Mobbin returned desktop-width, roughly 1440px-class layouts
  for every "Fresha search results" query this pass; no mobile-width Fresha search screen was
  returned or independently sought via a second targeted query, tag: assume a narrower Fresha
  layout stacks the list full-width with a map TOGGLE rather than the permanent split shown here,
  since that is the common pattern for this page shape, but this specific assumption is UNCHECKED).
- Capture date: 2026-09-05. Method: Mobbin MCP, search_screens, direct image-to-id pairing.
- Sources:
  - Filters modal open over the results list: https://mobbin.com/screens/c811632d-fe85-454a-883d-29c1c301fcac (verified)
  - Base list+map split, first result card visible: https://mobbin.com/screens/12a7bd21-e941-4249-a033-b61398e9b7f8 (verified)
  - Same list, scrolled to a different result card: https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937 (verified)
  - Hovering a result card shows its pin as a highlighted map popover: https://mobbin.com/screens/17fb8942-1a0e-4f07-b540-fd910816244c (verified)
  - Same hover state, second frame: https://mobbin.com/screens/c7fee04b-66ef-4a7d-8a66-d0c9667c04be (verified)

## Philosophy

Fresha's search results page is a permanent SPLIT on desktop, list left (roughly 35% width) and map
right (roughly 65%), so scanning cards and orienting geographically happen in the same glance with
no toggle needed at this width. Filtering is a single "Filters" button that opens ONE modal holding
every filter (sort, price, venue type) rather than a row of separate filter chips, keeping the top
bar to just the four search fields (treatment/location/date/time) plus that one Filters button. The
result card and its map pin are LINKED: hovering either highlights the other, so the map is treated
as a second index into the same list, not a decorative companion.

## Measured (ordered element list, top to bottom / left to right)

1. Top search bar, unchanged from the homepage: treatment field, location field, date field, time
   field, each a bordered pill segment in one continuous rounded bar (verified).
2. Below the search bar, a result-count line ("21 venues nearby") left-aligned, a single "Filters"
   button (icon + label, outline pill) right-aligned, both on their own row (verified).
3. Filters modal (opens centered over the page, not a side sheet): "Sort by" as three radio options
   (Recommended / Nearest / Top-rated), "Maximum price" as a single-handle slider with the current
   value shown as a chip, "Venue type" as three segmented buttons (Everyone / Female only / Male
   only, selected = solid PURPLE fill), "Clear all" (outline) + "Apply" (solid black) as the closing
   button row (verified).
4. List column (left): one result card per venue, each card = photo (full card width, roughly 4:3)
   -> venue name (bold) -> star rating + "(review count)" + neighborhood/city (grey, one line) ->
   then up to three service rows directly inside the SAME card: service name + duration (left),
   price or "from price" (right), and a row of quick-pick TIME CHIPS (10.00 / 10.15 / 10.30 / a
   "..." overflow) under each service row -> a "See more" text link closing the card (verified).
5. Map column (right): full-height embedded map, black numbered/rated pins (e.g. a pin showing
   "5.0") for each result, zoom controls bottom-right, a location/recenter control above them
   (verified).
6. Hover interaction: hovering a list card raises a popover pin-card on the map at that venue's pin
   (photo thumbnail + name + rating), and the pin itself gets a highlighted/enlarged state
   (verified, both hover-state screens).

## Port map (Fresha element -> Solen file)

- Whole page -> `app/[locale]/search/page.tsx` rendering
  `app/[locale]/_components/search/SearchTemplate.tsx` (2546 lines per CLAUDE.md's own breadcrumb
  investigation note, so this is a large, already-heavily-worked file: read before editing, don't
  rewrite wholesale).
- Top search bar -> reuse existing search constants/components per project memory
  `feedback_reuse_existing_search_data` (IMPORT existing search constants, never re-declare); the
  live `/{city}/{category}` route pattern already implies this bar exists there in some form.
- "Filters" button + modal -> `components-legacy/ui/FilterBar.tsx`.
- Date/time picker inside the top bar -> `app/[locale]/_components/primitives/DateTimePicker.tsx`
  (the one shared primitive, per V3-D445 lock: "ONE DateTimePicker primitive, dateLayout strip for
  booking, calendar for search, booking + search share it").
- Result card -> `app/[locale]/_components/search/SalonResultCard.tsx` (referenced by
  `SalonDetailV3.tsx`'s own import of `CATEGORY_LABEL` from that file) and/or
  `components-legacy/SalonCard.tsx` / `app/[locale]/_components/homepage/SalonCard.tsx` (there are
  multiple SalonCard implementations in this repo per the earlier `find` results; per FLOORS LAW 9
  "the same thing looks the same everywhere," whichever ONE canonical component search results uses
  must be the SAME component the home page and venue-nearby carousels use, not a fourth
  reimplementation).
- Map column + pins -> `app/[locale]/_components/homepage/NearbyMap.tsx` is the closest existing
  named map component found in this repo (found under homepage/, likely reusable or already the
  pattern search inherits from); not independently confirmed as the literal file search's map uses,
  since `SearchTemplate.tsx` was not read line-by-line this pass (out of scope for the timebox).
- Per-service quick-pick time chips inside a result card -> no direct Solen analog found this pass;
  flag as new anatomy if adopted (see Conflicts, this also collides with "no times in listings").

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [purple-filled selected filter]: Fresha's "Venue type" segmented control fills the
  selected option SOLID PURPLE. Solen's design contract (CLAUDE.md, `filter pill` row) is explicit
  and already dated: "FILTERS ARE NEUTRAL, NOT BLUE: pill / chip / sort segment / price slider /
  filter button, selected = `bg-s-bg-sunken` gray fill + `text-s-ink` + semibold, no blue" (owner
  2026-06-29, reconfirmed 2026-07-01). This is NOT an open question, it is already-decided law:
  Fresha's anatomy (one modal, radio sort, slider price, segmented venue-type) can be copied, but
  the SELECTED-STATE COLOR must stay the locked neutral grey fill, never Fresha's purple.
- CONFLICT [times in a listing card]: Fresha's result cards show literal clock times (10.00, 10.15,
  10.30) as quick-pick chips per service. Solen's own rule (project memory
  `feedback_no_times_in_listings`): "never a TIME on a card/listing; Heute/Morgen or TT.MM." Owner
  call: if this anatomy is ported, either the time-chip row is dropped from the card entirely, or
  the rule is explicitly re-opened for this one new element type (a same-day quick-book action is a
  different job than the DATE-label the existing rule was written against, but the letter of the
  rule still bans "a TIME on a card/listing" and this is exactly that).
- CONFLICT [service rows inside the discovery card]: Fresha's result card renders up to three full
  service rows (name, duration, price) inside the SAME card as the venue photo and rating. Solen's
  SalonCard is documented (project memory `project_card_badges`, and the density floor's "full info
  stack whenever data exists") as a venue-summary card, not one that also lists individual services
  inline; porting this would meaningfully densify SalonCard beyond its current job. Owner call:
  worth a mockup before deciding, not a small tweak.
- No independently-verified conflict on the list+map split itself (Solen already has map/list
  facilities per `NearbyMap.tsx`); the mobile-width toggle behavior is UNCHECKED (assume, stated
  above), so no conflict can be claimed there either way.
