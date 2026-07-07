# META AUDIT REPORT , 2026-07-07

17 parallel Sonnet auditors: 13 over all 39 past-session transcripts (2.5GB digested to 2.7MB of owner-verbatim extracts first), 2 over the full hook estate (73 global + 8 project hooks + both settings.json), 1 over all 15 skills + 5 commands + 2 workflows, 1 over CLAUDE.md x2 + LOOP_SYSTEM.md + memory index + all 16 _rules/ files. Deduped against RETRO_2026-07-06. Everything below is evidence-backed (quotes, line numbers, or direct test runs by the auditors).

---

## 1. SESSIONS: what the fleet found

### The one meta-finding that matters
**The Stop-gates catch the same behaviors every turn but never PREVENT them.** In heavy sessions: checkpoint-stop family fired up to 14x/session, missing-tunnel-link 6x, design-verify 9x, auto-commit 11x, concise-response 3-5x. Every fire was a correct catch; the behavior recurred anyway. The estate's next win is moving enforcement EARLIER (plan-write time, pre-edit, auto-run) plus killing ~10 confirmed false-positive sources that train gate fatigue.

### Still-live failure modes (ranked, cross-session counts)
1. **#7 checkpoint-stop / bundled "done"** , every batch, still #1 by volume. Gates work; behavior unchanged.
2. **#5 eyeball-verify** , search-morph saga (10+ owner callouts), mobile overhaul (2 full redo passes). gemini-visual-check's auto-trigger MISSES; the GEMINI-CHECK gate fires at Stop = after the damage.
3. **#1 guessing instead of grounding** , improved recently, but binary-triggers misses conversational refs; the fix (ss-folder-resolver) is 1 day old and unproven.
4. **#2 false-done** , verify-before-done-gate (new 07-06) caught one live instance already; "memory-note as fix for an automated-behavior ask" is a sub-pattern (should auto-route to hooks).
5. **#3 re-litigation** , mostly killed by drift gates; residual = regression-during-iteration (approved thing reverted by a later edit, coder `git checkout` clobbers).

### NEW recurring issues with NO coverage (candidates for new enforcement)
- **Coder subagents running unscoped `git checkout`/`reset`** clobbered concurrent approved work TWICE in one session (bold-hellman).
- **`pkill` blast radius**: pattern-matched `pkill -f "cloudflared tunnel"` killed the owner's live mobile Metro tunnel (ecstatic-mahavira).
- **Verification tooling silently broken**: preview_eval "navigated or closed" (dozens), `Cannot find package 'playwright'` recurring unfixed for ~2 weeks, tunnels dying (exit 144), stale `.next` wedges misdiagnosed as code bugs 3+ times/session. Nothing preflights tooling health; broken eval nudges straight back into eyeballing.
- **Wrong surface/repo**: built WEB mockups when owner meant the MOBILE app; worked in wrong worktree/branch 3x (amazing-curie, ecstatic-mahavira). No check names the repo+route before building.
- **Subagent degraded/empty final message** after long runs , 5+ cases, including one of THIS audit's own agents. Orchestrator must auto-treat empty results as "re-derive from artifacts".
- **Workflow rate-limit collapse reported as success** (findings:0, targetsFailed:27) , must escalate instead.
- **Parallel-session duplication**: two sessions got the identical overnight task 4 min apart; worktree-collision-guard never fired (needs a synthetic-fire test).
- **10-wide agent bursts hit rate limits** (twice) , codify waves of 3-4.

### Confirmed hook false positives (all seen in transcripts, several LIVE again during this audit)
binary-triggers + rejection-streak + multi-ask + mockup-variations all fire on `<task-notification>` text (fired 3x on THIS session's own notifications); no-verbose-ui-copy blocks "Zoom (max 200%)" (auditor reproduced the deny live); design-verify fires on pure-logic diffs (~2-3 of 9/session); mockup-visual matched `rounded-[10px]` inside prose; reinvent-data flags the canonical categories.ts as a re-declaration; no-defer-excuse misread historical retro docs (fixed); unfinished-batch fired 3 sessions running on a stale DONE plan file.

### Working well (amplify, don't touch)
- Silent no-op hunting with live-DB proof (fable-backend) , caught phantom columns, dead filters, anon-executable SECURITY DEFINER money functions.
- Writer-never-reviewer , caught an SSRF IPv6-mapped bypass, an RLS type mismatch, a dropped WITH CHECK, a beard-category regression, a promo-fix that was inert. Real prod saves, repeatedly.
- Self-verifying atomic migration (compare old-vs-new inside the transaction, RAISE on mismatch) , should be a NAMED pattern in fable-backend.
- Rule 12.5 self-test-before-wiring , held on every new hook since 07-03.
- Exists-check protocol + graveyard , repeatedly stopped duplicate builds.
- Owner praise on record for the orchestration pattern and Mobbin-grounded research.

---

## 2. HOOK ESTATE (73 global + 8 project)

Wiring is CLEAN: 0 orphans, 0 missing paths (system-health-check confirms). Bugs and structure:

**Bugs (auditor-verified):**
- `link-gate.py:87` and `finish-autonomously-gate.py:87` fall back to hardcoded `/Users/sulo/Documents/solen` when `CLAUDE_PROJECT_DIR` is unset , in a worktree session the git-status scan checks the WRONG tree (false negative on the owner's most-flagged rule, preview links). Fix: fall back to `data.get("cwd")` like the newer hooks do.
- `no-verbose-ui-copy.py` regex too broad (live-reproduced deny on "Zoom (max 200%)").
- 3 orphaned skip-flags with NO owning hook anywhere: `anti-checkpoint-skip.flag`, `link-gate-skip.flag`, `link-skip.flag` (grep-verified) , delete.
- 19 stale flags on disk (all inert past TTL, pure clutter) , no auto-sweep exists; extend session-marker-sweep to `*-skip.flag`/`*-ok.flag` >48h.
- `skip-flag-ledger.log` unbounded (815 lines, no rotation).
- Stop-hook I/O duplication: repeat-mistake-detector + verify-before-done each re-parse up to 4000 transcript lines on EVERY Stop.

**Consolidation (behavior-preserving merges):**
- 4 near-identical copy-lint gates (no-caps, no-emdash, no-decorative-separator, no-verbose-ui-copy) -> ONE copy-lint-gate.py (4 spawns -> 1, ~250 dup lines gone).
- 5 mockup-content gates (contract-hue, dataviz-ink, english-lucide, english-mockup.py, muted-color-v2) -> ONE mockup-content-contract gate (5 spawns -> 1; also kills the TWO diverging German word lists that double-deny one Write).
- readback-contract-gate folded into unfinished-batch-gate (same _plans scan, same failure mode).
- ~36 PreToolUse spawns per Edit/Write today; merges cut a third of them.

**Scope/tuning:** design-verify-gate should skip diffs with zero visual tokens; unfinished-batch should skip plan files whose ACTIVE.md row is DONE/PAUSED; gemini-check-gate + mockup-parity-gate widen beyond search-morph paths; exists-guard token matcher needs a same-domain weight (RatingBadge vs RatingFilter false block); worktree-collision-guard needs a synthetic-fire self-test (it missed a real duplicate-session event) and its hardcoded ROOT documented.

---

## 3. SKILLS ESTATE (15 skills, 5 commands, 2 workflows)

**Clean keeps:** fable-reasoning (best in estate), fable-execution, fable-backend, pixel-spec-auto, screenshot-spec, solen-drift-check, all 5 commands, both workflows (council + refine are "the strongest-engineered artifacts in the estate").

**Fixes needed (all verified against disk):**
- Dead path `scripts/mcp/site-tester` referenced in fresha-section-capture (2 places), site-teardown, and implicitly fable-frontend , the dir does not exist.
- Phantom skill `emil-design-eng` referenced by site-teardown + screenshot-spec , doesn't exist anywhere.
- gemini-visual-check claims a shared `llm-council/.env` that doesn't exist (1-line fix).
- verify.md still carries the retired solen-coral.html line UNDER its correction banner , the "banner over dead text" anti-pattern appears 3x in the estate; actually delete the dead lines.
- uiux-audit: generic numbers (16px body, two fonts, #333) contradict LOCKFILE; needs a self-subordination banner INSIDE the skill.
- huashu-design: hugely broad trigger + from-scratch-HTML default + always-loaded Chinese trigger block , must self-scope away from existing Solen surfaces (currently only fable-frontend's trap list stands between it and a locked page).
- **llm-council shells out `claude --model opus` by RAW Bash , invisible to no-opus-subagent-gate** (gate only sees Agent/Workflow calls). Owner decision needed: intentional exception or switch default to sonnet.
- "council" naming collision (llm-council skill vs council workflow) , add cross-links both sides.
- Gap: NOTHING audits the skill estate for staleness (this audit was manual) , extend system-health-check.py to resolve every script path referenced in SKILL.md/commands.

---

## 4. DOCS

**Global CLAUDE.md (19.5K): clean.** Only optional cut: fold rule 9 into rule 13 (~1KB). Not a priority.
**Project CLAUDE.md (22.7K): the best-maintained file audited** , every referenced path exists. One high-leverage 200-byte add: name the specific dangerous _rules files in precedence-chain item 8.
**LOOP_SYSTEM.md: cut the "Pillar audit 2026-06-23" changelog section , 28% of the file, zero live law.**
**Memory index: healthy (91/91 files indexed, no orphans).** One stale pointer: project_category_dashboards_built.md cites _plans/DASH_REFINE_LOOP.md which doesn't exist.
**_rules/ (149K live): the real bloat + danger lives here:**
- DANGEROUS: CODE_SAFETY.md rules 4/6/14 still say "ALWAYS push / check Vercel / wait for Vercel deploy" in live imperative voice under a 1-line banner , direct contradiction of never-push law. Rewrite, don't banner.
- SYSTEMS.md: 3 of 7 routes 404 (FIGMA_CODE_SYNC.md, emil-design-eng, SOLEN_CONTEXT.md); self-contradicts within one file; ~50-60% cuttable.
- STRUCTURAL_RULES.md + I18N_ROUTING.md both still assert `/discover` (live route is `/inspo`) , same dead rule duplicated in 2 files.
- SOLEN_UI.md + SOLEN_PATTERNS.md: ~20KB of retired teal/terracotta palette taught as worked examples an agent could copy verbatim; keep the structural/UX principle parts.
- KEY_FEATURES.md was MIS-archived (banner claims palette content; 95% was the shipped-feature list + a 37-item B2B roadmap brainstorm that now has no live home; SYSTEMS.md:104 still points at the stub).
- AGENT_COORDINATION.md: half dead (4-month-stale lock files, obsolete Dev1/2/3 roles), half live (INCOMPLETE_FEATURES protocol) , split it.
- SECURITY_RULES.md: content verified fine but untouched since 2026-03-23 , the only file that never got the precedence pass; deliberate freshness review warranted.
- Net effect: ~35-40KB removed/corrected, two dangerous blocks neutralized.

---

## 5. PROPOSALS (decision map)

| # | Item | Recommended form | Status |
|---|---|---|---|
| P1 | False-positive fixes (7 hooks incl. task-notification discriminator shared by binary-triggers/rejection-streak/multi-ask) | hook FIXES | needs ok |
| P2 | Worktree-path bug fixes (link-gate, finish-autonomously) | hook FIXES | needs ok |
| P3 | Consolidations (copy-lint x4 -> 1; mockup-content x5 -> 1; readback -> unfinished-batch) | hook MERGES | needs ok |
| P4 | Flag hygiene (delete 3 orphans, auto-sweep stale flags, ledger rotation) + collision-guard self-test + scope tunings | hook FIXES | needs ok |
| P5 | Coder git-guard (block checkout/reset/clean in coder subagents) | NEW HOOK | owner pick |
| P6 | pkill blast-radius guard (PID-scoped only for cloudflared/node/metro) | NEW HOOK | owner pick |
| P7 | Wrong-surface readback (name repo+route before building; web-vs-mobile) | NEW HOOK (extend readback) or skill step | owner pick |
| P8 | Verification-earlier package: tooling-health preflight (.env.local/node_modules/.next/tunnel) + auto-fire gemini-visual-check/measurement BEFORE edits instead of at Stop | HOOK (auto) vs SKILL (manual) vs hybrid | owner pick |
| P9 | Skill-estate staleness invariant in system-health-check (dead script paths, phantom skills) | hook EXTENSION | needs ok |
| P10 | Skill-file fixes (dead refs, huashu scoping, uiux banner, council cross-links) + skill content adds (wave-size 3-4, empty-result re-derive, .next discriminator, named migration pattern) | SKILL EDITS | needs ok |
| P11 | llm-council opus default -> sonnet (or documented exception) | owner pick | owner pick |
| P12 | Docs: dangerous fixes (CODE_SAFETY 4/6/14, SYSTEMS.md, Rule 32 x2, KEY_FEATURES un-mislabel) | doc EDITS | needs ok |
| P13 | Docs: bloat trims (LOOP_SYSTEM 28%, SOLEN_UI/PATTERNS ~20KB, AGENT_COORDINATION split, SECURITY freshness, CLAUDE.md precedence footnote, DASH_REFINE_LOOP pointer) | doc EDITS | needs ok |
| P14 | Workflow fix: council/audit workflows escalate when all sub-agents failed (rate-limit collapse) | workflow FIX | needs ok |

Every new hook ships with rule-12.5 self-tests (one should-block, one should-pass) before wiring.
