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
- [ ] A4 code-vs-law drift census
  - [x] A4a drift checker run , DONE, verified: _plans/design-consolidation/A4_CODE_DRIFT.md §1 (6021->10986; strict 30->46; SalonCard.tsx:48-51 bug); committed 80691b351
  - [x] A4b class census , DONE, verified: A4_CODE_DRIFT.md §2 tables a-j (b 69 / c 93 / e 413 / f 83 / g 170 / h 96 / j ~20; a=5, d=0 clean); committed 80691b351
  - [x] A4c regression verdicts , DONE, verified: A4_CODE_DRIFT.md §2 per-class REGRESSION/KNOWN-DEBT verdicts (ScrollableFilterRow dead-hover, TextInput radius, Radio/Switch opacity byte-unchanged samples); committed 80691b351
- [ ] A5 drift-gate divergences verified
  - [x] A5a s-pop , STALE: already fixed 2026-07-11 (50abcd060), check.py:115 comment confirms
  - [x] A5b hex transposition , STALE: fixed 2026-07-11 (50abcd060); code fallout SalonCard.tsx:48-51 fixed via W2 coder
  - [x] A5c D3/D4/D5 , CONFIRMED and FIXED in 43b4f7a99 (100ms registered in LOCKFILE §4; #15803D + #9A3412 dropped from ALLOWED_HEX)

## Phase B , web synthesis + apply (docs = direct edits; code via coder)
- [x] B1 all 17 contradictions resolved , commits 80691b351 (revive) + 43b4f7a99 (W1); C16 settled by code-verify (tailwind:186 #C2410C), C12 FLIPPED (code has ONE red #DC2626, docs corrected, styleguide was right)
- [x] B2 SOURCE.md corrected , commit 43b4f7a99 (s-pop UN-RETIRED note, rounded-input 12, deep #1E54B7, one-red #DC2626, urgency #C2410C x4, 4 generous-blue passages inline-retired; verified: git show 43b4f7a99 -- _design-system/SOURCE.md)
- [x] B3 LOCKFILE cleaned by orchestrator only , commits 43b4f7a99 + f-boundary; verified: LOCKFILE.md:55 (v3 heading), :71/:79 (one-red rows), §2.5 tab row, §4 100ms note, §11 #C2410C, §12 #1E54B7, §13.2 boundary note; no locked row reopened
- [ ] B4 stale docs bannered/merged
  - [x] B4a CANON tombstone (owner 'fold it' 2026-07-10) revived from stranded branch, 80691b351
  - [x] B4b stale docs bannered , commit 43b4f7a99, verified: V2_RECONCILIATION.md:3 (historical banner) + :10 (precedence strike) + rule-1 supersession; CONTRADICTIONS.md:4 (drift note) + §1 strike; MOTION.md x2 chains; TASTE_LOG.md:150 + CONSISTENCY_AUDIT.md:33 via revive 80691b351
- [ ] B5 registry + component docs , W2 coder running (dispatched 2026-07-12); loop-reviewer grades on return
  - [x] B5a Toast.md rewritten to shipped V3-D462 recipe , DONE (white pill/circle-badge/bottom-dock/CSS-transition motion, cited Toast.tsx:190-380)
  - [x] B5b FilterSheet.md selected-state rewritten to 2026-06-29 gray law , DONE (Layer section + Visual signature + Provenance, cited FilterSheet.tsx:351-385)
  - [x] B5c StatusPill.md tombstone + Avatar/PriceFrom stale status text , DONE; also swept the two secondary phantom-StatusPill refs A3 flagged (SuccessMark.md:13, CardText.md:39) + SalonSidebar registry row Layer column, all -> StatusInline
  - [x] B5d SearchOverlay registry row corrected (V3-D445 violation recorded) , DONE; also fixed the same false DateTimePicker claim found in SearchOverlay.md (Layer + Reuse sections) and DateTimePicker.md's Consumers list (re-verified real call-sites: SearchBar.tsx:542 + DateTimeStep.tsx:194, not the 1-site A3 undercount)
  - [x] B5e BackButton 40px-vs-44 floor note (owner question, no code change) , DONE, BackButton.md + registry API column
  - [ ] B5f registry rows for the 16 undocumented primitives + DateTimePicker row , IN PROGRESS
  - [ ] B5g 5 new component docs (Modal/Switch/Sheet/StatusInline/FieldLabel), literals from code only , IN PROGRESS (StatusInline.md done)
  - [ ] B5h SalonCard.tsx:48-51 #F5F5F4 -> #F4F4F5 , NOT STARTED
- [ ] B6 check.py aligned to LOCKFILE
  - [x] B6a check.py aligned , commit 43b4f7a99, verified: check.py A9 rule string "blue outside the hyperlink scope (v3)", ALLOWED_HEX comment lines for removed #9A3412/#15803D, CANONICAL_DURATIONS_MS comment, hairline rec #E4E4E7
  - [x] B6b should-block proof , verified: gate-stdin probe with text-[#9A3412] bg-[#15803D] returned "DRIFT GATE: blocked 2" exit=2 (this session, post-fix)
  - [x] B6c should-pass proof , verified: gate-stdin probe with duration-100 + text-s-urgency + bg-s-bg-sunken returned exit=0 (this session, post-fix)
- [x] B7 gap-fill , commits 43b4f7a99 + 180694ce8, verified: LOCKFILE §4 100ms note, §13.2 boundary note (180694ce8), §2.5 TopNavTab-not-built note, QUESTIONS.md:345 badge Q retained with #DC2626
- [x] B8 styleguide: --border #E4E4E7, --sunken #F4F4F5, --ink3 #6B6B6B, input radius 12; red swatch verified already-correct (one red #DC2626)

## Phase C , app (solen-mobile)
- [x] C1 mobile design-law inventory , DONE, verified: _plans/design-consolidation/C1_MOBILE.md §1 (5 docs + theme.ts, no MOBILE_LOCKFILE ever built); committed 80691b351
- [x] C2 mobile internal inconsistencies , DONE, verified: C1_MOBILE.md §2 (4 found: filter-pill 3-way, D8/D17 see-all, 9 stale draft rows, THEMING semantic-color claim); committed 80691b351
- [x] C3 web-vs-app divergences , DONE, C1_MOBILE.md §3 (13: 7 deliberate, 4 accidental, 2 reframed; s-error #DC2626 verified live tailwind.config.js:178)
- [ ] C4 mobile canon , BLOCKED-ON: W3 coder agent running (dispatched 2026-07-12, THEMING.md canonization per orchestrator decisions); reviewer grades on return
- [ ] C5 mobile gap rules , BLOCKED-ON: same W3 coder agent (44pt floor, ErrorState, toast recipe, safe-area/haptics/nav codify-dominant-pattern, dark-coverage rule)

## Phase D , close
- [ ] D1 consolidation report , DRAFT COMMITTED (sections 0-6 final, §7/§8 pending W2/W3 returns) , BLOCKED-ON: W2+W3 coder agents in flight, sections filled at their return
- [ ] D2 chips emitted , BLOCKED-ON: W2/W3 reviewer PASS (chip list finalized in §6 of the report; emitting before the coder results would chip stale items)
- [ ] D3 commits per chunk , IN PROGRESS, 4 so far: ef8cdb7a8 (plan), 80691b351 (revive), 43b4f7a99 (W1), boundary-note commit; final W2/W3 + close commits pending , BLOCKED-ON: W2/W3 returns
- [ ] D4 close on original message , BLOCKED-ON: last step after D1/D2 complete (W2/W3 in flight)

Premortem (gate 3): R1 resolving a contradiction in the wrong direction (older doc beats newer decision) -> every resolution cites the dated decision. R2 duplicating existing consolidation docs -> merge/banner CONTRADICTIONS/CANON/V2_RECONCILIATION, never add a parallel canon. R3 agents inventing values -> audit agents are read-only, findings must carry file:line. R4 overlap with #13 -> law-level only here. R5 mobile deliberate divergences mislabeled drift -> mobile agent splits deliberate vs accidental with dated sources. R6 rate limits -> waves of max 4 agents.

Parked / owner questions: (accumulate here during the run)
