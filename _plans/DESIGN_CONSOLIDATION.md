# Design-system consolidation (web first, then app) , 2026-07-12

Owner ask (verbatim): "solidify the design system. Like, the first auto web design, and also after that, the app design, like, do the... like, I want you to, like, actually think and, like, add many stuff. Like, do this or don't. And, you know, instead of do this or that, do this or, like like, add designs and all of that. You know? Like, find inconsistency, like, everything."

Readback: (1) solidify the design system into one decisive canon, (2) web first, (3) then the app (solen-mobile), (4) actually think + ADD the missing pieces, (5) decisive "do this / don't do that" calls, never option menus, (6) find inconsistencies everywhere (doc-vs-doc, doc-vs-code, web-vs-app).

Grading against (binary close conditions):
- Every doc-vs-doc contradiction found is either RESOLVED in the docs (superseded text corrected/bannered, citing the dated winning decision) or listed as an owner question with the exact fork.
- LOCKFILE + SOURCE + CLAUDE.md blocks + component docs agree on every literal an auditor greps for (spot-check: accent usage, selected-state, code font, success green, hairline hex).
- Stale authority docs (CANON.md etc.) carry an explicit status banner; no doc claims a precedence it no longer has.
- COMPONENT_REGISTRY rows match code reality (no phantom paths, no undocumented shared primitives among the audited set).
- Drift gate (solen-drift-check check.py) literals match LOCKFILE (the 5 self-audit divergences fixed + self-tested block/pass).
- Mobile: one canonical mobile design doc states tokens/type/dark-mode, cross-referenced to web canon, with deliberate divergences named and accidental drift listed.
- One consolidation report exists with every inconsistency found, each marked FIXED / CHIPPED / OWNER-Q.

Relationship to other workstreams: #13 (full-estate frontend audit) owns surface-by-surface UI fixes vs law; THIS workstream owns the LAW itself (docs, tokens, gates, registry) + the inconsistency census. Code-level UI drift found here feeds #13 / chips, not direct edits (mockup-first).

## Phase A , web audit (read-only, parallel)
- [x] A1 doc-vs-doc sweep , DONE, verified: _plans/design-consolidation/A1_DOC_CONTRA.md:11-29 (rows C1-C17) + §4 clean checks; committed 80691b351
- [x] A2 stale-authority census , DONE: A1_DOC_CONTRA.md §2 (7 items; CANON fold found STRANDED on branch context-compact-architecture-5d1ace, revived 80691b351)
- [x] A3 registry-vs-code , DONE, verified: _plans/design-consolidation/A3_REGISTRY.md §1-§5 (phantom StatusPill; Toast.md/FilterSheet.md violations; 16 undocumented primitives list); committed 80691b351
- [x] A4 code-vs-law drift census , verified: rollup of A4a-c below (each child carries its own file:line/sha evidence)
  - [x] A4a drift checker run , DONE, verified: _plans/design-consolidation/A4_CODE_DRIFT.md §1 (6021->10986; strict 30->46; SalonCard.tsx:48-51 bug); committed 80691b351
  - [x] A4b class census , DONE, verified: A4_CODE_DRIFT.md §2 tables a-j (b 69 / c 93 / e 413 / f 83 / g 170 / h 96 / j ~20; a=5, d=0 clean); committed 80691b351
  - [x] A4c regression verdicts , DONE, verified: A4_CODE_DRIFT.md §2 per-class REGRESSION/KNOWN-DEBT verdicts (ScrollableFilterRow dead-hover, TextInput radius, Radio/Switch opacity byte-unchanged samples); committed 80691b351
- [x] A5 drift-gate divergences verified , all 3 sub-items done (see A5a-c below); A5b's SalonCard.tsx:48-51 code fallout closed this turn via B5h
  - [x] A5a s-pop , STALE: already fixed 2026-07-11 (50abcd060), check.py:115 comment confirms
  - [x] A5b hex transposition , STALE: fixed 2026-07-11 (50abcd060); code fallout SalonCard.tsx:48-51 fixed via W2 coder (B5h, this turn)
  - [x] A5c D3/D4/D5 , CONFIRMED and FIXED in 43b4f7a99 (100ms registered in LOCKFILE §4; #15803D + #9A3412 dropped from ALLOWED_HEX)

## Phase B , web synthesis + apply (docs = direct edits; code via coder)
- [x] B1 all 17 contradictions resolved , commits 80691b351 (revive) + 43b4f7a99 (W1); C16 settled by code-verify (tailwind:186 #C2410C), C12 FLIPPED (code has ONE red #DC2626, docs corrected, styleguide was right)
- [x] B2 SOURCE.md corrected , commit 43b4f7a99 (s-pop UN-RETIRED note, rounded-input 12, deep #1E54B7, one-red #DC2626, urgency #C2410C x4, 4 generous-blue passages inline-retired; verified: git show 43b4f7a99 -- _design-system/SOURCE.md)
- [x] B3 LOCKFILE cleaned by orchestrator only , commits 43b4f7a99 + f-boundary; verified: LOCKFILE.md:55 (v3 heading), :71/:79 (one-red rows), §2.5 tab row, §4 100ms note, §11 #C2410C, §12 #1E54B7, §13.2 boundary note; no locked row reopened
- [x] B4 stale docs bannered/merged , verified: rollup of B4a-b below (each child carries commit evidence)
  - [x] B4a CANON tombstone (owner 'fold it' 2026-07-10) revived from stranded branch, 80691b351
  - [x] B4b stale docs bannered , commit 43b4f7a99, verified: V2_RECONCILIATION.md:3 (historical banner) + :10 (precedence strike) + rule-1 supersession; CONTRADICTIONS.md:4 (drift note) + §1 strike; MOTION.md x2 chains; TASTE_LOG.md:150 + CONSISTENCY_AUDIT.md:33 via revive 80691b351
- [ ] B5 registry + component docs , W2 coder work COMPLETE (all 8 sub-items a-h below), all edits doc-only + the one authorized SalonCard.tsx hex fix; LOCKFILE.md untouched (git status confirms) , BLOCKED-ON: loop-reviewer grade (coder does not self-certify; parent box ticks on reviewer PASS)
  - [x] B5a Toast.md rewritten to shipped V3-D462 recipe , DONE (white pill/circle-badge/bottom-dock/CSS-transition motion, cited Toast.tsx:190-380)
  - [x] B5b FilterSheet.md selected-state rewritten to 2026-06-29 gray law , DONE (Layer section + Visual signature + Provenance, cited FilterSheet.tsx:351-385)
  - [x] B5c StatusPill.md tombstone + Avatar/PriceFrom stale status text , DONE; also swept the two secondary phantom-StatusPill refs A3 flagged (SuccessMark.md:13, CardText.md:39) + SalonSidebar registry row Layer column, all -> StatusInline
  - [x] B5d SearchOverlay registry row corrected (V3-D445 violation recorded) , DONE; also fixed the same false DateTimePicker claim found in SearchOverlay.md (Layer + Reuse sections) and DateTimePicker.md's Consumers list (re-verified real call-sites: SearchBar.tsx:542 + DateTimeStep.tsx:194, not the 1-site A3 undercount)
  - [x] B5e BackButton 40px-vs-44 floor note , DONE, verified: BackButton.md:15 (open-question block, spot-checked by orchestrator) + registry API column; no code change
  - [x] B5f registry rows , DONE round 2, verified: reviewer PASS (all 16 rows call-site claims grep-backed: Modal 2 real, Sheet 5+mobile, Switch 4, PillToggle/Checkbox/Radio/Select/Textarea/FieldHelper 0 external, SkipLink gap true); commit 91ca978c5
  - [x] B5g 5 new component docs , DONE round 2, verified: reviewer PASS (Modal/Sheet/Switch call-sites corrected + 8 dashboard hand-rolled modals reframed as debt; zero em-dashes across 14 files, /usr/bin/grep-verified; FilterSheet.md dual dates); commit 91ca978c5
  - [x] B5h SalonCard.tsx:48-51 #F5F5F4 -> #F4F4F5 , DONE, verified: SalonCard.tsx:46-53 (comment + all 4 category rows), only that hex changed, nothing else in the file
- [x] B6 check.py aligned to LOCKFILE , verified: rollup of B6a-c below (fix sha + block/pass probe evidence on the children)
  - [x] B6a check.py aligned , commit 43b4f7a99, verified: check.py A9 rule string "blue outside the hyperlink scope (v3)", ALLOWED_HEX comment lines for removed #9A3412/#15803D, CANONICAL_DURATIONS_MS comment, hairline rec #E4E4E7
  - [x] B6b should-block proof , verified: gate-stdin probe with text-[#9A3412] bg-[#15803D] returned "DRIFT GATE: blocked 2" exit=2 (this session, post-fix)
  - [x] B6c should-pass proof , verified: gate-stdin probe with duration-100 + text-s-urgency + bg-s-bg-sunken returned exit=0 (this session, post-fix)
- [x] B7 gap-fill , commits 43b4f7a99 + 180694ce8, verified: LOCKFILE §4 100ms note, §13.2 boundary note (180694ce8), §2.5 TopNavTab-not-built note, QUESTIONS.md:345 badge Q retained with #DC2626
- [x] B8 styleguide: --border #E4E4E7, --sunken #F4F4F5, --ink3 #6B6B6B, input radius 12; red swatch verified already-correct (one red #DC2626)

## Phase C , app (solen-mobile)
- [x] C1 mobile design-law inventory , DONE, verified: _plans/design-consolidation/C1_MOBILE.md §1 (5 docs + theme.ts, no MOBILE_LOCKFILE ever built); committed 80691b351
- [x] C2 mobile internal inconsistencies , DONE, verified: C1_MOBILE.md §2 (4 found: filter-pill 3-way, D8/D17 see-all, 9 stale draft rows, THEMING semantic-color claim); committed 80691b351
- [x] C3 web-vs-app divergences , DONE, C1_MOBILE.md §3 (13: 7 deliberate, 4 accidental, 2 reframed; s-error #DC2626 verified live tailwind.config.js:178)
- [x] C4 mobile canon , DONE, verified: solen-mobile _design-system/THEMING.md (canon header :3-9, 26-row token tables vs theme.ts, parity table, 2a-2d resolutions); reviewer 10/11 PASS round 1, 2 punch items fixed same turn; solen-mobile commit fd6fa2d
- [x] C5 mobile gap rules , DONE, verified: THEMING.md section 4 (7 rules each with derivation; haptics kept OPEN 24v19 per no-invention rule; press-state per-file values after reviewer punch); commit fd6fa2d

## Phase D , close
- [x] D1 consolidation report , DONE, verified: _design-system/CONSOLIDATION_2026-07-12.md sections 0-8 all filled (§7/§8 completed after reviewer PASSes)
- [x] D2 chips emitted , DONE, verified: 7 spawn_task chips this session (task_f7510668 token regressions b/c/j, task_ae728f6e radius, task_65c411f4 CardName 14px, task_34f48e08 SearchOverlay V3-D445, task_6482ec0f shadows, task_2bcf91b8 press-scale, task_547a320b mobile ErrorState); owner decisions NOT chipped, they are §5 of the report
- [x] D3 commits per chunk , DONE, verified: ef8cdb7a8 plan / 80691b351 revive / 43b4f7a99 W1 / 180694ce8 boundary / report+§8 commits / f0f322c29 W2r1 / 91ca978c5 W2r2 / solen-mobile fd6fa2d / final close commit; never pushed
- [x] D4 closed on the original message , verified: close report delivered in-session mapping readback items 1-6 to proofs; per-item evidence lives in CONSOLIDATION_2026-07-12.md §0-§8 (committed bd33cd84c) and the per-box shas above (80691b351 / 43b4f7a99 / 180694ce8 / f0f322c29 / 91ca978c5 / solen-mobile fd6fa2d)

Premortem (gate 3): R1 resolving a contradiction in the wrong direction (older doc beats newer decision) -> every resolution cites the dated decision. R2 duplicating existing consolidation docs -> merge/banner CONTRADICTIONS/CANON/V2_RECONCILIATION, never add a parallel canon. R3 agents inventing values -> audit agents are read-only, findings must carry file:line. R4 overlap with #13 -> law-level only here. R5 mobile deliberate divergences mislabeled drift -> mobile agent splits deliberate vs accidental with dated sources. R6 rate limits -> waves of max 4 agents.

Parked / owner questions: (accumulate here during the run)
- Gate dispositions 2026-07-12: design-verify + link gates fired on the SalonCard #F5F5F4->#F4F4F5 token restore. Disposition: sub-perceptual delta (one RGB step in 2 channels), W2 reviewer item 7 verified the diff is hex-only (nothing else in the file), and this worktree cannot serve a preview (no node_modules/.env.local, memory reference_worktree_dev_setup; main's :3001 serves main's code, not this branch). Flags set with this reason; the change restores the LOCKED value, it does not propose one.
- checkbox-evidence-gate + unfinished-batch-gate quoted STALE plan-file text repeatedly this session (lines already carrying verified:/sha, or already re-atomized); appears to read a turn-start snapshot instead of the current file. Feed to workstream #18 (estate audit) as a gate bug.
- W2 coder (B5): 2 A3 findings were doc/registry-only out of scope for the "doc edits + one SalonCard hex fix" constraint, not silently dropped:
  - A3 finding 2d: `homepage/SectionHeader.tsx:66` renders `text-[13px]` for the section eyebrow; both `SectionTitle.md` and LOCKFILE §2.5 want responsive `text-[11px] md:text-[12px]`. Code-only fix, not touched this pass.
  - A3 finding 5 (leftover hand-rolled duplicates, discovered post-consolidation): `components-legacy/discovery/CardSignals.tsx:36` (star, should use `RatingStars`), `components-legacy/discovery/DetailPage.tsx:409` + `search/CategoryHeroCarousel.tsx:150-159` (both "ab CHF", should use `PriceFrom`), `salon/SalonStickyTabNav.tsx:185` + `components-legacy/booking/BookingWizard.tsx:186,201` (hand-rolled back buttons, should use `BackButton`), `components-legacy/ui/Skeleton.tsx` (dead file, zero importers, safe to delete), `app/[locale]/profile/page.tsx:235` (hand-rolls its own local `Avatar` duplicate instead of importing `primitives/Avatar`, found during B5 re-verification, not in the original A3 list). All noted in the registry rows they touch (Avatar/PriceFrom/BackButton) so the next code-sweep chip has file:line evidence already gathered.
  - BackButton 40px vs the locked 44px touch-target floor stays an open owner question (BackButton.md + registry note), not silently resolved either way.
