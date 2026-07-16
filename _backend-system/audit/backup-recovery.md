# Backup & recovery

Solen audit 2026-07-16

## Verdict

Solen follows the parts of this law that cost nothing and skips the parts that cost time. The nightly per-table export exists, runs, is idempotent, never conflates itself with PITR, and its failure signal genuinely reaches the founder's inbox through two independent paths (a red GitHub Actions run and the daily digest email), which is better wiring than the topic's own solenFit note assumed. What is missing is the one thing this whole topic is actually about: nobody has ever executed a restore. The documented FK-ordered restore procedure in `_plans/OPS_RUNBOOK.md` is unexecuted, the RTO figure in that same file is an admitted guess, and the 24-of-146-table backup scope has already drifted since it was set (a new revenue-adjacent table, `promo_redemptions`, shipped three days later and was never added). None of this is urgent at 28 salons and a database that fits on a phone, but "untested" and "already stale" are both true today, not hypothetical.

## Coverage + sampling method

Read in full: `lib/backup/export.ts`, `app/api/cron/db-backup/route.ts`, `scripts/db-backup-kill-test.ts`, `lib/cron-run.ts`, `app/api/cron/daily-digest/route.ts`, `_plans/OPS_RUNBOOK.md` (73 lines), `_rules/DB_SCHEMA.md` section 7 (migration/backfill law), `.github/actions/ping-cron/action.yml`, and the fresh research pass at `_backend-system/research/backup-recovery.md` (used as a lead, every load-bearing claim in it was independently re-derived from code below, not taken on faith).

Read the first ~90 lines (architecture comments + type declarations) of `app/api/cron/reconcile/route.ts`, enough to confirm its scope (Stripe-vs-DB drift detection, read-only, 48h lookback, never auto-fixes), not its full mismatch-handling body.

Checked live state: `_inventory/_db-snapshot.json` (146 tables, captured 2026-07-12) diffed programmatically against `BACKUP_TABLES` (24 entries, all 24 present in the live snapshot, zero phantom-table names). Diffed `supabase/migrations/` filenames dated after 2026-07-11 (when `BACKUP_TABLES` was fixed) against `BACKUP_TABLES` by grepping each new file's `CREATE TABLE` statements, to check whether backup scope had already gone stale; this is how `promo_redemptions` was found (see gaps below).

Grepped the whole repo (excluding `node_modules*` and stale worktrees under `.claude/worktrees/`) for: `point-in-time`/`PITR`, `restore.drill`/`drill`, `encrypted at rest`/`AES-256`, and any `*restore*`/`*drill*` script filename. Cross-checked `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md` and `_plans/BACKEND_AUDIT_INDEX.md` for any prior finding on this topic (only one line found: bucket-privacy confirmed live, no restore-drill finding logged before this pass, so nothing here duplicates an already-closed item).

Not done (out of scope for a read-only pass): did not query the live Supabase dashboard/billing UI (no browser session, MCP Supabase tools not authenticated this session) to directly re-confirm `pitr_enabled` or plan tier; did not execute a restore (that would be a write operation, explicitly forbidden by this audit's own method).

## Per-principle table

| id | rule | verdict | evidence (file:line) | severity |
|---|---|---|---|---|
| BACKUP-01 | Backup validated by an executed restore, not just a write/export | GAP | `scripts/db-backup-kill-test.ts:1-17` and `_plans/OPS_RUNBOOK.md:26` both state in their own comments that the kill test "does not restore, it proves the export path itself is sound." No restore script exists (`find scripts -iname "*restore*"` = empty). No dated drill log anywhere in `_plans/`, `_docs/`, or `scripts/`. | HIGH |
| BACKUP-02 | RPO/RTO explicit, written, periodically re-verified, not guessed | PARTIAL | `_plans/OPS_RUNBOOK.md:16` writes numbers down ("RPO = backup cadence... RTO ~ 1-2h") but RTO carries a literal `~` (estimate marker) and has never been timed (no drill, see BACKUP-01); RPO is conditional on an unconfirmed plan tier ("daily on Pro, or PITR window") rather than one committed figure. | MEDIUM |
| BACKUP-03 | Logical/row exports never described as a PITR substitute | MATCH | `lib/backup/export.ts:1-6` and `app/api/cron/db-backup/route.ts:1-6` both frame the export as "the ONLY restorable backup," never as PITR or a PITR-equivalent. `_plans/OPS_RUNBOOK.md:14,16,18` keep PITR and the in-house export in clearly separate sentences throughout. | NONE |
| BACKUP-04 | On Supabase, PITR is a platform-managed paid add-on only, no DIY WAL path | MATCH (as documented) | `_plans/OPS_RUNBOOK.md:14` states this correctly ("PITR... is a paid add-on"). No code anywhere attempts custom WAL archiving. This is an external platform fact Solen has no lever over; Solen's own docs state it accurately. | NONE |
| BACKUP-05 | Partial backup scope reviewed whenever a new business-critical table ships | GAP | `supabase/migrations/20260714120000_promo_per_user_cap.sql:18-24` creates `promo_redemptions` (per-customer promo-cap ledger, 1:1 FK to `bookings.id`) on 2026-07-14, three days after `BACKUP_TABLES` (`lib/backup/export.ts:26-51`) was fixed on 2026-07-11. It is still absent from `BACKUP_TABLES` today (2026-07-16). `salon_of_month_winners` (`supabase/migrations/20260713140000_salon_of_month.sql:29-36`) is a second, lower-stakes miss (editorial content). No hook or process re-checks the list on new migrations. | MEDIUM |
| BACKUP-06 | Shared write+delete credential is a named, tracked risk | GAP | `lib/supabase.ts:78-90` (`createAdminSupabaseClient`, service-role, "Bypasses RLS") is the exact same function `lib/backup/export.ts:17` imports for both the export writes and `pruneOldBackups`'s deletes, and the same function every other admin/cron route in the codebase uses to write/delete live rows. The fact is real and provable, but it is written down nowhere Solen's own team would read it (`_plans/OPS_RUNBOOK.md` does not mention it); it exists only in this audit's own research artifact (`_backend-system/research/backup-recovery.md:167`), not in a pre-existing ops doc. | MEDIUM |
| BACKUP-07 | Retention window has a stated rationale, not a bare constant | GAP | `lib/backup/export.ts:21`: `export const RETENTION_DAYS = 14;` carries zero comment. The file's other constants and functions all get multi-line rationale comments (lines 1-16, 69-75, 123-129); this one line does not. | LOW |
| BACKUP-08 | Immutable/WORM storage gap named as an accepted risk if not built | GAP | Supabase Storage has no object-lock/versioning (external platform fact, converging community sources, not independently re-verified this pass). `_plans/OPS_RUNBOOK.md` never states this as an accepted gap; only `_backend-system/research/backup-recovery.md:183-189` (this audit's own research pass) names it. Correctly premature to build per BACKUP-12's own logic, but the one-line acknowledgment is still missing from the team's actual runbook. | LOW |
| BACKUP-09 | Encryption at rest never cited as mitigating credential compromise | MATCH | Repo-wide grep for `"encrypted at rest"` / `AES-256` outside `_backend-system/research/` returns zero hits in production code or `_docs/`. The one place the topic is discussed correctly (`_backend-system/research/security.md:209-213`) explicitly separates the two threat models (RLS = access control, encryption at rest = disk-theft only). No conflation exists in shipped docs or comments. | NONE |
| BACKUP-10 | A swallowed per-item error must actually reach a human | MATCH | Two independent, traced paths: (1) `lib/cron-run.ts` sets `ok:false` and HTTP 500 whenever `result.errors` is a non-empty array (the shape `app/api/cron/db-backup/route.ts:41,51` returns on any table failure); `.github/actions/ping-cron/action.yml:57-71` hard-asserts `jq -e '.ok == true'` and `exit 1`s otherwise, turning the GitHub Actions run red. (2) `app/api/cron/daily-digest/route.ts:93-120` independently queries `cron_runs` for `ok=false` rows in the last 24h and includes the table name + error snippet in the founder's `ADMIN_EMAIL` digest (scheduled 05:15 UTC, after db-backup's 03:45 UTC run, so same-night failures are always caught by the digest window). Not "console.error only" as the topic's solenFit note assumed. | NONE |
| BACKUP-11 | Schema recoverability kept independently reproducible from data retention | PARTIAL | `_rules/DB_SCHEMA.md:85-119` documents a real backfill recipe, executed once ("ring 11, 2026-07-11") that brought all 260 then-applied migrations into git. `ls supabase/migrations/ \| tail -30` shows files through `20260714230441...` exist locally, meaning the discipline has held for the 5 days since (a genuinely positive sign, not just an assumption). But nothing re-runs the drift-detection query on a schedule; it is a manual recipe someone has to remember to re-run, not an enforced or repeated check. | LOW |
| BACKUP-12 | DR investment sized to actual business impact, not maximized | MATCH | No hot standby, mirrored replica, or other over-built DR infra exists anywhere in the codebase or infra docs. The current cold-restore-from-export posture is exactly NIST SP 800-34's own low-impact-tier recommendation, applied honestly to a 28-salon pre-revenue business. | NONE |
| BACKUP-13 | Stripe is not a substitute for lost Postgres payout/commission state | PARTIAL | Confirmed independently: `app/api/cron/reconcile/route.ts:1-45` is real, live, daily, and would surface every `missing_booking`/`missing_payout` mismatch against Stripe if Postgres rows were gone, but it is explicitly read-only ("It NEVER auto-fixes," line 18) and bounded to a 48-hour lookback (`LOOKBACK_MS`, line 46), so it is a diagnostic starting point for a human to manually reconstruct from, not an automated recovery path, and it would miss anything older than 48h at the moment of loss. No code anywhere rebuilds `salon_payouts`/commission/VAT state from raw Stripe PaymentIntent/Charge/Transfer history. | MEDIUM |

## The gaps in detail

### BACKUP-01: the restore procedure has never been run

`_plans/OPS_RUNBOOK.md:20-26` writes out a full 6-step restore procedure, including a hand-derived FK-dependency order across 20+ tables (line 24, one very long paragraph). `scripts/db-backup-kill-test.ts` is the only automated check in the repo touching this area, and its own header comment (lines 1-17) is explicit: it "exercises the REAL export function... proves the export path itself is sound," and separately, restore drill "does not restore." Nothing else in `scripts/`, `_plans/`, or `_docs/` runs or logs a restore.

What breaks in practice: the FK order in the runbook is hand-written prose, not code. A self-reference (`service_categories.parent_id`), a nullable-then-required column, or a trigger rejecting an out-of-order insert would only surface the first time someone actually restores, which under this audit's finding is: never, so far. If the DB were ever actually lost, the first restore attempt would also be the first test of whether the documented order is even correct.

Concrete fix: use the Supabase MCP `create_branch` tool (already available and unauthenticated-blocked only in this read-only audit session, not in general) to spin up a scratch branch, download one real date-folder from `db-backups`, and run the 6-step procedure end to end, timing each step. This is a few hours, once, and should be repeated quarterly or after any `BACKUP_TABLES`/FK-order change (this is also literally the parked checklist item `_plans/BACKEND_LAW.md:65-67`, "4b audit" / "4c recommendations", not yet closed).

### BACKUP-02: RTO is a labeled estimate, not a measurement

```
_plans/OPS_RUNBOOK.md:16
Restore procedure (data): 1. Supabase dashboard -> Backups -> restore to a
NEW project... RPO = backup cadence (daily on Pro, or PITR window); RTO ~ 1-2h
(restore + env repoint + owner `sync`).
```

The `~` is the tell: this is what NIST SP 800-34 (the topic's own T1 source) calls exactly the failure mode it warns against, a written number that was never derived from a business-impact analysis or a timed test. It directly depends on BACKUP-01: once a real drill runs once, this line can be replaced with a real number and the `~` dropped.

Fix cost: zero additional work beyond running the BACKUP-01 drill and updating one line in the runbook with the measured time.

### BACKUP-05: the backup table list is already stale, 3 days after being set

```
lib/backup/export.ts:26-51 (BACKUP_TABLES, last touched 2026-07-11)
supabase/migrations/20260714120000_promo_per_user_cap.sql:18-24
  CREATE TABLE IF NOT EXISTS public.promo_redemptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    redeemer_key text NOT NULL,
    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    redeemed_at timestamptz NOT NULL DEFAULT now()
  );
```

`promo_redemptions` is the enforcement ledger for the per-customer promo cap added the same day (`reserve_promo_use`, same migration file): it is what stops one customer from redeeming a capped promo code more times than `per_user_limit` allows. It is not in `BACKUP_TABLES`. If Postgres were restored from the nightly export today, every customer's promo-redemption history would silently reset to zero, meaning a customer who had already used a capped code could redeem it again post-restore. Bounded harm (extra discount, not lost money that was already collected), but real and currently invisible: nothing flags that this table exists and isn't covered.

A second, lower-stakes miss: `salon_of_month_winners` (`supabase/migrations/20260713140000_salon_of_month.sql:29-36`), editorial homepage content, recoverable by an admin re-picking a winner, worth noting but not urgent.

Fix: add `promo_redemptions` to `BACKUP_TABLES` (one line). Cost is genuinely trivial; the actual gap is that nothing prompts this addition when a new table ships. A cheap process fix: add "check `BACKUP_TABLES` " to the same mental checklist as the exists-check protocol whenever a migration creates a table touching money, bookings, or fraud/abuse controls, rather than building tooling for it.

### BACKUP-06 / BACKUP-08: the shared-credential and no-WORM risks are real but undocumented in the team's own runbook

Both are genuine, already-true facts about Solen's architecture (`lib/supabase.ts:78-90`, `lib/backup/export.ts:17`, the `db-backups` bucket's migration at `supabase/migrations/20260711161553_backend_loop_db_backups_bucket.sql:5` which sets `public=false` with zero separate `storage.objects` policies, confirmed also by `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md:34`). Neither is a code bug and neither should be fixed at 28-salon scale (matches BACKUP-12's own logic). The actual gap is narrower than "unmitigated risk": it is that `_plans/OPS_RUNBOOK.md`, the document engineers actually read, contains zero sentences naming either fact. They exist only inside this audit's own research scratch file, which is not the team's living ops doc.

Fix: add two lines to `_plans/OPS_RUNBOOK.md`'s Backups section: one naming the shared service-role blast radius, one naming the no-WORM gap, both with "accepted at current scale, revisit if X" framing (X = real revenue or a credential-leak incident, per the research pass's own trigger language). This is documentation only, no code or infra change, costs minutes.

### BACKUP-07: retention constant has no rationale comment

```
lib/backup/export.ts:21
export const RETENTION_DAYS = 14;
```

Every other constant and function in this file (lines 1-16 header, 69-75 export docstring, 123-129 prune docstring) carries a multi-line rationale comment. This one line does not, despite retention being exactly the kind of decision (corruption-discovery lag vs GDPR/nFADP exposure) that looks arbitrary to a future reader without one. The number itself is defensible (14 days is short enough to bound GDPR exposure, long enough to catch most slow-discovered bugs); only the written-down reasoning is missing.

Fix: a 2-3 line comment above the constant. Zero behavior change, costs a few minutes.

### BACKUP-13: Stripe reconciliation is a diagnostic, not a reconstruction path

`app/api/cron/reconcile/route.ts` is real, already shipped, and directly relevant here even though it wasn't built for this purpose: it independently proves that `salon_payouts.gross`/`net` are written from `pi.amount/100` by the webhook and never re-derived from Stripe elsewhere (comment block, lines 20-24), and that whole categories of charges (`walk_in`, `voucher`, `voucher_purchase`) are explicitly out of its scope (lines 40-44). Its 48-hour lookback (`LOOKBACK_MS`, line 46) means it is built to catch webhook drift within 2 days, not to serve as a full-history reconstruction tool. If Postgres were lost entirely and restored from a 14-day-old export, running `reconcile` afterward would surface mismatches only for the most recent 48 hours of Stripe activity relative to whenever it's next run, not the full gap between the backup's age and the loss.

This is not a bug in `reconcile` (it was built for webhook-drift detection, not disaster recovery, and does that job well), it is a genuine absence: no tool exists that walks Stripe's full PaymentIntent/Charge/Transfer history for an arbitrary historical window and rebuilds `salon_payouts` rows from scratch. Building one is real work (Stripe's API pagination, rate limits, and the same amount/VAT-split logic the webhook already encodes would need to be duplicated in a reconstruction script) and is legitimately premature at 28 salons; the fix here is naming the gap, which this audit now does, not building the tool today.

## What Solen already does RIGHT

- **The export function itself is well-built resilience code.** Per-table try/catch that never aborts the loop (`lib/backup/export.ts:81-110`), `upsert:true` for idempotent re-runs, paged `.range()` reads that don't blow memory on `bookings`. Do not "fix" this defensive design, it is correct.
- **Retention pruning only runs after a fully clean export** (`app/api/cron/db-backup/route.ts:34-39`), so one bad night never destroys an older, complete backup. This is exactly the right defensive ordering.
- **The failure-signal wiring is genuinely good**, better than this topic's own solenFit note assumed: `withCronRun` + the ping-cron GitHub Action + the founder daily digest form two independent, already-verified paths from a swallowed per-table error to a human inbox. Do not build a third alerting path for this; it would be redundant.
- **The private bucket is actually private.** `public=false`, zero `storage.objects` policies target it, live-verified in `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md:34`. No accidental client-readable backup path exists.
- **Schema and data recoverability are correctly kept as two separate concerns**, and the schema half (`_rules/DB_SCHEMA.md` section 7) has already been exercised once for real (the 2026-07-11 backfill of 260 migrations), which is more validation than the data-restore half has ever received.
- **No premature DR machinery exists.** No hot standby, no mirrored replica, no separate immutable cloud account. This is the correct call at this scale per NIST's own impact-tiered framework, and should not be built preemptively.
- **PITR/logical-dump distinctions are never confused in any shipped comment or doc.** Every mention of PITR in the codebase correctly treats it as a separate, currently-off, platform-only mechanism, never as something the nightly export approximates.

## Unknowns

- **Solen's actual current Supabase plan tier and live `pitr_enabled` value today.** The Supabase MCP tools available this session require authentication that wasn't available; the `pitr_enabled=false` / empty-backups-list fact carried in `_plans/OPS_RUNBOOK.md:18` is dated 2026-07-11 and was not independently re-verified in this pass or the research pass that preceded it. **To check: owner opens the Supabase dashboard directly (Settings -> Billing, Settings -> Database -> Backups).**
- **Whether `ADMIN_EMAIL` is actually set in the live Netlify environment.** The code path that makes BACKUP-10 a MATCH (`app/api/cron/daily-digest/route.ts:39-43`) silently skips sending if `ADMIN_EMAIL` is unset ("skipped: true, reason: no_admin_email"), and `_plans/OPS_RUNBOOK.md:46` lists Netlify env presence (including `ADMIN_EMAIL` implicitly via the wider env-check item) as an open owner-only item. If it is unset in production, BACKUP-10's second alert path silently doesn't fire (the first path, the red GitHub Actions run, is independent of this and still holds). **To check: owner confirms `ADMIN_EMAIL` is set in Netlify's env vars, or a maintainer runs `GET /api/health`/checks a recent digest email actually arrived.**
- **Whether the GitHub repo is public or private, and whether failed-workflow-run email notifications are actually enabled on the owner's GitHub account.** This affects whether BACKUP-10's first alert path (red Actions run -> GitHub email) is truly guaranteed versus just visible-if-someone-checks-the-Actions-tab. `_plans/OPS_RUNBOOK.md:42,72` already flags the repo-visibility question as unresolved for an unrelated reason (Actions minutes budget); the same unresolved fact matters here too.
- **Whether any other table besides `promo_redemptions` and `salon_of_month_winners` has shipped since 2026-07-11 that should be backup-covered.** This audit diffed migration filenames against `BACKUP_TABLES` by grepping `CREATE TABLE` statements in every file dated after 2026-07-11; it did not exhaustively check `ALTER TABLE ... ADD COLUMN` changes to already-covered tables for silently-added money/PII columns, which would still be captured by the existing `.select("*")` export (new columns on an already-backed-up table are fine) but were not individually enumerated here.
