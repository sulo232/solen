# Fresha customer bookings list ("Appointments")

Exists-check: net-new. No `fresha--bookings-list.md` or equivalent exists under
`_design-system/references/`. Closest neighbours checked and ruled out as the wrong target:
`fresha--confirmation.md` (the post-booking receipt screen, a different surface reached once, not
the persistent list), `fresha--booking-flow.md` (the services/staff/time booking WIZARD, not the
list of a customer's own bookings afterward), `fresha--search-results.md` and `fresha--home.md`
(discovery surfaces). On the Solen side, `app/[locale]/profile/bookings/page.tsx` (42 lines,
renders `<BookingsList userId={user.id}>`) and `components-legacy/booking/BookingsList.tsx`
(270 lines) are the live implementation this file feeds; both were read in full before writing
this spec, not assumed from their names.

## Identity

- Brand: Fresha. Surface: iOS customer app, "Appointments" tab (bottom nav, calendar icon).
- Method: Mobbin MCP only, iOS platform. No live fresha.com capture attempted this pass. Every
  value below is a screen I looked at directly, tagged verified, expect, or assume.
- Capture date: 2026-09-05.
- Primary sources:
  - Populated list, Upcoming (1) + Past (1):
    https://mobbin.com/screens/419c463d-1dd9-48d5-bef0-9805363d2b56 (verified, viewed image)
  - Zero-state ("No appointments"):
    https://mobbin.com/screens/cd4349f4-318d-405d-97b9-15c413db3dd3 (verified, viewed image)
  - Web desktop variant of the same tab, split-view with a Waitlist group and a detail panel:
    https://mobbin.com/screens/6193bca7-cacb-4b9a-991b-0a199a7fd999 (verified, viewed image; used
    here only to confirm the empty-state COPY and the section-vs-full-page pattern differ by
    platform, not for the mobile anatomy itself)

## Philosophy

Fresha treats this screen as a status ledger, not a gallery: Upcoming gets the visual weight (a
photo-map card, larger touch targets) because it is actionable now; Past shrinks to a thumbnail
row because it is a record, not a decision. Every action lives ON the row it belongs to (get
directions on the upcoming card, book again on the past row) rather than behind a shared menu.
There is no tab switch between Upcoming and Past on iOS; both render in one scroll under their own
labelled section, so a returning customer sees "you have one thing coming up" before they see
anything else.

## Measured (ordered element list, iOS, top to bottom)

1. Page header: "Appointments", large bold serif-free sans, top-left; a circular avatar (or
   generic user-initial disc) top-right, no back arrow (this is a bottom-tab root, not a pushed
   page) (verified).
2. Section label "Upcoming" + a small filled dot/badge carrying the count (e.g. a purple circle
   with "1") immediately to its right, same row (verified).
3. Upcoming card, one per booking, full width, bordered/rounded container:
   - Top: a static map thumbnail (pin at the venue address) as the card's own photo area, i.e. the
     "photo" slot is a MAP not the venue photo (verified, distinct from the confirmation screen's
     venue-photo hero in `fresha--confirmation.md`, tag: assume this map-vs-photo choice is
     deliberate to orient a return trip, not an inconsistency).
   - Below the map: salon name (bold, largest text on the card), then date/time line ("Tue, Sep
     24, 2024 at 10:00 AM"), then a meta line "1 hr, 30 min · free · Jet Plasma" (duration, price,
     service name, dot-separated) (verified).
   - Two side-by-side actions at the card's bottom edge: a left OUTLINE pill button "Get
     directions" (text-only, takes most of the width) and a right square icon-button (calendar/
     add-to-calendar glyph, bordered, no label) (verified).
4. Section label "Past" + the same count-badge pattern, "1" (verified).
5. Past row, more compact than an Upcoming card, no border/card shell of its own, just a row:
   - Small square photo thumbnail, left (venue photo here, not a map) (verified).
   - Salon name (bold, truncates), date/time line below it, then a meta line "free · 1 item ·
     Cancell…" (price, item count, and a STATUS word appended to the same line, truncated in this
     capture so the exact status vocabulary beyond "Cancell…" is tag: assume "Cancelled") (verified
     for the visible parts, assume for the truncated word's full spelling).
   - A single right-aligned action button, "Book again" (verified). No cancel/reschedule action on
     a past row, those only exist on an Upcoming card via its own detail screen (tag: assume, this
     list screen shows no reschedule/cancel control directly on any row; `fresha--confirmation.md`
     documents "Manage appointment" as the entry point to reschedule/cancel elsewhere in the app).
6. Bottom tab bar: Home / Search / Appointments (calendar icon, active/filled purple), three tabs
   total, no Profile or Messages tab visible in this capture (verified for this screen; not a
   claim about the full tab bar elsewhere in the app).

## Measured, zero-state (iOS)

1. Same "Appointments" header + avatar chrome as the populated screen (verified).
2. Centred content block, roughly upper-third of the remaining space (not vertically centred in
   the full viewport): a small purple-to-pink gradient calendar/planner icon illustration
   (verified).
3. Headline "No appointments", bold, directly under the icon (verified).
4. Subline "Your upcoming and past appointments will appear when you book", grey, two lines,
   directly under the headline (verified).
5. One CTA, "Search salons", an outline pill button (not filled ink), directly under the subline
   (verified).
6. No card/border around this cluster; it sits on plain white background, same page chrome and
   bottom tab bar as the populated state (verified).

## Measured, web desktop variant (context only, not the mobile anatomy)

Two-pane layout: left column keeps "Appointments" > "Upcoming" as its own bordered, boxed
zero-state (icon + "No upcoming appointments" + subline + "Search salons" button, all INSIDE a
card, not full-page) sitting above a separate "Waitlist (1)" section with its own card row; right
column shows the detail panel for whichever row is selected (photo hero, status pill "Awaiting
availability", "You're on the waitlist" headline, action rows, "Preferred dates", "Services")
(verified, content seen at https://mobbin.com/screens/6193bca7-cacb-4b9a-991b-0a199a7fd999). Noted
because it proves Fresha's own empty-state PATTERN is platform-relative (full-page centred on
mobile, boxed-and-inline on a multi-column web layout), not a single fixed anatomy to copy
literally onto a Solen desktop breakpoint (tag: assume, single sample).

## Port map (Fresha element -> Solen file)

- Whole screen -> `app/[locale]/profile/bookings/page.tsx` (auth-guarded server component) renders
  `<BookingsList userId={user.id}>` from `components-legacy/booking/BookingsList.tsx` (270 lines).
- Fresha's single continuous scroll with "Upcoming"/"Past" section labels -> Solen's
  `BookingsList.tsx` instead uses a THREE-WAY TAB SWITCH (`type BookingTab = 'upcoming' | 'past' |
  'cancelled'`, state at line 13/22, tab buttons at lines 144-172) that matches this repo's own
  locked CONTENT TABS pattern (CLAUDE.md design contract: "title + 2px ink underline, active = 600
  ink + underline"). This is a real structural difference from Fresha (tabs vs. stacked sections,
  and a third "Cancelled" tab Fresha does not surface as its own top-level group on this screen).
  See Conflicts.
- Fresha's map-thumbnail on the Upcoming card -> not currently present; Solen's booking row
  components (per `fresha--confirmation.md`'s own port map) already carry `salonCoverUrl`, a real
  venue photo, not a map. Porting Fresha's map-instead-of-photo choice is a genuinely NEW idea, not
  something to silently swap in.
- Fresha's per-row "Get directions" + calendar icon-button pair -> `BookingsList.tsx` has no
  directions/calendar affordance on a row today; its own actions are `handleCancel` (opens
  `CancelBookingSheet`, imported line 7) and `handleRebook` (calls `/api/bookings/express-rebook`
  then `/express-rebook/confirm`, lines 99-132), i.e. Solen's row already does MORE (a real
  express-rebook flow) than Fresha's simple "Book again" link-out.
- Fresha's zero-state anatomy (icon + headline + subline + one outline CTA, no card) -> `BookingsList.tsx`
  imports `EmptyState` from `components-legacy/ui/EmptyState.tsx` (line 10), which is this repo's
  own LOCKED empty-state component (CLAUDE.md design contract "states" row: promise headline +
  gesture subline + filled ink CTA + a 3D category icon or ghost-preview, on the sunken tray).
  Fresha's version uses an OUTLINE button on plain white; Solen's lock requires a FILLED ink CTA on
  the sunken tray. This is a direct anatomy difference, not a gap to close by copying Fresha's
  version. See Conflicts.

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [tabs vs. stacked sections]: Fresha renders Upcoming and Past as two labelled sections
  in one scroll, with a small count badge next to each label. Solen's `BookingsList.tsx` already
  uses a locked CONTENT TABS control (Upcoming / Past / Cancelled) per the design contract. Since
  Fresha structure is the source of truth per the 2026-09-05 owner rule, adopting stacked sections
  instead of tabs is a real structural change, not a cosmetic one, and needs a mockup + his yes
  before touching the real tab switch, not a silent replacement.
- CONFLICT [empty-state CTA fill]: Fresha's "Search salons" zero-state button is a neutral OUTLINE
  pill on plain white. Solen's LOCKED `EmptyState` component (design contract "states" row)
  specifies a FILLED INK CTA on the sunken tray, not an outline button on white. Owner call: keep
  Solen's existing filled-ink recipe (already shipped and locked), or adopt Fresha's outline
  treatment specifically for this screen.
- CONFLICT [map vs. photo on the primary card]: Fresha's Upcoming card leads with a static map,
  not the venue photo. Solen's `SalonCard`/booking-row grammar (per `fresha--confirmation.md`'s own
  port map and the FLOORS LAW imagery floor) leads with real venue photography as the largest
  element. Porting a map-first card here would need to be reconciled against the imagery floor,
  which requires the photo to be the card's largest element on customer screens; a map is not
  photography. Owner call, not a default swap.
- No conflict on the row-action set: Solen's existing cancel/rebook actions
  (`CancelBookingSheet`, `/api/bookings/express-rebook`) already exceed what Fresha's simple
  "Book again" link does, so nothing needs to be removed to match Fresha here, only the surrounding
  card anatomy (map, section-vs-tabs) is in question.
