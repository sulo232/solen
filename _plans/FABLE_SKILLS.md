# FABLE_SKILLS: distill Fable-5 reasoning into skills for Opus 4.8 (2026-07-03)

Owner ask (gist): go over all the skills and rules; as the strongest model, assess how to improve them; then make NEW skills that teach Opus 4.8 how to reason, how to execute any task, and how to do frontend work, so Opus performs closer to Fable.

## Atomic checkboxes

- [x] 1. Survey existing setup
  - [x] 1a. Inventory + read ~/.claude/skills/* (personal skills)
  - [x] 1b. Read ~/.claude/LOOP_SYSTEM.md + agent definitions (coder, loop-reviewer, council-*)
  - [x] 1c. Inventory hooks (~/.claude/hooks + project .claude/hooks + settings)
  - [x] 1d. Critique global CLAUDE.md rules 0-13 (gaps, overlaps, conflicts)
  - [x] 1e. Map project rules (_rules/*, _design-system entry docs) so new skills point, not duplicate
  (done via 6-reader parallel survey workflow, run wf_880aa077-ea7)
- [x] 2. Written assessment: how to improve the existing setup (parked recommendations below, NOT applied)
- [x] 3. New skill: reasoning -> ~/.claude/skills/fable-reasoning/SKILL.md
- [x] 4. New skill: task execution -> ~/.claude/skills/fable-execution/SKILL.md
- [x] 5. New skill: frontend pass -> ~/.claude/skills/fable-frontend/SKILL.md
- [x] 6. Wire triggering: global CLAUDE.md rule 14 points at the three skills
- [x] 7. Self-test per rule 12.5: frontmatter parses (name matches dir, description length), zero em/en-dashes, all three registered live in the session skill list
- [x] 8. Independent review (loop-reviewer, writer never reviewer): PASS in round 2 (round 1's only finding was a reviewer error, refuted by measurement; see review log)
- [x] 9. Close-out: original ask re-read, every box ticked, reported with links (2026-07-03)

## Assessment: how I would improve the existing setup (PARKED, owner's call)

Ranked by payoff. None applied; the rules are the owner's approved system.

1. STALE-DOC SWEEP (highest payoff, mechanical). The setup's biggest silent hazard is superseded law sitting unmarked next to current law. Concrete fixes:
   - LOOP_SYSTEM.md "Model tiering" section still says opus for security; gate + council workflow say sonnet/haiku only. Update the section.
   - verify.md points at retired public/solen-coral.html and refine.md section 2 justifies excluding design-verifier with an outdated reason (it IS read-only now; the valid reason is schema mismatch).
   - fresha-section-capture / pixel-ref-collect / site-teardown script phantom mcp__playwright__* tool names; repoint to preview_* / claude-in-chrome once.
   - Memory files with superseded bodies (feedback_check_skills_first, feedback_90_10_color_rule v2 blue model, feedback_selected_state_ink body, feedback_mockup_every_design_decision): add a SUPERSEDED-BY header line or run /consolidate-memory.
   - _rules/ legacy law (CODE_SAFETY "always push", Vercel, Figma-first, warm palette in SOLEN_UI/SOLEN_PATTERNS): stamp a one-line HISTORICAL banner at the top of each affected file.
   - npm run check:dash is cited in memory but absent from package.json: either add the script or fix the memory.
2. REGISTER OR DELETE unfinished-batch-gate.py: it is built (v2) but registered in no settings.json, so the multi-ask enforcement pair is half-connected. Same sweep: delete vestigial coder-marker-subagentstop.py (nothing reads its marker since orchestration-gate v2).
3. MULTIEDIT GATE HOLE: several global gates match "Write|Edit" only; MultiEdit slips them (mockup-gate, no-focus-ring, no-caps). One-line matcher fix each. Bash heredoc writes bypass all content gates; accept or add a Bash matcher to the top 2 to 3 gates.
4. PRECEDENCE CHAIN was unwritten (owner-literal > gates > LOCKFILE > CLAUDE.md blocks > TASTE_LOG > memory > global rules > generic checklists; latest dated decision wins; "supersedes X" kills X everywhere). Now written in fable-reasoning section 6; consider promoting a 5-line copy into project CLAUDE.md so it survives even without the skill loading.
5. RULE 9 vs RULE 13 CONTRADICTION: rule 9 says "YOU fix each item", rule 13 says "never hand-code substantial work". Resolve with one sentence in rule 9: "fix = route the punch list to the coder agent; hand-edit only sub-3-line mechanical items."
6. CONSOLIDATE the three parallel loop protocols (rule 9 verifier-loop, rule 13 / LOOP_SYSTEM layered loop, project finish-the-job) into one doc with the others pointing at it. They agree in substance; a weaker model cannot tell they are one system.
7. GATE HYGIENE: skip flags are being used often (worktree .claude/ has 4 recently-touched flags); consider logging flag touches to a ledger the Stop hook surfaces, so exceptions stay visible. Per-session marker files (~/.claude/.council-done-<sid> etc.) never get cleaned; a SessionStart sweep would stop the litter.
8. NO BACKEND-CORRECTNESS GATES: enforcement is overwhelmingly frontend/process; the number one backend failure (silent no-op filters) has no gate. A cheap one: PostToolUse on route.ts edits injecting a reminder to run the two-call discriminate check (or a /harden pass when it next recurs).
9. LESSONS_LEARNED.md stopped growing 2026-06-05 while lessons scatter to CLAUDE.md blocks + memory. Either resume appending or mark the file as index-to-elsewhere.
10. SUBAGENT-DELEGATION GATE GAP: Stop-level gates (design-verify, gemini-check) only see the main transcript, so delegated work is systematically less gated. Compensation now baked into fable-execution section 9 (verification goes INTO the coder/reviewer briefs); a structural fix would be a SubagentStop gate.

## Round 2: apply-all + enforcement hooks (owner go, 2026-07-03)

Owner: "Apply all of them. And also make hooks too, because rules keep getting forgotten."

- [ ] R1a LOOP_SYSTEM.md model-tiering section corrected to sonnet/haiku only
- [ ] R1b verify.md repointed away from retired solen-coral.html
- [ ] R1c refine.md section 2 stale design-verifier justification corrected
- [ ] R1d1 fresha-section-capture tool-name translation banner
- [ ] R1d2 pixel-ref-collect tool-name translation banner
- [ ] R1d3 site-teardown tool-name translation banner
- [ ] R1e1 memory feedback_check_skills_first superseded header
- [ ] R1e2 memory feedback_90_10_color_rule superseded header
- [ ] R1e3 memory feedback_selected_state_ink_not_blue_ring superseded header
- [ ] R1e4 memory feedback_mockup_every_design_decision superseded header
- [ ] R1f _rules historical banners (CODE_SAFETY, SOLEN_UI, SOLEN_PATTERNS, SYSTEMS, search-bar-rules, STRUCTURAL_RULES, I18N_ROUTING)
- [ ] R1g memory feedback_balance_anchor_derive_and_measure check:dash reference corrected
- [ ] R2a unfinished-batch-gate.py registered under Stop (global), self-tested
- [ ] R2b vestigial coder-marker-subagentstop.py retired and deregistered
- [ ] R3 MultiEdit added to matchers of mockup-gate, no-focus-ring-gate, no-caps-gate, orchestration-gate; Bash-write bypass decision stated in report
- [ ] R4 precedence-chain block added to project CLAUDE.md
- [ ] R5 rule 9 fix-routing sentence added to global CLAUDE.md
- [ ] R6 one-system mapping note added to LOOP_SYSTEM.md
- [ ] R7a skip-flag ledger hook built, self-tested, registered
- [ ] R7b session-marker sweep hook built, self-tested, registered
- [ ] R8 api-route discriminate-check reminder hook (project), self-tested, registered
- [ ] R9 LESSONS_LEARNED.md ledger-status banner
- [ ] R10 SubagentStop UI-work reminder hook built, self-tested, registered
- [ ] R11 fable-skill-trigger hook (UserPromptSubmit) built, self-tested, registered
- [ ] R12 independent review of the whole batch, punch list fixed
- [ ] R13 close-out: original message re-read, boxes ticked, report

## Review log

- Round 1 (loop-reviewer, read-only): checklist items 1 to 6 ALL PASS (referential integrity of every path/script/agent/skill referenced; factual accuracy of all six claims incl. the stale-LOOP_SYSTEM and phantom-playwright traps; zero banned characters; no drift-risk literals; internal consistency; frontmatter). One FAIL finding: "CLAUDE.md section 14 missing". Finding REFUTED by direct measurement: grep shows the section at /Users/sulo/.claude/CLAUDE.md:386 (the wiring was always global-file-only; reviewer checked the project file). Round 2 dispatched to re-verify that single item and re-issue the verdict.

## Parked / decisions surfaced

- Applying any of assessment items 1 to 10 needs an owner go (they modify the approved rule/hook system).
- The three skills self-describe as owner-invocable AND auto-triggering; if under-triggering is observed in practice, run the skill-creator description-optimization loop (needs an interactive session for the eval-review step).
