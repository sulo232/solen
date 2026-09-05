<!-- exists-check: net-new. No file in `_design-system/references/` collects Airbnb's empty states
     side by side. The two Trips-tab empty states are already fully measured in `airbnb--trips.md`
     (written earlier in this same pass); this file CITES them rather than re-measuring, and adds
     the two states that file does not cover: Wishlists and Messages. `airbnb--icons-vs-ours.md`
     documents the open-heart wishlist icon used elsewhere in the app but not the empty Wishlists
     TAB itself, so it is a sibling reference, not a duplicate. -->

# Airbnb, empty states (mobile, collected)

REF: airbnb / ios / empty-states / Mobbin only, all four surfaces are login-gated

## Identity

- **Brand / platform / surface:** Airbnb, iOS app. Four states: Trips (no upcoming / no past,
  cited from `airbnb--trips.md`), Wishlists (default zero-custom-lists state), Messages (no
  messages / no archived messages).
- **Method:** Mobbin MCP screens, viewed directly, plus local PIL colour-sampling on the
  downloaded thumbnails (299x678px). As in the other two files from this pass, absolute pt sizes
  are not claimed from these thumbnails; colour (scale-invariant) and structural facts are.
- **Date:** 2026-09-05.

## Philosophy

Airbnb does not use one illustration system across its own empty states: a fanned card-stack for
"no trips," a single object illustration for "no past trips," a plain ink line-icon for "no
messages," and, for Wishlists, no genuine empty state is shown at all (see below), instead a
system-generated "Recently viewed" list fills the slot. What IS consistent across every state that
does render is the COPY shape (name what's missing, explain when it fills, one action) and the
CTA's fill (a filled pill, never bare text, though the colour of that pill varies: crimson on
Trips, a plain outline on Messages). Airbnb treats emptiness as a per-feature design decision, not
a single reusable component the way this repo's own `EmptyState` primitive is.

## Measured, Trips tab (cited from `airbnb--trips.md`, not re-measured)

- **No upcoming trips:** fanned three-card skeleton-preview illustration (small real photo left-
  edge + grey placeholder title bar per card) + headline "Build the perfect trip" + subline
  "Explore homes, experiences, and services. When you book, your reservations will show up here."
  + filled crimson-red pill "Get started" (verified,
  [01f52e72](https://mobbin.com/screens/01f52e72-2105-4946-8936-93d60b15ba7f)).
- **No past trips:** single illustrated vintage suitcase-with-stickers object + copy-only line
  (no separate bold headline) "You'll find your past reservations here after you've taken your
  first trip on Airbnb." + the same filled crimson-red pill, labelled "Book a trip" (verified,
  [c9c2f44d](https://mobbin.com/screens/c9c2f44d-1906-4857-bb94-1838ac1e1c8d)).

## Measured, Wishlists tab

**Airbnb does not appear to show a true zero-state here at all.** The default Wishlists screen,
even for what is presumed to be a fresh account, renders exactly ONE tile: a solid mid-grey rounded
square containing a white clock-with-counter-clockwise-arrow ("history") icon, labelled "Recently
viewed" underneath, in the same grid position a real saved-wishlist tile would occupy (verified,
[b20d3d2e](https://mobbin.com/screens/b20d3d2e-eef8-4336-9454-9b9d5bb4716c)). Tag: assume this IS
Airbnb's zero-custom-wishlists state (a system-generated list standing in for "nothing saved yet"
rather than a blank page), since no alternative "you have no wishlists" copy-and-CTA screen was
found in this pass; not confirmed against Airbnb's own source, only inferred from this one capture.
Tile colour sampled directly: solid **#8C8C8C** (140,140,140) across three sample points on the
tile face, i.e. a flat fill, not a gradient (verified, PIL). A SEPARATE capture shows a one-time
coach-mark overlay ("Save your favorites in one place" / "Tap the heart icon as you browse to save
stays and experiences to a wishlist." / "Got it" button) appearing on top of a Wishlists screen
that already has at least one real saved item visible underneath it
([7c140f48](https://mobbin.com/screens/7c140f48-a9ae-4420-8686-9018dc681449)); this is an
onboarding tooltip, not the empty state itself, named here only to rule it out as a candidate.

## Measured, Messages tab

1. Page header "Messages" (bold, large, top-left), two circular icon-buttons top-right (search,
   settings/gear) (verified,
   [71724d46](https://mobbin.com/screens/71724d46-9317-4b99-bb23-6083d3b101bb)).
2. A three-way filter-pill row directly under the header: "All" (filled black/ink, active),
   "Traveling", "Support" (both plain light-grey unfilled pills), all three same height, no icons
   (verified, visual; a PIL sample intended to confirm the exact fill hex of the active "All" pill
   landed on an edge/gap pixel rather than the pill's own fill and is not reported as a number here
   to avoid overstating precision, direct visual read stands instead).
3. Centred content block: a small message-bubble outline icon (a folded-corner speech-bubble
   glyph), rendered in plain thin black/ink strokes, no colour and no background tile at all,
   unlike every OTHER empty-state icon on this tab bar's other screens which use either full-colour
   illustrations (Trips) or a filled grey tile (Wishlists) (verified, visual).
4. Headline "You don't have any messages" (bold), subline "When you receive a new message, it will
   appear here" (grey, two lines), directly under the icon (verified).
5. One CTA, "Show all messages", an OUTLINE pill (not filled), the only outline-style CTA found
   across every empty state measured in this file (Trips uses filled crimson, Wishlists shows no
   CTA at all) (verified).
6. An "Archived" sub-page (reached from Messages) repeats the identical icon+headline+subline+CTA
   shape verbatim, only the copy changes ("You don't have any archived messages" / "When you
   archive a message, it will appear here" / "Show all messages" again) (verified,
   [611cc645](https://mobbin.com/screens/611cc645-576e-4159-9f3f-16bd72670e21)). This is the one
   place in this whole file where Airbnb DOES reuse one exact empty-state component across two
   contexts.

## Not measured

- Whether a genuine "zero wishlists, zero recently-viewed" state exists below the "Recently
  viewed" floor (e.g. a brand-new account with literally nothing viewed yet). Not found in this
  pass; the one capture available already has at least the system-generated tile.
- Exact pt sizes, icon glyph dimensions, and corner radius for any element in this file, for the
  same reason given in `airbnb--trips.md` and `airbnb--profile-and-payments.md`: only Mobbin's
  scaled thumbnails were available for these login-gated screens.
- The exact vector/icon-set identity of the Messages bubble glyph (which icon library, if any,
  Airbnb draws it from).

## Port map (Airbnb value -> Solen surface)

- The "no true empty state, a system list fills the slot instead" pattern on Wishlists -> directly
  comparable to Solen's own no-fabrication-forward pattern for counts (per
  `fresha--profile.md`'s port map: `AccountHub.tsx` shows a real `favoritesCount` or an honest
  empty string, never a fabricated zero). Airbnb's "Recently viewed" solves the same emptiness
  problem with REAL, always-available data (view history) rather than a blank state; this is a
  legitimate alternative worth naming even though it is not this repo's current approach.
- Airbnb's outline CTA on the one empty state that uses it (Messages) -> Solen has no direct
  Messages-equivalent surface (chat/messaging was killed, per this repo's own graveyard,
  `_design-system/REMOVED.md` lines documenting "chat suggest," "conversations messages," and
  "typing indicator / price offer modal" as zero-caller deletions from 2026-07-11). This specific
  empty state has no live Solen surface to port onto.
- The crimson filled-pill CTA on Trips empty states -> already covered in `airbnb--trips.md`'s own
  port map and Conflicts section; not repeated here.

## Conflicts (Airbnb placement vs a Solen lock)

- CONFLICT [no single icon system across empty states]: this file's own measurements show Airbnb
  using at least three unrelated treatments (full-colour illustration, flat grey icon tile, plain
  ink line-icon with no tile) across four states on one product. Solen's locked `EmptyState`
  anatomy specifies ONE consistent icon source everywhere (design contract "states" row). This is
  the same conflict already raised in `airbnb--trips.md`, restated here because a second, unrelated
  surface (Messages, Wishlists) reproduces it, which strengthens rather than introduces the
  finding: Airbnb's own product is not internally consistent on this axis, so it should not be
  cited as evidence FOR relaxing Solen's consistency lock.
- CONFLICT [outline CTA]: the Messages empty state uses an outline button, the only one Airbnb
  itself uses across all four states studied here. Solen's lock specifies a filled ink CTA with no
  outline exception named. Since this Solen surface does not currently exist (chat/messaging is
  graveyarded), this conflict is informational only, not an open decision blocking anything today.
- No conflict on the copy shape (name it, explain when it fills, one action): this matches both
  Solen's own lock and, per `fresha--empty-states.md`, Fresha's pattern too; all three systems agree
  on the SHAPE even where they disagree on icon style and CTA fill.
