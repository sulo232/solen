> # 🛑 REVERTED , owner 2026-07-18 (do not act on anything below)
> The owner reverted this whole direction the same day it was approved, right after approving the CARDED
> salon-page-style booking-services mockup (`public/_mockups/liftup-booking-services-tiered/`): "revert the
> design system" + "remove the gates n sh for the simple thing that we made." The winning direction is the
> EXISTING carded salon-page tier-card display (rounded-24 + hairline + whisper shadow), NOT "take the box
> off." Actions taken: the fullscreen mockup gate was removed (`.claude/hooks/mockup-fullscreen-gate.py` +
> the `check_fullscreen` arm of `~/.claude/hooks/mockup-preflight-manifest.py`); REMOVED.md was fed so
> borderless is not re-proposed; no LOCKFILE/RATIONALE row was ever amended, so there is nothing there to
> undo. The `liftup-*-fs` before/after mockups remain on disk as dead exploration. Everything below is the
> abandoned plan, kept only as a record.

---

# Borderless rollout , "chrome off, density stays" (owner-approved Model B, 2026-07-18) , REVERTED, see banner

Owner: "alr approved. make real design principle like change cz rn we got everything around those
[old principles] n gates n hooks too. make acc plan n make tons of mockups bfr u acc implement, ima
approve each one."

So this is a real DESIGN-SYSTEM change, not a one-off. Model B (element-level "chrome off, density
stays") is the approved direction. The job: (1) codify it as law, (2) update the docs + gates/hooks that
encode the old boxed direction, (3) mock EVERY customer screen in the new direction, (4) owner approves
each mockup, (5) only then implement, screen by screen.

---

## 1. THE PRINCIPLE (the new law)

**Take the box off, keep the info.**

Remove the decorative card wrapper (border + shadow + rounded box) from every surface. Content sits on
white, grouped by **hairlines + whitespace + bold section labels** (the Uber borderless treatment). A
control stays **dense** ONLY when it carries a real decision: filter pills, prices, taxonomy pickers,
photos, status, the calendar. Everything else is chrome, and chrome comes off.

Decidable per element (one test): *is this box just a decorative border+shadow around a list?* -> off.
*Is this control a filter / price / taxonomy / photo / status?* -> keep. One visual language everywhere;
the marketplace stays scannable, the account/list surfaces go calm.

Reference: owner's Uber profile screenshots (analyzed 2026-07-18). This supersedes the "grouped card
sections everywhere" pattern.

---

## 2. WHAT IT SUPERSEDES / CODIFICATION TARGETS (design-system)

These are the doc rows that encode the OLD boxed direction and must be amended so the new principle is
law. LOCKFILE rows are FROZEN literals (precedence #3) , each needs the owner's explicit yes per row, so
these are PROPOSED amendments, surfaced for approval, not silently changed:

- **LOCKFILE / CLAUDE.md design-contract, `shadow` row** ("card shadow-elevation-2 rest / -3 hover"):
  amend to "cards that are just a box around a list = FLAT borderless (no shadow, no border); shadow/
  elevation reserved for genuine over-photo frost + the sticky bar fade." (CONTROL_ELEVATION.md already
  says calm control = flat; this extends it from controls to card SECTIONS.)
- The **grouped-card section pattern** in profile/settings/bookings , superseded by borderless
  hairline-grouped rows + bold section labels.
- Add a new **RATIONALE.md** principle block ("chrome off, density stays") with the one-test rule + the
  keep-list (filters/prices/taxonomy/photos/status) + the Uber reference.
- `_design-system/SOURCE.md` elevation/section guidance , point it at the new principle.

## 2b. GATES / HOOKS to audit + update (owner: "gates n hooks too")

The gates that could encode or fight the old boxed direction. AUDIT each; update only the ones that would
BLOCK or mis-flag the borderless treatment (a task in the rollout, tested one-should-block/one-should-pass
per rule 12.5, NOT changed blind):
- `pre-edit-drift-gate.sh` , does it treat removing `shadow-elevation-*` / card borders as drift? If so,
  it must ALLOW borderless on the migrated surfaces.
- `mockup-resurrection-gate.py` / `REJECTED_TREATMENTS.json` , ensure the borderless card treatment is
  NOT recorded as a rejected treatment (it is now approved law).
- The design-contract table in project CLAUDE.md (`shadow` / `selected` / card rows) , keep in sync with
  the amended LOCKFILE.
- `solen-drift-check` skill literals , add the borderless section pattern so it is not flagged.
- No change to the MOCKUP gates (real-base, backend-check, exists, english, no-caps, hue, lucide) , those
  are correct and stay.

---

## 3. THE FLOW (owner-dictated): mockups FIRST, approve EACH, then implement

1. Codify the principle (this doc + a RATIONALE.md block).
2. Audit + list the exact gate/hook + LOCKFILE amendments (above); get owner yes on the LOCKFILE rows.
3. **Mockup EVERY customer screen** in the borderless direction, grounded in each screen's real structure.
4. **Owner approves EACH screen's mockup.** No implementation before that screen's mockup is approved.
5. Implement approved screens (mockup -> code, per screen, layered loop coder+reviewer, one commit each).
6. Verify each live (screenshot + tunnel), then apply the design-system + gate amendments alongside.

---

## 4. FULL CUSTOMER-SCREEN INVENTORY + MOCKUP QUEUE

Status: [x] mocked+delivered · [~] mocked, being refined · [ ] not mocked yet · (A) = owner-approved.

### Discovery / entry
- [~] Home (`/de`) , hero + ForYou/Nearby/Featured/RecentlyViewed rows + search bar
- [~] Inspo feed (`/de/inspo`) , Pinterest masonry
- [x] Search results (`/de/[city]/[category]`) , round 2 (stays dense, only desktop card shadow off)
- [x] Salon PDP (`/de/salon/[slug]`) , round 2 (service tiers + team/review panels off, filters/prices stay)

### Booking flow (the wizard, booking-LOCKED order: services -> Staff -> Zeit(->Haare) -> Bezahlen)
- [x] Service select , APPROVED (owner 2026-07-18) as borderless + EXPAND-ON-DEMAND: rows stay simple
  (name + chevron + time + price); the description is collapsed by default and reveals on TAP (mobile) or
  HOVER (desktop @media hover), chevron flips. Mockup: liftup-services-expand/. This expand-on-demand row is
  now an APPROVED pattern for any row that has secondary info. Ready to implement in code (awaiting owner go on
  build-vs-keep-mocking).
- [~] Staff · [~] Date/time · [~] Hair · [~] Pay/confirm , MOCKED borderless (liftup-booking/), awaiting approval
- [~] Confirmation / receipt (`/de/confirmation`) , MOCKED (liftup-booking/), calm green success header

### Account (the calm borderless heartland)
- [x] Profile hub (`/de/profile`) , round 1 (A: direction liked)
- [x] Settings (`/de/profile/settings`) , round 2
- [x] Appointments (`/de/profile/bookings`) , round 2
- [ ] Favorites · [ ] Booking detail · [ ] Haarprofil · [ ] Looks · [ ] Stamps · [ ] Rewards
- [ ] Notifications · [ ] Referral · [ ] Intake forms
- [ ] Unified Saved (new, round-1 concept , folds Favorites + Inspo saved, TikTok swipe tabs)

### Walk-in + post-booking
- [ ] Walk-in queue tracker (`/de/queue/[token]`) · [ ] Walk-in pay
- [ ] Booking lookup (`/de/booking/lookup`) · [ ] Report/refund · [ ] Reschedule

**Model B is APPROVED (owner 2026-07-18).** Rounds 1+2 delivered. Next batch (this session): booking flow +
confirmation + home + inspo (grounded by workflow borderless-screen-map-2), as a served gallery for
per-screen approval.

---

## 4b. Round-3 asks (owner 2026-07-18, format polish , atomic)
- [x] Bigger + (add) icon on the service rows , DONE: 38px control + 22px + icon (was 26/15). services-fs.
- [x] Sticky category pill CHANGES as you scroll (scrollspy) , DONE: active pill steps Cut->Color->Styling as
  you scroll (11-service list for range), tap a pill to jump; fixed an init-on-hidden-pane bug. Verified live.
- [~] Convert OTHER mockups to FULL-PAGE + before/after (toggle) , template DONE (services-fs) + gate enforces.
  PUBLIC screens DONE this session as full-page before/after (live-iframe before): services-fs (APPROVED),
  salon-fs (APPROVED), home-fs, search-fs, inspo-fs. All on the hub (liftup/). REMAINING:
  - booking sub-steps (stylist, date/time, hair, pay, confirmation) full-page , the wizard is client-state so
    the "before" iframe only shows step 1; will drive/capture per step.
  - ACCOUNT screens (profile, settings, appointments, favorites, looks, haarprofil, stamps, rewards,
    notifications, referral) , AUTH-GATED, so the "before" needs a LOGGED-IN capture (Playwright + /api/dev/login),
    a heavier path than the public-screen live iframe. NAMED DEPENDENCY, flagged not dropped.
  - walk-in queue + the unified Saved page (built out).

## 5. Method / guardrails
- MOCKUP-FIRST, one owner approval per screen, before ANY code. Grounded in the real screen structure
  (read-only screen-map workflow), never invented. English chrome, real tokens, Lucide icons, served +
  tunnel link. No-parallel-frontend for BUILD; research/mapping CAN parallelize.
- The design-system + gate amendments (sections 2/2b) are their own approval-gated sub-track , proposed
  here, executed as the migrated surfaces land, with the owner's yes on each LOCKFILE row.
- Precedence: this is a systemic change; LOCKFILE frozen rows need explicit owner sign-off per row.
