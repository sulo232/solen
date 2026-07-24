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
