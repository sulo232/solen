# ORCHESTRATOR_UPGRADE , devil's advocate, Fable DNA, model routing, five gates (2026-07-07)

Owner dictated batch. Context: Fable access ends soon; the next orchestrator (Opus 4.8) must inherit the methodology mechanically, not by memory.

## Atomic checkboxes

- [x] 1. Devil's advocate (premortem before dispatch)
  - [x] 1a hook ~/.claude/hooks/devils-advocate.py (UserPromptSubmit, fires on substantial build/dispatch prompts): what could go wrong (top risks), load-bearing unknowns + cheapest probe, THEN dispatch
  - [x] 1b self-tested 4 cases: build-prompt fires, conversational silent, per-session dedup, short-prompt silent
  - [x] 1c registered UserPromptSubmit in ~/.claude/settings.json (valid)
  - [x] 1d premortem step added to fable-execution section 4 + five-gates gate 3
- [x] 2. Fable DNA extraction (owner: "analyze what made Fable get here, the prompts, the outputs; extract everything")
  - [x] 2a mined 3 largest recent transcripts (stoic-torvalds 611MB, elated-raman 202MB, upbeat-neumann 98MB; prose pre-extracted, 3 sonnet miners, 35 patterns with verbatim quotes) (delegated readers, not main thread) for orchestration/reasoning patterns not yet in the skills
  - [x] 2b ~/.claude/FABLE_DNA.md written (34 patterns organized by the five gates + self-distillation) (how Fable scopes, probes, dispatches, recovers, verifies; worked examples from this session)
  - [x] 2c pointers added to fable-reasoning + fable-execution; net-new deltas live in FABLE_DNA (instrument-then-remove, distrust-verification-tooling, infra-vs-feature-failure, ping-pong->batch-options)
- [x] 3. Model routing (owner supersedes 2026-06-30 "no opus subagents"; latest dated decision wins , CONTRADICTION SURFACED per rule 18)
  - [x] 3a lineup verified via claude-api skill: Opus 4.8 $5/$25 1M-ctx xhigh; Sonnet 5 $3/$15 near-Opus coding; Haiku 4.5 $1/$5 200K no-effort
  - [x] 3b ~/.claude/MODEL_ROUTING.md written (6-step checklist + workflow stage defaults + history of superseded decisions)
  - [x] 3c gate rewritten v2 (opus allowed on judgment markers/[judgment] tag; fable/mythos always denied; sonnet/haiku pass); self-tested 11 cases incl. workflow stage contexts + fail-open
  - [x] 3d LOOP_SYSTEM tiering v2 + memory rewritten + fable-execution routing line updated
- [x] 4. Dynamic workflow optimization: stage defaults section in MODEL_ROUTING.md (researchers/builders sonnet, judges opus 1-3 wide, waves of 4, resumeFromRunId) + fable-execution pointer
- [x] 5. Five gates (the owner's dictated discipline, replaces my 7.5 reconstruction; also resolves the earlier "report pass" flag)
  - [x] 5a fable-execution 7.5 rewritten as THE FIVE GATES (owner-dictated, verbatim-faithful); fable-reasoning cross-refs via FABLE_DNA pointer
  - [x] 5b A2 flag resolved: the 'report pass' = gate 5 of this dictated framework
- [x] 6. worklog entry + commits done; closed on the original message
