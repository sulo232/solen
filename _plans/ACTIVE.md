# ACTIVE PLAN — System Upgrade (Claude-Code setup)

> This is the single in-flight plan doc. It is auto-injected at SessionStart (survives compaction) and pointed at each turn. Full detail: [_plans/SYSTEM_UPGRADE_PLAN.md](SYSTEM_UPGRADE_PLAN.md). On completion this file is ARCHIVED to `_plans/archive/`, not deleted.

## Locked decisions
- Chinese subagent prompts: DROPPED (measured +15% tokens, not fewer).
- Council = multi-perspective subagent fan-out (correctness/security/dedup/hardcode), size-gated.
- MINIMIZE owner prompts (owner rule): NO permission-ASK hooks. Gates enforce MY behavior via DENY (block me + tell me to fix/orchestrate), NEVER `ask` the owner. Owner is pulled in ONLY for (a) genuine decisions and (b) frontend/taste. Safety net = the subagent council (post-build review) + a catastrophic-only DENY guard for irreversible DB/infra ops. The frontend mockup-gate stays as the one allowed owner-ask. All gates keep a 5-min skip flag + high threshold, tuned before tightening.
- Park NON-blocking decisions only (stop on blockers); hook enforces SURFACING, never continuation.
- Plan doc: ARCHIVE on completion (not delete).
- "Always link" → "always end with a verification artifact" (link for visual, curl/SHA for backend).
- Every new system: BUILD → SELF-TEST (positive + negative) → INTEGRATE.

## Build order (check off as completed)
- [x] **1. Compaction-proof plan-doc + re-read hooks** (built+reviewed+self-tested+wired; live next restart)
- [x] **2. System-health check** (`npm run health`; finds the 6 known issues, exit 1; --json for CI)
- [x] **3. Autonomy hardening** (finish-gate armed-flag + frontend-park-allow; link-gate web visual arm; CLAUDE.md dependency-test rule. Reviewed: all branches pass, existing behavior preserved)
- [x] **4. Anti-hardcode + anti-bloat gate** (check.py C1-C7 secrets/URLs/UUIDs/money + D1-D6 bloat; reviewer PASS; live via drift-gate)
- [x] 5. Orchestration gate (orchestration-gate.py PreToolUse DENY on big direct edit w/o coder-marker + coder-marker-subagentstop.py; wired, live next restart)
- [x] 6. Auto-review council (council-trigger.py Stop hook + 4 read-only persona agents + council.workflow.js + /council skill; wired, live next restart)
- [x] 7. Cross-session dedup index (scanExports symbol index + _inventory/CONCEPTS.md aliases; exists.mjs surfaces hair-DNA by synonym; pre-build-exists-check widened to lib/**)
- [x] 8. Audit cleanup (bulk): memory index green, user.md DNA fixed, Chinese-drop memory, 3 stale hooks removed (pre-page-commit/pre-sweep/pre-done-claim), 6 dup skill symlinks removed, dead-but-cited docs archived (_rules tier + SOLEN_LIVE_TRUTH, 10 refs repointed). DEFERRED -> Unplanned.
- [x] 9. Self-test-before-integrate rule (global CLAUDE.md rule 12.5 added)

## STATUS: all 9 items + 2 safety fixes DONE. Health check GREEN (0 fails). Deferred polish below.

## Done this session
- [x] Wired orphaned mcp-prod-write-guard.py (Supabase/Vercel writes now ask-gated)
- [x] Fixed stale worktree design-verifier.md (coral + not-read-only → correct main copy)
- [x] Built plan-doc system: plan-active-sessionstart.py + plan-active-prompt.py (global, wired) + plan-archive.sh helper; ACTIVE.md convention
- [x] Converted mcp-prod-write-guard from broad ASK to catastrophic-only DENY (DROP/TRUNCATE/DELETE-no-WHERE/branch reset/delete). Routine writes/migrations/deploys now silent. Verified.

## Unplanned additions / deferred / parked
- DEFERRED from #3: silent-stop positive-completion detector (mechanizing "is this turn truly complete?" is too false-positive-prone; the auto-council #6 covers premature stops on code changes anyway).
- DEFERRED from #3: parked-decision hard-gate (enforce *surfacing* at stop). Currently covered by the CLAUDE.md dependency-test rule + ACTIVE.md convention; hard-gate is a nice-to-have.
- DEFERRED from #3: mockup-gate web arm (web frontend mockup-first enforcement). Lower priority.
- HOUSEKEEPING: finish-gate armed-flag (`~/.claude/.autonomous-armed-<session>`) has no TTL/disarm and files accumulate. Add a TTL (honor only if recent) or a cleanup, and a disarm path.
- DEFERRED #8: full memory merge (8 clusters, 92->~73 files) to get MEMORY.md under the 17.1KB nag. Index already healthy/green; this is bloat polish. MUST carry verbatim: no-fabrication, never-push, dev-login route `/api/dev/login?to=`, selected-state-ink override.
- DEFERRED #8: retarget 4 skills off mcp__playwright__* to Claude_in_Chrome/Preview (fresha-section-capture, site-teardown [+ extract-typography/colors.js to extract-everything.js], pixel-ref-collect, gemini-visual-check). Niche, fuzzy mapping.
- DEFERRED #8: bulk-archive ~40 one-shot _tasks logs (CONTRADICTIONS, CONSISTENCY_AUDIT, V2_REBUILD_LOG, OVERNIGHT_LOG*). Low value, do carefully.
- NOTE: `watch` skill is a real cloned dir (dupes watch:watch plugin); left in place (removing a real dir is riskier).
