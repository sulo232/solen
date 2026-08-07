<!-- batch: owner dictation 2026-08-07, seven overhauls + a two-phase working protocol -->
# SYSTEM OVERHAUL (owner dictation 2026-08-07)

**Owner ask (verbatim, condensed):** "overhaul the depth of the... you, like, running agents to make mock up or make sets like how it actually works and how the flow is. And, also, the research flow too, like, we need a whole system, like new system. And, also, we need to overhaul the design system too and the relevant files and other documents to the design system and also overhaul when you, like, of you, like, repeating this over, you're, like, having a problem of that. and suggesting other overhauls that we should do. and asked me a lot of questions so you can actually understand. And, also, I want you... I wanna make a system about, like, an... of... like, overall about your output where it's me and also, like, questions where it's me and also the flow, like, how I want you, like, about the output, how I want you to first talk to me, and then I have to just go... like, ask me questions at first, you know, in the first phase, and then as... and then after that, on the second phase, you're gonna execute it as a loop."

## Readback (11 asks)
1. Overhaul how agents actually run when MAKING A MOCKUP (the depth, the flow)
2. Overhaul the same for MAKING A SET (multiple screens / variants), which today has no machinery
3. Overhaul the RESEARCH flow, as a whole new system
4. Overhaul the DESIGN SYSTEM itself
5. Overhaul the design system's RELEVANT FILES AND DOCUMENTS
6. Overhaul the REPETITION problem (the assistant repeating itself and its mistakes)
7. SUGGEST other overhauls we should do
8. ASK A LOT OF QUESTIONS first, so the work is understood before it starts
9. A system for OUTPUT: how the assistant talks to the owner
10. A system for QUESTIONS: how the assistant asks the owner
11. A two-PHASE flow: phase 1 = question round, phase 2 = execute as an autonomous loop

## Owner decisions already taken this session (2026-08-07, question round 1)
- **The repetition problem is ALL FIVE readings**, with a primary one he named himself: *trusting a number over his eyes.* Verbatim: 14 consecutive animation attempts, each changing one variable, each "verified", each rejected. "Each time I found the flaw in the instrument, fixed the instrument, got a new number, changed the code, and told you it was done. The measuring keeps improving. It has never once agreed with your eyes. So the pattern is not 'I pick bad values'. It is that I keep trusting a number over your report, and I only discover the number was pointing at the wrong thing after you reject it again. Fourteen times." Four separate instrument flaws named: sampled fixed strips of screen while the card moved through them; polled screenshots too slowly to see a 333ms animation; measured the card's rect converging instead of when it stops being visible; measured the wrong start state.
- **Design-system scope = option 3:** consolidate the duplicated law into ONE canon AND add the genuinely missing layers. Plus: research drives **add-or-replace** decisions, and every design change ships with **mockups**, not just docs.
- **Question phase fires on every SUBSTANTIAL task** (trivial stays instant).
- **Question delivery = a served page in the approved Taste Lab format** (numbered questions, lettered options, shorthand answers).

## Atomic checkboxes

### A. Question round (phase 1 of the owner's own protocol, applied to itself)
- [x] A1 Question round 1 asked via the question tool (4 questions, all answered) `verified:` the four answers are transcribed verbatim in the "Owner decisions already taken" section of this file (repetition = all five readings + his own diagnosis; DS scope = consolidate + add + research-driven + mockups; question phase = every substantial task; delivery = Taste-Lab page)
- [x] A2 Estate mapping fanned out, 13 read-only agents in 2 workflows `verified:` run wf_5e0543b6-57b (9 agents: agent/mockup flow, research, design-system files, mistake census, measurement trust, output, questions, two-phase, other overhauls) + run wf_d69eccaa-9d5 (4 agents: gate efficacy, cross-session propagation, thinking-level interventions, subagent utilization); transcripts under `~/.claude/projects/-Users-sulo-Documents-solen--claude-worktrees-design-system-consolidation-10167f/68d78dad-21dd-4632-a5a9-f1861516a718/subagents/workflows/`
- [ ] A3 Question round 2 built as a served Taste-Lab-format page, grounded in the mapping
- [ ] A4 Tunnel link delivered (cloudflare, never LAN IP)
- [ ] A5 Owner answers recorded durably (TASTE_LOG / the relevant law file) in the same turn they arrive

### B. Agent flow for mockups
- [ ] B1 Document the CURRENT literal flow (agents, skills, gates, files) end to end
- [ ] B2 Name where depth is lost (thin briefs, no reference, no art direction, one-shot)
- [ ] B3 Design the replacement flow, grounded in what exists (LOOP_SYSTEM, fable-frontend, _BASE.md, the mockup gate chain)
- [ ] B4 Diagnose the skip-flag problem (mockup-preflight-skip.flag 56 uses / 7 days, mockup-approved-skip 14)

### C. Agent flow for SETS (multi-screen / variant)
- [x] C1 Prove whether any set/variant machinery exists today. **ANSWER: none.** `verified:` grep for "variant set | screen set | multi-screen | set of screens | flow set" across `_design-system/`, `_plans/`, `public/_mockups/_BASE.md` and `~/.claude/skills/` returns 4 hits, none of them machinery: `_design-system/research/IG_PRINCIPLES_VERDICTS_2026-07-16.md` (prose), this plan file, and `~/.claude/skills/huashu-design/SKILL.md` + README (which lists "design variation exploration" but is explicitly SKIPPED for any existing Solen route). `public/_mockups/_BASE.md` governs ONE mockup and says nothing about sets. 32 of 120 mockup folders carry a/b/v-suffix names, all produced by hand, one at a time, with no shared spec, no cross-variant consistency check and no gallery contract.
  - [x] C1a No set/variant machinery in the design system `verified:` `_design-system/` grep, 1 prose hit
  - [x] C1b No set/variant machinery in the mockup base law `verified:` `public/_mockups/_BASE.md` has no set/variant section
  - [x] C1c No set/variant machinery in any skill that applies to Solen routes `verified:` only huashu-design mentions variation, and its own SKILL.md excludes existing Solen routes
  - [x] C1d Variants today are hand-built one-offs `verified:` 32/120 suffixed mockup dirs, no shared spec file among them
- [ ] C2 Define what a "set" is. **BLOCKED on owner**, concrete fork below. This is question 1 of round 2.
  - [ ] C2a Fork A: a set = one user FLOW end to end (e.g. every booking screen)
  - [ ] C2b Fork B: a set = N design DIRECTIONS of the same screen, to choose between
  - [ ] C2c Fork C: a set = a page FAMILY that must stay consistent (all list pages, all empty states)
  - [ ] C2d Fork D: all three, with a different pipeline each
- [ ] C3 Design the set pipeline (blocked on C2)

### D. Research flow
- [ ] D1 Document what research is today (26 files in _design-system/research/, no template found yet)
- [ ] D2 Define the evidence standard (sourced / tiered / dated) and how it is enforced
- [ ] D3 Define the path research -> add-or-replace decision -> mockup -> owner approval -> law
- [ ] D4 Define how research goes stale and how that is detected

### E. Design system (consolidate + add)
- [ ] E1 Full inventory of _design-system/ (47 entries) with LIVE / STALE / ORPHANED per file
- [ ] E2 The duplication map: every rule written in more than one place, and which copy wins
- [ ] E3 Target structure for the consolidated canon (one source of truth per concern)
- [ ] E4 The missing layers, named
- [ ] E5 Archive plan for the dated history sitting next to live law
- [ ] E6 Mockups for every design change the consolidation implies (owner: "and make mockups")

### F. Repetition
- [ ] F1 Ranked recurring-mistake census with counts, dates, and the gate hole for each
- [ ] F2 The measurement-trust fix: instrument validation before trusting a number
- [ ] F3 The rule for when the owner's eyes and the number disagree
- [ ] F4 The attempt-counter rule: N failed attempts forces a change of METHOD, not another variable
- [ ] F5 Redundancy inside a single reply (repeating himself in output)
- [ ] F6 Re-litigating settled decisions (a settled-decision lookup before speaking)
- [ ] F7 Rebuilding what exists (the exists-check, strengthened)
- [ ] F8 Honest answer on whether gate-per-mistake has hit its ceiling (215 hooks, 39 wiring violations)

### G. Output system
- [ ] G1 Map what governs reply shape today
  - [ ] G1a REPORT_SYSTEM.md read in full and its mandates listed
  - [x] G1b Count the armed Stop gates that police the reply. **64 Stop hooks armed across 22 matcher groups** `verified:` parsed `~/.claude/settings.json`. Nine of them fired on one reply this session; at least five were false positives on a turn that fixed nothing and touched no mockup (animation-frames, fix-needs-before-after, no-regression-by-fix, repeat-claim-needs-repro, mockup-lang, visual-deliverable). This is direct evidence for the owner's thesis and belongs in the K verdict.
  - [ ] G1c Which parts are enforced vs advice
- [ ] G2 Confirm the reply-blocking-Stop-gate ban and its exact failure mode (double-send)
- [ ] G3 Define the reply contract the owner wants (opening, readback, recommendation, evidence, close)
- [ ] G4 Pick enforcement mechanisms that are actually available given the ban

### H. Question system
- [ ] H1 Reconstruct the approved Taste Lab elicitation format precisely
- [x] H2 Count the currently-unanswered parked owner decisions across `_plans/`. **718 open/blocked/parked/owner-only mentions across the plan files, of which 104 are explicitly numbered decisions (D1..Dn, Q1..Qn).** `verified:` grep over `_plans/*.md` for `(OPEN|BLOCKED|PARKED|OWNER DECISIONS? NEEDED|owner-only|needs owner|awaiting owner|owner picks|owner to pick)` = 718; numbered-decision pattern = 104. Carried by at least 15 plan files including ACTIVE.md, COPY_VOICE_LAW.md, BACKEND_LAW.md, GAP_FIXES.md, FLOW_HARNESS.md. The question system's failure is not that questions are not asked, it is that 104 asked questions are sitting unanswered with no surface that shows them together.
- [ ] H3 Define what makes a good question here, from the record of what he answered vs ignored
- [ ] H4 Define durable recording so a question is never asked twice

### I. Two-phase flow
- [ ] I1 Map the existing machinery (ask-before-loop-gate.py is the closest, dated 2026-07-28)
- [ ] I2 Resolve the conflict with "FINISH THE JOB, do not report-and-wait" and the dependency test
- [ ] I3 Define "substantial"
- [ ] I4 Define what ends phase 1 and starts phase 2, and what happens if he does not answer
- [ ] I5 Define what happens to a NEW question that appears mid-loop (park or break)

### J. Other overhauls
- [ ] J1 Ranked list of at most 8 candidates outside A-I, with evidence and cost-of-leaving-it
- [ ] J2 Owner picks which ones enter scope

---

## Second dictation, same session (2026-08-07): six more asks

**Verbatim:** "And after this, I'm gonna, like, send you, like, many problems that I have, like, in other sessions. And I want you to fix and make gates out of it. But the problem is, like, making a gate thing, it really doesn't work. So I think we have to overhaul on that too because, no, it keeps happening even though I tell them to make a gate. It just doesn't fix anything. And, also, I think we need to, like, make a system about, like, you know, even if we make a gate and, like, it doesn't really get applied to other sessions till it get actually committed and everything. Right? So we need to make, like, a system about what should be committed in all this session and what should, like, state it or, like, what should, you know, like, all of those stuff. And, also, when I send you a problem, it's not really about, like, making, like, block... like, blocking each of those mistakes that happen. Like, because it's gonna be, like, a ton. Right? But, like, I think what we should make is, like, actually change, like, the thinking of how the Claude does. Like, you know? Like, attacking the core problem instead of, like, making blocking, like, each one. Can you Like, think... like, think... like, tell me, like, what I'm actually thinking because I cannot really explain. And, also, we also have to make a system about you, like, utilizing more of, like, the subagents / counseling, I think, because I barely see you using, like, other, you know, sessions."

### Readback (asks 12 to 17)
12. He will send a batch of problems from other sessions; fix them
13. Overhaul the GATE mechanism itself, because making a gate demonstrably does not stop the mistake
14. Build a system for CROSS-SESSION PROPAGATION: what must be committed, what must be stated, so a fix reaches every session
15. Stop building one blocker per mistake; change HOW CLAUDE THINKS, attack the core problem
16. Articulate his own model back to him ("tell me what I'm actually thinking because I cannot really explain")
17. Build a system for USING SUBAGENTS AND COUNCILS MORE, including him being able to SEE it happen

### K. Gate efficacy
- [x] K0 **First hard evidence, found by the gates firing on this very session.** Nine Stop gates fired on one reply. Five cited evidence that did not exist. Root cause measured, not guessed: `scripts/hooks/visual-deliverable-gate.py` decided "this turn wrote design knowledge" from filesystem **mtime** inside a 3600s window, and `.claude/hooks/mockup-lang-stop-gate.py` did the same with a 180-minute window. This is a worktree. The checkout stamped every file at 11:23:57, so `_design-system/RATIONALE.md`, `TASTE_LOG.md`, `research/PRINCIPLES_50.md`, `research/TASTE_RANGE.md`, `app/[locale]/dev/pdp/cta/page.tsx` and `app/[locale]/dev/pdp/reviews/page.tsx` all read as "written this turn" while `git status --porcelain` reported every one CLEAN. `verified:` mtime and git state printed side by side for all six.
  - This is the owner's fourteen-attempt animation failure in gate form: the instrument was real, the number was real, and the number was not measuring the thing. Both gates would have fired on **every turn for the first hour of every worktree session**, forever, no matter what was written.
- [x] K0a **Core fix, not a per-gate patch:** `scripts/hooks/_session_files.py`, one shared helper that answers "what did this session actually write?" from git (dirty working tree plus commits since session start) and **fails open to empty**, so a gate that cannot prove its trigger stays silent. `verified:` self-test 4/4, including the exact false positive (a committed file restamped by `os.utime` is NOT reported as written).
- [x] K0b `visual-deliverable-gate.py` converted to the helper. `verified:` self-test **5/5**, now including a live-project case that must stay silent on a clean tree and a restamped-clean case. Its old self-test had the bug baked in: the comment read "research files were modified this session, so knowledge_written_recently is truthy right now", so it tested against the false positive and called it correct.
- [x] K0c `mockup-lang-stop-gate.py` converted to the helper. `verified:` 4 live cases run end to end: clean tree exits 0; a genuinely written dev page with German chrome exits 2 and names the right file; the same file rewritten in English exits 0; deleted and back to clean exits 0.
- [x] K0d Swept the whole estate for the same bug class. **11 hooks still sweep content files and gate on mtime with no git cross-check** `verified:` AST-adjacent scan requiring a content glob/walk within 8 lines of an mtime read, excluding legitimate marker/flag/ledger TTLs. A first naive grep said 151; that number was wrong because it counted every legitimate flag-TTL use, and reporting it would have been the same unvalidated-instrument mistake this whole section is about. The 11: `count-consistency-gate`, `map-style-gate`, `mockup-defer-stop-gate`, `real-component-gate`, `fullbleed-external-link-gate`, `no-defer-excuse-gate`, `plan-first-gate`, `session-marker-sweep`, `system-health-check`, `tunnel-health-preflight`, `unfinished-batch-gate`.
- [ ] K0e Convert the remaining 11 to the helper (mechanical, one commit, after the K verdict decides which of them survive at all)
- [ ] K1 Audit every hook: armed / orphaned / skippable / self-tested
- [ ] K2 For a 25-gate sample, find the originating incident and check for recurrence AFTER the gate existed. Compute the honest PREVENTED / BYPASSED ratio
- [ ] K3 Catalogue the harm gates have caused (false positives, double-send, neutering, owner frustration)
- [ ] K4 Quantify the skip-flag hole
- [ ] K5 Measure the real cost of the 53-hook PreToolUse chain per edit
- [ ] K6 Verdict with evidence: is gate-per-mistake working, and the structural reasons it fails
- [ ] K7 Design the replacement: which narrow class still deserves a gate, and what everything else becomes

### L. Cross-session propagation
- [ ] L1 Map every change type to its propagation mechanism and its leak point (hooks, settings.json, project law, memory, skills, agents, session-local state)
- [x] L2 Count currently-orphaned gates. **48 of 211 global hook files (23%) are on disk and referenced nowhere in settings.json, so they enforce nothing.** `verified:` set difference between `~/.claude/hooks/*.py|*.sh` on disk (211) and the hook filenames appearing in `~/.claude/settings.json` (163 distinct). Armed load per event: PreToolUse 69 hooks / 42 matcher groups, Stop 64 / 22, UserPromptSubmit 18, SessionStart 8, PostToolUse 3, SubagentStop 1, PreCompact 1.
- [x] L3 Find every stranded branch carrying unmerged law or system work. **44 branches are ahead of main, holding 2,823 unmerged commits and 298 distinct law/system files that main does not have.** `verified:` `git rev-list --count main..<branch>` over all 90 branches; `git diff --name-only main...<branch>` filtered to `_design-system/ | _rules/ | CLAUDE.md | .claude/hooks/`, deduped = 298 files. Worst offenders: `claude/security-audit-principles-a877df` 512 commits / 159 law files, `claude/principles-security-audit-0ae738` 507 / 167, `claude/quirky-ellis-ef5559` 267 / 107, `claude/backend-analysis-improvements-77f02b` 145 / 42, `claude/context-compact-architecture-5d1ace` 74 / 33. There are also 33 live worktrees.
- [x] L3b **CORRECTION to the owner's premise (rule 18).** He said a gate does not reach other sessions until it is committed. That is TRUE for project gates and project law (`.claude/hooks/`, 30 files, plus `_design-system/`, `CLAUDE.md`), which need a commit AND a merge to main, and 298 such files are currently stranded. It is FALSE for GLOBAL gates: `~/.claude` **is not a git repository at all** (`git -C ~/.claude rev-parse` = "not a git repository"). Global hooks, skills, agents and the 12 doctrine docs live on the raw filesystem, so they reach every session on this machine the moment they are written, with no commit needed. The real global-layer risk is the opposite one: 211 hooks and all doctrine are unversioned, unreviewable, unrevertable and unbacked-up, and 48 of them are wired to nothing.
- [ ] L4 Design the session-close protocol: what must be committed, what must be stated
- [ ] L5 Name what committing CANNOT fix

### M. Thinking-level interventions (the core-problem ask)
- [ ] M1 Inventory every reasoning-layer mechanism that exists (skills, injections, briefs, FABLE_DNA, the promotion ladder)
- [ ] M2 Measure the injection load on one ordinary prompt
- [ ] M3 Trace the 14-attempt animation case against every existing mechanism and show why none fired
- [ ] M4 Name the missing reasoning moves, highest leverage first
- [ ] M5 Decide the install form for each (skill / brief / injection / gate / habit)
- [ ] M6 Add a reasoning tier to the promotion ladder, which today ends at a gate

### N. Subagent + council utilization
- [ ] N1 Inventory what is available and what doctrine says
- [ ] N2 Measure actual usage frequency from the record
- [ ] N3 Name the real friction that stops delegation
- [ ] N4 Design the default-to-delegation system
- [ ] N5 Make it VISIBLE to the owner (his complaint is partly that he cannot see it)

### O. The articulation (ask 16)
- [ ] O1 State his underlying model back to him in plain English, with the evidence for the reading
- [ ] O2 He confirms or corrects it, and that becomes the north star for A to N

## Unplanned additions / parked decisions
- The batch of problems from other sessions (ask 12) has not arrived yet. It is a DEPENDENCY for K and M being grounded in real cases rather than the record alone. Do not wait on it for the mapping; do wait on it before finalizing the gate-vs-reasoning split.
