# Context collapse: doctrine + bloat fixes (owner ask 2026-07-08)

Owner scope: context ONLY for now. Deliver the philosophy/structure (when + how to collapse context), fix bloated/unnecessary context sources where safe, wire it into auto hooks (not advice).

## Asks (atomic)

- [x] 1. Write the full structure/philosophy doc: when and how to collapse context -> ~/.claude/CONTEXT_SYSTEM.md
  - [x] 1a. Budget tiers (healthy / working / collapse-now thresholds)
  - [x] 1b. WHEN: the collapse triggers (topic switch, phase boundary, bulk just landed)
  - [x] 1c. HOW: /clear vs /compact semantics + the persist-to-disk ritual before collapsing
  - [x] 1d. Keep-out rules (what never enters main context)
  - [x] 1e. Maintenance cadence (memory index, WORKLOG, ACTIVE.md, plugin set)
- [x] 2. Fix bloated per-message hook injections (global hooks: full text on FIRST firing per session; triggers unchanged; coder round 1+2, loop-reviewer PASS)
  - [x] 2a. multi-ask-decompose.py (repeats = 1-line reminder)
  - [x] 2b. devils-advocate.py (repeats = silent, original one-shot restored in round 2)
  - [x] 2c. fable-skill-trigger.py (per-category: first match full, repeats silent, round 2)
  - [x] 2d. no-loop-narration-nudge.py (repeats = 1-line)
  - [x] 2e. plan-active-prompt.py (workstreams reminder: repeats = short)
- [x] 3. Auto hook: context-budget nudge in plan-active-prompt.py (transcript-size estimate, compact_boundary-aware, 120k = CONTEXT / 150k = CONTEXT RED, once per tier per session, fail-open)
- [x] 4. Self-tested (trigger/repeat/non-trigger + garbage stdin, py_compile) then read-only loop-reviewer graded: PASS round 1, no punch list
- [x] 5. Memory pointer: reference_context_system.md + MEMORY.md line

## Parked (blocked, named dependency)

- WORKLOG SessionStart trim (newest entry only): file is `.claude/hooks/worklog.py` in the PROJECT hooks dir, which is write-protected for this session. Needs owner to apply or approve the write.
- CLAUDE.md compression (24KB global + 23KB project, both injected every session): they are owner law text; est. 40-50% smaller without losing a rule by deduping what already lives in skills/hooks. Needs owner ok before touching.
- Plugin/connector prune (biggest baseline cut): needs owner action in claude.ai connector settings + /plugin. Candidate disable list for Solen work: small-business, marketing, brand-voice, huggingface-skills, box, design, product-tracking-skills, vpai, pdf-viewer, desktop-commander (overlaps Bash), one of the two Figma servers, one of the two Chrome-control servers, gmail connector, vercel connector.
- Memory index consolidation (17KB, 97 files): run /consolidate-memory as its own pass (merge dupes, prune index). Offered, not run in this turn.
- ~/.claude/state/ per-session files never get pruned (reviewer extraFinding, non-blocking): add a >7-day sweep to a SessionStart hook in a later meta batch.
