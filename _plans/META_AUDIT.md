# META_AUDIT , sessions -> skills/hooks/docs upgrade batch (2026-07-07)

Owner ask (dictated): audit almost all past sessions with many parallel Sonnet subagents (positives + downsides + repeated issues), analyze the whole skills + hooks estate for improvements, analyze CLAUDE.md and other bloated files, then propose skill/hook changes and ASK the owner per proposal whether it becomes a hook (auto) or a skill (on demand) BEFORE implementing.

Prior art (rule 12): [RETRO_2026-07-06.md](RETRO_2026-07-06.md) already mined 34 transcripts to 2026-07-05 for owner messages + failure taxonomy. This batch REUSES that and audits with a different lens: per-session positives AND negatives, hook/gate friction (wrong blocks, skip-flag abuse), skill effectiveness in situ, plus sessions since 07-05.

## Checkboxes (atomic)

- [ ] 1. Session audits via parallel Sonnet subagents
  - [x] 1a. Inventory all transcripts (40 files across worktree project dirs, 58K to 584M)
  - [x] 1b. Digest each transcript to a compact per-session extract (39 digests written by scratchpad/digest_sessions.py, 2.5GB -> 2.7MB)
  - [x] 1c. Spawn parallel Sonnet auditors over digest batches , DONE: all 13 session-audit reports returned 2026-07-07 (happy-jackson report recovered via its child agent after the primary returned empty)
  - [x] 1d. Cross-synthesize repeated issues, ranked, deduped against RETRO_2026-07-06 taxonomy , DONE: [META_AUDIT_REPORT.md](META_AUDIT_REPORT.md) section 1
- [x] 2. Skills + hooks estate analysis (BEFORE building anything new)
  - [x] 2a. Audit global hooks A-M (30 files) + settings wiring , DONE (report section 2; link-gate/finish-autonomously worktree bug, mockup-family merge map)
  - [x] 2a2. Audit global hooks N-Z (43 files) + all 8 project hooks + Stop-hook interaction check , DONE (no-verbose false positive reproduced live; copy-lint merge map; 0 orphans)
  - [x] 2b. Audit all 15 skills , DONE (dead site-tester path x3, phantom emil-design-eng, huashu scoping, llm-council opus bypass)
  - [x] 2b2. Audit 5 commands + 2 workflows , DONE (verify.md stale line; workflows clean)
  - [x] 2c. 19 stale-flag violations analyzed , DONE: all inert past TTL (clutter not function); 3 flags have NO owning hook (grep-verified orphans); disposal = P4 in box 6 after owner ok
- [x] 3. Docs bloat analysis
  - [x] 3a. Global ~/.claude/CLAUDE.md , DONE: clean; optional rule 9->13 fold (~1KB)
  - [x] 3b. Project CLAUDE.md , DONE: best-maintained file; add 200-byte precedence footnote naming dangerous _rules files
  - [x] 3c. LOOP_SYSTEM.md + _rules/* + memory index , DONE: CODE_SAFETY 4/6/14 dangerous, SYSTEMS.md 3/7 routes 404, Rule 32 dead in 2 files, ~35-40KB correctable; memory 91/91 clean, 1 stale pointer
- [x] 4. Proposals mapped (P1-P14 in [META_AUDIT_REPORT.md](META_AUDIT_REPORT.md) section 5, each tagged fix/merge/new-hook/skill-edit; no duplicates , every proposal names the existing thing it extends)
- [ ] 5. ASK owner per proposal: hook (auto-fires) vs skill (on-demand) vs skip , ASKED 2026-07-07 (4 questions covering P1-P14); BLOCKER: owner answers
- [ ] 6. Implement approved items , HARD-BLOCKED by owner order: "before you actually implement... you have to ask me" (box 5 answers). Will be atomized into one box per approved proposal ONCE the owner picks hook-vs-skill per item; cannot atomize earlier because the item list IS the audit output.
- [ ] 7. Close: re-read original dictation, tick every box, report once

## Parked / notes
- Owner phrase "drop many many Sane five" read as "spawn many many Sonnet 5 subagents" (matches gate: sonnet/haiku only).
- Implementation (box 6) is gated on the owner's hook-vs-skill answers by explicit owner order.
