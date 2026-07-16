# Dashboard design-language overhaul (mockup-first)

Owner ask (2026-07-14): "comp overhaul the design system and design of dashboard, make me mockups."

## Scope read (stated defaults, correct if wrong)
- **Overhaul the OPERATOR dashboard's own design language** (LOCKFILE §12 vibrant skin + ADS primitives), NOT the locked customer B&W system (§1-§11). Customer DS untouched.
- **Round 1 surface = the dashboard HOME** (`/[locale]/dashboard`), the surface that sets the language every other route inherits. The other ~44 `/dashboard/*` routes adopt the winning direction in a later pass.

## Delivered (round 1)
3 genuinely distinct directions, each a full re-skin of the REAL home (icon rail, setup banner, header + CTA, NEW 4-up KPI strip, NEW "Today" timeline hero, revenue/appointments charts, activity, top services, top team). Grounded in real tokens (LOCKFILE §1/§3), real ADS primitive shapes (DashPanel/DashStatCard/DashRow/charts), real Lucide icon data, and the shipped AV_GRADS avatar gradients. Populated with representative salon data.

- **A. Refined Light** (recommended ship base) , calm white, real KPI strip, soft depth, blue disciplined to links/active, ink CTA. Lowest risk, friendliest for non-technical owners, smallest jump from §12. Locked tokens only.
- **B. Command** (boldest) , dark charcoal cockpit (Revolut-charcoal, ties to iOS dark mode), brightened semantics, blue glow. Net-new dark palette (contract-hue-skip; would be tokenised if picked). Recommend shipping as a TOGGLE, not the only skin.
- **C. Operator Pro** (densest) , labeled 230px sidebar (grouped nav visible) replacing the icon rail, compact joined KPI bar, denser rows, smaller radii. Fresha-B2B structure (§12.1). For high-volume salons.

Mockup file: `public/_mockups/dashboard-overhaul/index.html` (self-contained, tab switcher). Verified: all 3 skins render (DOM-measured + top screenshots); tunnel 200.

## Recommendation
Ship **A (Refined Light)** as the base + offer **B (Command)** as an optional dark toggle. Concrete failure mode of B-as-default: dark can read cold to non-technical salon owners and weakens photo-heavy sub-pages (gallery, services). C is the power-user option once an account grows.

## OPEN forks (blocking the build; owner call)
1. **Which direction** (A / B / C / a blend, e.g. A layout + B dark toggle)?
2. **Scope confirm**: home-first then propagate, OR a specific subset of routes, OR treat the whole `/dashboard/*` estate now?
3. If B is in: dark = a user TOGGLE or the single skin?

## Relationship to other workstreams
Distinct from #13 (full-estate audit, which does per-surface [mockup] FIXES against existing law). This is a design-LANGUAGE direction reset for the operator dashboard. If a direction is picked, #13's dashboard WAVE-2 pass inherits it.

## Round 2: A-refined v2 (owner picked A, wants it pushed further) , 2026-07-14
Owner reaction to round 1: "A, but more gradients, more minimalistic + breathing space, declutter / put unnecessary stuff away, more like an Uber-Eats terminal but we also need managing. Go actually check how each feature's leading apps/sites design their dashboards." Scope: home first, then propagate.

Research: 6-agent Mobbin workflow (dashboard-reference-research) across 5 domains , salon-booking (Fresha/Square Appointments/Booksy), delivery-terminal (Uber Eats Manager/DoorDash/Toast), shift-scheduling (Deputy/When I Work/Homebase), minimal-gradient SaaS (Linear/Revolut/Stripe/Whop), payments/POS (Square/Stripe). Synthesized brief north-star: "a calm live-ops terminal , one gradient hero + a live right rail, everything else quiet and one click away." Full result: task output wis3242g4.

Built: `public/_mockups/dashboard-overhaul/v2.html` (single refined-A direction). Changes vs round-1 A:
- ONE gradient moment: a blue-wash "Revenue today" hero band (no card box) with a live dot + timestamp + area-fill sparkline. Chart + KPI sparklines carry the same faint blue area-fill. No gradient on cards/buttons/CTA/nav.
- Do-now action stack (walk-in waiting, payments to collect, appointments to confirm) , the terminal that still manages.
- State-tabbed Today (Ongoing/Upcoming/Done, gray sunken pill) with a live "in the chair, 12 min left" row.
- ONE revenue trend chart (area fill + grey prior line + 1W/4W/MTD range) instead of two stacked charts.
- Week KPIs demoted to 2 hero cards + a text-column strip (New clients / Rating / Utilization / Rebookings).
- Setup banner demoted to a top-bar progress ring.
- Persistent right "Today live" rail (activity stream + team-today) , the live pulse. Hides < 1160px.
Verified rendering (measured + screenshots). Locked tokens only except the shipped AV_GRADS avatar gradients (contract-hue-skip).

Added (owner ask 2026-07-14, "the workable one"): a Workable clock-in/out-style **Open/Closed status card** at the top (green badge + live timer + ink "Close shop" when open; grey badge + "opens tomorrow" + green "Open now" when closed), with a preview toggle to see both states; closed mode greys the live pulses + labels the hero "(closed now)". Maps Workable's Clock-out(ink)/Clock-in(green) exactly.

OPEN for owner: is v2 the direction? Any of: gradient dosage, the live rail, the do-now stack, the demoted KPIs, the open/closed card. Then build in real code.

## Round 4: INTEGRATION (owner 2026-07-15, likes all 3 fresh structures, wants them combined)
Owner voice: "I like a lot of all of these. Integrate the side view, I love the focus one, it looks clean. The sidebar that's good, maybe while it's open. Integrate the terminal one, the chair cards and the bottom navigation, it's easy to click payments and check. In the workspace that's good. I'm not really sure how to integrate these."

Atomic asks:
- [x] Integrate all 3 fresh directions into ONE design , integrated.html @ 8a2d1305f; verified: rendered at localhost:62905, DOM probe returned sidebarW=240, chairCards=5, dockBtns=5, railPanels=4; tunnel 200
- [x] Nav = Focus labeled sidebar , integrated.html:154 `.ig-sidebar{width:240px}`; 13 `.d3-navitem` labeled rows (grep -c = 13); verified: screenshot shows Overview active (gray fill + blue icon)
- [x] Sidebar OPEN / expanded , no collapsed default in markup; collapse control at integrated.html:158 `.ig-collapse`; verified: screenshot shows labels visible at 240px
- [x] Terminal chair cards , `.ig-chairs` grid @ integrated.html:304, `.d2-chair live` @ :305, 'Now' heading @ :302, ink Complete button @ :316 `.d2-primact ink`; verified: innerText probe found 'Complete' + 'Next, 09:45'
- [x] Terminal action dock , `.ig-dock` @ integrated.html:179 (position:absolute, bottom:22px), `.ig-dockbtn.ink` @ :183; all 5 verb labels present in markup (New sale/New appointment/Walk-in/Payments/Reports); verified: DOM probe dockBtns=5
- [x] Workspace composition kept , 'Good morning, test' @ integrated.html:276, Open status card 'Close shop' @ :284, Today list head @ :361; verified: screenshot shows greeting + Open/closes-19:00 card + gradient hero
- [x] Workspace right rail kept , To-dos panel @ integrated.html:404, Live panel @ :425; verified: DOM probe railPanels=4, screenshot shows both
- [x] Integration SOLVED , rule stated in-file at integrated.html:14-15 (HTML comment `SIDEBAR is PLACES ... DOCK is ACTIONS`) and enforced by the markup: nav only inside `.ig-sidebar`:154, zero section links inside `.ig-dock`:179 (all 5 labels are verbs); commit 8a2d1305f. NOTE: owner REJECTED this rule 2026-07-15 (needed a paragraph to explain = failed); superseded by Round 5
- [x] Integration SHOWN , intro paragraph at integrated.html:222 spells the rule out; verified: served 200 via tunnel + screenshot of the rendered home; commit 8a2d1305f

**Integration logic (the thing that stops it being a kitchen sink):** the SIDEBAR is PLACES (navigate to sections); the DOCK is ACTIONS (do a thing: new sale, walk-in, payments). They never overlap, so two bars are not redundant. Chair cards = the live day (center hero). Right rail = what needs you.

Layout: [Focus sidebar, expanded] | [center: greeting + open/closed + gradient revenue hero + chair cards + today list] | [right rail: to-dos + live] with the [Terminal action dock] pinned along the bottom of the content area.

Built: `public/_mockups/dashboard-overhaul/integrated.html`. PARKED ambiguity: "maybe while it's open" read as the sidebar's expanded state (implemented expanded by default with a collapse toggle); if the owner meant the salon open/closed state, the status card already covers it.

## Round 5: DECLUTTER + chairs-first (owner 2026-07-15, rejected the integrated draft)
Owner voice: "Not on board with this revenue today thing, we don't even need that as the main information. Maybe we can put the person in chair, many person, we're gonna have multiple people in chair, it's not gonna be one person. Make that main. There's a lot of to-dos or same information all over and over again, also for today, it's all in one picture. We can make it a little bit small and maybe there's a see all, click for all schedule today. What does this bottom navigation do? Now we have two navigation, it doesn't really make sense, it's just clutter."

Atomic asks:
- [x] Revenue demoted , now a quiet text stat in `.ig-statline` chairs.html:160/:297, label at :299; grep for revhero/gradient-hero = 0; verified: screenshot shows 'Revenue today CHF 1'240 +18%' as plain text beside Appointments/Waiting/Free chairs, no hero block
- [x] Hero = people in the chair , 'In the chair now' section with live dot + `.ig-chairs` grid directly under the stat line; verified: screenshot, it is the largest element on the page
- [x] MULTIPLE chairs occupied , grep -c 'In chair' = 3 (Elena/Lena 12 min, David/Marco 8 min, Sara/Sofia 25 min), counter reads '3 of 4 chairs busy'; verified: screenshot
- [x] Repeats killed , Live stream removed (grep '>Live<' = 0); walk-ins ONLY in Waiting, needs-you is decisions only (Collect x1, Review x1). Caught 2 real dupes from MY spec (waiting 'Marco R.' = Marco Rossi already in David's chair; waiting 'Jonas W.' = Jonas Widmer already in Today 11:15), renamed to Luca F./Noah K.; verified: every person string now counts exactly 1 (Lena Vogt, Marco Rossi, Sofia Keller, Nina Brun, Jonas Widmer, Aria Fischer, Luca F., Anna B., Noah K. = 1 each)
- [x] Today is small , 2 preview rows only (11:15 Jonas, 13:00 Aria) instead of the 6-row list; verified: grep of the today block
- [x] See all , verified: `<a class="ig-seeall">See all</a>` at chairs.html:435, styled :192-193, sitting next to the '6 appointments' count at :433; commit e4d9779bb
- [x] Dock removed , zero dock markup in chairs.html (the only 'dock' hits are prose at :17/:231 stating it is gone); sidebar is the sole nav; verified: screenshot has no bottom bar
- [x] Actions now contextual , verified by line: Complete (ink) chairs.html:341/:355/:369, Start :382, Check in :396/:401/:406, Collect :417, Review :422, ink New button :292; zero of them are section links; Reports stays a sidebar place; commit e4d9779bb

**Diagnosis of my miss:** the dock needed a rule to explain it ("sidebar = places, dock = actions"). If a layout needs a paragraph, it has failed. Two nav-shaped bars read as two navs regardless of intent. Actions belong where they are used: check-in on the waiting card, collect on the payment row, one ink "+ New" in the header, Reports is a place (sidebar).

**Redundancy map (what repeated):** walk-in waiting appeared in both to-dos and the queue; "next appointment" appeared on both the chair cards and the Today list; the Live stream restated new-booking/payment already shown in to-dos + today. Fix: chairs = now, waiting = who is queued, needs-you = decisions only, today = a count + see all, live stream cut.

Built: `public/_mockups/dashboard-overhaul/chairs.html`.

## Next (after owner picks)
Mockup-first still binds each screen. On a picked direction: extend the approved skin to the home in real code (DashboardUI primitives + DashboardLayout), verify (design-verifier + measured), then propagate route-by-route.

## Round 7: fix the SYSTEM, not the mockup (owner 2026-07-15, "dont we have design system and taste system, lets first fix ths, whats missing")

Diagnosis (all four verified against disk, not asserted):
1. **LOCKFILE §12 codifies the OLD dashboard** , §12.1 locks the Fresha icon rail + KPI-chart home, §12.2 locks a blue primary CTA. The redesign direction contradicts all three, so the only dashboard law available was actively wrong. verified: LOCKFILE.md §12.1/§12.2 read this session.
2. **TASTE_LOG had ZERO dashboard entries** , `grep -n "dashboard|operator|chair" TASTE_LOG.md` = 0 hits before this round; every owner call from 7 mockup rounds lived only in chat.
3. **The drift gate exempts mockups** , pre-edit-drift-gate.sh:67 `*public/*) exit 0`, so hex/token/treatment law never binds `public/_mockups/**`.
4. **REMOVED.md had no treatment graveyard** , `grep "left-edge|dock|left bar"` = 0 hits; the left-edge-bar "ban" existed only in a memory file, which is why it shipped.

Fixes landed:
- [x] TASTE_LOG "Round D1: Operator dashboard home" , 13 dated owner decisions (structure, one-nav, chairs hero, revenue demoted, nothing-twice, today small, paid/unpaid, no edge bars, no invented features, Workable open/closed, one-carded-hero + bare-text secondaries, pill spec, 16/32) + the council root-cause note + the §12 conflict flag. verified: _design-system/TASTE_LOG.md lines 179-222.
- [x] REMOVED.md +6 treatment lines (left-edge accent-bar, bottom action dock, revenue hero, right-rail live stream, generic waiting queue, pill-in-pill), all tagged "TASTE_LOG Round D1". verified: `grep -c "TASTE_LOG Round D1" REMOVED.md` = 6, so `npm run exists` now hits them.
- [x] mockup-depicts-gate ARM 1b , machine-checkable treatment ban: colored `border-left/right` edge accents in mockup CSS block at write time (neutral hairlines exempt). Self-tested: green var + hex accents BLOCK (exit 2), neutral border-right / non-mockup file / traced manifest PASS (exit 0).
- [x] Checkbox-evidence repairs on round-5 boxes (file:line + commit shas added). verified: DASHBOARD_OVERHAUL.md:77/:79 carry `verified:` + e4d9779bb.

OWNER DECISION still open (blocks the real build, not the mockups): supersede LOCKFILE §12.1 (icon-rail structure) + §12.2 (blue primary CTA) by name, per the frozen-row rule. TASTE_LOG Round D1 is the newer dated decision and wins by precedence meanwhile.
