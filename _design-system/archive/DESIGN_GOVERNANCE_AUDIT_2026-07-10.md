# Design-governance audit (owner ask 2026-07-10: inconsistencies/gaps causing bad mockups, bad design, forgetting)

<!-- exists-check: net-new , this audits the GOVERNANCE layer (docs/hooks/process), not the product UI (that is FRONTEND_AUDIT_2026-07-08.md) nor the general hook estate (_plans/HOOK_AUDIT_2026-07-10.md, which covered correctness bugs; this pass is design-causality: what lets bad design through). Three agent sweeps: docs / design-hooks / process. -->

Triage key (0p-4): [FIX] this wave, [PARK] with reason.

## Part 3: PROCESS layer (agent returned 2026-07-10)

1. [FIX] Approval memory asymmetry: mobile has a production gate (mockup-gate.py blocks real edits until the path is in mockup-approvals.txt) but its scope check is hardcoded `solen-mobile/` (mockup-gate.py:38) , WEB real-page edits have no approval gate at all.
2. [FIX] approved-mockups.txt is only read by approved-surface-guard (redesign prevention on /dev slugs); nothing turns "owner approved treatment X" into build-time knowledge for the real page.
3. [FIX,HEADLINE] TASTE_LOG.md is WRITE-ONLY: zero hook references (grep-proven). REMOVED.md has append-enforcement (graveyard commit block) + injection (binary triggers); DRIFT_LEDGER has injection; TASTE_LOG has NEITHER , settled taste decisions survive only if the agent remembers to open the file. This is the single biggest forgetting mechanism, per the agent's plain-language verdict.
4. [FIX] pixel-spec-auto's spec.md is dead after the one-time annotated.png eyeball: pre-component-edit-pixel-spec.sh clears its flag and nothing ever diffs the built code against the MEASURED values again.
5. [FIX] SENIOR_SCORECARD.md + WORK_TYPES.md are pure doctrine: not in the design-verifier agent definition (which cites LOCKFILE/SOURCE/styleguide/SOLEN_UI only), not in any hook.
6. [FIX] FLOW_HARNESS (/dev/flows, the owner-approved replacement for the graveyarded mockup model) is an ORPHAN: no ACTIVE.md row, zero references in any skill (fable-frontend still describes public/_mockups + /dev mockup routes only) , a fresh session cannot mechanically discover it.
7. [FIX] FLOW_HARNESS.md status stale ("awaiting reviewer pass" since 2026-07-08); REMOVED.md:56 points at a dead-end replacement.

Part-3 verdict: every other memory class has a hook on at least one end; TASTE_LOG has a hook on neither.

## Part 1: DOC estate (agent returned 2026-07-10)

1. [FIX] StatusPill documented in LOCKFILE:653-664 + COMPONENT_REGISTRY but DELETED 2026-06-30 (REMOVED.md:46; find = no file) , point both at StatusInline.
2. [FIX] REGISTRY ProgressStepper row = GREEN recipe citing LOCKFILE 13.2, which itself supersedes green with blue ("Green on a stepper node = NEVER") , rewrite to blue or drop (status "proposed").
3. [FIX] SOURCE.md:329 vs LOCKFILE:227 H2 contradiction (23px/700/-0.03 vs 20px/600/-0.01), flagged by CONSISTENCY_AUDIT 33 days ago, never applied.
4. [FIX] Stale border hex #E7E5E4 in SOURCE.md:289 + CONSISTENCY_AUDIT:33 (current: #E4E4E7; SOURCE contradicts itself two lines apart).
5. [FIX,HIGH] TASTE_LOG Round-3 B1 + CONSISTENCY_AUDIT B1 still read "[RESOLVED: BLUE]" for selected states , superseded 2026-06-29 by the gray rule; the anti-relitigation ledger IS the stale relitigation source. Strikethrough + supersession note both places.
6. [FIX] Toast doc claim stale in LOCKFILE section 5 + REGISTRY ("pastel pill") vs live Toast.tsx white-pill V3-D462 (memory already right; docs wrong).
7. [FIX] components-legacy/ui/Toast.tsx divergent dead file (blue error icon + killed s-amber token) , confirm zero importers then delete + REMOVED line.
8. [PARK] generalize gate-name-cited-but-not-built check , folded into the weekly self-audit.
9. [FIX] (= part 2/3 headline) TASTE_LOG / REGISTRY / CONSISTENCY_AUDIT have zero injection paths.
10. [FIX] LOCKFILE + SOURCE referenced by ZERO hooks; enforcement is a hand-copied regex subset that provably drifted (findings 1-6). Doc-vs-gate reconciliation goes into the weekly self-audit.
11. [DONE 2026-07-10, owner: "fold it"] CANON.md folded into LOCKFILE. Deltas added to LOCKFILE (warm-shadow rationale in section 3, amber deeper-sibling note in section 1, fold provenance in section 8); CANON.md is now a tombstone with a section-to-section map; live citations repointed (SOURCE 7 spots, fable-reasoning + fable-frontend skills, SelectedCheckBadge.md); drift-check A9 message rewritten from the RETIRED v2 "generous blue" law to LOCKFILE section 1.5 v3 (a real stale-law bug this fold surfaced). NEW PARKED (from the fold): (a) drift-check ACCENT_ALLOWED_HINTS still carries v2 tappable-markers as FP-suppressors , tightening needs a live FP count first, blocking coverage lives in no-black-selected-gate; (b) CANON R4 housekeeping , archive the pre-B&W Hanken-era mockups (12+ files, e.g. solen-apricot-dusty-duo.html) out of the served public/ root to public/_archive-mockups/ , historical doc links break on move, needs a link sweep first.
12. [FIX] MOTION.md stale self-claim ("loads every session") , correct to "ENTER RECIPE gate-enforced, rest read-on-demand".
13. [FIX] TASTE_LOG Rounds 4/5 unchecked 33 days while MOTION.md claims the confirmation rebuild done , cross-reference and close explicitly.

## Triage verdict (0p-4)
FIX-wave groups: (A) doc corrections 1-7,12,13 + TASTE_LOG keyword backfill; (B) hook fixes , gemini message, dataviz context, no-black-selected merge (the live-proven blue hole), owner-scope relevance, TASTE_LOG injection via the drift-ledger mechanism; (C) the mockup-preflight AGGREGATOR (one-pass manifest). Process fixes: FLOW_HARNESS registration + skill references, SENIOR_SCORECARD into the design-verifier agent def, doc-vs-gate reconciliation into the weekly audit. PARKED: structure-liberty prose dedup (low); gate-name check (weekly audit); spec.md re-diff , OWNER DECIDED 2026-07-10: went with the defer recommendation, do NOT build until a real case of built-page-vs-measured-spec drift shows up; then revisit. OWNER: CANON precedence line , DECIDED 2026-07-10: folded (see finding 11).

## Part 2: design-HOOK estate (agent returned 2026-07-10, live Write-probes used)

1. [FIX,#1-ranked] SERIAL FRICTION root: 13+ independently-registered PreToolUse gates each deny one at a time on a mockup Write (live-tested: two probes, one message each). Fix: ONE mockup-preflight aggregator hook that runs every check in-process and returns a single manifest of ALL unmet requirements (consolidation precedent: mockup-content-gate already merged 5, copy-lint merged 4).
2. [FIX,#2] gemini-check-gate.py:112-120 deny message hardcodes "search mockup"/"Airbnb reference" whatever was edited , a factually WRONG "instead" (law 6.7 violation in substance). Interpolate the real path + generate context.
3. [FIX,#3] no-black-selected duplication is a real COVERAGE HOLE (live-proven): global copy detects blue-selected but is shadowed; project copy misses blue + non-ternary shapes. A blue-selected state reusing a declared class constant ships past EVERYTHING today. Merge: port blue-detection + non-ternary into the project gate (keeps its net-new discipline + avatar exemption), retire/narrow the global copy.
4. [FIX] dataviz misfire root (tonight's icon false-positive): mockup-content-gate.py:243 in_chart = element-name OR-alternation (<path|<circle...) with no chart-context token requirement. Require co-occurring chart/spark class.
5. [FIX] TASTE_LOG read by ZERO gates (grep-proven; matches part 3) , a mockup can re-litigate the 2026-06-29 neutral-filters call and pass everything. Fix: keyword-injection mechanism (drift-ledger-inject pattern) pointed at TASTE_LOG entries.
6. [FIX] owner-scope arm partials: (a) Grounded-in accepts ANY existing path (no relevance check; reuse mockup-parity token-overlap), (b) fabrication regex too narrow (fake ETA/status strings pass), (c) nothing requires a mobile-viewport render before the owner sees a mockup.
7. [PARK,low] structure-liberty-injector duplicates 6 mockup rules as hand-copied prose (lines 50-55) that can drift from the gates' regexes , consolidate when next touched.
8. LAW 6.7 compliance elsewhere: 12 of 13 read gates carry a genuine instead , pass.



## Improvement wave (0p-5, after triage)
