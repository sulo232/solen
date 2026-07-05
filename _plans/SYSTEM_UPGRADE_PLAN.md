# Solen Claude-Code System Upgrade — Master Plan

Date: 2026-06-28. Owner-approved direction: fix the audit findings + build 4 new enforced systems + harden autonomy & orchestration. Principle throughout (owner rule): **every behavioral rule becomes a HOOK (enforced), not advice that gets forgotten.** Each new system EXTENDS an existing one (no duplicate systems). Each is BUILT → SELF-TESTED → only then INTEGRATED.

Root cause tying the whole initiative together: *you build enforcement, but nothing enforces the enforcement* — hooks get de-registered by later settings edits, memory rules drop out of the index, dead docs keep "canonical" framing, and the orchestration default is injected as prose (the one mechanism the system itself says gets outranked under task focus).

---

## DECISIONS (locked)
- **Chinese subagent prompts: DROPPED.** Measured +15% tokens (o200k) / +52% (cl100k) vs English, plus reasoning/parsing/debug costs. Token savings come from trimming boilerplate, file-by-reference, and prompt caching instead — language-independent.
- **Council = multi-perspective subagent fan-out** (correctness / security / dedup / hardcode), NOT multi-LLM-API, NOT a single reviewer. Owner explicitly wants different perspectives. Fires only on substantial builds (size-gated).
- **All new gates ship as `ask` (not hard `deny`) with a 5-min skip flag + high threshold**, tuned before tightening. (harden.md lesson: a misfiring gate gets disabled, then nothing is enforced.)
- **Park decisions: enforce SURFACING, never CONTINUATION.** Park only non-blocking decisions; a blocking decision is still a hard stop (dependency test). A hook makes you *report* parked decisions at end; it never forces you past a blocker.
- **"Always link" → "always end with a verification artifact"**: link for visual/route turns, curl-output/commit-SHA for backend. Not a blanket link.

---

## PART A — Audit remediation (from SYSTEM_AUDIT.md)

### A0 — DONE this session
- [x] Wired orphaned `mcp-prod-write-guard.py` into global settings (Supabase writes / Vercel deploy now `ask`-gated). Live next session restart. Backup saved.
- [x] Fixed stale worktree `design-verifier.md` (was coral + not read-only) → synced to correct main copy (B&W/blue, `tools: Read,Grep,Glob,Bash`).

### A1 — Stale hooks (project)
- [x] `pre-page-commit-check.sh` — REMOVED (verified 2026-07-06: file absent from main + worktree `.claude/hooks`; find over both trees returns nothing).
- [x] `pre-sweep-check.sh` — RETIRED (verified 2026-07-06: file absent everywhere; `pre-edit-drift-gate.sh` is live and registered).
- [x] `pre-done-claim-check.sh` — REMOVED, superseded by the council Stop hook (verified 2026-07-06: file absent; `council-trigger.py` registered under global Stop). NOTE: LOOP_SYSTEM.md still claims it is registered under project Stop; that stale claim is fixed in the A5/doc pass.

### A2 — Skills (DONE 2026-07-06, coder + orchestrator-verified)
- [x] Retarget `fresha-section-capture` — all `mcp__playwright__browser_*` calls in Steps 2-5 + Edge Cases → `mcp__claude-in-chrome__*`; correction banner added. Verified: grep leaves only the banner's descriptive mention.
- [x] Retarget `site-teardown` — same retarget; script refs fixed to the only real script `extract-everything.js` (old typography/color steps merged, pipeline renumbered 7→6 steps).
- [x] Retarget `gemini-visual-check` — `name:` frontmatter added; trigger now `mcp__Claude_Preview__preview_screenshot` / repo site-tester scripts (old phantom trigger could never fire).
- [x] Merge `pixel-ref-collect` → `pixel-spec-auto` — "Brand-sourced reference collection" section (B1-B7) added with real tool names + description extended; old dir archived to `~/.claude/_archive/skills-2026-07-06/`.
- [x] Slim `screenshot-spec` — auto-trigger posture removed from frontmatter AND body; now manual-annotation/escalation tier, routing authority = CLAUDE.md binary-triggers table.
- [x] Remove 6 of the 7 plugin-duplicate skills (`accessibility-review`, `design-critique`, `design-handoff`, `design-system-management`, `user-research`, `ux-writing`) — verified 2026-07-06: none exist in `~/.claude/skills` anymore.
- [x] Remove the last dupe `~/.claude/skills/watch` — archived to `~/.claude/_archive/skills-2026-07-06/watch` (plugin `watch:watch` is the provider).
- [x] Clean stale legacy dir `~/.agents/skills/` — INCIDENT + FIX: the three entries in `~/.claude/skills` (huashu-design, screenshot-spec, site-teardown) were SYMLINKS into `~/.agents/skills`, so the coder's archive move left them dangling (SKILL.md unreadable). Orchestrator verification caught it; fixed by deleting the symlinks and moving the real dirs (with the coder's edits intact) INTO `~/.claude/skills` as the single live location. `~/.agents/skills` is now empty. All three skills re-verified live (registry lists them, SKILL.md reads, edits present).
- [x] Bonus: `fable-frontend` trap-list bullet updated (it claimed the capture skills still script against the phantoms; now records the 2026-07-06 retarget).

### A3 — Memory (now 112 files → ~70, zero info loss)
- [x] Index orphans into MEMORY.md — verified 2026-07-06: files↔index checked BOTH directions, 112 files = 112 index lines, zero orphans, zero dead links.
- [x] Fix dead link MEMORY.md:55 — verified 2026-07-06: no dead links remain anywhere in the index.
- [x] Fix `user.md` stale DNA — verified 2026-07-06: user.md already carries B&W pivot, Inter Tight/Inter, Netlify (updated 2026-06-28 note present).
- [x] Merge clusters — DONE 2026-07-06 (coder, orchestrator-verified): 112 → 90 files, all 9 clusters merged (mockup 7→2, color 4→2, icons 3→1, links 2→1, verify 6→2, autonomy 2-into-1, copy 4→2, killed-features 4→1, tombstones shrunk). Both-direction index check PASS (90 files = 90 index lines, zero dead links). 4 verbatim carries verified in place: no-fabrication (feedback_ui_copy_rules), never-push (feedback_no_auto_push), dev-login (feedback_verify_backend_access), selected-state gray (project_palette_b_w_pivot). Retired essays tombstoned. NOTE: plan said "~70"; the 9 named clusters mathematically yield 90 (22 removed); further consolidation would need merges outside the sanctioned clusters, parked as optional polish.
- [x] Add the dropped-Chinese decision as a memory — verified: `feedback_no_chinese_subagent_prompts.md` exists + indexed.
- [x] Add the dropped-Chinese REMOVED.md line — DONE 2026-07-06 via `npm run removed` (committed 9b39fec7d).

### A4 — Docs
- [x] Archive retired `_rules` design tier — verified 2026-07-06: all 4 (UI_RULES, solen-color-60-30-10, KEY_FEATURES, UTILITIES_INDEX) are 1-paragraph ARCHIVED stubs pointing at LOCKFILE/SOURCE/_inventory, full copies in `_rules/archive/`.
- [x] Archive `_tasks/SOLEN_LIVE_TRUTH.md` + repoint inbound refs — DONE 2026-07-06: moved to `_tasks/archive/SOLEN_LIVE_TRUTH.archived.md` with banner; the one live "principal spec" framing (`_rules/SOLEN_UI.md:7`) rewritten to SOURCE/LOCKFILE; all 7 remaining path mentions across the 4 `_rules` files + 35 path strings in 3 historical `_tasks` docs repointed to the archive path. Verified: zero `_tasks/SOLEN_LIVE_TRUTH.md` refs left outside `_rules/archive/`.
- [x] Fix project CLAUDE.md success-green contradiction — verified 2026-07-06: current text already states normal green `#16A34A`, `#15803D` appears only inside NOT-clauses, "generous" appears only inside the supersedes-note. Fixed in an earlier round.
- [x] Bulk-archive `_tasks/` one-shot .md logs — DONE 2026-07-06: 30 zero-inbound-ref files moved to `_tasks/archive/`; 10 kept in root with live referrers documented (INCOMPLETE_FEATURES, APPLE_PAY_SETUP + REFUND_APPEAL_PLAN + CUSTOMER_FIX_PROGRESS + WALKIN_DASHBOARD_NEEDS cited from app/lib code, SOLEN_DESIGN 10 referrers, CONTRADICTION_AUDIT via CANON.md, SOLEN_NEXT/SYSTEM_AUDIT/V2_REBUILD_LOG via plans+rules). Non-md scripts untouched.
- [x] Regenerate >30-day DB snapshot — verified 2026-07-06: `_inventory/_db-snapshot.json` + SURFACE.* regenerated today (Jul 6 00:00).

### A5 — System-health check (DONE 2026-07-06, coder + orchestrator-verified)
- [x] Built `~/.claude/hooks/system-health-check.py`: CLI `--report` (exit 1 on violations, orchestrator-verified exit 1) + SessionStart hook mode (compact one-line additionalContext, always exit 0, fail-open). Asserts all 4 invariants: hook wiring both scopes w/ `SHELVED.txt` manifest (seeded: plan-archive.sh, sim-shot.sh) + reverse missing-path check; memory index both directions; stale flags >24h (report-only, never deletes); phantom strings (mcp__playwright in skills, mcp__claude_ai_ in settings).
- [x] Self-tested per rule 12.5 BEFORE registering: seeded orphan hook detected; seeded unindexed memory file detected; clean-run honest (current true state: 2 orphan hooks from a CONCURRENT session (rejection-streak-escalator.py, repeat-mistake-detector.py, appeared ~00:41, left untouched on purpose) + 18 stale flags = 20 violations, exit 1); hook mode exit 0 verified twice (coder + orchestrator).
- [x] Registered under global SessionStart (settings.json re-validated with json.tool by both coder and orchestrator).
- [x] Bonus (same pass): removed the 5 dead `mcp__claude_ai_*` permission allowlist entries from global settings.json (0 remain); LOOP_SYSTEM.md stale claims corrected (pre-done-claim-check bullet dated correction at :80, allowlist item marked RESOLVED at :90).

---

## PART B — Four new enforced systems (each extends an existing host)

### B1 — Cross-session dedup / research-first (the "another session rebuilds the hair-DNA algorithm" case)
- **Host:** `scripts/lib/scan-surface.mjs` (the one scanner every consumer reads) + `pre-build-exists-check.sh`.
- **Gap:** the exists scanner is NAME/PATH-keyed only. It misses (i) new logic inside an EXISTING file (a `lib/*.ts` write isn't gated at all), (ii) concept synonyms (DNA/affinity/persona/deriv/scorer), (iii) it's a one-shot transcript checkbox (running exists for anything satisfies it).
- **Build:** add a signature/export index scanner (parse exported fn/const names from `lib/**` + `app/**`, not just filenames) + a hand-kept `_inventory/CONCEPTS.md` alias map (hair-DNA = deriv/affinity/persona/score). Widen `pre-build-exists-check.sh` gate to `lib/**/*.ts`, and require the turn's `exists` call to have matched the concept being added (parse new content's export names → feed to exists → block if hit).
- **Net-new:** signature + alias indexing only. Everything else reused.

### B2 — Anti-hardcode + anti-bloat gate
- **Host:** `.claude/skills/solen-drift-check/scripts/check.py` `scan_text()` loop (already gates hex, already net-new-diff aware, comment-stripping, drift-ok escapes, wired via `pre-edit-drift-gate.sh`).
- **Build (additive rules, auto-inherit the gate):**
  - **C1 secrets/keys** (sk_/pk_/eyJ JWT/AIza/sk-ant/service_role/high-entropy) → **BLOCK on presence** (special-case, bypasses net-new diff). The one always-on hard block.
  - **C2 URLs** (supabase/localhost/solen.ch → BLOCK net-new; other http(s) → WARN), **C3 hardcoded UUIDs** in `app|components|lib` non-test → BLOCK net-new, **C6 absolute fs paths** → BLOCK net-new, **C7 prices/fees/VAT literals** → BLOCK money / WARN display.
  - **C4 magic numbers**, **C5 untranslated JSX copy** (next-intl), **D1 console.log/debugger** (console.error/warn allowed), **D2 commented-out code ≥3 lines**, **D3 overlong fn**, **D4 dup added block**, **D5 redundant comment**, **D6 bare TODO** → all WARN/`INFO ` (never gate).
- **Net-new:** regexes + the C1 presence special-case in `run_gate_stdin`. No new hook, no settings change.

### B3 — Auto-review council (perspective subagents, no drift)
- **Host:** `refine.workflow.js` review step (already has writer≠reviewer, fix-only rounds, convergence rule, round cap, recurring-miss detection — the anti-drift machine). Trigger via a new `Stop` hook.
- **Build:**
  - Replace the single `reviewerType` review call with a **fan-out of N read-only reviewer subagents** (clone `loop-reviewer.md`'s read-only `tools:` contract into `correctness` / `security` / `dedup` / `hardcode` personas), each returning `VERDICT_SCHEMA`; merge punch-lists by `file:line` before the convergence check so the existing shrink-rule still governs.
  - **`Stop` hook auto-trigger:** reads `transcript_path`, detects a substantial build (coder ran OR substantial source Edit/Write) with no review yet this turn → `{"decision":"block", reason: "run the council review on [changed files]"}`. Guards: honor `stop_hook_active`, per-turn "reviewed" marker (no double-review if /refine already ran), size threshold (skip trivial), cost cap.
- **Net-new:** reviewer personas + the merge step + the Stop trigger. Loop skeleton reused.

### B4 — Compaction-proof plan-markdown + .md re-read hooks
- **Host:** `loop-default.py`'s SessionStart-injection pattern (proven to survive compaction via `source=compact`).
- **Build:**
  - Convention: a single canonical in-flight plan file `_plans/ACTIVE.md` (this very file is the first instance; rename/standardize).
  - **SessionStart hook** (incl. `source=compact` + `resume`): read `_plans/ACTIVE.md`, inject as `additionalContext` → survives compaction.
  - **UserPromptSubmit hook:** re-inject `_plans/ACTIVE.md` each turn so it never falls out of context; also a header line reminding "off-plan asks get appended here."
  - **Lifecycle:** create ACTIVE.md at task start; append off-plan items as they arrive; on completion ARCHIVE (move to `_plans/archive/`, not delete — keeps history, stops polluting context since only ACTIVE.md is injected). Owner wanted auto-delete; archive achieves the same "context stays clean" without losing the record.
  - Optional `PreCompact` hook to stamp "compaction happened, re-read ACTIVE.md" for belt-and-suspenders.
- **Net-new:** the ACTIVE.md convention + 2 small hooks (clone loop-default injection). 

---

## PART C — Autonomy + orchestration hardening (from the autonomy/orchestration audit)

### C1 — Close the finish-gate's silent-stop hole
- `finish-autonomously-gate.py` only catches stop-PHRASES; a confident-but-incomplete summary passes. Add a positive-completion signal: if the kickoff was a multi-item/numbered task and the final message lacks an explicit "all N done/verified/committed" closure → nudge. Also persist an "autonomous mode armed" session flag so the trigger doesn't decay out of the 6-message window on long runs.

### C2 — Parked-decision surfacing gate (the safe half of "park & continue")
- Convention: parked decisions append to `_plans/ACTIVE.md` (or `~/.claude/parked-decisions-<session>.md`).
- Extend `finish-autonomously-gate.py`: if parked decisions exist and the final message doesn't surface them → block "surface all parked decisions before stopping."
- Doc reconciliation: replace "pause for any genuine decision" with the **dependency test** (park non-blocking; STOP on blocking/destructive/credential). Hook enforces surfacing only.

### C3 — Frontend park + link/verification-artifact
- Make `finish-autonomously-gate.py` frontend-aware: frontend edit + preview link present → legitimate stop (so it stops fighting "mockup then park"). End report must enumerate parked frontend.
- Extend `link-gate.py` with a web arm scoped to VISUAL/route edits (cloudflare/localhost link required); exempt backend/refactor/migration/doc/audit. For those, the closer is a verification artifact (curl/SHA), not a URL.
- Generalize `mockup-gate.py` to web frontend (PreToolUse Write|Edit on `app/**/page.tsx`, `components/**`, `ask` unless approved).

### C4 — Make orchestration the REAL default
- Keep `loop-default.py` but DEMOTE it to framing that points at the gate.
- **PreToolUse Edit/Write orchestration gate:** `ask` on a substantial direct edit not preceded by a coder dispatch this turn. PreToolUse has no transcript → a `SubagentStop` hook writes a turn-scoped marker when the `coder` finishes; the gate checks marker + size threshold. Override flag. Scope to source globs (docs/memory/mockups exempt). Ship `ask`, high threshold, tune.

### C5 — Self-test-before-integrate rule
- Add global CLAUDE.md rule 12.5 (sibling to 12/13): every new hook/workflow/agent/script gets ≥1 positive + ≥1 negative test asserting the right signal BEFORE it's registered/used. Cross-link `harden.md` step 5 as the worked example. Optional narrow `ask` when an Edit/Write adds a `"command"` entry to a settings.json hook block.

---

## BUILD ORDER (recommended)

| # | Item | Why first | Risk | Enforceable? |
|---|---|---|---|---|
| 1 | B4 compaction-proof plan + re-read hooks | Makes every later step survive compaction; dogfoods immediately | low | yes |
| 2 | A5 system-health check | Verifies all Part-A cleanup; catches regressions | low | yes (CI) |
| 3 | C1+C2+C3 autonomy hardening | Owner's most-loved area; mostly extends one existing hook | low-med | mostly |
| 4 | B2 anti-hardcode/bloat (check.py rules) | Highest day-to-day code-quality leverage; additive to a wired gate | med (false-pos tuning) | yes |
| 5 | C4 orchestration gate | The "why do you just edit" fix; needs threshold tuning | med | yes (ask) |
| 6 | B3 auto-review council | Biggest build; depends on C4 marker + size threshold | med-high (cost/loops) | yes (Stop) |
| 7 | B1 cross-session dedup index | Valuable but the most net-new code (signature index) | med | partial |
| 8 | A1–A4 cleanup (hooks/skills/memory/docs) | Can run anytime; do in parallel with the above | low | n/a |
| 9 | C5 self-test rule | Cheap, behavioral | low | partial |

Each item: BUILD → SELF-TEST (positive + negative case) → INTEGRATE → check it off here.
