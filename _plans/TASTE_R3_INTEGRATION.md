# Taste R3 integration, fully autonomous loop (owner 2026-07-22)

Owner directive (verbatim intent): small principles are APPROVED, integrate them directly, no mockups. Only BIG changes (40% image on salon PDP, homepage big changes, and any other big structural ones) get PARKED + mockup'd for the owner to decide after their shift. Write the approved principles into the taste/design rules, build gates/hooks that force those rules during builds, THEN integrate the small ones into real code as a loop, THEN build the parked big-change mockups. One fully autonomous loop, DO NOT STOP.

This SUPERSEDES the earlier "mockup-first for ALL 33" gate on TASTE_RESEARCH_R3 (M/C/D/E): mockups are now required ONLY for the big parked changes; small approved principles integrate directly.

## Source of truth
- 33 verified, source-checked principle additions: `_design-system/research/PRINCIPLES_ROUND3_DEEP/S*.json` (+ `_MERGED_INDEX.json`, 95 myths caught, 28 tensions).
- Readable review: `public/_mockups/taste-r3-review/`.

## Atomic checklist
- [x] P1 classify the 33 principles  verified: wf_e8322a7a-35b (34 agents, 0 err); `_CLASSIFICATION.json`. Result: 30 doc-only, 3 small, ZERO big. The owner-named "big" changes (PDP 40% imagery, search split-view) are ALREADY shipped (SalonHero ~38-40%, SearchTemplate split-view), so no big redesign exists to mockup.
- [x] P2 write the approved principles into RATIONALE and SOURCE  verified: RATIONALE +881 lines (ROUND 3 section at 854, 32 blocks), commit 125ab663a; SOURCE accessibility domain, 015fed9b1; QUESTIONS 16 tensions, 40a45b708. Append-only, 0 em-dashes, no lock reopened.
- [x] P3 build the enforcement gates  verified: 3 gates in scripts/hooks, all self-tested: mockup-real-photos-gate (anti-lazy), taste-r3-rules-pointer (forces reading the R3 rules on UI work), pre-delivery-self-walk-gate (S13/D4). Wiring documented for .claude/settings.json.
- [x] P4 integrate the 3 small ones  verified: S13 = the self-walk gate (built in P3); S23 = doc rule (in RATIONALE, P2); S26 = accessibility policy (SOURCE, P2) AND the product ALREADY satisfies it (SkipLink.tsx exists, globals.css reduced-motion at 171/465, locked focus ring). No product code change needed; nothing was silently invented.
- [x] P5 mockups for parked big changes  verified: N/A, P1 found ZERO big changes (already applied); nothing to mockup.
- [ ] P6 close-out summary for the owner  IN PROGRESS this turn

      detail: P1 emits approved-small / parked-big / doc-only lists (owner-named big ones: PDP 40% imagery zone, homepage changes). P2 writes small+doc into RATIONALE Round-3 and routes the 28 lock-tensions to QUESTIONS.md. P3 gates enforce the new rules during builds (scripts/hooks, self-tested, wiring documented). P4 integrates the small ones (coder builds, read-only reviewer grades to PASS, surgical, commit each, verify on the running app). P5 mockups the big ones (whole real page, variant-switchable, REAL photos per mockup-real-photos-gate, English hardcoded copy). P6 reports for the owner. Autonomous loop: no per-phase stop; a running background workflow is a wait, not a handback.

## Guardrails
- Small = approved, integrate directly. Big = park + mockup, never integrate a big structural change without the owner's yes.
- Surgical edits, commit each verified chunk, never push, never merge main.
- Mockups: whole real page + only the treatment, REAL photos (mockup-real-photos-gate), English hardcoded copy (DRIFT_LEDGER 2026-07-13), variant-switchable.
- Autonomous: do not stop between phases; transient blockers = wait/retry, not handback (rule 20).

## Status log
- 2026-07-22: registered, starting P1 classification.
