# Estate audit , hooks / skills / rules / systems / memory (2026-07-11)

Full audit of the enforcement + tooling estate by 5 parallel read-only agents (94 global hooks, 13 project hooks, ~20 custom skills + plugins, 11 system docs + global/project CLAUDE.md + 13 `_rules`, 90 memory entries, both `settings.json`). Every claim was cross-checked against the live filesystem / git / settings, not assumed. NO changes made , this is for approval.

Legend: **BIG** = needs your explicit yes (retires/weakens a gate, deletes a memory/skill, changes a rule's behavior). Everything else = low-risk correction I can batch on one "go the safe ones."

Verified CLEAN (good news): 0 wiring violations live (no orphan hooks, no phantom registrations, no broken memory links); `demo-data-not-live-gate` + `no-getsession-authz-gate` both now registered; pixel-spec-auto/screenshot-spec tiering is clean; gemini early-nudge+Stop pair is intentional not dup.

---

## TIER 0 , LIVE BUGS (something is currently wrong; fix regardless)
1. **check.py drift gate , 2 live literal bugs** (project `.claude/skills/solen-drift-check/scripts/check.py`, on the ENFORCED `--gate-stdin` path). `s-pop` still in RETIRED_TOKENS (:115) though LOCKFILE un-retired it (V3-D424) -> a legit urgency-badge token is blocked. `ALLOWED_HEX` has `#F5F5F4` (:69) where `s-bg-sunken` is really `#F4F4F5` -> the WRONG hex passes, the RIGHT hex is blocked. FIX: drop `s-pop`; correct the hex. Not BIG.
2. **readback-contract gate (`unfinished-batch-gate.py`) false-fires forever** on a days-old readback line that is itself a conditional/meta instruction ("if not enough -> improve it..."). Confirmed real (2026-07-09 transcript), it blocked THIS session repeatedly. FIX: bound the readback scan to messages since the last Stop AND exclude "if X then Y"/self-referential process lines from requiring a checkbox. Not BIG.
3. **`no-getsession-authz-gate.py` has no fail-open wrapper.** `main()` is called bare; every sibling wraps in `try/except: sys.exit(0)`. A crash-to-BLOCK on a security gate is the worst failure direction, and it contradicts its own docstring. FIX: wrap main(). Not BIG.
4. **`no-black-selected-gate.py` (project) is blind to BLUE selected-states.** Only detects `bg-s-ink`; never `bg-s-accent`/`border-s-accent` or a declared-constant class, though its own docstring claims blue-detection was ported in. The global copy self-disables for solen paths, so RIGHT NOW nothing in the repo checks blue-selected , the exact regression that already slipped once. FIX: port the blue + SEL_CONST regex. Not BIG (it strengthens the gate).

## TIER 1 , SECURITY / COVERAGE GAPS (a real hole, not just noise)
5. **`mcp-prod-write-guard.py` has a CLI-shaped bypass** , HIGHEST consequence. It blocks catastrophic SQL (DROP/TRUNCATE/unscoped DELETE) ONLY when `tool_name` starts with `mcp__`. A Bash `psql -c` / `supabase db execute --sql` with identical SQL is invisible to every hook. FIX: add a Bash-matcher twin running the same `catastrophic_sql_reason()`. Not BIG (additive).
6. **`coder-git-guard.py` + `no-ai-assets.py` don't strip heredoc bodies** , the exact class `no-verify-commit-gate.py` v2.1 just fixed. A `git commit -F - <<'EOF'` body mentioning "git checkout" or "dall-e" false-DENIES. FIX: port the v2.1 heredoc-strip regex into both. Not BIG.
7. **`pre-build-exists-check.sh` is gameable** , the "did `npm run exists` run" check is a bare substring grep, so any command merely CONTAINING that text (a decoy `grep "npm run exists" README`) satisfies the project's #1 anti-duplication gate. FIX: require the command to actually START with `npm run exists`. Not BIG.
8. **`frontend-design` plugin can bypass the fable-frontend pipeline** (enabled globally, broad "build web components" trigger, zero project guard) , it can ship UI with no exists-check/mockup-first/LOCKFILE. **BIG** , disable it for this repo, or add a hard carve-out.
9. **`coderabbit:code-review` auto-fires the same space `council-trigger.py` already owns** (two independent auto-review systems on one diff). **BIG** , pick council as canonical, make coderabbit opt-in.

## TIER 2 , STRUCTURAL: the gate estate is fragmenting
10. **5 stop/defer/punt Stop-gates overlap** (`finish-autonomously` + `unfinished-batch` + `owner-punt` + `no-defer-excuse` + `defer-bulk`). Each has its own phrase list, exemption list, skip flag, born from a separate incident; a fix in one doesn't propagate. This is WHY several fired on genuine completions this session. **BIG** , extract a shared `_lib` (phrase taxonomy + quote/backtick-strip + ONE meta-discussion exemption) all five import. (Same `_lib` also fixes: inconsistent meta-exemption in no-push/owner-punt/defer-bulk vs the windowed pattern already proven in link-gate + stat-source-gate; and the duplicated `ACTIVE_ROW`/`DETAIL_LINK` regex across unfinished-batch + pre-compact-snapshot.)
11. **Cross-scope DUPLICATE: `no-black-selected-gate.py` exists in BOTH global and project**, two different impls both firing on every Solen edit; the global one hardcodes Solen-only tokens it has no business owning. **BIG** , retire the global copy, keep project v2 as sole authority. (Ties to #4.)
12. **Project `mockup-english-gate.py` duplicates global `mockup-content-gate.py`** (same scope, same threshold) , will silently diverge on future fixes. Also: it isn't wired for MultiEdit AND wouldn't work there anyway (reads only `new_string`). **BIG** , retire the project copy (or give it the solen-path self-disable the sibling uses) + fix MultiEdit handling if kept.

## TIER 3 , DEAD-LAW / SKIP-DECAY (gates skipped so often they're advice, not enforcement)
Skip-flag ledger counts (last ~5 days): `media-read-ok` **213**, `plan-first` **45**, `finish-autonomously` **27**, `exists-skip` **25**, `batch-items` **25**, `removed-edit` **14**.
13. **`delegate-media-read-gate.py` skipped 213x** (10x the runner-up). Either the rule's exemption is too narrow for this screenshot-heavy repo, or it's reflexive bypass. **BIG** (if the exemption scope changes) , audit the 213, then broaden the RULE or tighten the gate; don't leave a silently-abused flag.
14. **`plan-first-gate.py` (45)** checks "was a `_plans/*.md` touched THIS turn," not "does the plan already cover this edit" , manufactures busy-work on multi-turn tasks. FIX: also pass when the ACTIVE row's detail file has an open checkbox whose keywords overlap the edited file. Not BIG.
15. **`exists-skip` (25) + `removed-edit` (14)** , the two anti-duplication / anti-revive gates are the ones most waved off. FIX: require a reason-string with the skip touch, or shorten the TTL. **BIG** (changes how the gate is bypassed).
16. **`owner-punt-gate.py` base arm** fires on bare `please provide`/`your side:` with no setup-object noun nearby (unlike its own DBPUNT/BACKENDPUNT arms) , "please provide feedback on the mockup" trips it. FIX: require a secret/key/token/env/domain noun within ~30 chars. Not BIG.

## TIER 4 , RULES + SYSTEM DOCS
17. **SECURITY_RULES.md S1 + CODE_SAFETY.md R25 still mandate `getSession()`** ("ALWAYS getSession, BANNED getUser") , the EXACT anti-pattern the live `no-getsession-authz-gate` now blocks and the whole backend migrated off 2026-07-10. **BIG** , rewrite S1 to `getUser()`/`requireAuth()`, tombstone R25.
18. **LESSONS_LEARNED.md forked from its own injector.** Its banner says it stopped being fed 2026-06-05; `lessons-ledger-inject.py` is hardcoded to read ONLY this file. So a month+ of lessons are invisible to the PreToolUse injector meant to surface past bugs , a silent no-op inside the enforcement layer. **BIG** , resume feeding it, or repoint the injector + fix REGRESSION_SYSTEM.md's doctrine.
19. **Fable-5-orchestrator assumption stale in 4 docs** (rule 14 + LOOP_SYSTEM + MODEL_ROUTING row 1 + FABLE_DNA) , this session runs on Sonnet 5, not Fable 5. **BIG** , confirm current model policy, update all four.
20. **SOLEN_UI.md (35KB, "mandatory hard stop")** is cited by ROADMAP_RULES but is absent from CLAUDE.md's design routing, the precedence chain, and fable-frontend , whether it actually binds is undefined. **BIG** , name its role in CLAUDE.md or fold into fable-frontend.
21. **CLAUDE.compact-draft.md swap decision** pending 3+ days, already drifting from the live file. **BIG** , accept or reject.
22. Non-BIG doc corrections (batchable): LAW_SYSTEM §5 names non-existent `_rules/DB_HANDLING.md` (repoint); REPORT_SYSTEM + LAW_SYSTEM describe `report-summary-gate.py` as "pending" but it's live (mark live); CODE_SAFETY R3/4/6 "build-before-commit" contradicts project CLAUDE.md "never build unless asked" + the precedence chain (strip "current law"); STRUCTURAL_RULES 42/46C "zone" rules retired elsewhere but not tombstoned here; ROADMAP_RULES R8 points at CLAUDE.md "Section 2/3.2/6/11" (no numbered sections exist); search-bar-rules S7 body still says `text-embedding-004` (retired) though its banner flags it; DB_SCHEMA.md hand-maintained + undated vs the live snapshot; precedence chain never ranks the `~/.claude/*.md` system docs; the 8-layer completeness checklist + "never push" are each duplicated across 4-5 files (trim to a pointer).
23. **STRUCTURAL_RULES 40/41 (orphan components) + 44 (naming collisions)** are incident-postmortem prose rules with a manual bash snippet, never hardened into gates despite LAW_SYSTEM's own "recurring prose -> gate" doctrine. FIX: `/harden` both. Not BIG.

## TIER 5 , SKILLS
24. **Capture pipeline leans on possibly-dead MCP tools.** `fresha-section-capture` + `site-teardown` + `gemini-visual-check` depend on `mcp__claude-in-chrome__*` / `mcp__Claude_Preview__*`, not registered in any config file found; a real working replacement (`scripts/mcp/site-tester`, added 2026-07-07, used by test-sweep) exists but is MIS-described as nonexistent in two of those skills' banners. **BIG** , confirm whether the MCP tools are reachable from a live main session; if not, repoint all three to site-tester + `npx playwright screenshot`. (Non-BIG half: fix the two stale "site-tester doesn't exist" banners regardless.)
25. **`huashu-design` trigger lists "salon card"** , a real LOCKED production component its own SKIP rule says must route to fable-frontend. FIX: remove the trigger term. Not BIG.
26. **`refine` is two things under one name** (the `/refine` command that derives a checklist vs the raw `refine.workflow.js`). FIX: one-line "prefer /refine unless you already hold a checklist" note. Not BIG.
27. **"review this" is answered by 6+ surfaces** (bare review / security-review / code-review / code-review:code-review / coderabbit:code-review / coderabbit:autofix + project council) with no arbitration. FIX: fable-execution names a pick-order. Not BIG. (Ties to #9.)
28. **uiux-audit produces LOCKFILE-contradicting numbers** (16px body, #333, 2-font) , guarded only by a note read-first. FIX: upgrade the fable-frontend trap-list note into a hard "never apply a uiux-audit number without a LOCKFILE check." Not BIG.
29. Dangling skill pointers (batchable): fable-frontend "motion reference -> watch skill" (no `watch` skill exists) -> point at its own step 6; site-teardown routes Figma -> `figma-implement-design` (doesn't exist) -> honest gap note. huashu-design 800-line body -> trim to a router. pixel-spec-auto/fresha Fresha-brand tiebreaker (Fresha -> fresha-section-capture, all other brands -> pixel-spec-auto).

## TIER 6 , MEMORY
30. **`feedback_rules_are_hooks.md` = 25.2KB and growing**, the single biggest context tax; a blow-by-blow build changelog already duplicated in each hook's own docstring + ~10 linked memories. **BIG** , prune to a current-state index (name + one-line + link out).
31. **`feedback_binary_triggers.md` names 3 dead things** (skill `pixel-ref-collect`, skill `design-taste-frontend`, tool `mcp__playwright__browser_evaluate`) , real operational risk (a wrong/wasted tool call), oldest untouched file in a refreshed section. FIX: rewrite to mirror the current CLAUDE.md binary-triggers table. Not BIG (correction).
32. **`project_dashboard_aurora_design.md` (15KB)** self-corrects at the top then carries ~10KB of dead branch narrative. **BIG** , trim to the correction + a pointer.
33. **`feedback_check_skills_first.md`** is fully tombstoned but still a loaded 873-byte file. **BIG** (deletion) , fold the tombstone into the MEMORY.md index line, delete the file.
34. Non-BIG memory: `project_backend_hardening_2026_07.md` stops at P2 (append ring-9); over-size candidates to triage next (`project_discovery_redesign` 14KB, `project_loyalty_solen_wide` 11KB, `feedback_verify_ui` 9KB); `concise-response-gate` registered with an empty `"matcher": ""` (drop it, cosmetic).

---

## Atomic tasks (all done)
- [x] A. global hooks , [x] B. project hooks , [x] C. skills , [x] D. rules+system docs , [x] E. memory+wiring , [x] F. synthesized here , [x] G. presented for approval

## Session-evidence seeds (as filed)
- no-verify-commit-gate v2.1 heredoc-body-strip (DONE this session); readback phantom-fragment (#2, live); orphans confirmed CLOSED (#5-tier0 n/a); edit-then-commit body-strip (part of v2.1); defer-bulk + readback double-fire (#10/#tier2).
