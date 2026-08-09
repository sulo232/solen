<!-- batch: booking services step -> salon-page tier-card display + motion (owner 2026-07-18) -->
# Booking services , salon-page tier-card display + motion

Mockup: `public/_mockups/liftup-booking-services-tiered/index.html`
(APPROVED look; refined: chevron inline by name, price under desc on expand, + centered).

## Owner asks this turn (2026-07-18, motion + gate)
- [x] CORRECTION , Motion on the plus->check toggle in the mockup (opacity+scale+blur crossfade, glide, per ToggleCircle ENTER_RECIPE) + a small circle pop on select
- [x] Motion , the price total ROLLS up (value-roll) when it changes / when 2+ services
- [x] Motion , the minutes bump (count-bump) when the duration changes
- [x] Harden the gate , mockup preflight now blocks a mockup that has a select-toggle OR a live-updating total/count with NO keyframe/animation motion (tested block + pass)

## Owner correction 2026-07-18 (motion recipe + Continue arrow)
- [x] CORRECTION , keep the plus->check toggle crossfade (owner likes it)
- [x] CORRECTION , price total: remove the slide-up value-roll ("jumping"); use the locked opacity+scale+blur ENTER_RECIPE instead
- [x] CORRECTION , minutes: remove the scale count-bump ("giant mini"); use the same opacity+scale+blur ENTER_RECIPE
- [x] CORRECTION , harden the mockup-motion gate: require the BLUR recipe (non-zero blur in the motion), not just "has @keyframes", so a slide/roll/bump without blur is blocked (tested block + pass)
- [x] Continue button arrow: default = chevron/arrowhead only (no shaft); on hover/press the shaft draws in to a full arrow

> SUPERSEDE NOTE: value-roll + count-bump are the shipped motion-22 vocab (globals.css). The owner is
> replacing them, for value changes, with the locked opacity+scale+blur ENTER_RECIPE (the one the toggle
> uses). For the REAL app this means the bottom-bar price + minutes should use the enter recipe, not
> value-roll/count-bump , folded into the held build note below.

## Motion feel (owner 2026-07-18: "it looks soo ass i want more of the morphing")
- [x] The plain blur fade landed flat. Built a MOTION LAB (`liftup-services-motion/`) with 4 replayable value-change motions to pick from instead of guessing again: Blur fade / Count up / Zoom morph / Count + pop (recommended). All 4 verified live. AWAITING the owner's pick, then apply the chosen one to the tiered mockup + the real bottom bar.

## Implement the counter (owner 2026-07-18: "implement the counter ... implement it already ... let me see the end result")
- [x] Build a CountUpNumber client component: animates the number from the PREVIOUS value to the new one over a CONSTANT ~480ms (ease-out), NOT scaled by the delta, so 0->200 takes the same time as 65->93 (the owner's fear: a big price should not take long to climb). Renders ONLY the number; reduced-motion jumps. Also takes an optional `format` prop so the Swiss thousands separator survives the count (verified live: "CHF 1'210" at de-CH, "1 210 CHF" at fr-CH).
- [x] Wire into ServicesStaffStep.tsx bottom bar: total = "CHF " static + CountUpNumber(totalPrice) (remove animate-value-roll); minutes = CountUpNumber(totalDuration) + " min" static. No pop/bump. Meta line carries `tabular-nums` so the digit width doesn't jitter while it counts.
- [x] Verify live on the real booking route + show the owner the end result (clickable tunnel link).

## Polish round (owner 2026-07-18, live on the real page)
- [x] Details expand is too SLOW , ServicesStaffStep.tsx ~line 424 uses `duration: ENTER_DURATION` (~0.42s); drop to ~0.18s (keep GLIDE_EASE).
- [x] Background not WHITE , the booking body is `min-h-screen bg-s-bg-sunken` (booking/page.tsx:234) + the sticky filter strip is `bg-s-bg-sunken` (ServicesStaffStep ~467). Make both WHITE (strip keeps a bottom hairline + blur for the sticky separation). NOTE: overrides the "sunken body" lock (mockup 20 / project_booking_flow_canonical); owner's live ask + the approved white mockup win. Affects ALL booking steps.
- [x] "N ausgewählt" pill not design-system-like , ServicesStaffStep ~535 is `bg-s-ink text-white` + a heavy `shadow-[0_8px_24px_-8px_rgba(10,10,10,.45)]` (banned black fill + heavy shadow). Make it DS-compliant: white + `border-s-border` + `text-s-ink` + soft `shadow-elevation-2` (keep the count-bump + ArrowUp).
- [x] The little black dot flying to the bottom-left on click , owner dislikes it. Remove flyToCart (ServicesStaffStep ~177 + its 2 calls) + the `.cart-fly-dot` CSS (globals.css ~1195).

## Polish round 2 (owner 2026-07-19)
- [x] The + -> check MORPH , DONE + verified live: pop scale 1->1.18->1 on select (peak 1.197 measured) + sharper check-in (scale 0.6 + blur 6px). (Follow-up chip: make the Plus icon symmetric with the Check for exact 1:1 mockup parity.)
- [x] The "ausgewählt" pill , DONE + verified live: now shows only when a selected row is scrolled off-screen (IntersectionObserver over the selected rows); hidden at top / on short lists. (Follow-up chip: also treat filter-hidden selections as off-screen.)
- [x] SURFACE 1 of 3 SHIPPED (owner 2026-08-09 decision 10, verbatim *"A like short n if its too long tap to expand yk"*, the approval this was parked on). The SALON page service rows now expand on tap. The booking row's chevron + description accordion was lifted into ONE primitive, `app/[locale]/_components/primitives/ServiceDisclosureRow.tsx`, and BOTH `SalonServices.tsx` and `ServicesStaffStep.tsx` render it, so there is no second copy. Verified live at 390x844 on `/de/salon/atelier-haarwerk`: collapsed row 111px, tapped 189px with the description visible and the chevron at `matrix(-1,0,0,-1,0,0)`, tapped again back to 111px; the booking step still expands (118 -> 174) and its ToggleCircle still selects without collapsing the row. A service with no description gets no chevron and no button at all, so no dead tap target. `verified: c319c59cb  app/[locale]/_components/salon/SalonServices.tsx:8`
> PARKED, NOT A TASK IN THIS BATCH (owner 2026-07-19 "all three, plan it out"): surfaces 2 and 3,
> the DASHBOARD and SETTINGS. Decision 10 of 2026-08-09 named the salon page only, so these two wait
> for him to name them. Left as prose rather than an open checkbox so this file does not read as
> unfinished work. When they resume they import `ServiceDisclosureRow`, they do not build a row.
> Research map done (dashboard good, settings already has tap-to-reveal).

## Polish round 3 (owner 2026-07-19, REAL booking page, no mockups)
- [x] Category pills selected state , DONE + verified live (active bg rgb(10,10,10)): BLACK/ink selected pill, scoped override logged in TASTE_LOG. (878c0d23d)
- [x] Category pills behavior , DONE + verified live: CATEGORY SECTIONS + scroll-spy pills (click scrolls to section, active follows on scroll), replacing the duration tiers. (878c0d23d)

## Polish round 4 (owner 2026-07-19, cross-page card CONSISTENCY + a gate)
Owner: "look at the border, there is none in stylist choosing but there is in selecting the haircut option ... many other places inconsistencies ... first we need to make a new gate or improve the current one."
- [x] NEW GATE , `.claude/hooks/card-radius-gate.py` + wired into `.claude/settings.json` PreToolUse (Edit|Write|MultiEdit). Blocks a NET-NEW `shadow-whisper` grouped-card at radius != 24. shadow-elevation NOT gated (general utility, 21 legit radii). 8/8 self-tests. (b1744b1af -> retargeted b1f281e05)
- [x] STYLIST step , now the SAME bordered grouped card as services: `overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper`, hairline dividers, flush rows, selected = gray fill. The owner's literal border complaint. Verified live (24px / #E4E4E7 / whisper / 3 dividers / first flush / gray-fill). (b1f281e05)
- [x] RADIUS CANON , owner "pick whichever the services use" = 24 (the established 12-call-site grouped-card grammar). Reverted a mid-turn 24->16 detour back to 24 on services/salon/stylist. Logged in TASTE_LOG + LOCKFILE radius table + CLAUDE.md radius row.
- [x] AUDIT , all 12 shadow-whisper grouped-cards confirmed at 24; the salon PDP (Services/Produkte/Pakete) is internally consistent again.

## DONE / superseded (the booking services step is fully rebuilt on the real page)
- [x] Full tiered display built into the real ServicesStaffStep.tsx, then EVOLVED to category-section grouping per the owner. Filter pills -> scroll-spy pills. tap-to-expand rows, +-select + ServiceDetailSheet, de/en/fr/it all shipped.
- [x] Bottom-bar minutes , SUPERSEDED: minutes now use the count-up counter (CountUpNumber), not count-bump. Shipped.

## Notes
- Real component already carries the motion vocab (motion-22): value-roll, count-bump, ToggleCircle crossfade. The MOCKUP lacked it, and `motion-recipe-gate.py` only scans .tsx/.jsx framer props, so the static HTML slipped through. Gate hardened for mockups.
