# Fresha home (mobile web)

Exists-check: EXTENDS `public/_pixel-refs/fresha/homepage-hero/SPEC.md` (2026-07-17 capture, already
measures the hero fold at 390x844 with getBoundingClientRect and already has an owner-facing TLDR
and applied-to-Solen probes at `public/_mockups/homepage-rhythm/hero.html`). That file did the hero
in full; it explicitly stops at "the following section's headline crosses at 98.1 percent" and does
not name or capture what comes after. This file adds the search-field SHAPE (treatment/location/
date/time segments and their dropdown behavior) and the ordered SECTION LIST below the fold, which
the existing capture does not cover, and defers entirely to the existing file for hero measurements
rather than re-deriving them.

## Identity

- Brand: Fresha. Platform: web. Mobbin returned desktop-width (roughly 1440px-class) captures for
  every "Fresha home page" query this pass, same limitation noted in `fresha--search-results.md`;
  the existing `homepage-hero/SPEC.md` already has the true 390px mobile-web measurements, so this
  file's NEW content (search field states, category dropdown, section order) is desktop-sourced and
  tagged assume for whether it holds unchanged at 390px, expect for the general shape carrying over
  since Fresha's hero itself is confirmed (by the existing file) to be responsive, not a separate
  mobile design.
- Capture date: 2026-09-05. Method: Mobbin MCP, search_screens, direct image-to-id pairing.
- Sources:
  - Default hero, search field default state: https://mobbin.com/screens/d1ef7c5f-0de3-485c-bed1-d5a9253f5a24 (verified)
  - Treatment field focused, category dropdown open (Top categories: Hair & styling, Nails,
    Eyebrows & eyelashes, Massage, Barbering, Hair removal): https://mobbin.com/screens/0b68f8e9-3c79-4302-83c6-990eefc611d7 (verified)
  - Search field collapsed/idle, no dropdown: https://mobbin.com/screens/498008f7-fde7-4581-b70c-c8b5ab1d6904 (verified)
  - Time field focused, time-of-day dropdown (Any time / Morning / Afternoon / Evening, selected
    solid purple, plus From/To hour selects): https://mobbin.com/screens/60b09119-52d3-418c-bd64-f73e16b56c4a (verified)
  - Location field focused, place-autocomplete dropdown: https://mobbin.com/screens/07f1acb1-7f36-499f-8411-8c9a2f31bb3d (verified)
  - Date field focused, month calendar dropdown (Any date / Today / Tomorrow quick picks above a
    full month grid): https://mobbin.com/screens/bbed93f8-7e33-4c5f-9878-54978f24d4cf (verified)

## Philosophy

Every one of the four search fields (treatment, location, date, time) opens the SAME dropdown
shape directly below itself: quick-pick chips or a short curated list at the top, a fuller picker
(calendar grid, category list) below that. Nothing navigates away from the homepage to filter; the
whole query gets built in place before one "Search" tap. The category dropdown doubles as
onboarding: a user with no idea what to type sees "Top categories" the instant they focus the field,
so the empty state of the search bar is itself a menu, not a blank prompt.

## Measured (ordered element list, hero: see existing SPEC.md for full 390px measurements; summary only)

1. Nav: "fresha" wordmark left, "For business" + account avatar/chevron right (verified, matches
   existing SPEC.md's nav row).
2. H1 "Book local beauty and wellness services" (verified, existing SPEC.md already measured this
   at 390px: 40px/44 line-height/700 weight, 2 lines).
3. Search bar: one continuous rounded pill container, divided into four un-bordered segments
   (Treatment | Location | Date | Time), a solid black circular-ended "Search" button closing the
   bar on the right, each segment a plain icon + placeholder/value text with no visible separators
   between segments beyond whitespace (verified, all four dropdown captures share this same bar).
4. Live counter text directly under the bar, e.g. "320,926 appointments booked today" (verified,
   matches existing SPEC.md).
5. "Get the app" pill button, centered, QR/app-store glyph inline (verified, matches existing
   SPEC.md).
6. Next section heading "Recently viewed" begins to appear at the very bottom edge of the captures
   (verified, partial text visible in two of the six screens); its content was not captured this
   pass (tag: not captured, see below).

## Measured (search-field dropdown anatomy, new this pass)

- Treatment field dropdown: "Top categories" label, then a plain vertical list of six categories,
  each row = a small icon in a light-grey square (no color, no photo) + category name, no chips, no
  grid, no images (verified).
- Location field dropdown: a plain vertical list of place suggestions, each row = a pin icon +
  place name (bold) + a second line of disambiguating detail (address/region), no map preview
  inline (verified).
- Date field dropdown: three quick-pick pills across the top (Any date / Today / Tomorrow, "Any
  date" selected = solid purple fill) directly above a standard single-month calendar grid with
  month-name + arrow navigation, today's date outlined, no range selection visible (verified).
- Time field dropdown: four quick-pick pills (Any time / Morning / Afternoon / Evening, selected =
  solid purple fill) above two side-by-side "From" / "To" hour dropdowns that stay greyed out until
  a specific pill is chosen (verified).
- Every dropdown is a plain white card, sits directly under its own field only (not the full bar
  width), drop-shadow, no visible border, closes on an outside click (assume for the close
  behavior, not directly observed, standard pattern inferred from the screenshots' framing).

## What was not captured this pass

The section-by-section list BELOW "Recently viewed" (whatever Fresha calls its main feed: likely a
"Recommended," "Popular near you," or category-rail sequence) was not reached. Every "Fresha home
page" Mobbin query this session returned only hero-area and search-dropdown variants; none of the
five flow/screen searches surfaced a scrolled full-page home capture. A second, more targeted Mobbin
query (e.g. platform ios, or a query naming "recommended salons home feed") would likely surface it
but was not attempted given the time budget and this surface's priority-5 (lowest) ranking in the
task brief.

## Port map (Fresha element -> Solen file)

- Whole page -> `app/[locale]/page.tsx`.
- Search bar -> `app/[locale]/_components/homepage/SearchBar.tsx` / `HomeSearchPill.tsx`; per
  project memory `project_search_book_points` and `feedback_search_expand_gesture_linked`, Solen's
  search-morph expand is already gesture-linked rather than a binary focus threshold, so Fresha's
  "focus opens a dropdown directly under that one field" anatomy is close to, but not identical to,
  Solen's existing morph behavior; treat this as anatomy reference for the DROPDOWN CONTENT
  (category list, date quick-picks), not a mandate to change the existing expand mechanic.
- Category dropdown list -> `app/[locale]/_components/homepage/searchCategories.ts` (data) feeding
  whatever renders `MobileCategoriesRow.tsx` / `CategoryTabs.tsx` today.
- Date/time dropdown -> the same shared `DateTimePicker.tsx` primitive named in
  `fresha--booking-flow.md` and `fresha--search-results.md` (V3-D445 lock: one primitive across
  booking + search, and by extension the home search entry point into search).
- Hero H1 + live counter + "Get the app" pill -> `Hero.tsx` / `HeroDuo.tsx` / `HeroHeadline.tsx` /
  `HeroSpotlight.tsx` (four candidate files exist in `app/[locale]/_components/homepage/`; which one
  is currently live was not confirmed this pass, out of scope for this timebox).
- "Recently viewed" -> `RecentlyViewed.tsx` / `RecentlyViewedTiles.tsx`.

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [gradient hero background]: every Fresha hero capture sits on a saturated pink-to-violet
  gradient wash, no photography anywhere in the hero band. Solen's design contract targets roughly
  80% neutral surface + 17% ink with blue reserved for small clickable accents (taste rule 3), and
  the FLOORS LAW imagery-presence floor calls for real salon photography, not decoration, in this
  exact zone (FLOORS LAW item 2: "no other company has just image hard coded... SHOW OFF THE STORES
  THAT WE HAVE"). A full-bleed decorative gradient is arguably a milder version of the same banned
  pattern (a colored surface standing in for real content). This exact tension is ALREADY being
  worked through in `public/_mockups/homepage-rhythm/hero.html` (variants a/d/e/f per the existing
  homepage-hero SPEC.md) with an owner pick still pending; this file does not reopen that, it only
  flags that the gradient itself, not just the card's vertical position, is a second axis of the
  same reference that has not yet been explicitly decided.
- CONFLICT [purple-filled quick-pick pills]: the date/time dropdowns' selected pills (Any date, Any
  time, Morning, etc.) fill solid purple. Same locked rule as `fresha--search-results.md`'s filter
  conflict: Solen's filter/chip selected state is `bg-s-bg-sunken` neutral grey, never a brand-color
  fill (CLAUDE.md design contract, `filter pill` row, owner 2026-06-29). Not an open question,
  already-decided law: copy the dropdown STRUCTURE, not the selected-state color.
- No conflict on the live counter and "Get the app" pill: the existing homepage-hero/SPEC.md already
  ruled the live counter out under the no-fabrication rule (Solen has no comparable live number to
  show) and that finding stands, restated here only for completeness, not re-litigated.
