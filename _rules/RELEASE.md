// exists-check: net-new vs _rules/SYSTEMS.md, _rules/ROADMAP_RULES.md, _rules/SECURITY_RULES.md, _rules/DB_SCHEMA.md, _rules/STRUCTURAL_RULES.md, _rules/KEY_FEATURES.md, _rules/search-bar-rules.md because none of them cover a deploy-rollback procedure, a kill-test-vs-regression-test lifecycle, or a feature-flag removal rule (checked: SECURITY_RULES.md and DB_SCHEMA.md only document HOW to use feature_flags as a kill switch, not when a flag gets deleted; ROADMAP_RULES.md's "verify after deployment" line is about smoke-checking a fresh deploy, not reverting a bad one)

# Release Rules (rollback, script lifecycle, flag lifecycle)

Three release-time gaps a 2026-07-26 research sweep found: no written rollback
procedure, no keep-or-delete rule for the scripts/*-kill-test.ts family, no
lifecycle rule for feature_flags rows. All three are findable-in-30-seconds
documents, not machine-enforced gates, because at 1-developer/28-salon scale a
documented rule plus periodic manual review is the proportionate answer; each
section names the trigger to build a real gate later.

---

## 1. Rollback: what to press when a live deploy is bad

**Netlify web deploy (the one that will actually happen first):**
Netlify keeps every deploy as an atomic, immutable build. Reverting does NOT
need a code change or a new commit:

1. Open Netlify → the site → **Deploys**.
2. Find the last deploy that was known-good (before the one that broke it).
3. Click it → **Publish deploy**.

This flips the live site back to that build in under a minute. It is a
platform feature already available today; the only gap was that it wasn't
written down anywhere in this repo.

After a rollback: check `/api/health`, check the last few Sentry-equivalent
alerts (`lib/error-report.ts`'s `alertAdmin` emails), and check that the
Supabase schema the reverted build expects still matches the live DB (a
rollback that crosses a migration boundary can reintroduce a schema
mismatch: see the migrations note below).

**Supabase migrations:** this is a SEPARATE decision, not covered again here.
`_backend-system/research/migrations.md` section 1 already covers it: never
write a down migration, fix forward, or restore from a full backup for a
genuine disaster. That guidance stands; this file only adds the Netlify half
that had no equivalent anywhere.

**GitHub Actions crons (`.github/workflows/cron-jobs.yml`):** a bad cron
change is reverted the same way as any code change, `git revert` the commit
on `main` (the owner does the actual `git push`); there is no separate cron
"deploy" to roll back, the workflow file IS the deployed artifact.

---

## 2. Kill-test vs regression test: a verification script is one or the other

A script under `scripts/` that verifies behavior is EXACTLY one of:

- **REGRESSION TEST**: lives under `tests/` or `e2e/`, runs in CI on every
  push (wired into `.github/workflows/quality.yml`), and its failure blocks a
  merge.
- **KILL-TEST**: a one-off script written to prove a specific fix during a
  specific hardening sprint (the `ring1` through `ring9` family,
  `db-backup-kill-test.ts`, `spend-path-kill-test.ts`, ...). Lives in
  `scripts/`, is NOT wired into CI, and is a manual-run verification tool,
  not a safety net.

**The rule:** a kill-test not deleted within 30 days of the sprint that
created it must be either PROMOTED (moved into `tests/`, wired into CI in the
same PR) or DELETED. It may not sit indefinitely in `scripts/` pretending to
be coverage: counting these scripts as "test files" overstates real
regression protection (verified 2026-07-26: 21 kill-test scripts vs 6 real
`tests/**/*.test.ts` files, a 3.5x overstatement if conflated).

**Trigger to build an automated gate** (a CI job that flags any
`scripts/*-kill-test.ts` file older than 30 days): once a THIRD kill-test-vs-
real-test confusion incident happens, or once `scripts/` exceeds ~30 such
files. Below that, a documented rule plus an occasional manual sweep is
proportionate.

---

## 3. Feature flag lifecycle: every flag is PERMANENT or LAUNCH, named at creation

Every row added to `feature_flags` (and every `CLIENT_FEATURE_FLAGS` /
`FeatureKey` entry in `lib/feature-flags.ts`) falls into exactly one category,
stated in a comment next to its definition:

- **PERMANENT**: an operational kill switch (`maintenance_mode`, `bookings`,
  `payments`). Never removed.
- **LAUNCH**: a temporary gate on a specific feature rollout (a new category,
  a new payment method). Has an implicit expiry: once the launch decision is
  made (ship fully on, or kill fully off) and stays at that single value for
  90+ days with no active experiment, the flag must be DELETED from both the
  code (every `checkFeatureEnabled(...)` call site removed) and the
  `feature_flags` table row, in the same PR that makes the decision permanent.

**Already caught and fixed by this rule (2026-07-27):** `lib/feature-flags.ts`
had `CLIENT_FEATURE_FLAGS.isMassageSpaEnabled: false`, a Phase 1 launch gate
with zero read sites anywhere in the repo (its own definition was the only
grep hit). Removed. The whole `CLIENT_FEATURE_FLAGS` object was also dead
(never imported) and was removed with it.

**Trigger to build an automated gate** (a CI script reading
`feature_flags.updated_at` for launch-type rows unchanged past 90 days and
opening a warning): once the `feature_flags` table crosses ~25 rows. A
`flag_type` or `review_by` column on the table is the natural mechanism when
that trigger fires: not added yet, this is a documented rule only, adding a
column is a migration and needs the owner's go-ahead on the schema change.
