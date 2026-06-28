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
- [ ] `pre-page-commit-check.sh` — watches dead paths (`components/home/**`, `HomePage.tsx`, `SalonCard.tsx` moved to `app/[locale]/_components/homepage/**` + `components-legacy/`) and a receipt nothing writes. → REMOVE (dead ritual) or repoint. Recommend REMOVE.
- [ ] `pre-sweep-check.sh` — keyed to retired coral palette + deleted `SOLEN_BUILD_LEARNINGS.md`. Superseded by `pre-edit-drift-gate.sh`. → RETIRE.
- [ ] `pre-done-claim-check.sh` — orphaned AND calls `mcp__playwright__*` (not installed; we have Claude_Preview/Claude_in_Chrome). → retarget tools + wire under Stop, OR remove. Folds into the auto-council Stop hook (C3) — likely SUPERSEDED by that.

### A2 — Skills
- [ ] Retarget 4 skills off `mcp__playwright__*` → `mcp__Claude_in_Chrome__*` / `mcp__Claude_Preview__*`: `fresha-section-capture`, `site-teardown` (also fix deleted `extract-typography.js`/`extract-colors.js` → `extract-everything.js`), `pixel-ref-collect`, `gemini-visual-check` (trigger note).
- [ ] Remove 7 plugin-duplicate skills: `accessibility-review`, `design-critique`, `design-handoff`, `design-system-management`, `user-research`, `ux-writing`, `watch` (all exact dupes of installed `design:*` / `watch:watch`).
- [ ] Merge `pixel-ref-collect` → `pixel-spec-auto`; slim `screenshot-spec` to its manual-annotation tier.

### A3 — Memory (92 → ~70, zero info loss)
- [ ] Index 5 orphans into MEMORY.md: `user.md`, `feedback_no_parallel_agents_frontend.md`, `project_search_facts.md`, `reference_test_server_pattern.md` (skip RETIRED_).
- [ ] Fix dead link MEMORY.md:55 (`feedback_no_vercel_deploy.md` → renamed RETIRED_).
- [ ] Fix `user.md` stale DNA (coral/Anton/Figtree/Vercel → B&W/blue, Inter Tight/Inter, Netlify).
- [ ] 8 merge clusters (mockup 8→2, color 5→2, copy/artifact 4→1, icons 3→1, autonomy/loop 5→2, verify/measure 6→2, links 3→1, killed-features 4→1). Carry verbatim: no-fabrication, never-push, dev-login route, selected-state override.
- [ ] Add the dropped-Chinese decision as a memory + REMOVED.md line (anti-re-propose).

### A4 — Docs
- [ ] Archive retired `_rules` design tier (UI_RULES, solen-color-60-30-10, KEY_FEATURES, UTILITIES_INDEX) → gut to a 1-line pointer to LOCKFILE/SOURCE/_inventory.
- [ ] Archive `_tasks/SOLEN_LIVE_TRUTH.md` + repoint its 7 inbound "principal spec" refs to SOURCE/LOCKFILE.
- [ ] Fix project CLAUDE.md success-green contradiction (#15803D line ~89 → #16A34A) + "generous blue v2" leftover prose.
- [ ] Bulk-archive `_tasks/` one-shot logs into `_tasks/archive/`; regenerate >30-day DB snapshot.

### A5 — System-health check (the meta-fix)
- [ ] Build a script/hook asserting the invariants: every hook on disk is wired (or shelved-on-purpose), every memory file indexed, every doc's referenced paths alive, no archived doc cited as canonical. This is what would have caught all of Part A. Run it in CI + a SessionStart nudge.

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
