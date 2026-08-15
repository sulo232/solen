# Env-failure hardening (owner 2026-07-06: "make me hook or skills or system onto how to fix it and also a plan and then drop subagents n go")

The two recurring environment failures from the 2026-07-03/04 polish-loop session, hardened into enforcement + a one-command fix, per the rules-are-hooks philosophy.

## The failures being killed
1. `npm install` inside a worktree whose node_modules is a SYMLINK dereferences the link into a partial dir: shared deps vanish (framer-motion incident), app 500s, ~85 phantom tsc errors.
2. `next dev` corrupts its .next cache under parallel-agent load (stale `[locale] 2/` chunk dirs, ENOENT `_document.js`, boundary-chunk 404s). Cost 3 verifier renders + hung a coder in one session.

## Delivered (this batch)
- [x] HOOK `worktree-npm-install-gate.sh` (PreToolUse/Bash): blocks npm/pnpm/yarn/bun package-mutating commands when ./node_modules is a symlink; points at the main repo + re-link fix; 5-min skip flag. SELF-TESTED 11/11 (4 block cases, 5 allow cases, flag case, real-dir case) BEFORE wiring. Wired into .claude/settings.json Bash matcher.
- [x] SYSTEM `scripts/dev-doctor.sh`: one command that (a) heals a broken/partial node_modules symlink, (b) detects + clears .next corruption markers, (c) probes the dev server. Self-tested on the live worktree (healthy path).
- [x] SYSTEM launch.json "Next.js prod test" (:3300, build + start): the stable server for long/parallel verification runs, per reference_test_server_pattern. Dev server stays for HMR work; verifiers get the prod server.
- [x] Plan (this file) + ACTIVE.md #3 System-Upgrade row reopened with this batch.

## Not mechanically hookable (named, per the harden rule's escape clause)
- Subagents dying mid-report (usage-limit deaths, degraded closers, connection drops): harness-level, no hook can intercept. Mitigation stays procedural: orchestrator verifies the working-tree diff mechanically when a coder's report is lost (did this 3x in the polish loop; it works).

## Then: subagents dropped on the next queued work
Bug-hunt workstream #2 resumed (owner's "go" + the stated top recommendation): onboarding + admin surfaces never audited. Dispatch per BUG_HUNT.md.
