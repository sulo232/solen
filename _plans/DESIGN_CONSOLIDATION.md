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
- [x] A1 doc-vs-doc sweep , DONE: A1_DOC_CONTRA.md (17 contradictions C1-C17, 7 clean checks)
- [x] A2 stale-authority census , DONE: A1_DOC_CONTRA.md §2 (7 items; CANON fold found STRANDED on branch context-compact-architecture-5d1ace, revived 80691b351)
- [x] A3 registry-vs-code , DONE: A3_REGISTRY.md (1 phantom, 5 doc-vs-law violations, 16 undocumented primitives, 2 stale statuses)
- [ ] A4 code-vs-law drift census
  - [x] A4a drift checker run , DONE: A4_CODE_DRIFT.md §1 (info scope 6021->10986 +82%; strict 30->46; SalonCard #F5F5F4 live bug)
  - [x] A4b class census , DONE: §2 (a,d clean; b 69 / c 93 / e 413 / f 83 / g 170 / h 96 / j ~20 live)
  - [x] A4c regression verdicts , DONE: b,c,e,g,h,j REGRESSED (audit-cited lines byte-unchanged); a,d genuinely swept
- [ ] A5 drift-gate divergences verified
  - [x] A5a s-pop , STALE: already fixed 2026-07-11 (50abcd060), check.py:115 comment confirms
  - [x] A5b hex transposition , STALE: fixed 2026-07-11 (50abcd060); code fallout SalonCard.tsx:48-51 fixed via W2 coder
  - [x] A5c D3/D4/D5 , CONFIRMED and FIXED in 43b4f7a99 (100ms registered in LOCKFILE §4; #15803D + #9A3412 dropped from ALLOWED_HEX)

## Phase B , web synthesis + apply (docs = direct edits; code via coder)
- [x] B1 all 17 contradictions resolved , commits 80691b351 (revive) + 43b4f7a99 (W1); C16 settled by code-verify (tailwind:186 #C2410C), C12 FLIPPED (code has ONE red #DC2626, docs corrected, styleguide was right)
- [x] B2 SOURCE.md corrected (s-pop note, input 12, deep #1E54B7, one-red, urgency #C2410C x4, 4 generous-blue passages inline-retired)
- [x] B3 LOCKFILE cleaned by orchestrator only (v2 heading, error/closed rows, §2.5 tab row, §4 +100ms, §11 urgency, §12 deep, §13.2 boundary note; no locked row reopened, every edit records the later dated decision it applies)
- [ ] B4 stale docs bannered/merged
  - [x] B4a CANON tombstone (owner 'fold it' 2026-07-10) revived from stranded branch, 80691b351
  - [x] B4b V2_RECONCILIATION (historical banner + precedence strike + rule-1 supersession), CONTRADICTIONS (drift note + §1 strike), MOTION (chain completed x2); TASTE_LOG + CONSISTENCY_AUDIT fixed by revive
- [ ] B5 registry + component docs , BLOCKED-ON: W2 coder agent running (dispatched 2026-07-12, Toast/FilterSheet/StatusPill docs, 8+ registry rows, 5 new docs, SalonCard hex); loop-reviewer grades on return
- [ ] B6 check.py aligned to LOCKFILE
  - [x] B6a check.py: A9 v3 rewrite + hints comment (fold), #9A3412/#15803D dropped, duration comment corrected, hairline rec hex corrected
  - [x] B6b should-block proof: retired-hex probe -> DRIFT GATE blocked, exit 2
  - [x] B6c should-pass proof: locked values + duration-100 + text-s-urgency -> exit 0
- [x] B7 gap-fill: 100ms registered (code-derived, 10 usages); §13.2 progress-vs-selection boundary (derivation cited); TopNavTab recorded nonexistent in §2.5 row; notification-badge stays OWNER-Q in QUESTIONS.md (hex corrected)
- [x] B8 styleguide: --border #E4E4E7, --sunken #F4F4F5, --ink3 #6B6B6B, input radius 12; red swatch verified already-correct (one red #DC2626)

## Phase C , app (solen-mobile)
- [x] C1 mobile design-law inventory , DONE, _plans/design-consolidation/C1_MOBILE.md §1 (5 docs + theme.ts, no MOBILE_LOCKFILE ever built)
- [x] C2 mobile internal inconsistencies , DONE, C1_MOBILE.md §2 (4 found: filter-pill 3-way, D8/D17 see-all, 9 stale draft rows, THEMING semantic-color claim)
- [x] C3 web-vs-app divergences , DONE, C1_MOBILE.md §3 (13: 7 deliberate, 4 accidental, 2 reframed; s-error #DC2626 verified live tailwind.config.js:178)
- [ ] C4 mobile canon , BLOCKED-ON: W3 coder agent running (dispatched 2026-07-12, THEMING.md canonization per orchestrator decisions); reviewer grades on return
- [ ] C5 mobile gap rules , BLOCKED-ON: same W3 coder agent (44pt floor, ErrorState, toast recipe, safe-area/haptics/nav codify-dominant-pattern, dark-coverage rule)

## Phase D , close
- [ ] D1 consolidation report (_design-system/CONSOLIDATION_2026-07-12.md): every inconsistency, status FIXED / CHIPPED / OWNER-Q
- [ ] D2 code-drift fixes emitted as chips (design-suggest flow; mockup-first binds builds)
- [ ] D3 commits per verified chunk (never push)
- [ ] D4 close on the ORIGINAL message: tick readback items 1-6 with proof

Premortem (gate 3): R1 resolving a contradiction in the wrong direction (older doc beats newer decision) -> every resolution cites the dated decision. R2 duplicating existing consolidation docs -> merge/banner CONTRADICTIONS/CANON/V2_RECONCILIATION, never add a parallel canon. R3 agents inventing values -> audit agents are read-only, findings must carry file:line. R4 overlap with #13 -> law-level only here. R5 mobile deliberate divergences mislabeled drift -> mobile agent splits deliberate vs accidental with dated sources. R6 rate limits -> waves of max 4 agents.

Parked / owner questions: (accumulate here during the run)
