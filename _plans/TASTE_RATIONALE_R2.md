# Taste rationale ROUND 2: reference-driven expansion (owner 2026-07-16)

Owner message (dictated): fix + commit; expand RATIONALE.md with the og round-1 digest + a round-2 digest from another AI; give an opinion on it; capture ~30 X reference links with the ss/spec pipeline (never eyeball); run opus sub-agents for more ideas; build mockups that apply the references to real Solen surfaces WITH the liked-aspect forks named (because "u might grasp the wrong part of the refference"); think how to integrate and show it in the mockups.

## Atomic boxes

- [x] Fix the parked calendar range copy ("13. bis 19. Juli" per approved panel) , verified: commit 06ea0b14b, line 857
- [x] Fix the empty staff-name fallback after "Mitarbeiter:" , verified: commit 06ea0b14b, existing calendarPage.anyStaff key reused, all 4 locales confirmed present
- [x] Download all 30 X references , verified: 30/30 in manifest.json after curl retry pass (6 urllib IncompleteReads retried OK), 19 videos got 3 ffmpeg frames each
  - [x] count check , verified: public/_mockups/_assets/taste-refs/manifest.json "fetched": 30, "failed": [] (commit 733888b74)
- [x] Spec-extraction ran over all primary stills , verified: 31 outdirs; tier-1 card detection failed on every borderless portfolio render (expected per the trigger table), tier-2 inline PIL sampling by the analysis agents took over
- [x] Analysis agents read every reference , verified: 4 sonnet agents (one wave of 4), 30/30 refs with SHOWS/MEASURED/FORKS/SOLEN-MAP blocks + syntheses, persisted to research/TASTE_REFS_2026-07.md
- [x] Opus judges ran (2, generative lens + diagnostic lens) , verified: converged verdicts (stack is analytic-not-generative; floors are prose-not-computed), 9+10 ranked gaps recorded as RATIONALE.md section 28, kill-lists honored in the integration
- [x] Opinion delivered , verified: closing message of 2026-07-16 + the kill-list recorded in RATIONALE.md status header (commit 676c5553c) (kept: systems layers; cut: RTL/CJK, deep data-viz, ISO 9186; named failure mode: doc bloat, countered by the gates-over-prose build order)
- [x] Expand RATIONALE.md with round-2 material, no duplication , verified: commit with sections 16-28, all sub-items below in that diff:
  - [x] Domain 0: epistemic stance (Polanyi lossy externalization, Hume true-judge, repertory grid as the Taste Lab mechanism; COMPACT, not an essay) , verified: commit 676c5553c
  - [x] Domain: cognition + signifiers (Norman signifiers, gulfs, cognitive load, information scent, progressive disclosure, memory effects with replication flags, ego depletion DEAD) , verified: commit 676c5553c
  - [x] Domain: depth/light/materiality (light-from-above prior, key+ambient two-layer mapping to our elevation stacks, positive-polarity advantage T1, flat-design signifier cost NN/g 22/25 numbers, translucency legibility caveat) , verified: commit 676c5553c
  - [x] Domain 2 extension: token architecture (3-tier, Radix 12-step job map, semantic naming, i18n hue boundary note) , verified: commit 676c5553c
  - [x] Domain: states + feedback mechanics (focus-visible distinction, disabled-button argument vs our opacity-50 lock = TENSION for probe, validation timing, skeleton nuance flag, progress-bar perception Harrison 2010, labor illusion cross-ref to PSYCHOLOGY.md) , verified: commit 676c5553c
  - [x] Domain: forms (top-aligned labels + Penzo caveat + Das null replication, single column, autocomplete/inputmode, placeholder-as-label ban mechanics) , verified: commit 676c5553c
  - [x] Domain: icons (24/20 grid + keylines, optical volume, icon+label NN/g, ISO 9186 flag) , verified: commit 676c5553c
  - [x] Domain: data display (Cleveland-McGill ranking + Heer-Bostock replication, bars-start-at-zero / line-truncation rule, data-ink, table alignment mechanics, zebra-striping marginal flag) , verified: commit 676c5553c
  - [x] Domain 4 extension: typographic craft (punctuation incl. the DELIBERATE em-dash-ban departure, widows/text-wrap, font-display/CLS, variable-font opsz/GRAD, system-stack tradeoff) , verified: commit 676c5553c
  - [x] Domain: composition vocabulary + Swiss style heritage (rule-of-thirds folklore flag) , verified: commit 676c5553c
  - [x] Domain: voice/tone mechanics (NN/g 4 dimensions, voice-constant-tone-variable, no-dead-ends, Aaker; cross-ref LOCKFILE brand voice) , verified: commit 676c5553c
  - [x] Domain: ethics as taste (Brignull taxonomy, DSA Art. 25, CPRA; cross-ref PSYCHOLOGY.md hard lines, no duplication) , verified: commit 676c5553c
  - [x] Domain 9 extension: sourced expansion buckets (W3C/IBM by string length), Swiss 1'000 grouping mechanic (locale-native via de-CH), RTL/CJK boundary notes , verified: commit 676c5553c
  - [x] Folklore table additions: 10,000-hour rule, 3-click rule, 8-second attention span, rule of thirds, ego depletion, Doherty dramatization already present , verified: commit 676c5553c
  - [x] Entry template: add the BOUNDARY/reversal-condition field (round-2's four-part test) , verified: commit 676c5553c
- [x] Build the reference mockup page , verified: public/_mockups/taste-refs/index.html committed, rendered proof 31/31 images + 17 probes + 5 conflict cards (public/_mockups/taste-refs/) , per-theme probes: reference still + named fork branches (A/B what you might have liked) + the treatment applied to a COPY of the real Solen surface; resurrection-gate signatures respected
- [x] WORKLOG entry + plan boxes ticked + per-chunk commits (TASTE_LOG waits for the owner's picks, elicitation is open, no settled decision to log yet)
- [x] Closed with clickable tunnel links (probe page + rationale summary in the final message)


## Round 2b: integrated tappable pages (owner 2026-07-16: "mockups for the round 2" + "each one in acc pages... integrated and tappable")

- [x] Base captures of the real pages , verified: public/_mockups/_assets/taste-round2/ base-dashboard.png (dev-login, PIL-measured), base-termine.png (consent-seeded rerun), base-home-mobile.png, base-home-full.png, base-loyalty.png (shows loyalty = coming soon), 3 real card-photo crops
- [x] Dashboard integrated page (P1 roll, P3 collapse+undo, P7 checklist, P12 stack, P14 tips) , verified: dashboard.html, JS-verified toggles all true, gemini diffs (P1 patch over title, P12 tag clip) fixed and re-measured live (patch 515-546 clears title 505, covers number 520-539, hot clears the percent line 552)
- [x] Bookings integrated page (P16 hero, P4 cascade) , verified: bookings.html, real BookingCard recipe 1:1, rendered screenshot checked
- [x] Payment step integrated page (P9 CTA amount, P1b voucher roll, R2-1 disabled-explains, R2-2 blur validation) , verified: payment.html, JS-verified: why-line on disabled tap, total rolls 65 to 55, CTA arms "Pay CHF 55", email err fires on blur only
- [x] Search integrated page (P13 grouped+highlight+loader, P15 named wait) on the live home capture , verified: search.html, JS-verified full sequence
- [x] Richness + layout generative probes (G1 triptych, G2 list/grid/carousel toggle) with real photos + converged card recipe , verified: richness.html, 14/14 images, toggle works
- [x] Hub with honest not-integrated list (P5/P6 loyalty coming-soon, P8 token needed, P11/P17 no surface yet, P2/P10 decision carried by refs page) , verified: index.html
- [x] OWNER REJECTED the four rebuilt pages on sight 2026-07-16 ('so ass... replacing what i spent hours') , verified: deleted + graveyarded (REMOVED.md line, revert commit), hub rewritten to dashboard-only; hardened same turn: ~/.claude/hooks/mockup-real-base-gate.py (Base: declaration + rendered-capture check, SELFTEST OK 5/5, wired into settings.json); rebuild on REAL captures in progress (live search overlay + booking wizard walk)

- [x] Rebuild on REAL captures , verified: search.html rebuilt on the live-captured overlay (base-search-real.png, PIL-pinned pill 7.8-13.4 percent), rendered proof: typed state + grouped results over the real pill; real wizard steps 1-3 captured (base-book-1/2/3) for the pay-step rebuild
- [ ] BLOCKED, named: pay-step capture (no day with free times loaded during the automated wizard walk on Muse Beauty Studio; chip task_400fe4c2); bookings-page capture (needs one real booking on the test account first); richness probe (waits for the converged card to render live post-merge)

## Owner picks 2026-07-16 (dictated)

- [x] Record the picks in TASTE_LOG , verified: commit 75b2c2b52, TASTE_LOG.md section '2026-07-16, reference-probe picks round 1' (P7/P12/P13/P14 approved, P1 no-blur, P3 rejected)
- [x] Graveyard P3 (approve-collapse-with-undo) , verified: REMOVED.md line added by npm run removed (commit 75b2c2b52)
- [x] De-blur the P1 demos , verified: grep 'blur([123]px)' now returns 0 hits in both taste-refs/index.html and taste-round2/dashboard.html (checked again this turn; commit 75b2c2b52)
- [x] CORRECTION: round-2 explained in plain English , verified: public/_mockups/taste-round2/round2-explained.html (commit 75b2c2b52), 3 cards rendered (browser check), every round-2 probe tagged live/probe/waiting with its named blocker
- Apply round, in flight with the coder agent (dispatched 2026-07-16, orchestrator commits after loop-review):
  - [x] P7 SetupBanner full checklist , verified: loop-reviewer PASS (SetupBanner.tsx:64-97, all steps render with the approved disc language, bar/count/links byte-identical), in checkpoint commit 5e87f6f01; rendered proof _audits/screenshots/taste-r2/apply-dashboard-p12.png shows the full checklist live
  - [x] P12 bell in-place stack , verified: loop-reviewer PASS (NotificationCenter.tsx:60-126 + DashboardLayout salonId plumbing fixed, was undefined; 4-locale viewAll), commit 835421ff1; rendered proof: popover opens in place with the honest empty state on the test salon; latent staff-403 endpoint bug chipped (task_8ac7442c)
  - [x] P13 search suggest treatments , verified: loop-reviewer PASS (SearchOverlay.tsx:579-633 SectionLabel groups, splitHighlight live-tested, matchQuery additive across all call-sites, loader fixed-slot, gesture regions diffed untouched), commit fa4a482ee; typed-state screenshot deferred: the overlay morph is the recorded preview-tab rAF trap and scripted focus missed twice, code-level PASS carries it
  - [x] P1 digit roll , BLOCKED honestly per instruction: reviewer-confirmed the revenue KPI has NO change trigger (dashboard/page.tsx:112-138, one fetch, period=week hardcoded); a roll needs a Woche/Monat toggle first, which is a separate owner feature call, parked
  - [ ] P14 tips panel , BLOCKED: no insights backend exists (exists insight = 0), shape approved only

## Completion round (owner 2026-07-16: "make mockups for all of em also for refs page u havent made mockup for all")

- [x] round2-rules.html Wrong/Right pairs , verified: 15 pair blocks rendered, 10/10 images, browser JS check (R2-1 tap, P17 minimize, G2 toggle all true)
- [x] P17 interactive demo , verified: minimize/restore toggle works (browser check, same run)
- [x] C1/C2/C4 rendered A/B with hue-ok probe markers; C3/C5 stay questions with the reason stated on the page , verified: same render check
- [x] G1 (3 densities) + G2 (3 layouts, toggle) as elicitation variants , verified: converged recipe, real photos, toggle works
- [x] Linked from hub + refs header , verified: commit ae5a852ec (index.html round2-rules card + taste-refs howto pointer), render checked in browser same turn, gemini spacing diff applied in that commit

## Picks round 2 + the full-bleed exploration (owner 2026-07-16 evening, dictated)

- [x] Picks logged , verified: TASTE_LOG.md 'picks round 2' table, commit ec06965-era (git log: docs(taste): picks round 2 logged)
- [x] Icon boundary DEFINED , verified: RATIONALE.md domain 22 (closed 7-item icon-only set, additions are logged owner calls) + round2-rules.html caption, commit 'icon-only exemption set DEFINED'
- [x] Gray chrome fixed , verified: 6 probe/explainer pages now white-first (same commit); TASTE_LOG row logs the signal; product gray locks (sunken tray, gray selected) named as untouched law pending a by-name reopen
- [x] Full-bleed exploration built , verified: fullbleed.html (commit 81b176509), 7 ranked moments with fork chips, 9/9 images render (browser check), gemini diffs applied (gradient fade-to-white, frost fallback); the flagged 'N' overlap is the Next.js dev badge inside the base capture, an artifact, skipped with reason
- [x] Overhaul-readiness verdict delivered , verified: readiness-judge output (workflow wf_9a56928a-35e journal) summarized in the closing message: roughly two-thirds ready (component layer), the missing third is page-level composition + 3 open owner calls, ordered list recorded below
- [x] Workflow ran (3 agents, all done) , verified: run wf_9a56928a-35e; outputs: 7 ranked full-bleed moments (built), 13 unprobed general dimensions (4 high: photo grammar, page rhythm, brand-moment frequency, product color stance), readiness verdict

### The overhaul-readiness order (from the readiness judge, wf_9a56928a-35e)
1. [merge] the converged-card branch (chip task_c132841a), 2. [probe] full-bleed placement (page live), 3. [probe] page-level rhythm G3, 4. [probe] gray-extent question, 5. [owner-call] imagery direction G6 fresh yes, 6. [owner-call] C3 + C5, 7. [script] 3B contrast sweep, 8. [script] measured floors D1/D2/D4/D8, 9. [probe] trailing gaps G4/G5/G7/G9.

## CORRECTION: full-bleed as ACTUAL FULL PAGES (owner 2026-07-16 night: "make acc pages instead... i need to acc visualize stop maiking mockups like ths ts a reccuring pattern")

- [x] HARDENED , verified: Scale arm live in ~/.claude/hooks/mockup-real-base-gate.py, selftest 8/8 (no-scale blocks, fragment-page-surface blocks, full-page passes), wired since the Base arm
- [x] Real full-page captures , verified: base-pdp-full (390x4990), base-barbershop-full (390x2211), base-fuersalons-full (390x7651), clean home recapture (390x4065, consent seeded), commit 9b3fa5650
- [x] fullbleed.html rebuilt as FULL pages , verified: commit 9b3fa5650, 7 moments in scrollable 390px phone frames, composites seam at PIL-measured cuts (home 500, PDP 335, for-salons 660)
- [x] Verified , verified: 19/19 images, 8 scrollable frames, FB1 seam eyeballed clean after the recapture (screenshot in session), committed 9b3fa5650; gemini ran on the prior iteration of this page, its diffs (gradient fade, frost fallback) carried over unchanged

## Full-bleed picks + the dead-chevron rule (owner 2026-07-16, "ok all of it no disban the full bleed thing one thing to add it smtimes make chevron that has no real destination")

- [x] FB picks logged, then VOIDED by the owner correction (the "ok all of it no disban" message meant rejection; correction entry appended to TASTE_LOG)
- [x] Dead-chevron rule live , verified: TASTE_LOG row + RATIONALE.md domain 13 "Dead affordances are fabrications" + a FAIL line in ~/.claude/agents/loop-reviewer.md standing lens (survives context, graded on every UI diff)
- [x] Audit chipped , verified: task_4f8747c1 (sweep + wire-or-remove, per-component commits)
- [x] Implementation queue VOIDED 2026-07-16 (the picks were a misread, full-bleed is denied; see the CORRECTION section)

## CORRECTION: full-bleed is DENIED, not approved (owner 2026-07-16: "fym i told you full bleed is not okay i want it gone the mockup is denied bro")

- [x] Wrong log reversed , verified: TASTE_LOG.md '2026-07-16, CORRECTION: full-bleed DENIED' entry voids the picks table; dead-chevron rule explicitly kept
- [x] fullbleed.html deleted (git rm), captures kept as neutral bases
- [x] Graveyarded , verified: REMOVED.md line (npm run removed output) + REJECTED_TREATMENTS 'fullbleed-direction' signature (resurrection-gate selftest still OK)
- [x] Implementation queue voided (edited in place, see the picks section)
- [x] HARDENED , verified: ~/.claude/hooks/pick-reading-gate.py, selftest 4/4 (mixed+logged blocks without a Reading check, passes with one, clean approvals unaffected), wired into the global Stop hooks
- [x] Chip explained in the closing message

## Parked / boundaries
- Web dark mode stays graveyarded (exists-check hit); positive-polarity mechanics recorded for MOBILE dark mode only.
- Merge chip task_c132841a, payment capture chip task_400fe4c2, R1/R2/R4 post-merge: unchanged, owner-gated.
- Round-2 digest figures the digest itself flags as needing primary-source checks stay flagged "assume (digest)" in RATIONALE.md, not asserted.
