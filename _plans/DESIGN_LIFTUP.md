# Design lift-up + minimalist-direction exploration (owner 2026-07-18)

Status: **QUEUED** , owner scoped it "after you're done" with the frontend gap fixes (#GAP_FIXES.md).
Deliverable model: **MOCKUP-FIRST**. The owner explicitly wants to SEE directions and lift-up mockups
before anything is applied. "its a loop [not] finished once u make mockups for those liftups."

## Owner references (screenshots , Uber profile, the borderless/minimalist look they like)
- `/Users/sulo/.claude/uploads/52878f2d-37a1-43b1-9756-e2e3a26b664d/83a70cdc-IMG_6537.png`
- `/Users/sulo/.claude/uploads/52878f2d-37a1-43b1-9756-e2e3a26b664d/43858a70-IMG_6538.png`
- `/Users/sulo/.claude/uploads/52878f2d-37a1-43b1-9756-e2e3a26b664d/3fd364dd-IMG_6539.png`
Owner: "i like how uber like in profile page ... it doesnt have borders between each stuff ... or smtimes jst
lines it looks simple and minimalistic and our profile page looks so ass." If the screenshots are unreadable,
fall back to Mobbin (Uber profile/account screens). VIEW these (delegate to a haiku/sonnet reader per the
media-read rule) at the START of this workstream, not now.

## Atomic items (decomposed from the owner message , deliver or block EACH)
- [ ] A. **Screen audit , primitives + lift-up candidates.** Walk every customer screen; for each, record
  (a) does it correctly use design-system primitives, (b) is it a lift-up candidate (elevation/motion/polish).
  Output = a per-screen table. (Use `npm run exists` + _inventory/SURFACE.md for the screen list; delegate the
  read sweep to subagents per the no-parallel-frontend + delegate-media rules , this is audit/read work,
  parallel-OK.)
- [ ] B. **Unified favorites page.** Merge profile Favoriten + Inspo Gespeichert (+ any other saved surface)
  into ONE page with TikTok-style swipeable tabs to switch between them. Exists-check first (favorites,
  /profile/favorites, /inspo/saved, discovery_saves). MOCKUP.
- [ ] C. **Lift-up + motion mockups.** For the lift-up candidates from A, mock the elevation/motion upgrades.
  This is the item the owner named as the loop's close condition ("finished once u make mockups for those
  liftups").
- [ ] D. **REMOVE staff-icon movement on the salon (store) page.** Owner: "when u go to store page and then
  the icons of staff moves sh thats so ass remove it." This one is a REMOVAL of a disliked motion, not a
  show-me-first item , find the staff avatar/icon animation on the salon PDP (likely SalonTeam / staff row)
  and remove that motion. Feed REMOVED.md. (Do this EARLY , it's a clear owner rejection, not a mockup fork.)
- [ ] E. **Find surfaces that LACK a UI.** "find the places which lack a ui too if it even exists." Identify
  screens/states with missing or absent UI (missing empty/error/loading, or a flow with no screen at all).
- [ ] F. **Profile redesign direction , Uber-borderless.** Redesign the profile hub toward the borderless/
  minimalist Uber look (no borders between rows, hairline separators or none, simple). MOCKUP the profile in
  this direction. Owner dislikes the current profile.
- [ ] G. **Direction decision , minimalist vs pills/Fresha/Airbnb.** The tension: Solen already uses pills +
  Fresha/Airbnb-style density in places, and the owner wants the Uber-minimalist borderless style in others.
  Produce SIDE-BY-SIDE direction mockups so the owner can pick. Consider codifying the winning direction into
  the design system (LOCKFILE/SOURCE) so it applies "in many places" , but ONLY after the owner picks.
- [ ] H. **General direction mockups (not just profile).** "make me mockups for this too not only in profile
  pages but general mockups too." Apply the chosen/candidate direction to a few general surfaces so the owner
  sees the system-wide implication.

## Method / guardrails
- Mockup-first, copy-of-real-page (not from-scratch HTML redraws). Deliver as a served route / cloudflare
  tunnel link, never an image attachment or claude.ai artifact.
- No-parallel-frontend for BUILD; audit/read sweeps (item A, item E, screenshot reads) CAN use parallel
  read-only subagents (waves of <=4).
- Ground the minimalist direction in the LOCKFILE tokens + the Uber reference; the pills/Fresha side already
  exists in-repo. Do NOT invent hex/sizes , pull from LOCKFILE or the reference.
- G is a genuine owner FORK (which direction wins). Surface both as mockups; do not silently pick one and
  codify it.
- Item D is a code removal the owner already decided , not blocked on a mockup.

## Decision log
- 2026-07-18 ROUND 1 delivered (public/_mockups/liftup-directions/ , profile current-vs-minimalist + unified saved).
  Owner verdict: "i like the uber but ion think everywhere like that is good we can mix up. gimme ideas on
  other screens n how we gonna integrate it." => DIRECTION SETTLED: adopt the Uber-borderless-minimalist, but
  MIXED (not everywhere). The open question is now the INTEGRATION MODEL (how to decide which screen gets
  minimalist vs keeps marketplace density) + seeing the mix applied to OTHER screens.
- 2026-07-18 ROUND 2 (in progress): integration mockups. 3 candidate integration models side-by-side +
  the mix rendered on other screens (Settings, Appointments, Search results, Salon PDP), grounded in a
  read-only screen-map (workflow liftup-screen-map). Lead with a recommended model.

## Open forks to resolve with the owner (via the mockups)
1. RESOLVED toward MIXED (owner 2026-07-18). Remaining: which INTEGRATION MODEL governs the mix (round 2).
2. Unified-favorites: which surfaces fold in (Favoriten, Inspo saved, saved salons, saved looks, boards?) and
   the tab set. (item B)
