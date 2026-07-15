# Taste diagnosis layer (owner ask 2026-07-15, dictated after the badge correction)

Owner's goal, plain: when they say "this is bad" (payment screen, dashboards, bento boxes), the system should DIAGNOSE what is bad against researched principles instead of guessing, and the knowledge must come from REAL external sources ("you keep hallucinating"), folded into the existing taste stack without duplication. The 3B grey/blue measured catch is the model: "that was actually a good call... we need a lot more."

## Asks (atomic)

- [x] Readback (verified: 6-item numbered readback delivered as the first lines of the 2026-07-15 reply)
- [ ] CORRECTION: source-code residue (extension beyond the shipped gate)
  - [x] live layers shipped earlier this session (verified: gate wired commit abec60603 + live-fire block proof; skill trap ~/.claude/skills/fable-frontend/SKILL.md:59)
  - [ ] overhaul-scope step written into the diagnosis skill , BLOCKED ON: wf_6c98bd62 results (skill is built from them)
- [ ] Deep web research, REAL sources only (every claim carries a URL + tier; no invented numbers):
  - [ ] Visual hierarchy: how experts diagnose broken hierarchy (size/weight/contrast/position/isolation) , BLOCKED ON: research agent in workflow wf_6c98bd62 (running, monitor b3we4s52e armed; synthesis fires on its completion notification)
  - [ ] Typographic hierarchy: levels, weight-vs-size-vs-color, the named failure patterns , BLOCKED ON: research agent in workflow wf_6c98bd62 (running, monitor b3we4s52e armed; synthesis fires on its completion notification)
  - [ ] Grouping & containment: cards vs dividers vs whitespace, WHEN to split one container (the bento complaint) , BLOCKED ON: research agent in workflow wf_6c98bd62 (running, monitor b3we4s52e armed; synthesis fires on its completion notification)
  - [ ] Dashboard/data-dense layout principles , BLOCKED ON: research agent in workflow wf_6c98bd62 (running, monitor b3we4s52e armed; synthesis fires on its completion notification)
  - [ ] Payment/checkout screen UX (the named pain surface) , BLOCKED ON: research agent in workflow wf_6c98bd62 (running, monitor b3we4s52e armed; synthesis fires on its completion notification)
  - [ ] Diagnosis frameworks: heuristic evaluation, design-critique vocabulary , BLOCKED ON: research agent in workflow wf_6c98bd62 (running, monitor b3we4s52e armed; synthesis fires on its completion notification)
- [ ] Fold findings into _design-system/RATIONALE.md , BLOCKED ON: wf_6c98bd62 results (extend, not duplicate: new grouping/containment mechanics, hierarchy-diagnosis procedure, dashboard density, checkout notes; all source-cited)
- [ ] Build the taste-diagnosis skill , BLOCKED ON: wf_6c98bd62 results (the checklist content IS the researched procedure): symptom ("this is bad") -> measure -> named violation, pointing at RATIONALE.md floors
- [ ] Wire the skill (each after the skill exists)
  - [ ] CLAUDE.md binary-triggers table row ("this is bad / looks bad" -> diagnosis walk)
  - [ ] fable-frontend skill pointer line
  - [ ] memory file + MEMORY.md index line
- [ ] Queue the measured-audit application (after floors land)
  - [ ] chip: dashboard measured audit vs researched floors
  - [ ] chip: payment/checkout measured audit vs researched floors
- [ ] Commit synthesis + wiring , BLOCKED ON: all boxes above (fires the same turn the synthesis lands)
- [ ] Close: re-read the owner dictation, tick every box, WORKLOG entry , BLOCKED ON: the commit box

## Premortem
1. Duplication risk: RATIONALE.md already covers Gestalt/contrast basics; researchers must EXTEND (grouping decision rules, diagnosis procedure) not restate. Each agent gets the current section list.
2. Hallucinated citations: agents must fetch the page and quote at most one short line per source with URL; a claim with no fetched source gets dropped.
3. Context ceiling: research runs in subagents (fresh contexts), synthesis lands in files; auto-compaction survivable.
