<!-- workstream 81: the one that CLOSES design work instead of opening more of it -->
# Why every screen except the salon page looks different, and the plan to fix it

Owner 2026-08-27, two messages. First: *"some places use a background for gray or some places are
weird, there's a lot of inconsistencies, if you switch between categories on the home page the
search bar moves to other places, that should be a permanent spot, there is something like weird
back button sometimes, placement hierarchy is not correct, those stuff, typography too."* Then:
*"not only back arrows, all other stuff, actually think it through, research it, it should be a
multi-hour design improvement session."* Then, seeing me start work without a plan: *"actually
plan, what happened to the planning harness."*

---

## 0. WHAT HAPPENED TO THE PLANNING HARNESS, answered before anything else

**It is a perfect record and it has never once been a queue.** Measured on this file, 2026-08-27:
109 workstream rows, **38 of them design work marked ACTIVE and unclosed.** Several are literally
today's complaint, already written down weeks ago and never finished:

- **#55 HOME + INSPO CHROME**, "sticky search, Airbnb-smooth category switch, chrome" , the search
  bar moving is this row.
- **#47 POLISH DIAGNOSIS**, "why Airbnb reads finished and ours reads unfinished".
- **#52 SCREEN RESEARCH**, every screen archetype, then the change list.
- **#35 Full frontend sweep**, "fix every gap and inconsistency, loop till done".
- Plus #13, #19, #22, #25, #31, #36, #37, #38, #41, #48, #50, #51, #55b, #69, #70.

The index also has **ID collisions**: #30 appears three times, #31, #42, #55 and #62 twice each. So
even the addressing is broken.

**And today I made it worse before he stopped me.** I fired a 13-agent research workflow and began
driving the browser without writing a row, without reading the 38 that were already open, and
without an exists-check. That is the exact failure the harness exists to prevent, committed by the
person maintaining it.

**So this row is not the 39th.** Its first job is to close or fold the other 38.

---

## 1. THE MECHANICAL CAUSE, measured today, and it explains his whole complaint

### (a) One screen has a design. The other nine have a research folder.

`_design-system/sections/` holds ten screen folders. File counts, counted 2026-08-27:

```
salon-detail        21 files   01-hero.md, 02-sticky-tab-nav.md, 03-header.md, ...
booking-datetime     1 file    CORPUS.md
booking-service      1 file    CORPUS.md
booking-staff        1 file    CORPUS.md
checkout-pay         1 file    CORPUS.md
confirmation         1 file    CORPUS.md
home-feed            1 file    CORPUS.md
profile-hub          1 file    CORPUS.md
saved                1 file    CORPUS.md
search-results       1 file    CORPUS.md
```

The salon detail page is the ONLY screen with a per-section specification, and it is the only screen
he likes. The other nine have a corpus of gathered references and nothing that says what the screen
IS. That is not a coincidence to be explained, it is the answer.

### (b) The one automatic check that would have caught the drift has been aimed at a dead port since the day it was wired.

`.github/workflows/quality.yml`, job `floors:` (line 562):
- line 597 starts the site: `npx next start -p 3002`
- line 611 runs the check: `BASE_URL: http://localhost:3001`

Nothing listens on 3001 in that job. `motion:` (line 500) is the job that uses 3001, and it is a
separate job on a separate runner, so the two never share a port.

What the checker does with an unreachable page, `scripts/check-geometry.mjs`:
- line 1610 `page.goto` throws, line 1632 catches it and stores `{ floors: null, error }`
- line 1730 in the gate loop: `if (!entry || !entry.floors) { ... continue; }` and the message it
  prints is its own confession , **"could not be measured ... skipped, not counted as a floor
  failure"**
- `gateFailed` therefore stays false, line 1751 prints **"GATE: PASSED"**, exit 0.

Both port lines were written by the SAME commit, `3f3d09a2a`, 2026-07-28, titled *"Wire gate:floors
into CI. It was never a decision, and it is already green."* The mismatch was there at birth, and
"already green" is precisely what a check that cannot reach a page reports.

**So for 30 days the only thing enforcing the FLOORS LAW across the real site has been passing
because it never loaded a single page.** Design law survives in documents and dies in practice, and
this is the mechanism.

NOT YET EXECUTED, and named honestly: the chain above is read end to end from source, not run.
Playwright cannot launch in this sandbox (chromium dies on `mach_port_rendezvous`, permission
denied), so the empirical control , point BASE_URL at a dead port locally and watch it print GATE:
PASSED , has not been run here. It is step 1 below.

### (c) The chrome measured live, which is what he actually described

At 402 wide on the running site. The category row on the home page is not a filter, it is six links
to six different routes, so "switching category" is a full page change and each page draws its own
chrome.

| what he taps | the search pill | the category row |
|---|---|---|
| `/de` (All) | y 13, h 62, w 368, centred "Suchen" | y 96 |
| `/de/coiffeur` | y 4, h 54, w 370, left icon + "Coiffeur" | y 86 |
| `/de/barbershop` | y 4, h 54 | y 86 |
| `/de/nails` | y 4, h 54 | y 86 |
| `/de/spa` | y 4, h 54 | y 86 |
| `/de/inspo` | y 19, h 62, **w 316**, "Styles suchen..." | y 28 |

Three different search bars in three vertical positions, reached from one row of chips. That is
"the search bar moves to other places, that should be a permanent spot", measured.

Back arrow, same sweep, 11 pages: 44x44 at (16,20) solid white on seven of them; 40x40 at (16,16)
see-through with a 1px ring on the salon page only; none at all on a category page, a search result
page, or Inspo. The fixed bottom bar is identical on all 11.

Gray, measured earlier by hit-testing 5,500 painted points per screen: warum-solen 73.5%, the
salon-owner dashboard 44.3%, and every screen a customer browses between 0% and 4.2%.

---

## 2. THE PLAN, in order, with a binary close condition on each step

Ordered so that each step makes the next one cheaper. Nothing here is a mockup of a new look;
every step either restores a rule that already exists or makes two screens agree with each other in
the direction of the screen he already likes.

- [x] **S1. Make the floors check real again. DONE 2026-08-27, commit `16eb8782e`.**
  Both bugs fixed: the `floors:` job's `BASE_URL` now says 3002, the port its own job serves; and an
  unmeasurable route now FAILS the gate instead of being skipped.
  PROVED by control, not by claim: old code against a dead port exits **0** printing "GATE: PASSED";
  new code, same input, exits **1** printing "GATE: FAILED".
  Corrected while doing it: I had written that Playwright cannot launch in this sandbox. It can. The
  earlier failure was a different script, and the assumption was wrong.
  **THE MEASURED LIST, 15 routes at 390x844 on the live site, floors failed out of six:**
  `/de/salon/cuts-and-culture` **0** - help 1 - notifications 2 - inspo 3 - `/de/coiffeur` 3 -
  `/de/nails` 3 - `/de/spa` 3 - `/de/basel/coiffeur` 3 - salon reviews 3 - warum-solen 3 - `/de` 4 -
  `/de/basel` 4 - profile 4 - profile/settings 4 - `/de/barbershop` 5.
  **The salon detail page is the only page in the product that breaks nothing.** Every other page
  breaks between one and five. His eye and the numbers agree exactly, with no interpretation needed.
  Sharpest single number: on `/de/coiffeur`, `/de/nails`, `/de/spa`, `/de/basel/coiffeur` and
  `/de/inspo` the **largest text on the screen is 14px** against a floor of 28, an anchor ratio of
  1.02x to 1.17x. Those screens have no hierarchy at all, which is his "placement hierarchy is not
  correct", measured.
  STILL OPEN, and it is the bigger half of S1: the gate visits only **three** routes
  (`/de`, `/de/salon/old-town-barbers`, `/de/booking/lookup`) and all ten of their current failures
  sit in `FLOORS_ALLOWLIST`. So even with the port right it was toothless. Widening the route list
  will fail CI until the surfaces are fixed, which is why it is not armed in the same breath as the
  port fix. That widening is the first thing S4 earns.

- [ ] **S2. Chrome becomes one component, not six.** The search pill and the category row are
  cross-screen furniture, and this project's own FLOORS LAW 8 already says an entity on more than
  one screen renders through the same component. Today they are re-implemented per route family.
  CLOSE CONDITION: the pill's measured y, height and width are identical on `/de`, all four category
  routes, and `/de/inspo`, verified by re-running the live sweep in section 1(c).
  HIS CALL, one line, not a stop: WHICH position wins. Plan A is the home page's (y 13, h 62), since
  it is the first thing anyone sees. Plan B is the category page's (y 4, h 54), which buys 8px of
  content. I will take Plan A if he says nothing.

- [ ] **S3. Back arrow becomes one rule.** Standard is the 44x44 at (16,20) that seven pages already
  use. The salon page KEEPS its see-through 40x40, as a named variant, because a solid white circle
  on a photo reads heavy and that page is the benchmark. The three pages with none get one.
  CLOSE CONDITION: every page that is not a bottom-tab destination has a back control, and the sweep
  returns exactly two variants, on-photo and on-white, with nothing else.
  DONE 2026-08-27, and it is the measurement half, not the close: reading every back control out of
  shipped source gives **13**, in 4 box sizes (32/36/40/44), 4 icon sizes (16/18/20/22), 2 glyphs
  and 6 fill treatments. The shared `BackButton` primitive is imported by exactly ONE screen
  (SalonHero) while 21 files draw their own inline, and the primitive itself contradicts his dated
  2026-08-03 pick: it is 40px white with a hairline, his is a 44px `#F2F2F2` circle at 0px border.
  Three of the 13 sit under the global header, which `REMOVED.md:22` already deleted on purpose, so
  those are removals not restyles; one is 32px, under the 44px touch floor. All 13 are on one page,
  at real size, no tap needed: `public/_mockups/compare-back-arrow/index.html` (`58c0d98de`),
  verified rendering at 402x844.
  STILL OPEN: nothing has moved in the product. The sweep still returns 13 variants, not 2.

- [ ] **S4. Write the nine missing screen specs.** Use `salon-detail`'s 21 files as the template,
  since that is the shape that produced the screen he likes. Each of the nine gets its sections
  named, its type scale fixed, its surface decided, and its card anatomy pinned to the registered
  component.
  CLOSE CONDITION: ten folders, each with a per-section spec, and each spec's numbers matching what
  the live page actually renders.

- [ ] **S5. Fold the 38 rows.** Every one of them is either finished, superseded by a spec written in
  S4, or genuinely still open. Mark each. Fix the duplicate IDs.
  CLOSE CONDITION: the ACTIVE design row count is under 10 and every survivor names what it is
  waiting on.
  DONE 2026-08-27 (`4bc731360`): 35 rows audited against the CODE, not against their own detail
  files. **20 closed** , FINISHED 4/19/36/37/38/41/47/64/68/78/104/107/109, SUPERSEDED 22 by 13,
  42 by 43, 52 and 55 by 81, 69 by 70, DEAD 35 and 53. Every one of the 15 survivors now carries a
  WAITING ON line naming one concrete blocker, and 9 of those blockers are one word from him.
  Index recount: 21 CLOSED, 48 ACTIVE across all workstreams.
  STILL OPEN: **14 design rows** are still ACTIVE against a target of under 10, and roughly 5 design
  rows were never handed to an audit. Those five need judging, and then the survivors that wait only
  on him need to be put to him as one list rather than fourteen.

- [ ] **S6. Then and only then, the look.** Gray, the dashboard direction, typography. Those are
  taste calls and they are his. They are LAST on purpose: fixing them before S1 to S4 means fixing
  them once per screen forever.

---

## 3. RESEARCH RUNNING

Workflow `wf_b64ddc3e-e45`, 13 agents. Five going OUT to primary sources (Airbnb chrome behaviour,
Apple and Material law on back affordances, surface-versus-tray decision rules, what is actually
published about type discipline as opposed to folklore, and the one-entity-many-screens literature).
Six mapping our own code by subsystem. One arbiter colliding the halves.

It feeds S2, S3 and S4. It does not gate S1, which is a one-line fix to a proven bug.

---

## 4. WHAT IS HIS AND WHAT IS NOT

MINE, no asking: S1 in full, S5 in full, the back arrow rule in S3, and every place two screens are
made to agree in the direction of the salon page.

HIS, and both arms decided in advance so none of them is a stop: the search pill's winning position
(S2, Plan A unless he says otherwise), whether the dashboard goes white, and which dashboard
direction. Those three are already written up in `_plans/SETTINGS_INSTA_GRAY.md`.

---

## S7. The wide mockup pass, and both arms of every fork decided up front

Owner 2026-08-27, on the first pass being ten agents wide: *"why one per screen didnt we fix ths in
harness only one agent is too low u need to run tons tons bro are u dunb why is this happening
again"*. He is right and the mechanical cause is recorded in section 0b below.

**His answer to the one question asked before this loop started:** SAME LADDER EVERYWHERE. Every
screen is pulled onto the salon detail page's exact numbers, not merely pushed over the failing line.

### The ladder, stated as numbers a builder can apply without asking

Read off `/de/salon/cuts-and-culture`, the only route in the product that clears all six floors and
the one screen he says he likes:

| axis | the number | measured on the salon page |
|---|---|---|
| display anchor | >= 28px, and 30px is the house value | 30px |
| body | 14px | 14px |
| anchor ratio | >= 1.8x | 2.14x |
| distinct sizes on one screen | at most 5, and at most 4 inside any 8px window | 5 distinct, densest 4 |
| text at weight >= 600 | at most 30% | 30% |
| what carries emphasis | size and colour, weight 500 not 600 | Airbnb runs 3.1% at >= 600 |
| distinct shadows | at least 2 | 3 |
| photographic share of the first screen | >= 33%, by real salon content only | 34.66% |

### The forks, both arms decided now

- **A variant only looks different and moves no number.** PLAN A: the critic kills it and it is not
  shown to him. PLAN B, if a whole screen's five variants are all cosmetic: that screen's failure is
  structural, not stylistic, so it goes to the recompose arm alone and the file says so in one line.
- **A screen cannot clear the imagery floor without content he has not approved.** PLAN A: show the
  arrangement using real seeded salons and mark it as his call at the bottom of the page. PLAN B, if
  there is genuinely no salon content for that surface (Why Solen, notifications): declare the floor
  inapplicable in the file with the reason, do not invent a photo, and do not silently skip it.
- **The critic cannot render because the browser pane is busy.** PLAN A: it says so and grades from
  the file. PLAN B: the orchestrator re-renders the three highest-value comparison pages itself
  before handing over any link, since the Stop gate refuses an unmeasured mockup link anyway.
- **Two screens fix the same floor by two different mechanisms.** PLAN A: that is a defect in the
  set, not taste, and the arbiter picks one mechanism for both. PLAN B, if the two screens genuinely
  differ (Barber has content, Coiffeur does not): it is a documented VARIANT of one rule, named as
  such, per FLOORS LAW 8.
- **He rejects the ladder once he sees it.** PLAN A: the ladder is the only thing that changes, so it
  reverts by dropping one stylesheet per screen. PLAN B: fall back to the "just clear the line"
  option he did not pick, which is already built as variant A on every screen.

### 0b. Why the harness did not stop a ten agent fan-out

`~/.claude/hooks/fan-out-not-one-agent-gate.py` exists, he asked for it by name on 2026-08-03
(*"ye 12 and 40, but in any othr sub agent work i wanr alot of agents, make a whole gate for that"*),
and it IS registered in settings.json at line 492. Two holes, both measured this turn:

1. **Its matcher is `Agent`, not `Agent|Workflow`.** The fan-out went through the Workflow tool, so
   the check never ran. Every other gate that needs to see both is registered as `Agent|Workflow`
   (`no-opus-subagent-gate.py`, `no-overstep-launch-gate.py`), so this one is the odd one out.
2. **It only refuses ONE agent.** It has a ceiling on bigness and no FLOOR on width, so ten agents on
   a job he sized at forty passes it silently. His own numbers, 12 and 40, were never encoded.

Both fixed this turn in the existing file rather than a new one.
