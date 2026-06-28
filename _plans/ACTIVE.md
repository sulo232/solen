# ACTIVE PLAN — System Upgrade (Claude-Code setup)

> This is the single in-flight plan doc. It is auto-injected at SessionStart (survives compaction) and pointed at each turn. Full detail: [_plans/SYSTEM_UPGRADE_PLAN.md](SYSTEM_UPGRADE_PLAN.md). On completion this file is ARCHIVED to `_plans/archive/`, not deleted.

## Locked decisions
- Chinese subagent prompts: DROPPED (measured +15% tokens, not fewer).
- Council = multi-perspective subagent fan-out (correctness/security/dedup/hardcode), size-gated.
- All new gates ship as `ask` + 5-min skip flag + high threshold, tuned before tightening.
- Park NON-blocking decisions only (stop on blockers); hook enforces SURFACING, never continuation.
- Plan doc: ARCHIVE on completion (not delete).
- "Always link" → "always end with a verification artifact" (link for visual, curl/SHA for backend).
- Every new system: BUILD → SELF-TEST (positive + negative) → INTEGRATE.

## Build order (check off as completed)
- [x] **1. Compaction-proof plan-doc + re-read hooks** (built+reviewed+self-tested+wired; live next restart)
- [x] **2. System-health check** (`npm run health`; finds the 6 known issues, exit 1; --json for CI)
- [x] **3. Autonomy hardening** (finish-gate armed-flag + frontend-park-allow; link-gate web visual arm; CLAUDE.md dependency-test rule. Reviewed: all branches pass, existing behavior preserved)
- [ ] **4. Anti-hardcode + anti-bloat gate (extend check.py)** ← NEXT
- [ ] 5. Orchestration gate (PreToolUse: ask on substantial direct edit w/o coder dispatch + SubagentStop marker)
- [ ] 6. Auto-review council (Stop hook → refine.workflow.js review fan-out)
- [ ] 7. Cross-session dedup index (signature/concept index + CONCEPTS.md alias map)
- [ ] 8. Audit cleanup (stale hooks, skill retargets/removals, memory merges, doc archives)
- [ ] 9. Self-test-before-integrate rule (CLAUDE.md 12.5)

## Done this session
- [x] Wired orphaned mcp-prod-write-guard.py (Supabase/Vercel writes now ask-gated)
- [x] Fixed stale worktree design-verifier.md (coral + not-read-only → correct main copy)
- [x] Built plan-doc system: plan-active-sessionstart.py + plan-active-prompt.py (global, wired) + plan-archive.sh helper; ACTIVE.md convention

## Unplanned additions / deferred / parked
- DEFERRED from #3: silent-stop positive-completion detector (mechanizing "is this turn truly complete?" is too false-positive-prone; the auto-council #6 covers premature stops on code changes anyway).
- DEFERRED from #3: parked-decision hard-gate (enforce *surfacing* at stop). Currently covered by the CLAUDE.md dependency-test rule + ACTIVE.md convention; hard-gate is a nice-to-have.
- DEFERRED from #3: mockup-gate web arm (web frontend mockup-first enforcement). Lower priority.
- HOUSEKEEPING: finish-gate armed-flag (`~/.claude/.autonomous-armed-<session>`) has no TTL/disarm and files accumulate. Add a TTL (honor only if recent) or a cleanup, and a disarm path.
