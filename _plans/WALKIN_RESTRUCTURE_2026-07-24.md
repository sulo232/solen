# Walk-in PDP restructure — owner batch 2026-07-24

Owner (dictated, walk-in state selected on the PDP): the walk-in panel is ONE BIG SHEET; hard
to tell time vs services vs barber apart; the sticky sub-nav (Services/Team/Reviews) does not
work when scrolling in walk-in; walk-in lacks Termin's clickable stylists + service browsing.
Plus fix the minutes display + the wait/open-status explanation.

## Root cause (VERIFIED, app/[locale]/_components/salon/SalonDetailV3.tsx)
- L263 `{!walkinMode && <SalonServices>}` and L285 `{!walkinMode && <SalonTeam>}` HIDE Services +
  Team in walk-in; the monolithic SalonWalkInPanel (L258) replaces them.
- The sub-nav availableSections (L137-150) is computed from salon DATA regardless of mode, so it
  still renders Services/Team tabs -> they scroll to #section-services / #section-team which do
  NOT exist in walk-in -> dead tabs. Exactly the owner's complaint.
- Reverses the one-card lock (commit 635a33183 "walk-in = ONE module card"). Owner's live ask
  (2026-07-24) overrides it (precedence chain: owner live literal ask > prior TASTE_LOG lock).

## Atomic asks
- [ ] 1. Redesign the minutes display (55-70 Min wait) so it reads clearly.
- [ ] 2. Redesign the wait / open-status explanation (Offen / Wartezeit / X vor dir; relate to open-until).
- [ ] 3. Break the one-big-sheet into visually DISTINCT sections (status/time - barber - services).
- [ ] 4. Make the sticky sub-nav work in walk-in (Services/Team/Reviews scroll targets must exist).
- [ ] 5. Termin parity in walk-in:
  - [ ] 5a. Clickable Team section (all stylists -> profiles), like Termin.
  - [ ] 5b. Browsable Services section (navigable), walk-in Anstehen (queue-join) action preserved.

## Forks (owner steer)
- [ ] Barber quick-pick (drives queue wait + service filter) vs the Team browse section: keep both
  (recommended, different purposes) or merge into one.
- [ ] Minutes/status redesign direction: first pass shown live; refine to taste.

## Out of scope
- walk-in-pay / queue backend, Stripe. Termin mode (just fixed). Map / transit / staff-languages.

## Round 2 refinements (owner, 2026-07-24, after seeing first pass live)
First pass LANDED + owner saw it (screenshotted the redesigned queued status card). Now:
- [ ] R2-1. Status panel: make it COMPACT + STICKY — on scroll it shrinks into a slim sticky
  bar that stays visible, so the LIVE wait is always on screen as it changes.
- [ ] R2-2. Services: group "like the normal appointments" (Termin) + add "Alle ansehen"
  see-all affordance(s) instead of dumping all 11 services in one long list. [interpretation
  to confirm: Termin-style category chips + preview + see-all, vs per-category see-all]

## Round 3 (owner 2026-07-24, angry — STOP PHASING, finish this turn)
- [ ] CORRECTION: stop stopping/phasing ("next pass"). Finish ALL items in one turn.
  HARDEN: extend defer-bulk-gate to catch phasing language ("next pass", "focused pass", "next turn").
- [ ] BUG: Termin mode -> click a Team member -> jumps into Walk-in mode (regression). Then
  clicking Termin opens the stylist profile. Reproduce + fix.
- [ ] #9 redesign StaffProfilePage bottom sheet (cleaner/fresher).
- [ ] #10 add "see all" to the stylist profile.
- [ ] #11 BUG: stylist profile -> book their service -> selection doesn't carry into booking.
- [ ] #6 CO = per-service live/walk-in badge (no per-service wait data exists).

## Round 4 (owner 2026-07-24)
- [ ] A. Walk-in services = one huge grouped list (all categories, all rows). Make it like the
  Termin "normal appointment" pattern: chips + FLAT preview (first ~5) + "Alle ansehen", not
  category-header grouped-all.
- [ ] B. "Alle ansehen" = a real BUTTON that OPENS the full walk-in service list (+ "create a
  backend"). Data already exists client-side (salon.services); clarify if a real route/API is meant.
- [ ] C. MOCKUPS (3 English options) to redesign the compact status-bar CONTENT — owner likes the
  pill SHAPE, content ("Offen · 55-70 Min · 5 vor dir · i") is too cluttered.

## CORRECTION (owner 2026-07-24, furious): do NOT ship unapproved designs to the LIVE surface
- [x] REVERTED: I wired status-bar option E into the LIVE SalonWalkInPanel (commit ff0dceeda) while
  the owner was still CRITIQUING the mockups — never approved. Owner: "why the fuck did you revert
  the walk-in to the one I told you I do not want". Reverted (9a8882c91); live bar back to prior state.
- RULE (behavioral, no clean gate possible since "approval" isn't detectable): status-bar / walk-in
  design experiments live ONLY in the /dev/walkin-statusbar-options mockup route. NEVER edit the live
  SalonWalkInPanel presentation until the owner says explicitly "ship option X" / "make it live".

## CORRECTION 2 (owner 2026-07-24, "i told you to give me mockup to renew the number, u skipped it")
- [ ] Owner asked for a MOCKUP renewing the status-bar NUMBER ("55–70 Min" range look = disliked).
  Deliverable = a /dev mockup with SINGLE-number wait treatments (NOT a range, NOT the rejected
  position-hero). Build it in /dev; do NOT touch the live bar.
- [ ] HARDEN: mockup-vs-live gate — when the owner asks for a "mockup"/"renew", the edits must land
  in a /dev mockup route, never the live customer component.
