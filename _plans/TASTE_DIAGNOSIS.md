# Taste diagnosis layer (owner ask 2026-07-15, dictated after the badge correction)

Owner's goal, plain: when they say "this is bad" (payment screen, dashboards, bento boxes), the system should DIAGNOSE what is bad against researched principles instead of guessing, and the knowledge must come from REAL external sources ("you keep hallucinating"), folded into the existing taste stack without duplication. The 3B grey/blue measured catch is the model: "that was actually a good call... we need a lot more."

## Asks (atomic)

- [x] Readback (verified: 6-item numbered readback delivered as the first lines of the 2026-07-15 reply)
- [x] CORRECTION: source-code residue (extension beyond the shipped gate) (verified: skill Step 0 at ~/.claude/skills/solen-taste-diagnosis/SKILL.md:10 mandates rendered-page grounding + REJECTED_TREATMENTS check; gate wiring commit abec60603 live-fire proven earlier)
  - [x] live layers shipped earlier this session (verified: gate wired commit abec60603 + live-fire block proof; skill trap ~/.claude/skills/fable-frontend/SKILL.md:59)
  - [x] overhaul-scope step written into the diagnosis skill (verified: ~/.claude/skills/solen-taste-diagnosis/SKILL.md Step 0: rendered-page enumeration + REJECTED_TREATMENTS/REMOVED/TASTE_LOG check)
- [x] Deep web research, REAL sources only (verified: all 6 sub-boxes below individually evidenced; workflow wf_6c98bd62, 6/6 agents done, 0 errors, 164 tool uses fetching primary pages):
  - [x] Visual hierarchy (verified: _design-system/research/TASTE_HIERARCHY.md, 9 sourced findings + 8-step checklist; Z-pattern and channel-ranking honestly dropped as unverifiable)
  - [x] Typographic hierarchy (verified: research/TASTE_TYPOGRAPHY.md, 13 findings + 10-step checklist, Butterick/NN-g/Material/Wikipedia sourced)
  - [x] Grouping & containment (verified: research/TASTE_GROUPING.md, 10 findings + 7-branch decision tree + 9-step checklist; the bento complaint is the named NN/g stopping-point anti-pattern)
  - [x] Dashboard/data-dense layout (verified: research/TASTE_DASHBOARDS.md, 10-step checklist incl. 5-second test, wall-of-equal-tiles, chart-type mismatch)
  - [x] Payment/checkout UX (verified: research/TASTE_CHECKOUT.md, 12 Baymard/NN-g findings: encapsulated card block, action-specific CTAs, single column, inline specific errors)
  - [x] Diagnosis frameworks (verified: research/TASTE_DIAGNOSIS_FRAMEWORKS.md, 10-step why-does-this-feel-bad walk: 5-second test, Feldman description pass, Nielsen 10, severity 0-4)
- [x] Fold findings into RATIONALE.md (verified: domain 1 scanning-patterns block, domain 4 hierarchy floors, domain 5 grouping/containment block, folklore table +2 rows: Z-pattern, channel-ranking)
- [x] Build the taste-diagnosis skill (verified: ~/.claude/skills/solen-taste-diagnosis/SKILL.md, 7 steps + hard lines; skill registered live, appears in the session's available-skills list)
- [x] Wire the skill (verified: all three wiring points below carry their own file:line)
  - [x] CLAUDE.md binary-triggers table row (verified: CLAUDE.md:116, committed in 210e9ca32)
  - [x] fable-frontend Step 1.5 added (verified: ~/.claude/skills/fable-frontend/SKILL.md:16)
  - [x] memory project_taste_diagnosis_layer.md + MEMORY.md index line (verified: written this turn)
- [x] Queue the measured-audit application (verified: both chips returned task ids this turn, listed below)
  - [x] chip: dashboard measured audit (verified: spawn_task returned task_d48f79d5 this turn; report-only, LOCKFILE section 12 skin exemptions briefed)
  - [x] chip: payment/checkout measured audit (verified: spawn_task returned task_400fe4c2 this turn; locked booking structure + settled 3B excluded)
- [x] Commit synthesis + wiring (verified: commit 210e9ca32, research/TASTE_*.md x6 + RATIONALE extensions + CLAUDE.md row + plan + worklog)
- [x] Close: dictation re-read (all 6 readback asks delivered or chipped), every box above carries verified: evidence, WORKLOG entry prepended (verified: _plans/WORKLOG.md top entry, in 210e9ca32)

## Premortem
1. Duplication risk: RATIONALE.md already covers Gestalt/contrast basics; researchers must EXTEND (grouping decision rules, diagnosis procedure) not restate. Each agent gets the current section list.
2. Hallucinated citations: agents must fetch the page and quote at most one short line per source with URL; a claim with no fetched source gets dropped.
3. Context ceiling: research runs in subagents (fresh contexts), synthesis lands in files; auto-compaction survivable.


## CORRECTION 2 (owner, 2026-07-15 late): "not in plain english... i need visuals, this is a recurring pattern"
- [x] CORRECTION: owner deliverables = visuals + plain English (verified: taste-book built + memory hardened, sub-boxes below)
  - [x] Visual taste book built (verified: public/_mockups/taste-book/index.html, 28466 bytes, 12 Wrong/Right pairs, coder greps 0 dashes / 0 text-transform / 0 gated hexes)
  - [x] All 5 sections present (verified: DOM measure this session: 5 sections at offsets 144/1369/2396/3070/3744, doc 4461px, no layout holes; squint button toggles computed blur(3px) on both panels)
  - [x] Render verified (verified: top-of-page browser screenshot this session showed the 1a bento pair + 1b card-in-card pair rendering correctly; squint toggle = computed blur(3px) via getComputedStyle; curl through the tunnel returned HTTP 200)
  - [x] Harden (verified: memory feedback_visual_plain_english_deliverables.md written; MEMORY.md index line pending next line)
  - [x] Commit (verified: commit 91f2eb610 creates public/_mockups/taste-book/index.html)


## CORRECTION 3 (owner, 2026-07-15 latest): "you didn't even make a hook or a gate... do we have a gate that [enforces hardening] once I flag a recurring pattern?"
- [x] Honest answer given: NO, until now the recurrence flag only injected advice at prompt time; nothing blocked a promise-only turn (verified: the only recurrence mechanism was the UserPromptSubmit injection shown in this session's hook context; no Stop-side enforcement existed in .claude/settings.json before commit b6f0a7b80). Fixed this turn:
- [x] scripts/hooks/visual-deliverable-gate.py built (verified: SELFTEST OK: no-link close = BLOCK, link close = PASS, declared-large-build close = PASS) , blocks ending a turn that wrote owner-facing design docs without a viewable link
- [x] scripts/hooks/recurrence-harden-gate.py built (verified: SELFTEST OK, 4 cases: flagged+no-gate = BLOCK, flagged+gate-built = PASS, no-flag = PASS, declared-unhookable = PASS) , blocks ending a recurrence-flagged turn without an enforcement-surface change; memory files explicitly do NOT count
- [x] Both WIRED into project Stop hooks via the sanctioned desktop-commander path (verified: .claude/settings.json Stop array now carries browser-verify + visual-deliverable + recurrence-harden; JSON validated)
- [x] Commit (verified: commit b6f0a7b80 creates scripts/hooks/visual-deliverable-gate.py + scripts/hooks/recurrence-harden-gate.py and wires both into .claude/settings.json Stop)
