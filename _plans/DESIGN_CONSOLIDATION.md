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
- [ ] A1 doc-vs-doc contradiction sweep (LOCKFILE vs SOURCE vs CANON vs CLAUDE.md blocks vs TASTE_LOG vs CONTROL_ELEVATION vs MOTION vs styleguide.html)
- [ ] A2 stale-authority census (docs claiming dead precedence, e.g. CANON.md "this wins" vs folded-into-LOCKFILE 2026-07-10)
- [ ] A3 registry-vs-code coverage (stale rows, phantom paths, undocumented shared primitives, component docs contradicting LOCKFILE)
- [ ] A4 code-vs-law drift census (drift checker run + classes it misses: type scale, radius, shadow, spacing, active:scale, disabled opacity), incl. which CONTRADICTIONS.md 2026-06-08 items regressed
- [ ] A5 drift-gate divergences verified (check.py vs LOCKFILE: s-pop, #F5F5F4 transposition + the other 3 from SELF_AUDIT_2026-07-11)

## Phase B , web synthesis + apply (docs = direct edits; code via coder)
- [ ] B1 resolve every A1/A2 contradiction decisively per precedence chain (latest dated owner decision wins), each with citation
- [ ] B2 SOURCE.md corrected (superseded text fixed or bannered)
- [ ] B3 LOCKFILE.md cleaned (orchestrator-only writes; NO locked-row reopening)
- [ ] B4 CANON.md + other stale docs bannered/merged
- [ ] B5 COMPONENT_REGISTRY.md statuses corrected; missing component doc stubs added for undocumented shared primitives
- [ ] B6 check.py aligned to LOCKFILE (via coder if >3 lines) + self-test (one should-block, one should-pass)
- [ ] B7 gap-fill: add decisive missing rules derived from locked patterns (list produced in A-phase; each new rule cites its derivation; genuinely underivable = owner question, not invention)
- [ ] B8 styleguide (public/solen-styleguide.html) spot-synced to consolidated tokens (stale rows patched)

## Phase C , app (solen-mobile)
- [ ] C1 mobile design-law inventory (PLAN.md, THEMING.md, mobile COMPONENT_REGISTRY, src theme code)
- [ ] C2 mobile internal inconsistencies (docs vs src theme code)
- [ ] C3 web-vs-app divergence list, split DELIBERATE (dated decision) vs ACCIDENTAL drift
- [ ] C4 consolidated mobile canon written (tokens/type/dark-mode/components) cross-referencing web canon
- [ ] C5 mobile gap-fill: decisive rules for gaps (or owner questions)

## Phase D , close
- [ ] D1 consolidation report (_design-system/CONSOLIDATION_2026-07-12.md): every inconsistency, status FIXED / CHIPPED / OWNER-Q
- [ ] D2 code-drift fixes emitted as chips (design-suggest flow; mockup-first binds builds)
- [ ] D3 commits per verified chunk (never push)
- [ ] D4 close on the ORIGINAL message: tick readback items 1-6 with proof

Premortem (gate 3): R1 resolving a contradiction in the wrong direction (older doc beats newer decision) -> every resolution cites the dated decision. R2 duplicating existing consolidation docs -> merge/banner CONTRADICTIONS/CANON/V2_RECONCILIATION, never add a parallel canon. R3 agents inventing values -> audit agents are read-only, findings must carry file:line. R4 overlap with #13 -> law-level only here. R5 mobile deliberate divergences mislabeled drift -> mobile agent splits deliberate vs accidental with dated sources. R6 rate limits -> waves of max 4 agents.

Parked / owner questions: (accumulate here during the run)
