<!-- exists-check: net-new. `_design-system/references/` has one existing Airbnb trips-adjacent
     file, `airbnb--checkout-and-confirmation.md`, which stops at the post-purchase receipt inside
     the CHECKOUT flow, not the persistent "Trips" tab a returning guest opens later. Neither
     `airbnb--profile-list.md` nor `airbnb--profile-1to1-diff.md` opens the Trips tab itself (they
     note its EXISTENCE as one of five bottom-tab items and stop there). This file is the first
     capture of the Trips tab's own anatomy. Read all three before writing this; type/colour/
     divider numbers already measured for shared chrome (bottom tab bar, card radius) are cited
     from `airbnb--profile-list.md` and `airbnb--listing-page.md` rather than re-measured. -->

# Airbnb, Trips tab (mobile, guest side)

REF: airbnb / ios / trips-tab / Mobbin only, login-gated surface

## Identity

- **Brand / platform / surface:** Airbnb, iOS app, the "Trips" tab (bottom nav, third of five).
- **Why Mobbin and not live Playwright:** `airbnb.com/trips` requires a signed-in session; this
  task's own instructions name this exact surface as one to source from Mobbin rather than by
  logging into a live account, so every value below is a Mobbin screen, not a rendered DOM.
- **Method:** Mobbin MCP screens, viewed directly, PLUS local PIL colour-sampling on the
  downloaded thumbnail images for the two states where an exact hex mattered (see "Measured,
  interaction colour" below). Mobbin serves a scaled preview (299x678px in every file sampled
  here), not the original device resolution, so absolute pt sizes for type/spacing are NOT
  claimed from these images; only colour (scale-invariant) and structural order/proportion are.
- **Date:** 2026-09-05.

## Philosophy

The Trips tab is organized by TIME, not by trip: everything upcoming renders as one or more large
photo cards, grouped by destination name as a plain text label, nearest trip first. A single
system-status banner (ID review, a pending charge, anything blocking the trip) sits ABOVE every
trip card when one exists, so an account-level blocker is never buried under content it affects.
Past trips are demoted to a completely different, text-forward list layout on their OWN page, with
year dividers, never mixed into the same scroll as upcoming trips. The one recurring interactive
color on this tab is the crimson-red primary CTA (Review / Request to book / Book a trip), the same
family used on Airbnb's checkout, confirming this repo's other Airbnb captures rather than
introducing a new rule.

## Measured, populated Trips tab (top to bottom)

1. Page header "Trips", bold, large, top-left; a small circular icon-button top-right (a list/
   filter glyph in most captures) (verified,
   [1b33adfa](https://mobbin.com/screens/1b33adfa-21ab-4e24-84e7-78dbd514e3ee)).
2. Conditional STATUS BANNER, full-width, bordered card, appears directly under the header only
   when something needs attention: a filled blue bell-icon circle + bold headline ("We're
   reviewing your ID") + a grey subline explaining the hold and a resolution ETA ("Your reservation
   is still pending until this is complete, we'll email you an update within one hour") (verified,
   same screen). Not present on captures with no pending issue (verified by absence,
   [8c6d6c12](https://mobbin.com/screens/8c6d6c12-6992-4c5e-9c31-e0d27cbc4257)).
3. Destination label, plain bold text, no card or background, acts as a section header for every
   trip card under it until the next label ("New York", "Brooklyn", "Miami Beach" seen across
   captures) (verified, multiple screens).
4. Trip card, one per trip, full width, white rounded card:
   - Photo fills the top portion of the card, corners rounded to match the card (an exact radius
     was not pixel-measured from these thumbnails; `airbnb--listing-page.md`'s cross-reference
     card radius of 20px is the closest measured Airbnb value in this repo for a comparable
     rounded photo card, cited as expect, not re-verified here).
   - A status/timing PILL sits on top of the photo, top-left corner: seen values are "Pending"
     (grey/neutral fill), "In 2 weeks", "In 3 months" (both a plain light pill, same neutral
     treatment regardless of urgency, i.e. the pill's COLOUR does not encode urgency) (verified,
     [d840bcfa](https://mobbin.com/screens/d840bcfa-ed41-4d3c-9196-d39b4e7d98ca),
     [1b33adfa](https://mobbin.com/screens/1b33adfa-21ab-4e24-84e7-78dbd514e3ee)).
   - Below the photo: bold title (the listing name or, for an Experience, the experience name,
     e.g. "Ride jet skis in Miami and Biscayne Bay"), then one grey subline with date + host name
     ("Jun 10 · 3:00 PM · Hosted by Selcuk") (verified, same screen).
   - Below the subline, a full-width secondary action pill sits INSIDE the card on some captures:
     "View listing" (grey/neutral, when nothing else is pending) or "What you'll do" (grey/neutral,
     for an Experience booking), always a single button, never two side by side (verified,
     [1b33adfa](https://mobbin.com/screens/1b33adfa-21ab-4e24-84e7-78dbd514e3ee) for "View listing",
     [d840bcfa](https://mobbin.com/screens/d840bcfa-ed41-4d3c-9196-d39b4e7d98ca) for "What you'll do").
5. A closer-to-checkin trip card grows a THIRD content block below the title/subline: the full
   street address as its own line + a "Get directions" button aligned to the right of that same
   line (two-column row, not stacked), then a date-badge + "Check in after 7:00 PM" row below that,
   then a horizontally-scrolling "Discover experiences for your trip" rail with two photo tiles
   (each with its own save-heart icon) (verified,
   [bd35553c](https://mobbin.com/screens/bd35553c-9732-4fa3-b7c8-50c5a00eee73)). This is tag:
   assume a state that only appears once a trip is imminent (days away, not months), inferred from
   this being the only capture with a real check-in time and address, not confirmed as a documented
   threshold.
6. A condensed list variant exists, with a SMALL square thumbnail replacing the big photo and no
   secondary button, seen when two upcoming trips are close together on one screen: "Miami Beach"
   + "New York" both rendered this way, thumbnail + title + one subline, no card border drawn
   (verified, [a12e7c67](https://mobbin.com/screens/a12e7c67-bf56-4ba3-af0f-102bfb2797e0)). Tag:
   assume this compact row is a DIFFERENT card density/variant of the same trip-card component
   rather than a distinct feature, since it carries the same fields (title, date, host) as the big
   card, just smaller.
7. When more trips exist than fit, a closing row links out: "Find past trips in your profile" as
   its own full-width grey pill row with a small suitcase emoji on its right (verified,
   [8c6d6c12](https://mobbin.com/screens/8c6d6c12-6992-4c5e-9c31-e0d27cbc4257)).
8. Bottom tab bar, all 5 tabs visible on every Trips capture: Explore / Wishlists / Trips (active,
   red icon + red label) / Messages / Profile, unread badges (small red dots) appear on Messages
   and Profile in most captures (verified, multiple screens; matches the bottom-tab-bar anatomy
   already fully measured in `airbnb--profile-1to1-diff.md`, not re-measured here).

## Measured, "Past trips" (separate page, reached from the Trips tab)

Back arrow + "Past trips" bold header, no photo cards at all on this page: instead a vertical list
of SMALL rows, each a square thumbnail (left) + destination name (bold) + a date range (grey,
below) on the right, rows visually separated by soft shadow/whitespace rather than a hairline.
Rows are grouped by year, and a year number ("2023", "2022") renders centred and small between
groups, acting as the only divider on the page (verified,
[b8886ccd](https://mobbin.com/screens/b8886ccd-04ea-415d-bf80-98e51cf13313)). This is a
structurally DIFFERENT layout from the upcoming-trip card (text-forward list vs. photo-forward
card), not a smaller version of the same component.

## Measured, empty states (both genuinely guest-side, not the host "reservations" tab)

- **No upcoming trips:** headline "Build the perfect trip" + subline "Explore homes, experiences,
  and services. When you book, your reservations will show up here." above a crimson-red filled
  pill CTA "Get started". The illustration is not a single icon but a fanned STACK of three
  rounded-rect skeleton cards (each showing a small real photo thumbnail on its left edge and a
  grey placeholder bar where a title would be), i.e. the empty-state graphic previews the SHAPE of
  the content that will eventually fill this screen rather than showing an unrelated icon
  (verified,
  [01f52e72](https://mobbin.com/screens/01f52e72-2105-4946-8936-93d60b15ba7f)).
- **No past trips:** a single illustrated object (a vintage travel suitcase with destination
  stickers), headline-less copy: "You'll find your past reservations here after you've taken your
  first trip on Airbnb." directly under the illustration, then the same crimson-red filled pill,
  labelled "Book a trip" here instead of "Get started" (verified,
  [c9c2f44d](https://mobbin.com/screens/c9c2f44d-1906-4857-bb94-1838ac1e1c8d)). Both empty states
  share the same CTA-button treatment (filled crimson pill) despite one using a card-stack graphic
  and the other a single object illustration, i.e. the icon style is NOT standardized across
  Airbnb's own empty states, only the CTA fill and the "explain then act" copy shape are.
- Two other screens surfaced by the same search ("Today"/"Upcoming" toggle pills + an open-book
  illustration + "You don't have any upcoming/any reservations") belong to the Airbnb HOST app's
  reservations tab (bottom nav reads Today/Calendar/Listings/Messages/Menu, not the five-tab guest
  bar), not the guest Trips tab. Named here only to rule them out, not used as evidence for this
  file (verified as host-side by the tab bar, not used further).

## Measured, interaction colour (PIL-sampled from the downloaded Mobbin thumbnails)

Primary CTA colour on Airbnb's booking-review chain, sampled directly (thumbnail is 299x678px,
colour values are scale-invariant even though absolute size is not confirmed):

| screen | button label | sampled RGB (left/centre/right of the button) | read |
|---|---|---|---|
| "Confirm and pay" (checkout step 1) | Review | `(232,31,78)` / `(233,138,159)` / off-target | a clear left-to-right gradient, deep red-pink fading to a lighter coral-pink, consistent with the "rausch gradient" already documented on the Reserve button in `airbnb--listing-page.md` (`rgb(228,28,92)` to `rgb(234,89,140)`), same family, independently sampled here |
| "Request to book" (checkout final step) | Request to book | `(234,30,78)` / `(218,52,92)` / `(247,44,87)` | stays in a tighter crimson-red band across the button width rather than a visibly graded fade; tag: assume near-flat fill, though thumbnail JPEG/WebP compression could also be muting a subtle gradient |
| "Add a payment method", PayPal selected | Connect to PayPal | `(12,51,134)` / `(2,44,123)` / `(12,51,136)` | a flat, solid dark blue, consistent with PayPal's own brand blue, not Airbnb's own palette; this button changes colour to match whichever payment method is selected (see `airbnb--profile-and-payments.md`) |

## Not measured

- Exact corner radius, shadow, and padding of the trip card, the destination-label type size, and
  every other spacing/type value on this tab. The only images available were Mobbin's scaled
  thumbnails (299x678px, not a confirmed device-point resolution), so a claimed pt value here would
  be a guess dressed as a measurement. Where a directly comparable value already exists elsewhere
  in this repo's Airbnb captures (card radius, hairline colour), it is cited as such above, tagged
  expect, not stated as freshly measured.
- Whether the "imminent trip" address+directions+check-in block (item 5) is gated by a specific
  time threshold (24h, 7 days, etc.) before check-in, or by some other signal. Only one example was
  captured.
- The exact icon/glyph used for the top-right button on the Trips header (a list icon in some
  captures); it was not resolved to a named Lucide-equivalent icon.

## Port map (Airbnb value -> Solen surface)

- Trips tab as a persistent, always-reachable destination -> Solen's closest existing surface is
  `/profile/bookings` (per `fresha--bookings-list.md`'s port map), reached through the Profile hub
  rather than a dedicated bottom-tab item; Solen has no bottom tab bar at all (a locked, dated
  removal, `_design-system/REMOVED.md`, cited already in `airbnb--profile-1to1-diff.md`), so
  porting "Trips as its own tab" is not available as a literal structural option here.
- The conditional status banner above all trip cards -> no direct Solen analog found in this pass;
  `PayConfirmStep.tsx`'s cancellation-policy banner (per `fresha--payment-step.md`) is the closest
  existing "banner above content" pattern in this codebase, though it serves a different moment
  (pre-booking, not post-booking status).
- The photo-forward upcoming card vs. text-forward past-trips list (two distinct layouts for the
  same underlying entity) -> directly relevant to FLOORS LAW 8 ("the same thing looks the same
  everywhere"): Airbnb itself does NOT follow that floor here, upcoming and past trips render
  through visibly different card anatomies. Not a contradiction to resolve; Solen's own floor
  governs Solen's components, not Airbnb's.
- Filled crimson CTA on both empty states -> matches Solen's own locked filled-ink CTA convention
  in spirit (fill, don't outline, the one commit action), though the exact HUE is Airbnb's brand
  colour, not portable under taste rule 3 (ink only). See Conflicts.

## Conflicts

- **CONFLICT [empty-state icon variety]:** Airbnb uses two unrelated illustration styles for its
  two Trips empty states (a card-stack skeleton preview vs. a single suitcase object), no single
  icon system. Solen's locked `EmptyState` anatomy (design contract "states" row) specifies ONE
  consistent icon source (`/icons/categories/` 3D icons or a ghost-preview) across all empty
  states. Airbnb's own inconsistency here is not evidence to relax Solen's consistency lock; if
  anything it is a counter-example, named so it is not silently copied.
- **CONFLICT [CTA colour]:** every primary CTA measured on this tab (Review, Request to book, Get
  started, Book a trip) is Airbnb's crimson/rausch brand colour, filled. Solen's taste rule 3 locks
  the one commit CTA to ink (`bg-s-ink`), with brand colour (`s-accent` blue) reserved for small
  clickable text/chips only, never a big CTA. This is the SAME conflict already logged in
  `airbnb--listing-page.md` for the Reserve button; recorded again here because it recurs on every
  CTA on this tab too, not a new finding, just wider evidence for an already-open owner decision.
