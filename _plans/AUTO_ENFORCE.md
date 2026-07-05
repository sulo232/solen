# AUTO_ENFORCE batch (owner 2026-07-06): turn retro recommendations N1/N2/N6/N7/N8 into automatic machinery

Owner ask verbatim: "for n1 in what i can do better cant we or dont we have an skill for that and also if not make one or gimme sugestions and n2 cant we make skill for that too n n6 cant we make hook or system or skill and n7 pushaback thing or skill or hook for ths or u got suggestion n n8 make it auto bro make hook or skill nd make the skills hook like auto instead of me acc having to type that a"

Design rule for the whole batch: the owner wants AUTO (hooks that fire on their own), not more slash commands he has to remember. Inject-only where false positives are cheap; deny only where a block is the point. Every gate self-tested (one should-fire, one should-not) before wiring (rule 12.5).

## N1 , wall-of-asks readback (upgrade existing multi-ask-decompose.py)
- [x] exists-check: read multi-ask-decompose.py, confirm current behavior (fires on multi-ask, instructs plan checkboxes, no readback)
- [x] add unstructured-wall detection (long + unnumbered + multi-imperative)
- [x] inject mandatory numbered READBACK at the top of the reply (owner sees the parse instantly, catches drops in one glance)
- [x] should-fire test (dictation wall)
- [x] should-not-fire test (short msg; already-numbered list)

## N2 , unnamed screenshot reference resolver (new hook)
- [x] exists-check: binary-triggers covers image-attached, nothing resolves WHICH file in ~/solen/screenshots
- [x] new ss-folder-resolver.py (UserPromptSubmit, inject-only): detect screenshot-reference-without-filename
- [x] hook itself lists the 6 newest files in /Users/sulo/solen/screenshots with ages and injects them
- [x] instruction: files newer than ~60 min = the intended refs; if still ambiguous, ask ONE question naming candidates BEFORE building
- [x] should-fire test ("look ss folder")
- [x] should-not-fire test (explicit IMG_5676 named; no screenshot words)
- [x] wire into settings.json (UserPromptSubmit)

## N6 , parallel-worktree collision guard (new hook + ledger system)
- [x] new worktree-collision-guard.py (PreToolUse Edit|Write|MultiEdit): shared ledger ~/.claude/worktree-edit-ledger.jsonl, append {ts, worktree, relpath} on every repo code edit
- [x] deny (once, skip-flag escape) when a DIFFERENT worktree touched the same relpath within 6h; message names the other worktree + age + "check its git log before duplicating"
- [x] scope: code + mockups only; EXCLUDE _plans/, _tasks/, _design-system/*.md, .claude/, memory (docs are legitimately shared across sessions)
- [x] ledger self-trims (keep last 500 entries)
- [x] should-block test (fake other-worktree entry, same relpath, fresh)
- [x] should-pass tests (same worktree; stale entry >6h; excluded path)
- [x] wire into settings.json (PreToolUse)

## N7 , two-rejection auto-escalation (new hook)
- [x] new rejection-streak-escalator.py (UserPromptSubmit, inject-only): per-session streak state keyed by session_id
- [x] rejection regex (still/again/nth changed/not like/wrong/wtf/same problem/not fixed...) increments; non-rejection resets
- [x] at streak >= 2: inject MANDATORY escalation: stop solo iteration, measure (rects/PIL), fire llm-council + gemini-visual-check vs the reference, present diagnosis BEFORE the next edit
- [x] should-fire test (two rejections in a row)
- [x] should-not-fire test (rejection then normal message resets)
- [x] wire into settings.json (UserPromptSubmit)

## N8 , auto-harden on recurring mistake (new hook; no owner typing)
- [x] exists-check: harden-when-flagged.py fires only when the OWNER flags; nothing fires off my own repeated admissions
- [x] new repeat-mistake-detector.py (Stop): bucket my final-message self-corrections into themes (dots, focus ring, font, blue/black, stopped-early, guessed, duplicated, fabricated, link, measure); state per session
- [x] 2nd same-theme admission in one session = block once: order /harden NOW with the named theme (rule: a mistake that survives a round becomes a hook)
- [x] should-block test (two same-theme apologies)
- [x] should-pass tests (first apology; different themes; stop_hook_active guard)
- [x] wire into settings.json (Stop)

## AUTO-SKILLS , stop making the owner type commands
- [x] exists-check: skill-autopilot.py already auto-fires safe skills; fable-skill-trigger covers fable-*; gap = the new /tunnel and /whatsleft
- [x] read skill-autopilot.py trigger table, extend: tunnel/link phrases ("gimme link", "tunnel dead", "cant open", "link?") auto-fire /tunnel; status phrases ("whats left", "whats next", "where are we") auto-fire /whatsleft
- [x] should-fire tests (both phrase families)
- [x] should-not-fire test (unrelated message)

## Suggestions where machinery cannot fully replace the owner (kept honest)
- N1: readback catches drops, but a numbered ask is still parsed correctly MORE OFTEN than a wall; numbering remains worth the 5 seconds on big batches.
- N6: the guard warns at edit time inside one repo family; it cannot see intent. Disjoint surfaces per worktree is still the cheap prevention.
- N7: escalation is auto now, but pasting the reference with rejection #1 is still the fastest convergence path.

## Round log
- R1 (2026-07-06, ultracode workflow, 20 agents): 6 items built, each adversarially verified by an independent agent that re-ran every behavioral test plus one adversarial input of its own. 4/6 passed round 1-2 clean (n2, n7, n8, auto-skills); n1 passed after ratifying the builder's threshold correction (spec said wall=len>350 which the verifier proved is mathematically dead code, strict subset of the existing len>240+ands>=3 clause; 150 ratified by orchestrator since 350 was never an owner number; residual gap: unnumbered walls under 150 chars do not fire, acceptable); n6 failed round 2 on two real bugs the adversarial verifier found and reproduced (ledger append race dropping concurrent entries; doubled-slash rel-path false negative), both fixed and re-proven (8/8 concurrent appends survive, doubled-slash now denies). All 4 new hooks wired into settings.json (ss-folder-resolver + rejection-streak-escalator: UserPromptSubmit; worktree-collision-guard: PreToolUse; repeat-mistake-detector: Stop); n1 + auto-skills are edits to already-wired hooks. Live production proof: the new READBACK mandate fired on the owner's very own trigger message this session. check-invariants: full PASS after wiring.
