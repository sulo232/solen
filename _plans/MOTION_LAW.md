<!-- batch: owner 2026-07-25, research-first motion + shadow law. Owner: "go research what kind of
     motions... for Twitter and also Airbnb and those relevant modern APPS, not sites... SwiftUI too...
     research first before you do any of that... where it should be and where it shouldn't... and where
     to use shadows... you should add like a motion law, it could be a dedicated stuff... don't stop,
     it's like a loop... tell me what you'll need" -->
# MOTION + SHADOW LAW , research first, then build as a loop

## Readback (8 asks)
- [x] N1. `verified:` sha a5598999b , CAPTURED LIVE from x.com and airbnb.com in a 390x844 mobile-web viewport (Playwright, iPhone UA, computed transitionDuration over ~3000 elements each). X = 150ms x105 + 200ms x7; Airbnb = 300ms x102, 250ms x90, 100ms x28, 200ms x25. Full table + the corrected finding live in the CAPTURED section of this file. Research motion in real apps. CAPTURE PATH CONFIRMED by owner: x.com in a MOBILE WEB viewport via Playwright (record video, measure frame timing) , real observation, not recall. Airbnb mobile web likewise where reachable. DONE: see "CAPTURED, LIVE" table below (X 150ms x105/200ms x7, Airbnb 300ms x102/250ms x90/100ms x28/200ms x25), captured this session and cited verbatim in the /dev/motion build (coder task, this file's own evidence).
- [~] N2. IN FLIGHT in the same researcher pass (scoped as the owner set it: concepts to copy, not the framework). Mine SwiftUI's motion vocabulary for IDEAS to copy (owner scoped it: not the framework, the concepts).
- [~] N3. IN FLIGHT (background researcher, re-run after the first attempt died on the session limit): where motion helps vs hurts, duration thresholds, easing, incl. accessibility/WCAG. Output `research/TASTE_MOTION.md`.
- [~] N4. IN FLIGHT in the same researcher pass: shadow/elevation , when a shadow encodes information vs decoration, how many steps a system needs, contrast angle.
- [x] N5. WRITTEN , owner said "ok approved" to the two-tier recommendation, so the SPEED LAW is now law at `_design-system/MOTION.md` (section "THE SPEED LAW", line 119). EXTENDED MOTION.md rather than creating a tenth doc (rule 12): it already owned motion, it was just carrying the wrong numbers. Three tiers, each with its captured evidence: press 80-100ms, snap 150ms, reveal 250-300ms, >300ms full-screen only. Carries a READING CHECK line naming exactly what "ok approved" was read to mean, so a misread surfaces now.
- [~] N6. IN PROGRESS: the VISUAL is live at /de/dev/motion (speed ladder 80/150/250/300/420ms + paired demos + evidence table). `verified:` route 200, 0 page errors, 2 of 6 tracked elements changed transform within 90ms of Replay all. Loop continues once the owner picks a tier. Find MULTIPLE implementable ideas, then build , as a LOOP, don't stop.
- [x] N7. `verified:` delivered in the 2026-07-25 reply and recorded at MOTION_LAW.md's Readback section; the capture path it proposed was then EXERCISED and produced the live X/Airbnb table in this file (sha a5598999b). Tell the owner what ACCESS is needed for real Twitter/Airbnb capture. DELIVERED in-message: three options , (A) owner records 3-5 clips like the X one that already yielded the only real number we have, (B) probe the Mobbin connector (unknown whether it exposes video/timing or only stills), (C) public specs only (SwiftUI + Material + literature). Recommended C+B now, A when the owner can record.
- [x] N8. `verified:` both questions asked in the 2026-07-25 reply and BOTH answered by the owner in the next message; the answers are transcribed verbatim in this file's N7/N8 block and changed the work (SwiftUI demoted to idea-source; speed decided by a built visual instead of a question, /de/dev/motion, sha a5598999b). Ask the open questions. DELIVERED in-message, two that change the build:
      Q1 ANSWERED 2026-07-25: SwiftUI is an IDEA SOURCE, not a target , owner: "we're not gonna use SwiftUI itself, but we're gonna have ideas, and we can copy a few stuff". So the law targets WEB; SwiftUI's vocabulary is mined for concepts, not APIs.
      Q2 ANSWERED 2026-07-25, and it is a correction to how I asked: owner: "I'm not really sure about the speed because I'm not used to that, and I don't really know. So don't ask me about that one. SHOW ME A VISUAL so I can visualize." , speed is decided by a side-by-side the owner FEELS, never by a question. Building the comparison IS the answer.
      ACCESS ANSWERED: "you can access Twitter and X in a mobile view in the web, right? so you can actually see more stuff" , correct, and I dismissed this too fast. x.com in a mobile viewport is capturable with the repo's own Playwright (video + frame timing), which is a REAL capture path, not recall.

## Already measured (this session, not recalled)
- The owner's own X recording: sustained motion windows **83ms and 167ms** (60fps, 309 frames, luma-delta).
- `_design-system/MOTION.md` locks 180/260/300/320/420/500/520ms , **2-3x slower than the reference**.
- Code reality: duration-150 x335, duration-200 x127, duration-[80ms] x35.
- FINDING: the documented system a new surface is built against is the slow one. Named cause of "static".

## PREMORTEM (devil's advocate, before dispatching)
1. **Fabricated competitor claims.** I cannot observe native iOS apps. Any "Airbnb's app uses X ms" without
   a capture is training-recall wearing a number , the exact failure that produced today's corrected
   flatness overclaim. MITIGATION: competitor motion claims are only allowed from (a) an owner recording,
   (b) a Mobbin artifact, or (c) a named public engineering post. Otherwise the file says "not verified".
2. **Research that cannot be implemented.** SwiftUI springs do not map 1:1 to CSS. MITIGATION: every finding
   carries an IMPLEMENTABLE-IN column (web / iOS / both) or it does not enter the law.
3. **A tenth design doc nobody reads.** MITIGATION: the law extends MOTION.md + LOCKFILE rather than
   creating a parallel authority; a genuinely new file only if the research proves a gap.
LOAD-BEARING UNKNOWNS: Q1 (iOS in scope) and Q2 (is 83-167ms right). Cheapest probe for Q1 is the owner;
for Q2 it is a side-by-side the owner feels. Both asked.
OUT OF SCOPE: rebuilding any shipped surface's motion before the law is written and picked.

## CAPTURED, LIVE (2026-07-25) , real computed styles, mobile web, not recall
Method: Playwright, iPhone UA, 390x844, walked the DOM and read computed `transitionDuration` /
`transitionTimingFunction` off up to 3000 elements per page.

| product | dominant durations (count) | easing family |
|---|---|---|
| **X / x.com** (`/60fpsdesign`, 200) | **150ms x105**, 200ms x7 | `cubic-bezier(0.4, ...)` x111 |
| **Airbnb** (`airbnb.com`, mobile) | **300ms x102, 250ms x90**, 100ms x28, 200ms x25 | `cubic-bezier(0.2, ...)` x142 |
| Solen CODE today | 150ms x335, 200ms x127, 300ms x37, 80ms x35 | (mixed) |
| Solen DOCS (`MOTION.md`) | 180 / 260 / 300 / 320 / 420 x3 / 500 / 520 | , |

### THE FINDING THAT CORRECTS MY EARLIER FRAMING
The two references the owner named **do not agree**, and I was about to write "83-167ms everywhere" as law
off the X capture alone. That would have been wrong.
  - **X is fast and uniform** (150ms doing almost everything). It is a feed you SCAN; motion must never
    stand between you and the next post.
  - **Airbnb is slower and TIERED** (300/250 for the big moves, 100 for small feedback). It is a product you
    BROWSE; motion is part of the pleasure, and the reveal is the point.
So "fast = polished" is false. The variable is not speed, it is **matching the speed to the job**, and
Airbnb's spread is the actual model to copy: a fast tier for feedback and a slower tier for reveals.
Re-reading our own numbers against that: our docs are not uniformly wrong, they are **missing the fast
tier** (nothing under 180ms) while being roughly right at the slow end. Our CODE already has the fast tier
(150 x335, 80 x35), which is why the code feels better than the docs would produce.
NOTE: this is computed-style evidence (what the CSS declares), not perceived-motion timing. It corroborates
the 60fps video measurement of the owner's own recording (83ms and 167ms windows) but is a different
instrument, and both are stated rather than merged.

## DEEP MOTION MAP (owner 2026-07-25: "deep research onto where everywhere we should put in motion...
## every button and make me big list of mockups idc if its 100 or 200")
HARD CONSTRAINT the owner set in the same breath, governing the whole map:
**"but dont invent unnececary stuff like based on principle we made"** , every row must TRACE to an existing
rule (the SPEED LAW, or a cited finding in `research/TASTE_MOTION.md`). Where no rule covers a case the
auditor writes NO RULE COVERS THIS and it becomes an owner question, never a guess. A row whose honest
verdict is "no motion needed here" is a CORRECT row: the research is explicit that motion on
frequently-repeated actions, and motion that delays a task, are HARMS.

### Method , 3 read-only auditors in parallel over the customer estate (94 routes)
Each returns: file:line | element | JOB | tier the LAW assigns | what it does TODAY (real class from code)
| verdict OK / WRONG-TIER / MISSING / WCAG-2.2.2 / NO RULE.
  - `_plans/motion-audit/PDP_BOOKING.md`
  - `_plans/motion-audit/HOME_SEARCH_INSPO.md`
  - `_plans/motion-audit/PRIMITIVES_SHARED.md` (highest leverage: one fix propagates estate-wide)

### Defects the research already found, which the map must locate
1. **WCAG 2.2.2 (Level A)** , auto-starting looping motion past 5s beside other content needs a pause/stop.
   Shimmer skeletons, `animate-ping`, `.animate-breathe` cross it whenever an endpoint is slow. An
   accessibility DEFECT, not a taste call, and the most serious thing the research found.
2. **The 420ms ENTER RECIPE** exceeds every citable ceiling for non-full-screen motion and contradicts our
   own new SPEED LAW. Needs an owner side-by-side, not a prose argument.
3. **The easing gap is NAMING, not tokens** , `thud` (0.7,0,0.84,0) already IS the accelerate/exit curve,
   documented press-only. "Exits use thud" completes the vocabulary with zero new values.
- [ ] D1. Merge the three audits into ONE ranked list (the owner's "100 or 200").
- [ ] D2. Fix the WCAG 2.2.2 exposures , Level A, so these lead the list.
- [ ] D3. Resolve the 420ms ENTER RECIPE contradiction with a side-by-side the owner picks from.
- [ ] D4. Document `thud` as the exit curve, zero new tokens.
