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
- [x] 5. ASK owner per proposal , ANSWERED 2026-07-07: coder git-guard YES as hook; pkill-guard SKIPPED (owner); wrong-surface readback SKIPPED (owner); verify-early = HOOK auto-fires; hook maintenance = FULL batch; docs dangerous + doc trims + skill fixes = ALL yes; llm-council keeps opus as documented exception (owner left it unselected)
- [x] 6. Implement approved items , ALL 8 workflow tasks reviewer-PASSed (5 in round 1, 3 in round 2; run wf_24a77c5d-67b)
  - [x] 6a. P1 false-positive fixes , notification guard live (spot-verified: this session's own hook misfires stop), no-verbose "Zoom (max 200%)" passes, design-verify/mockup-visual/reinvent/unfinished-batch tuned
  - [x] 6b. P2 worktree-path fixes in link-gate.py + finish-autonomously-gate.py (cwd fallback, tested vs temp repo)
  - [x] 6c. P12 dangerous docs , grep-verified: 0 "ALWAYS push" in CODE_SAFETY, SYSTEMS routes all resolve, /discover only as historical note, KEY_FEATURES restored + B2B_WORKFLOWS_IDEAS.md created
  - [x] 6d. P10+P11 skills , site-tester/emil-design-eng phantoms gone (remaining mentions are explicit "does not exist" corrections), huashu SKIP clause + Chinese gate live (visible in session skill list), opus exception documented
  - [x] 6e. P13 trims , LOOP_SYSTEM 9K->5.7K, SOLEN_PATTERNS 20K->8K, SOLEN_UI 41K->35K, AGENT_COORDINATION split to archive, SECURITY re-review stamped, precedence footnote added, memory pointer fixed
  - [x] 6f. P3 consolidations , copy-lint-gate.py + mockup-content-gate.py live, 12 files in _retired/, settings valid, health-check hook-wiring=0
  - [x] 6g. P4 hygiene , 3 orphan flags deleted, sweep extended to *-skip/*-ok >48h (stale flags 19->6), ledger rotation, collision-guard synthetic test run, gemini/parity scopes widened, exists-guard weighting
  - [x] 6h. P9+P14 , SKILL REFS invariant live in --report (0 violations), council.workflow escalates on all-lens failure
  - [x] 6i. P5 coder-git-guard.py live + wired (coder checkout DENIED / status allowed / main-thread unaffected, tested)
  - [x] 6j. P8 verify-tooling-preflight.py + gemini-auto-fire.py live + wired (gemini-check-gate untouched as backstop)
- [x] 7-close. Original dictation re-read; all asks delivered or owner-disposed. Owner skips: pkill guard, wrong-surface readback, opus switch.
- [x] 8-bonus. Stranded enforcement REVIVED (found during close, finish-autonomously gate correctly refused the park): cherry-picked 879cc736c (browser-verify Stop gate + wiring) + 685d9bf19 (site-tester MCP) onto this branch. Conflicts resolved (ACTIVE.md kept current index; package.json took ONLY @modelcontextprotocol/sdk, dropped @phosphor-icons per Lucide-only rule; lock regenerated). Proof: selftest.mjs 74/74; gate self-test block(exit 2)/pass(exit 0); project settings JSON valid; health check wiring 0. Memory project_browser_verify_and_site_tester updated to revived-on-branch status.
- [ ] 7. Close: re-read original dictation, tick every box, report once

## Parked / notes
- Owner phrase "drop many many Sane five" read as "spawn many many Sonnet 5 subagents" (matches gate: sonnet/haiku only).
- Implementation (box 6) is gated on the owner's hook-vs-skill answers by explicit owner order.
