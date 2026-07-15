# Taste rationale layer (owner research, 2026-07-15)

Owner delivered a researched reference skeleton: 8 reasoning domains (perception, color, contrast, typography, spacing/shape, motion, aesthetic theory, rationale-articulation) with formulas, thresholds, folklore debunks (golden ratio, Miller 7±2, Lin 2004, 60-30-10), and a decision format (forces/tradeoffs, QOC/ADR/pattern-language). Ask: redefine the Solen taste system's rationale layer on top of it, WITHOUT duplicating CANON/LOCKFILE/SOURCE/TASTE_LOG/PSYCHOLOGY.

## Asks (atomic)

- [x] Readback of asks (first lines of reply, 5 items)
- [x] Ground: inventory existing taste stack (workflow wf_6a3e81a3, 6 agents, all returned)
  - [x] LOCKFILE.md: 93 rules classified: 51% BARE / 29% OWNER-QUOTE / 16% MEASURED / 4% MECHANIC; 12 load-bearing BARE rules listed
  - [x] SOURCE.md: coverage map done: domains 1+7+8 uncovered, 3 covered (WCAG only), 2/4/5/6 partial; zero academic citations
  - [x] TASTE_LOG.md + QUESTIONS.md + REMOVED.md: all 6 probe axes UNSETTLED; settled axes list extracted
  - [x] MOTION.md + CONTROL_ELEVATION.md + PHOTO_STRATEGY.md + RESTRAINT_TEST.md: CONTROL_ELEVATION = best-evidence file; spring double-definition found; 420ms > NN/g band found
  - [x] PSYCHOLOGY.md: T1/T2/T3 tier vocab reused; myth table extracted; domain-7 items NET-NEW (not in the 15 laws)
  - [x] Token map + mockup conventions + SalonCard DOM extracted (gradient photo placeholders = house mockup pattern; no local photos exist)
- [x] Folklore sweep of _design-system docs (only legacy 60/30/10 refs in superseded _rules/SOLEN_UI.md notes; Doherty correctly tiered medium in PSYCH_PSYCHOLOGY.md; in-house flags: SOURCE.md:63/232/319/1075 + RESTRAINT_TEST percentages, all recorded in RATIONALE.md section 9)
- [x] Answer ask 2: what to ADD beyond the research (in final reply: i18n type mechanics, focus-ring departure record, imagery/photo domain, dark-mode contrast policy, touch ergonomics, enforcement layer as domain 9)
- [x] Draft _design-system/RATIONALE.md v1 WRITTEN (11 sections: tiers, entry format, 8 domains, folklore table, 12-rule retrofit queue, 5 pending owner decisions)
- [x] Build taste-lab elicitation mockup (public/_mockups/taste-lab/index.html, 43604 bytes)
  - [x] Probe 1: corner curvature (circular arc vs squircle/superellipse) on real card + button
  - [x] Probe 2: optical alignment corrections (icon centering, circle sizing)
  - [x] Probe 3: secondary-text contrast (current grey vs APCA-informed) on white + sunken
  - [x] Probe 4: type measure cap on long German body text
  - [x] Probe 5: web dark-mode teaser (mobile Revolut-charcoal precedent applied to one card)
  - [x] Each probe: side-by-side variants, real tokens, forces/optimizes/sacrifices annotation, my pick marked
  - [x] Exists-check line in the mockup file (plus Grounded-in, Owner-scope; hardened against 6 chained hooks: mockup-english-gate, pre-build-exists-check, mockup-grounding-gate, mockup-content-gate hue check, mockup-preflight-manifest aggregator)
- [ ] Verify lab renders (screenshot, real browser) -- ORCHESTRATOR/REVIEWER: not done by the coder sub-agent (no self-certify); needs a real-browser screenshot pass before this ticks.
- [ ] Cloudflare tunnel link, clickable
- [ ] AskUserQuestion: rationale-layer location, retrofit scope, extra domains, template weight
- [ ] Commit _plans + draft + mockup
- [ ] Close: re-read original message, tick boxes, WORKLOG entry

## Settled axes confirmed off-limits for probes (do not re-litigate)
- Nested radius formula: LOCKED (LOCKFILE DS-4, 2026-06-11, owner-approved). DROPPED from probe list.
- Spring easing: ease-spring exists in SOURCE motion ladder + Motion-22 locked. Not probed.
- Blue policy, selected states, filter pills, fonts, hairline, radius 16: LOCKED. Not probed.

## Premortem (gate 3)
1. Re-litigating settled taste in probes: mitigated by agent C verifying each probe axis against TASTE_LOG/REMOVED/LOCKFILE before build.
2. Duplicate system (RATIONALE.md overlapping SOURCE 22 sections or PSYCHOLOGY myth table): mitigated by coverage-map agents first; RATIONALE holds only the mechanics layer, decisions stay in CANON/LOCKFILE/TASTE_LOG; folklore merges into the existing myth table.
3. Dev-server/tunnel friction in worktree: node_modules + .env.local symlink confirmed present. Port collision with :3001 (main) possible; use auto-port via preview_start.

## Parked / open
- (fill during run)
