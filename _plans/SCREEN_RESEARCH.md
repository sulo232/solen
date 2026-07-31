<!-- exists-check: _design-system/sections/ already holds per-section specs for ONE screen
     (salon-detail, 21 files). This workstream EXTENDS that structure to every other screen rather
     than inventing a parallel one. Also checked: _design-system/research/ (TASTE_*.md are
     axis-level, not per-screen), _design-system/references/ (empty), public/_pixel-refs/fresha/
     (empty). REMOVED.md: no hits. The genuinely new piece is the per-screen CORPUS research, a
     wide sweep of real apps per screen archetype, which nothing in the estate has ever done. -->

# SCREEN RESEARCH , wide corpus sweep, every screen, then the change list

**Owner, 2026-07-29, verbatim:** *"Stop being lazy and actually research, like, so many booking
apps. Like, modern ones... Like, Airbnb and, like, simplicity bookings and not only booking, but
those booking apps generally, and also the PDP page or any pages, and how they do it. What we
should change, like, component wise, how we should add, like, motion or design... what we should
do with the grid. How we should align, fucking places of our font we should use and all of that.
And stop the laziness saying oh it's exhausted."*

**Overruled, and recorded so it is not re-argued (rule 10):** I raised that Mobbin returns at
most 30 screens per call and that its corpus is curated rather than complete. He overruled it.
The call is settled: sweep wide, paginate, report the sample honestly, do not hedge.

## The anchor fact this workstream is built on

`_design-system/sections/` contains exactly ONE subdirectory, `salon-detail`, with 21 per-section
spec files. It is also the only screen in the entire product the owner says he likes. Every other
screen was drawn rather than specced. This workstream extends that structure outward.

---

## The asks, atomized

### A. Corpus research, per screen archetype

**ALL OF SECTION A IS IN FLIGHT**, dispatched 2026-07-29 as workflow run `wf_9cb73f3c-7c4`, one
agent per archetype running in parallel. Each agent runs >= 8 distinct Mobbin searches across iOS
and web, examines the returned screenshots, and writes `_design-system/sections/<key>/CORPUS.md`.
These boxes tick when that file exists on disk and carries a stated sample size. That is the binary
close condition, not "the agent said it was done".

- [x] A1. Salon PDP / listing detail , agent `corpus:salon-detail` dispatched
- [x] A2. Home / discovery feed , agent `corpus:home-feed` dispatched
- [x] A3a. Search RESULTS list anatomy , agent `corpus:search-results` dispatched
- [x] A3b. Search FILTER controls (chips, sort, price) , same agent, explicit sub-target in its brief
- [x] A4. Booking step: service selection , agent `corpus:booking-service` dispatched
- [x] A5. Booking step: staff / provider selection , agent `corpus:booking-staff` dispatched
- [x] A6a. Booking DATE control (strip vs calendar) , agent `corpus:booking-datetime` dispatched
- [x] A6b. Booking TIME slot grid , same agent, explicit sub-target in its brief
- [x] A7. Checkout / payment , agent `corpus:checkout-pay` dispatched
- [x] A8. Booking confirmation , agent `corpus:confirmation` dispatched
- [x] A9. Profile / account hub , agent `corpus:profile-hub` dispatched
- [x] A10. Saved / favorites , agent `corpus:saved` dispatched

**Verification box:**
- [x] A-VERIFY. **DONE 2026-07-29.** `verified: b0bbf8118` , all 10 files listed with `wc -l` and citation
      counts before ticking; e.g. `_design-system/sections/search-results/CORPUS.md:1` exists at 196
      lines with 233 mobbin.com/screens links. All 10 `CORPUS.md` exist on disk, each naming its sample size
      and citing Mobbin urls. Verified by listing the files and counting citations, not by trusting
      the agents' self-reports. 0 agents errored, 0 returned empty. Line counts: booking-datetime
      198, booking-service 419, booking-staff 298, checkout-pay 189, confirmation 171, home-feed
      183, profile-hub 392, salon-detail 181, saved 180, search-results 196. **781 unique Mobbin
      screen urls** cited across the corpus plus axis files plus the change list. Em-dash count
      across all of it: 0 (6 were found in booking-datetime and stripped).

### B. Named references that must appear in the corpus

- [x] B1. `verified: counted across all 16 output files , Airbnb appears in 16/16, 365 mentions,
      158 lines carrying a cited mobbin screen url. Measurement quoted in AXIS_ALIGNMENT.md §6,
      my own live addendum at §7.` **Airbnb , COVERED, and it is the deepest lens in the whole sweep.** Present across every
      archetype. The alignment axis pixel-measured 9 Airbnb account rows (worst-case spread 1.0
      preview px, mean 0.39) and that measurement is what settles the row dispute.
- [x] B2. `verified: SimplyBook.me appears in 5/16 files, 10 mentions, and exactly ONE line carries
      a screen url , sections/confirmation/CORPUS.md:23 , which is an ABSENCE statement whose url
      points at the Fresha screen that came back instead. Zero SimplyBook.me screens exist in the
      corpus.` **SimplyBook.me , BLOCKED, and the blocker is concrete: Mobbin has no screens for it.**
      Every named search across every agent returned zero on-archetype results for SimplyBook.me.
      This is not an agent skipping work, it is an absence in the corpus. Two ways forward, and I
      am not picking silently: capture it live via `Skill(reference-lock)` against their real
      product, or confirm "simplicity bookings" meant a different product. **Needs one line from
      the owner.** Recorded, not buried.
- [x] B3. `verified: counted across all 16 files. OBSERVED , Fresha 16/16 files, 575 mentions, 235
      cited screen urls; Square Go 11/16, 95 mentions, 36 cited urls. ABSENT , Booksy 23 mentions /
      2 url-bearing lines, Treatwell 24/2, Vagaro 18/2, StyleSeat 19/2, Squire 14/2, Mindbody 19/2,
      and each of those url-bearing lines is an absence statement (confirmation/CORPUS.md:23,
      home-feed/CORPUS.md:39) whose url points at what returned INSTEAD.` **Beauty and grooming , PARTIAL, and the shortfall is named rather than smoothed over.**
      Observed: **Fresha** and **Square Go**. Returned zero screens: **Booksy, Treatwell, Vagaro,
      StyleSeat, Squire, Mindbody**. So the corpus is strong on marketplace and booking mechanics
      generally and thin on our exact vertical. Every conclusion drawn from a beauty-specific
      pattern carries that caveat in the source file. Same two ways forward as B2.
- [x] B4. `verified: cited-screen-url line counts , Uber 71, Resy 51, Calendly 22, Revolut 11,
      OpenTable 11, Stripe 7, Linear 4. All non-booking or adjacent, all with real screens.` **Modern apps generally , COVERED.** Uber, Revolut, Linear, Stripe, OpenTable, Resy,
      Calendly and others appear across the archetype and axis sweeps, which is where the motion and
      type findings mostly come from.

### C. Cross-cutting axes, each its own deliverable

Also in flight in `wf_9cb73f3c-7c4`, one agent per axis, each writing
`_design-system/research/AXIS_<NAME>.md`.

- [x] C1. COMPONENTS , what we should change, add, or retire , agent `axis:COMPONENTS` dispatched
- [x] C2. MOTION , what to add and where , agent `axis:MOTION` dispatched
- [x] C3. GRID , what to do with it , agent `axis:GRID` dispatched
- [x] C4. ALIGNMENT , how things should line up , agent `axis:ALIGNMENT` dispatched
- [x] C5. FONT , what we should actually use , agent `axis:FONT` dispatched

- [x] C-VERIFY. **DONE 2026-07-29.** `verified: b0bbf8118` , all five opened this turn, line counts read
      from disk, not from the agents' self-reports. All five exist and were opened, not trusted:
      `AXIS_ALIGNMENT.md` 546 lines, `AXIS_COMPONENTS.md` 863, `AXIS_FONT.md` 416, `AXIS_GRID.md`
      446, `AXIS_MOTION.md` 483. Each carries a stated sample and a Solen verdict naming files or
      tokens. ALIGNMENT additionally carries a measured addendum on our own live product (section 7).

- [x] C4-SETTLED. **The row-alignment dispute is closed, measured, and I was wrong.** Owner said our
      list-row icons, text and arrows were not at the same heights the way Airbnb does it; I told
      him that was correct as built. Measured live at 390x844: `/de/profile/settings` 11 rows all at
      **0.0px**, but the two-line Dashboard row in the `/de` mobile menu sits at **+10.0px** for
      both the icon and the chevron. Single-line rows 0.0, two-line rows 10.0, no overlap. Cause:
      `align-items: center` centres satellites on the whole two-line block instead of the title line,
      so the bug is invisible on any screen made only of single-line rows, which is exactly the
      screen I checked before answering him. Evidence: `_design-system/research/AXIS_ALIGNMENT.md` §7.

### E. Standing constraints on how this work is reported

- [x] E1. **No "that's not achievable" hedging.** Readback item 11. The owner overruled my
      sample-size objection explicitly, so it is settled (rule 10) and is not re-raised. Discharged
      by construction: every research agent's brief orders it to state its real sample size as a
      fact ("of the N screens I examined across M apps") instead of hedging about coverage, and the
      extended `measurement-needs-scope-gate.py` now blocks an unscoped count at turn end, so the
      honest-sample discipline is enforced rather than editorialised.
- [x] E2. **HELD.** Zero visual changes landed this turn. Research and measurement only. The one
      product file touched in this workstream is none; the alignment defect is recorded, not fixed.

### D. Output

- [x] D1. **DONE.** Ten research files, one per archetype, under
      `_design-system/sections/<screen>/CORPUS.md`. Counts and citation totals in A-VERIFY.
- [x] D2. **DONE.** `_design-system/research/CHANGE_LIST_2026-07-29.md`, 1048 lines: ten changes
      ranked by how fast the owner would notice them, each naming the exact file to edit and its
      corpus evidence, then a direct answer per axis (COMPONENTS, MOTION, GRID, ALIGNMENT, FONT), a
      what-not-to-copy section, and an honest limits section.
- [x] D3. **ARMED, not yet due.** No change has been proposed for application, so nothing is waiting
      on a mockup yet. This box converts into the blocking gate for the NEXT phase: the first item
      off the change list gets a mockup before any product file is edited. Tracked as the open item
      on this workstream's row in ACTIVE.md.

---

## Next phase, not started, needs the owner

1. **Pick which change to build first.** The change list is ranked, but the ranking is my read.
2. **Answer B2:** was "simplicity bookings" SimplyBook.me? Mobbin has zero screens for it either way,
   so if it matters it needs a live capture rather than a corpus search.
3. Then: mockup, approve, build, verify. In that order, every time.

---

## Status

Launched 2026-07-29. Corpus phase running as a workflow.

---

## OWNER DIRECTION, 2026-07-29, after rejecting the injected-diff mockup

He said "no not at all do u even know what i want u to do", then answered four questions.
These four answers govern everything that follows. I got the format wrong twice before this.

| question | his answer |
|---|---|
| what a finished screen should be | **Static images, several options side by side.** Rendered pictures of 3 or 4 different directions per screen. NO interaction, NO tap-through prototype. He picks a direction before anything gets built. |
| how far from what ships today | **Start from the best apps, rebuild the flow.** The corpus anatomy is the target. Our current screen is INPUT, not a constraint. Steps may merge, split, or reorder. |
| which screen first | **Home.** |
| how much motion | **"research"** , he wants motion RESEARCHED, not built into these. Motion is a separate deliverable, not part of the static options. |

### What this kills, so it is not attempted a third time

- The injected before/after diff on the live route. Built 2026-07-29, rejected. It restyles the
  existing structure and therefore cannot show a rebuilt one. `public/_mockups/booking-structure/`
  stays on disk as a working reference for the injection MECHANISM, but it is not the format.
- A tap-through animated prototype. He explicitly did not pick that option.

### The next unit of work, stated so a fresh session can start cold

Build **3 or 4 static home-screen directions, side by side, as rendered images**, each derived
from the measured corpus anatomy in `_design-system/sections/home-feed/CORPUS.md`, not from our
current home. Anchor facts already measured there: a search entry in the top zone appears in 29 of
34 screens, a category shortcut strip in 24 of 34, titled sections as horizontal carousels in 26 of
34, provider card with photo above text in 16 of 19, and a decorative hero photograph in **0 of
34**, which is the single most useful finding for our home.

Deliver as ONE page showing the options next to each other so he can compare at a glance, with a
cloudflare tunnel link. Motion is researched separately and is not part of these images.

---

## OWNER CORRECTION, 2026-07-30: the research answered the wrong question

Verbatim: *"the whole research, I wanted to do that to actually understand why they're doing this
instead of this... understand the concept behind each Mobbin, the concept, the principles that
they're using, what we can learn from if we're already using this and that... I want you to
actually reason each step that you're taking... I want you guys to show me more direction... I
think you're just combining everything else. I want you to actually think, and the relations."*

**What I delivered and why it missed.** Frequency counts. "29 of 34 put search in the top zone."
That says what is COMMON. It says nothing about WHY, cannot be argued with, and cannot be learned
from. Worse, it flattens every app into one vote, as if Airbnb and Fresha were solving the same
problem. They are not: Airbnb sells a PLACE so the photograph is the product and the card is mostly
image; Fresha sells an APPOINTMENT so the price and the time are the product and the photo is only
reassurance. Opposite bets. My "photo above text, 16 of 19" erased that distinction entirely, which
is exactly the combining-everything he named.

- [x] C6. `verified: _plans/SCREEN_RESEARCH.md` this section, plus the run brief at
      `.claude/../workflows/scripts/home-why-derived-wf_a172a45e-0ed.js` which carries the owner's
      correction verbatim and forbids frequency counts by name.` CORRECTION: the research must
      explain WHY, not count WHAT.
- [x] C7. DONE, `verified: public/_mockups/home-directions-v2/index.html`, 8 directions E to L, run `wf_a172a45e-0ed`, Derive phase. **More directions than four.** He asked for this twice. Four was my number, not his. The
      next round produces more, and they are grouped by the REASONING behind them rather than by
      which app they came from.
- [x] C8. Reason out each step in the reply. `verified: done in the 2026-07-30 replies, which
      explain why the phone bug happened, why my six invented bets were discarded, why these four
      lenses, why both sides always stand, and why a Relations phase exists.`
- [x] C9. DONE, `verified: 5 WHY_*.md files, 16 positions across 4 lenses, each argued both ways`, run `wf_a172a45e-0ed`. The four-answer requirement (problem, cost, which
      product it suits, where Solen sits) is written into the shared BRIEF of every lens agent, so
      it cannot be skipped per-pattern.
- [x] C10. DONE, `verified: _design-system/research/WHY_RELATIONS.md, 6 forced pairs with mechanisms`, run `wf_a172a45e-0ed`, dedicated Relations phase writing
      `_design-system/research/WHY_RELATIONS.md`: forced pairs with mechanisms, incompatible pairs,
      only-together pairs, and the single most load-bearing choice.

### Status of C7, C9, C10, stated concretely rather than as a pause

All three are IN FLIGHT in workflow run `wf_a172a45e-0ed`, relaunched 2026-07-30 after its first
attempt returned `API Error: 529 Overloaded` on all 7 agents with zero output. That is an Anthropic
capacity error, not a script defect, so the response is a retry on the same run id (partial work
caches) rather than a redesign. They tick when the files exist on disk:
  `_design-system/research/WHY_ENTRY.md`, `WHY_CURRENCY.md`, `WHY_RETURN.md`, `WHY_DENSITY.md`,
  `WHY_RELATIONS.md`, and `public/_mockups/home-directions-v2/{why.html,index.html}`.

---

## OWNER ASK, 2026-07-31: two pages, not one

He wants the single page split in two, and gave the references himself.

- [~] H1. IN FLIGHT, run `wf_be365c3b-019`, 4 home agents dispatched. HOME stays /de per his ruling.
- [~] H2. IN FLIGHT, same run. Removal is a hard requirement in every home agent's brief, not a suggestion.
- [~] H3. IN FLIGHT, 4 directions: hA stacked, hB collapsed pill, hC search-owns-the-bar, hD category-led.
- [~] H4. IN FLIGHT, 3 landing agents. Route /de/discover per his ruling; hero exempt per his ruling.
- [~] H5. IN FLIGHT, required in all 3 landing briefs; lC makes it structural rather than a footer block.
- [~] H6. IN FLIGHT. The 243px measurement is in the shared brief and each direction must STATE its
      navigation answer in its own note; a direction that leaves it implied is defined as failed.
- [~] H7. IN FLIGHT, compose agent writes home.html and landing.html, cross-linked.

**MEASURED on /de at 390x844 before any design, 2026-07-31:**

| element | number |
|---|---|
| header height | 84px, sticky, transparent |
| logo | 28px type, 71px wide, x=16 |
| hamburger | 44x44, x=330 |
| gap between logo and burger | **243px** |
| h1 "Termine, sofort bestätigt." | 31.2px / 700, y=124 |
| subline | 18px, y=170 |
| search stack | 358x250, y=218 to y=468, four 46px rows |
| first salon card | **y=842**, one pixel below an 844px fold |

**His navigation worry is arithmetically correct.** A pill sandwiched between logo and burger gets
243px minus its own padding. Airbnb does not sandwich: it STACKS, logo row then a full-width search
row. That is the hypothesis each direction tests differently.

**PREMORTEM, named before dispatch:**
1. Inventing a search bar instead of cloning the real one. DRIFT_LEDGER 2026-07-03 records exactly
   this. Every direction must reuse the real `SearchBar` markup, not redraw it.
2. Shipping a navigation pattern he already rejected. Bottom bar is banned by name; each direction
   must state its navigation answer explicitly rather than leaving it implied.
3. **A genuine conflict I will not resolve silently:** he asked for the Airbnb /discover imagery
   treatment on the LANDING page, and FLOORS LAW 2 forbids a decorative hero (0 of 34 home screens
   carried one). The floor is scoped to browse/discovery/PDP surfaces. A logged-out landing page is
   a different animal from a browse feed, so I read the floor as not binding there, but it is the
   owner's call and it is surfaced rather than assumed.

OUT OF SCOPE: touching any real `.tsx`. These are mockups to pick from.

### H1 to H7 status, concretely rather than as a pause

All seven are IN FLIGHT in workflow run `wf_be365c3b-019`, dispatched 2026-07-31: 4 home agents,
3 landing agents, 1 compose agent. They tick when the files exist on disk:
  `public/_mockups/home-landing-split/{hA,hB,hC,hD,lA,lB,lC}.html` plus `home.html` and
  `landing.html`.
Two owner rulings are baked into the brief and must not be re-litigated: home STAYS at /de with the
landing page at /de/discover, and the landing page is EXEMPT from FLOORS LAW 2's hero ban, his call,
dated 2026-07-31.

---

## OWNER ASK, 2026-07-31 (later): rebuild home on the Airbnb header structure

- [~] J1. IN FLIGHT wf_acd17e97-259. Header = search bar on TOP, category icons BELOW it (Airbnb structure)
- [~] J2. IN FLIGHT wf_acd17e97-259. Icons COLLAPSE into the bar as you scroll
- [~] J3. IN FLIGHT wf_acd17e97-259. Remove "Für dich" and "Top auf Solen" sections
- [~] J4. IN FLIGHT wf_acd17e97-259. Add "popular in <city>" (Barber in Zurich, etc) from REAL data, not hardcoded
- [~] J5. IN FLIGHT wf_acd17e97-259. Add a logged-in personal section driven by Hair DNA
- [~] J6. IN FLIGHT wf_acd17e97-259. Add a cities section
- [~] J7. IN FLIGHT wf_acd17e97-259. Keep the existing footer
- [~] J8. IN FLIGHT wf_acd17e97-259. Give IDEAS for where the hamburger menu goes, do not just pick one
- [~] J9. IN FLIGHT wf_acd17e97-259. Reuse OUR existing search bar design, refreshed with Airbnb-clean shadows
- [~] J10. IN FLIGHT wf_acd17e97-259. Several directions, not one. Do not invent; ground everything.

Airbnb reference measured from his screenshot: search button 342x56, full-width pill, heavy
white surface with a soft shadow, category tabs directly beneath, tabs collapse on scroll.

---

## OWNER ASK, 2026-07-31 (late): pushback with degrees, and audit my subagent use

- [ ] K1. Prove the harden work is actually thought through, not gates that break again
- [ ] K2. Push back with DEGREES: opinion, partial agreement, disagreement, not binary yes-man
- [ ] K3. Research whether I use subagents correctly, and WHEN and HOW they should be used

**My live pushback on K1, stated before any research so it is not hindsight:** 156 gates is now
itself the defect. 7 are currently disabled by skip flags, 37 share one blind spot, and gate
satisfaction consumes more of a turn than the work does. Each gate was locally correct; the
aggregate is not. I would argue for merging or deleting roughly half.
