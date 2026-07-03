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
- [ ] 8. Independent review (loop-reviewer, writer never reviewer): running in background, verdict lands in the review log below
- [ ] 9. Close-out: re-read original ask, tick every box, report with links

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

## Review log

- Round 1 (loop-reviewer, read-only, background agent): verdict + punch list recorded here after completion.

## Parked / decisions surfaced

- Applying any of assessment items 1 to 10 needs an owner go (they modify the approved rule/hook system).
- The three skills self-describe as owner-invocable AND auto-triggering; if under-triggering is observed in practice, run the skill-creator description-optimization loop (needs an interactive session for the eval-review step).
