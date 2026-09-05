# Fresha customer empty states (collected)

Exists-check: net-new. No `fresha--empty-states.md` exists under `_design-system/references/`.
Individual empty states appear as sub-sections of other capture files in this directory (e.g. the
zero-state inside `fresha--bookings-list.md`, written earlier in this same pass), but nothing
collects them side by side for a single anatomy comparison. This file exists to do that
comparison, and reuses the bookings zero-state already measured in `fresha--bookings-list.md`
rather than re-measuring it.

## Identity

- Brand: Fresha. Surface: iOS customer app (all four states below), plus one Fresha WEB screen
  used only as a cross-platform data point, not as a fifth customer state.
- Method: Mobbin MCP only. Every value below is a screen I looked at directly, tagged verified,
  expect, or assume. Two states the task asked me to look for, a customer-facing "no search
  results" and a "no reviews yet" on a venue page, were searched for across several phrasings on
  both iOS and web and were NOT found in Mobbin's Fresha catalog this pass. They are named here as
  missing rather than invented; see "Not found" below.
- Capture date: 2026-09-05.
- Sources: see each state's own citation below.

## Philosophy

Every Fresha customer empty state shares the same four-part recipe regardless of what is empty:
one small icon (never a full illustration, never a photo), a bold one-line headline naming the
missing thing plainly ("No appointments", "No favourites", "You have no active vouchers"), a grey
one-line subline explaining when it will fill in, and exactly one button pointed at the fastest way
to fill it. The icon's COLOUR is the only element that varies by content type (a purple-pink
calendar for appointments, a purple-pink heart for favourites, a flat yellow-and-ink ticket for
vouchers); the copy and button pattern otherwise repeat verbatim across all three.

## Measured

### 1. No appointments ("Appointments" tab)

https://mobbin.com/screens/cd4349f4-318d-405d-97b9-15c413db3dd3 (verified). Full detail already
captured in `fresha--bookings-list.md`; summary: purple-to-pink gradient calendar icon, headline
"No appointments", subline "Your upcoming and past appointments will appear when you book", one
OUTLINE pill CTA "Search salons", no card/border around the cluster, sits in the upper third of the
screen (not vertically centred in the full viewport) (verified).

### 2. No favourites ("Favourites" screen, reached from the Profile row)

https://mobbin.com/screens/771c047b-87c1-4818-93a3-b56cfb8dc1b2 (verified). Back arrow + "Favourites"
headline as page chrome, then a purple-to-pink gradient heart icon, headline "No favourites",
subline "Your favourites list is empty. Let's fill it up!", one OUTLINE pill CTA "Start searching".
Same vertical position (upper third) and same outline-button treatment as the appointments state
(verified).

### 3. No active vouchers ("My vouchers" screen, reached from the Profile row)

https://mobbin.com/screens/8fbb3134-a63a-4439-92ff-e2fd3889260f (verified). Back arrow + "My
vouchers" headline, then a flat yellow-and-black ticket icon (the one icon in this set that is NOT
a purple-pink gradient), headline "You have no active vouchers", subline "Find salons to buy a
voucher or book a service.", one FILLED INK CTA "Find salons near you". This is the one state in
the set whose button is filled dark, not outline, breaking the pattern the other two states share
(verified, tag: assume this is a deliberate exception for a state one step closer to spending
money, not an inconsistency, since it was the only one of four Fresha empty states sampled that
uses a filled button).

### 4. No appointments, Fresha WEB variant (cross-platform data point, not a fourth iOS state)

https://mobbin.com/screens/6193bca7-cacb-4b9a-991b-0a199a7fd999 (verified, content seen). Same
copy family ("No upcoming appointments" / "Your upcoming appointments will appear here when you
book." / "Search salons") but the anatomy changes shape for the wider layout: the empty state sits
INSIDE a bordered card in the left column of a two-pane page, not full-page-centred, and a
"Waitlist (1)" section with real content renders directly below it in the same column. Proves the
icon+headline+subline+CTA recipe is portable across platform, but the CONTAINER (full-page on
mobile vs. a boxed card inline with other content on web) is not fixed, it adapts to the
surrounding layout (verified for content, tag: assume for how general this web pattern is beyond
this one sample).

## Not found (searched, absent from this pass)

- **Customer-facing "no search results" state** (e.g. "no salons match your filters"). Multiple
  phrasings were tried on both iOS and web; the only "No results found" pattern Mobbin returned
  for Fresha was on the MERCHANT dashboard (Clients list, Sales/Appointments filter, Sales history,
  Timesheets), all using a magnifying-glass icon + "No results found" + "Try adjusting your search
  criteria" (verified those exist, e.g.
  https://mobbin.com/screens/bc998ffa-9e96-4deb-98db-c8f798a001ee), but none of those is the
  customer-facing search-empty-state this file was asked to find. Noted as a merchant-side data
  point only, not substituted for the missing customer state.
- **"No reviews yet" on a venue/salon page.** Searched directly, zero results returned. Not
  guessed at; if this state needs to be designed, it has no Fresha reference captured yet.

## Port map (Fresha element -> Solen file)

- All three genuine customer empty states -> Solen's own LOCKED `<EmptyState>` component
  (`components-legacy/ui/EmptyState.tsx`, confirmed imported by `BookingsList.tsx` per
  `fresha--bookings-list.md`'s port map) already exists as the single shared primitive for exactly
  this job, per the design contract's "states" row: "promise headline (never a bare status label) +
  gesture subline + a filled ink CTA to the filling action + a 3D category icon (`/icons/
  categories/`) or ghost-preview, never a grey Lucide disc."
- Fresha's icon treatment (a flat gradient illustration per content type) -> Solen's lock already
  specifies its OWN icon system (`/icons/categories/` 3D icons or a ghost-preview), so this is not
  a gap to fill from Fresha, the two systems solve the same slot differently by design. See
  Conflicts.
- Fresha's outline-button default (two of three states) -> Solen's lock specifies a FILLED INK CTA
  for every empty state, no outline variant named. See Conflicts.
- The `profile/vouchers`, `profile/favorites` routes already exist in Solen (confirmed by directory
  listing in `fresha--profile.md`'s research) as the pages that would need this empty state if they
  do not already use `<EmptyState>`; whether they currently do was not re-verified in this file
  specifically (it is verified for `BookingsList.tsx` only, per `fresha--bookings-list.md`).

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [icon system]: Fresha uses one purple-pink gradient illustration family across states
  (calendar, heart) plus one flat two-tone exception (the voucher ticket). Solen's locked
  `EmptyState` anatomy specifies its own icon source (3D category icons or a ghost-preview), not a
  gradient-illustration family. Adopting Fresha's specific icon style would mean introducing a new
  illustration system alongside (or instead of) the one already locked. Owner call, not a default
  swap; the CLAUDE.md design contract table says this row is already locked.
- CONFLICT [outline vs. filled CTA]: two of Fresha's three states use an outline button; Solen's
  lock requires a filled ink CTA on every empty state, with no stated exception. Fresha's own third
  state (vouchers) breaks its own pattern and goes filled too, which is arguably closer to Solen's
  rule than Fresha's own majority pattern is. Recommend keeping Solen's filled-CTA lock as is
  rather than importing Fresha's outline default; flagged as a conflict rather than silently
  resolved because the mockup-first law still binds any visible change here.
- No conflict on the headline+subline+one-CTA recipe itself: Solen's lock already specifies this
  exact three-part copy shape, so Fresha's SHAPE, as opposed to its icon style and button fill,
  needs no change to match.
