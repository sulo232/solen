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
- [x] Verify lab renders (screenshots at 375 + desktop of probes 1/2/3/5, console clean, squircle clip-path verified applied, no horizontal scroll at 375; loop-reviewer round 1 FAIL on one item, 8 raw #FFFFFF outside :root, fixed to var(--white), re-verified rendered + grep)
- [x] Cloudflare tunnel link, clickable (delivered in the closing reply: generation-barn-houses-greater.trycloudflare.com/_mockups/taste-lab/index.html)
- [x] AskUserQuestion: rationale-layer location, retrofit scope, extra domains, template weight (asked in the closing turn)
- [x] Commit _plans + draft + mockup (ea5e73fdf docs, + mockup commit)
- [x] Close: re-read original message, tick boxes, WORKLOG entry

## Owner answers (2026-07-15, via AskUserQuestion)
- Location: RATIONALE.md as drafted. Retrofit: EVERYTHING (~47 bare rules, full sweep). Domains added: i18n typography + touch ergonomics + enforcement; imagery DECLINED. Template: hybrid.

## Follow-up work from the answers (same session)
- [x] RATIONALE.md status updated to owner-confirmed; sections 9-11 added (i18n type, touch ergonomics, enforcement); open-items section rewritten
- [x] Full retrofit sweep: 45 FORCES/MECHANIC blocks (8 color/type + 14 space/motion + 11 primitives/layout + 12 icons/cards/sheets) merged into RATIONALE.md section 14 (two agents returned summary-only, blocks mined from their transcripts; all 4 ranges covered)
- [x] Reviewer pass: round 1 FAIL on 2 literal drifts (search/btn 99px misgrouped as 9999px; "14-role" vs 19 actual type roles), both fixed + grep-verified; checks 1/3/4/5 (structure, no value changes, no invented evidence, no dashes/myths) all PASS
- [x] Commit retrofit + final report (commit landed; report in the closing reply)

## Parked (surfaced at close, non-blocking)
- Discount badge contradiction: memory project_card_badges says "pale-green -X% pill", live SalonCard.tsx (V3-D85-semantic 2026-05-19) ships s-love-deep on s-love-soft (rose). Mockup follows live code. Owner to say which is current; if the pale-green memory reflects a later decision, the live card is drifted.
- The 5 probe picks themselves: owner answers pending; each answer becomes a TASTE_LOG entry in the new FORCES format + RATIONALE.md cross-link.
- QUESTIONS.md candidates found during audit: spring double-definition (bezier vs physics), icon stroke-width 1.9 vs 2 inconsistency, SalonCard residual focus-visible outline vs the global no-ring override.

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
