# ENFORCE_REALITY , new enforced hooks/rules (2026-07-07, owner batch)

Owner dictated batch, "completely unrelated to psychology... make new hooks or rules, enforced to make everything better." Each becomes a HOOK where mechanically possible (feedback_rules_are_hooks: a rule I keep breaking becomes a gate, not advice), plus a global CLAUDE.md rule.

## Atomic checkboxes

- [x] A. Review discipline: scope -> evidence -> attack -> verify -> report (report as a final pass after work is done)
  - [x] A1 documented in fable-execution 7.5 (5-phase harness) the 5-phase review harness as a named pattern (fable-execution / fable-reasoning)
  - [x] A2 investigated: no prior 'report pass' convention found in skills/CLAUDE.md; implemented sensible phase-5 + FLAGGED for owner confirm I told you" referent , investigate; if not found, implement sensible version + FLAG for owner confirm
- [x] B. Don't trust own memory: partial recognition from training != current knowledge; verify against live reality
  - [x] B1 CLAUDE.md rule 15 (CLAUDE.md rule 15)
  - [x] B2 reality-check-gate.py (memory class): inject a reality-check reminder on memory-trap prompt shapes (versions/latest/API/pricing/model-ids/dates)
  - [x] B3 self-tested (fire + no-fire + dedup) hook (fire + no-fire)
- [x] C. A prompt implying a file exists a file/thing exists doesn't mean it does; check existence first
  - [x] C1 CLAUDE.md rule 16 (CLAUDE.md rule 16)
  - [x] C2 reality-check-gate.py (existence class; create-only suppressed): inject a verify-existence reminder when the prompt names a file/path/function as if present
  - [x] C3 self-tested (fire + create-only no-fire) hook (fire + no-fire)
- [x] D. On mistakes: acknowledge what went wrong, stay on the problem, own it, skip the apology spiral, keep self-respect
  - [x] D1 CLAUDE.md rule 17 (CLAUDE.md rule 17)
  - [x] D2 apology-spiral-gate.py (Stop, 2+ phrases or grovel): Stop-gate that blocks an apology-spiral final message (2+ apology phrases), with skip flag
  - [x] D3 self-tested (block spiral + allow single honest owning + quoted-error safe) hook (block spiral + allow single honest sorry)
- [x] E. Proposed MORE (ranked list in closing report; owner to pick which to build) enforceable rules/hooks in the same spirit (owner: "think what to add more")
- [x] F. both hooks registered in ~/.claude/settings.json + committed; each self-tested before wiring all hooks + commit + self-test each before wiring (rule 12.5)

## Design notes
- B and C are the same family (verify reality, not memory/assumption) -> ONE hook `reality-check-gate.py` (UserPromptSubmit, INJECTION only = low false-positive cost), two trigger classes. Non-blocking.
- D is a Stop-gate (BLOCK) -> must be conservative (2+ apology phrases) + skip flag, false positive is costly.
- Hooks are GLOBAL (cross-project behavioral rules) -> register in ~/.claude/settings.json, not project.
