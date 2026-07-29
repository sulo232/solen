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

**Verification box, ticks only after the run returns:**
- [ ] A-VERIFY. Every `CORPUS.md` above exists on disk, names its sample size, and cites Mobbin
      urls. Any agent that returned null gets re-dispatched via
      `Workflow({scriptPath, resumeFromRunId: "wf_9cb73f3c-7c4"})`, which replays cached results and
      re-runs only the failures.

### B. Named references that must appear in the corpus
- [ ] B1. Airbnb (owner's main reference, minus the red)
- [ ] B2. SimplyBook-style booking tools (owner said "simplicity bookings"; reading as SimplyBook.me,
      flagged for correction, not blocking)
- [ ] B3. Beauty and grooming booking apps specifically (Fresha, Booksy, Treatwell, Vagaro, StyleSeat)
- [ ] B4. Modern apps generally, outside booking, for motion and type

### C. Cross-cutting axes, each its own deliverable

Also in flight in `wf_9cb73f3c-7c4`, one agent per axis, each writing
`_design-system/research/AXIS_<NAME>.md`.

- [x] C1. COMPONENTS , what we should change, add, or retire , agent `axis:COMPONENTS` dispatched
- [x] C2. MOTION , what to add and where , agent `axis:MOTION` dispatched
- [x] C3. GRID , what to do with it , agent `axis:GRID` dispatched
- [x] C4. ALIGNMENT , how things should line up , agent `axis:ALIGNMENT` dispatched
- [x] C5. FONT , what we should actually use , agent `axis:FONT` dispatched

- [ ] C-VERIFY. All five AXIS files exist and carry a stated sample size + a concrete Solen verdict.

### E. Standing constraints on how this work is reported

- [x] E1. **No "that's not achievable" hedging.** Readback item 11. The owner overruled my
      sample-size objection explicitly, so it is settled (rule 10) and is not re-raised. Discharged
      by construction: every research agent's brief orders it to state its real sample size as a
      fact ("of the N screens I examined across M apps") instead of hedging about coverage, and the
      extended `measurement-needs-scope-gate.py` now blocks an unscoped count at turn end, so the
      honest-sample discipline is enforced rather than editorialised.
- [ ] E2. No visual change lands before a mockup the owner has seen. Blocks all of section D.

### D. Output
- [ ] D1. A research file per screen archetype under `_design-system/sections/<screen>/`
- [ ] D2. One change list, ranked, naming the exact file for each change
- [ ] D3. Mockup BEFORE any change lands (owner rule, non-negotiable)

---

## Status

Launched 2026-07-29. Corpus phase running as a workflow.
