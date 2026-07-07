# ENFORCE_REALITY , new enforced hooks/rules (2026-07-07, owner batch)

Owner dictated batch, "completely unrelated to psychology... make new hooks or rules, enforced to make everything better." Each becomes a HOOK where mechanically possible (feedback_rules_are_hooks: a rule I keep breaking becomes a gate, not advice), plus a global CLAUDE.md rule.

## Atomic checkboxes

- [x] A. Review discipline: scope -> evidence -> attack -> verify -> report (report as a final pass after work is done)
  - [x] A1 documented in fable-execution 7.5 (5-phase harness) the 5-phase review harness as a named pattern (fable-execution / fable-reasoning)
  - [x] A2 investigated: no prior 'report pass' convention found in skills/CLAUDE.md; RESOLVED 2026-07-07: the owner dictated the full framework (the five gates); fable-execution 7.5 now carries it verbatim-faithful, flag closed
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
- [x] E. MORE , all 3 BUILT (finish-autonomously: no stopping to ask):
  - [x] E1 stat-source-gate.py (Stop): blocks unsourced persuasion stats; extends rule 15. Self-tested (block unsourced, allow sourced, allow 'tests pass'/'20% off').
  - [x] E2 rule 18 contradiction-surfacing (disposition-tier rule; reality-check backs the file/version half).
  - [x] E3 post-compact-reverify.py (SessionStart resume/compact) + rule 19. Self-tested (fires compact/resume, silent startup).
- [x] F. both hooks registered in ~/.claude/settings.json + committed; each self-tested before wiring all hooks + commit + self-test each before wiring (rule 12.5)

## Design notes
- B and C are the same family (verify reality, not memory/assumption) -> ONE hook `reality-check-gate.py` (UserPromptSubmit, INJECTION only = low false-positive cost), two trigger classes. Non-blocking.
- D is a Stop-gate (BLOCK) -> must be conservative (2+ apology phrases) + skip flag, false positive is costly.
- Hooks are GLOBAL (cross-project behavioral rules) -> register in ~/.claude/settings.json, not project.


## Dogfood fix (2026-07-07): stat-source-gate false-positive on meta/quotes
The stat-source Stop gate trapped a reply that merely DISCUSSED the gate (it quoted trigger phrases like a "studies show" example). Root cause: it matched the raw final message, so quoted examples + meta-discussion counted as assertions. Fixed: (1) skip when the message contains gate/meta keywords (gate|hook|unsourced|trigger|rule 15|self-test|...); (2) strip double-quoted and backticked spans before matching (a quoted stat is a citation of a pattern, not a claim). Re-tested 5 cases: blocks a genuine unsourced assertion, allows meta-discussion / quoted example / sourced stat / the exact trapping message. Lesson logged: a content-scanning Stop gate must exclude quotes+meta or it cannot describe itself.
