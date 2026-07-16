# Migrations , researched law

Date researched: 2026-07-16. Sources fetched this run: 15 (listed at the bottom with URLs).
Who this is for: any Claude session or engineer touching `supabase/migrations/`, the Supabase MCP
`apply_migration` tool, or a schema change that will run against the live Solen database (146 tables,
264 migration files today, ~28 salons live, low traffic, Netlify serverless, Supabase Postgres,
PostgREST underneath).

This file is descriptive-turned-prescriptive: it separates what the evidence actually says (tiered)
from what specifically applies to Solen's current scale. Read `_docs/BACKEND.md` section 2 (database
+ RLS + two-client model) and `_rules/DB_SCHEMA.md` section 7 ("Migration law: additive-idempotent
apply_migration") before applying any of this; that section is Solen's own existing law and this file
extends it, it does not replace it.

---

## 0. The short version

1. **Forward-only.** Never write a `down` migration for anything that ships to production. When a
   migration is wrong, write a new migration that fixes it. (T2, converging sources; already Solen's
   de facto practice, see section 1.)
2. **A schema change and the code that depends on it deploy in separate steps**, oldest-compatible-first:
   expand (add the new shape, keep the old working), migrate (switch reads/writes to the new shape),
   contract (drop the old shape). Never a single deploy that removes a column the previous release's
   code still reads. (T1, Martin Fowler's ParallelChange; T2 GitLab's identical multi-release column
   drop/rename process.)
3. **`ADD COLUMN` with a plain constant default (or NULL) does not rewrite the table** and is nearly
   instant on modern Postgres. A **volatile** default (a function call), a generated column, or an
   identity column **does** rewrite the table and holds `ACCESS EXCLUSIVE` for the duration. (T1,
   Postgres docs.)
4. **`ADD CONSTRAINT ... NOT VALID` then `VALIDATE CONSTRAINT` in a second statement** turns one
   long `ACCESS EXCLUSIVE`-holding table scan into a near-instant catalog change plus a
   `SHARE UPDATE EXCLUSIVE` scan that does not block reads or writes. Do this for every new
   `CHECK`, `NOT NULL` (via a check constraint), and non-FK constraint on a table with existing rows.
   (T1, Postgres docs.)
5. **Always `CREATE INDEX CONCURRENTLY`**, never a bare `CREATE INDEX`, on any table that already has
   rows and traffic. It costs roughly double the work and can leave an `INVALID` index behind on
   failure (which you then `DROP` and retry), but it never blocks writes. (T1, Postgres docs.)
6. **A backfill (an `UPDATE`/`INSERT` touching existing rows) is not a schema change and should not
   ride inside the DDL migration once a table has real, live-traffic-sized data.** It should be
   batched by primary key, resumable (skips already-done rows), idempotent (safe to re-run), and
   throttled (a pause between batches). At Solen's current table sizes this is usually unnecessary,
   see section 4 and "Premature at our scale."
7. **Seed data and migrations are different concerns.** A migration changes structure. A seed inserts
   rows. Keep them in different files; make every seed idempotent (`ON CONFLICT DO NOTHING` / upsert),
   and never let a seed accidentally run destructive test data against production. (T3/CONV,
   converging blog consensus, no single canonical standard exists for this one.)
8. **"Just run the down migration" is a lie the moment real user data has been written since the up
   migration ran.** A down migration is untested in practice (rarely exercised), and even a
   syntactically correct rollback throws away or corrupts any row created or changed in between.
   The actual rollback plan for a bad migration is: fix forward, or restore from a full backup for a
   genuine disaster. (T2, multiple converging sources; T1 for the backup-based disaster-recovery
   half via standard operational practice.)
9. **After any DDL that adds/renames/removes a table or column, the PostgREST schema cache must see
   it**, or the API returns errors on things that exist in the database. This is Solen's documented
   #1 failure mode (silent no-ops) applied to schema changes specifically. Verify with a live query
   through the API, not just a passing migration. (T1/T2, PostgREST + Supabase docs; see "Myths and
   traps.")
10. **At ~28 salons, almost none of the "hyperscale" tooling (Sidekiq-style batched background
    migration frameworks, blue-green schema swaps, terabyte-scale online migration pipelines) is
    warranted.** The correct move is disciplined use of the cheap primitives above (`NOT VALID` +
    `VALIDATE`, `CONCURRENTLY`, expand/contract), not adopting GitLab's or Stripe's machinery
    wholesale. See "Premature at our scale."

---

## 1. Forward-only vs reversible

**The question:** should every migration ship with a paired "down" migration that undoes it
(the classic Rails/Flyway/most-framework default), or should the team commit to forward-only and
never write (or run) a down migration in production?

**What the evidence says:**

- Spatie (a well-known Laravel shop) states their explicit practice directly: "The reality is that you
  never rollback your database... when something needs to be reversed, we think carefully about the
  appropriate solution and handcraft a new migration that moves forward." (T2,
  [freek.dev](https://freek.dev/2900-why-i-dont-use-down-migrations))
- A second, independent source makes the same argument from a different angle: down migrations are
  "untested disaster plans" because "when do you run them? Hardly ever," and running one against a
  table that received new writes after the up migration ran "creates a significant problem: your
  migration history no longer makes sense." Its recommended alternative: write a new up migration to
  fix a mistake, and for genuine disasters, restore from backup. (T2,
  [antman-does-software.com](https://antman-does-software.com/why-you-will-never-write-another-down-migration))
- Braintree's production migration tooling (`pg_ha_migrations`, used at a payments company under
  similar reliability pressure to Solen's Stripe-Connect model) goes further and structurally
  **removes rollback support**: "migrations are written with only an `up` method and never use
  `change`, which is believed to be the only safe approach in production environments," because
  "rollback strategies do not involve reverting the database schema to its previous version." (T2,
  [github.com/braintree/pg_ha_migrations](https://github.com/braintree/pg_ha_migrations))
- Supabase's own migration tooling generates a down migration on request, but its docs carry an
  explicit warning: "SQL statements generated in a down migration are usually destructive. You must
  review them carefully to avoid unintentional data loss." (T1, vendor doc,
  [supabase.com/docs/guides/deployment/database-migrations](https://supabase.com/docs/guides/deployment/database-migrations))

**Where the real tradeoff lies:** a down migration is genuinely useful in exactly one narrow window:
between "migration applied" and "any new row written or old row touched," in an environment with no
concurrent traffic (a local dev reset, a CI test database). The moment the table has live writes after
the up migration ran, a mechanical down migration either (a) drops a column that now holds data nobody
backed up, or (b) leaves the schema in a state the application code was never written against. Frameworks
that make `down()` a first-class citizen are optimizing for the dev-loop case, not the production case,
and it is easy to mistake the two.

**Recommended default for Solen:** forward-only, already the practice in `_rules/DB_SCHEMA.md` section 7
(the `apply_migration` law never mentions or supports a down path). Do not add down migrations to new
files. If a migration is wrong, write a new migration that corrects it (add the missing column, drop the
wrong constraint, backfill the bad rows). For a genuine catastrophic mistake, the recovery path is a
Supabase point-in-time restore or backup restore, not a hand-written reverse migration.
**Cost:** you give up the illusion of a one-command undo. That illusion was mostly false anyway once
data existed; you were never going to safely run it in production. **When this is wrong:** a true
greenfield local/CI-only migration set with no production data at stake, where a down migration is just
a convenience for `db reset` during development. Solen's Supabase CLI local-dev loop (`supabase db reset`)
already covers this case without needing paired down files, because a local reset replays every up
migration from zero rather than reversing one.

---

## 2. Zero-downtime deploys and the expand/contract (parallel change) pattern

**The question:** how do you change a table's shape (rename a column, split a table, change a type)
when the API and the database must both keep serving traffic through the change, and the deploy of the
schema change and the deploy of the code that depends on it are two separate events (this is
structurally true for Solen: migrations apply via the Supabase MCP `apply_migration` tool on one
timeline, application code deploys via Netlify on `main` merges on a different timeline)?

**What the evidence says:**

Martin Fowler named and formalized this pattern (Parallel Change, also called Expand/Contract) in a
2014 bliki entry that remains the canonical reference. Its structure, quoted from the source:

1. **Expand**: "augment the interface to support both the old and the new versions"
2. **Migrate**: "update all clients using the old version to the new version"
3. **Contract**: "remove the old version and change the interface so that it only supports the new
   version"

Two rules distill the whole pattern: "Never remove something until nothing depends on it, and never
force adoption of something that does not yet exist." Fowler's own caveat matters as much as the
pattern: "If the contract phase is not executed you might end up in a worse state than you started,
therefore you need discipline to finish the transition successfully." (T1,
[martinfowler.com/bliki/ParallelChange.html](https://martinfowler.com/bliki/ParallelChange.html))

GitLab's engineering docs operationalize the exact same three phases for Postgres specifically, with
concrete multi-release recipes:

- **Dropping a column**: three releases. Release M: stop reading/writing the column in application
  code (`ignore_column`). Release M+1: drop it in a migration. Release M+2: remove the ignore rule.
  Explicit rule: "Ignoring and dropping columns should not occur simultaneously in the same release."
- **Renaming a column**: create the new column, dual-write via trigger, ignore the old name in the
  model, then a later release cleans up and drops the old column.
- **Changing a column's type**: a temporary column plus triggers keep both in sync during migration,
  cleaned up afterward.
- **Adding `NOT NULL`**: "requires that any application changes are deployed first, so it should
  happen in a post-deployment migration" (i.e., after the expand phase's code has shipped and is the
  only thing writing to the table).

(T2, [docs.gitlab.com/development/database/avoiding_downtime_in_migrations](https://docs.gitlab.com/development/database/avoiding_downtime_in_migrations/))

**Where the real tradeoff lies:** expand/contract costs you calendar time (multiple deploys instead of
one) and code complexity (the app must tolerate both shapes during the migrate window). The payoff is
that at no point does a schema change and a code deploy have to land in the exact same instant, which
is the thing that actually causes downtime: a deployed lambda instance reading a column that a
concurrent migration just dropped, or a migration blocking on a lock a live request is holding.

**Recommended default for Solen:** use the pattern for any *structural* change that an in-flight request
could observe mid-transition: renaming a column that live code reads/writes, changing a column's
meaning or type, or splitting one table into two. Do not use it for additive changes with no consumer
yet (a brand-new nullable column feeding a feature not yet wired into the frontend); those can go
straight in because nothing depends on them yet, which is exactly Fowler's second rule.
**Cost at Solen's scale:** with Netlify deploying from `main` and Supabase migrations applied
independently via MCP, a rename that isn't expand/contracted has a real (if often small) window where
deployed code and live schema disagree, serverless functions are not all replaced atomically. The
window is usually short (Netlify's deploy propagates in seconds to a couple of minutes) but is not
zero, so treat any column rename or type change as at minimum a two-step (add new, backfill, swap
reads, drop old) operation, never a single `ALTER TABLE ... RENAME COLUMN` on a table real code
already touches.

---

## 3. The specific Postgres locks that break production

**The question:** which exact `ALTER TABLE` / `CREATE INDEX` forms take a lock that blocks ordinary
reads and writes, for how long, and which forms avoid it. This is the single most mechanical, most
verifiable part of this topic, so it is quoted directly from the current official Postgres docs.

Lock levels, from the Postgres lock-modes reference (T1,
[postgresql.org/docs/current/explicit-locking.html](https://www.postgresql.org/docs/current/explicit-locking.html)):

| Lock mode | Blocks | Typical acquirer |
|---|---|---|
| `ACCESS SHARE` | only `ACCESS EXCLUSIVE` | plain `SELECT` |
| `ROW EXCLUSIVE` | `SHARE` and stronger | `UPDATE` / `DELETE` / `INSERT` |
| `SHARE UPDATE EXCLUSIVE` | itself and stronger, but not reads/writes | `VACUUM`, `ANALYZE`, `CREATE INDEX CONCURRENTLY`, `VALIDATE CONSTRAINT` |
| `SHARE` | writes, but not reads | plain `CREATE INDEX` |
| `SHARE ROW EXCLUSIVE` | most things | some `ALTER TABLE`, `CREATE TRIGGER` |
| `ACCESS EXCLUSIVE` | everything, including plain `SELECT` | `DROP TABLE`, most `ALTER TABLE` forms by default, `VACUUM FULL` |

Only `ACCESS EXCLUSIVE` blocks a plain read. Everything below it in the table still lets `SELECT` run;
the operational danger is almost always "this took `ACCESS EXCLUSIVE` and something else was already
holding a weaker lock on the same table, so the migration queues behind it, and everything queues
behind the migration" (a classic lock queue pile-up), not the migration statement itself being slow.

**`ADD COLUMN` with a default** (T1, [postgresql.org/docs/current/sql-altertable.html](https://www.postgresql.org/docs/current/sql-altertable.html)):
> "When a column is added with `ADD COLUMN` and a non-volatile `DEFAULT` is specified, the default
> value is evaluated at the time of the statement and the result stored in the table's metadata...
> The value will be only applied when the table is rewritten, making the `ALTER TABLE` very fast even
> on large tables... In neither case is a rewrite of the table required."
> "Adding a column with a volatile `DEFAULT` (e.g., `clock_timestamp()`), a stored generated column,
> an identity column, or a column with a domain data type that has constraints will cause the entire
> table and its indexes to be rewritten."

So: `ADD COLUMN foo text DEFAULT 'x'` is cheap (metadata-only). `ADD COLUMN foo timestamptz DEFAULT
now()` is expensive (full rewrite under `ACCESS EXCLUSIVE`) because `now()`/`clock_timestamp()` are
volatile. This exact distinction (constant vs. function-call default) is the number one way this class
of migration silently goes from instant to a full-table lock.

**`ALTER COLUMN ... TYPE`** (T1, same source):
> "Changing the type of an existing column will normally cause the entire table and its indexes to be
> rewritten... However, when changing the type of an existing column, if the `USING` clause does not
> change the column contents and the old type is either binary coercible to the new type or an
> unconstrained domain over the new type, a table rewrite is not needed. However, indexes will still
> be rebuilt unless the system can verify that the new index would be logically equivalent."

A type change is `ACCESS EXCLUSIVE` for the whole rewrite in the common case. `varchar(50)` to
`varchar(100)` (or to unconstrained `text`) is one of the few genuinely cheap cases because it is
binary-coercible; `text` to `integer` is not.

**`ADD CONSTRAINT` vs `NOT VALID` + `VALIDATE CONSTRAINT`** (T1, same source):
> "Although most forms of `ADD table_constraint` require an `ACCESS EXCLUSIVE` lock, `ADD FOREIGN KEY`
> requires only a `SHARE ROW EXCLUSIVE` lock." A plain `ADD CONSTRAINT ... CHECK (...)` (no `NOT VALID`)
> scans the whole table under `ACCESS EXCLUSIVE` to verify every row, right then.
>
> `VALIDATE CONSTRAINT`: "This command acquires a `SHARE UPDATE EXCLUSIVE` lock... The validation step
> does not need to lock out concurrent updates, since it knows that other transactions will be
> enforcing the constraint for rows that they insert or update; only pre-existing rows need to be
> checked."

The pattern this produces: `ALTER TABLE t ADD CONSTRAINT c CHECK (...) NOT VALID;` (near-instant,
catalog-only, new rows enforced immediately) followed by a separate `ALTER TABLE t VALIDATE CONSTRAINT
c;` (a `SHARE UPDATE EXCLUSIVE` scan of existing rows that does not block reads or writes, just other
DDL). Two cheap statements instead of one expensive one. GitLab's docs state the same conclusion for
`NOT NULL` specifically: add it as a `CHECK` constraint `NOT VALID` first, deploy the app change that
guarantees no more nulls get written, then `VALIDATE` in a later, separate migration.

**`CREATE INDEX` vs `CREATE INDEX CONCURRENTLY`** (T1, [postgresql.org/docs/current/sql-createindex.html](https://www.postgresql.org/docs/current/sql-createindex.html)):
> Plain `CREATE INDEX` "locks out writes (but not reads) on the table until it's done." With
> `CONCURRENTLY`, Postgres "builds the index without taking locks that prevent concurrent inserts,
> updates, or deletes," at the cost that it "must perform two scans of the table" and "requires more
> total work... and takes significantly longer to complete." It also "cannot run inside a transaction
> block," and if it fails partway (a deadlock, a uniqueness violation it discovers), "the `CREATE
> INDEX` command will fail but leave behind an 'invalid' index... The recommended recovery method... is
> to drop the index and try again."

Concretely, the finalization step still needs a brief `ACCESS EXCLUSIVE` to flip the index visible,
but per the pglocks.org lock-conflict tool and the Postgres index-locking docs, this final step is
very short; the long build itself runs under `SHARE UPDATE EXCLUSIVE`, which does not block ordinary
reads/writes. (T2, [pglocks.org](https://pglocks.org/))

**Renames** (`RENAME COLUMN` / `RENAME TABLE`): take `ACCESS EXCLUSIVE` like most `ALTER TABLE` forms,
but the lock is held for a trivial duration because it is a catalog-only change (no rewrite, no scan).
The actual danger with a rename is never lock duration; it is that any code (this instant, or a request
that started a moment earlier and is still in flight) referencing the old name breaks the moment the
rename commits. This is why GitLab's rename recipe is a dual-write-then-cleanup dance across releases,
not a locking concern, it is a coordination-with-deployed-code concern (expand/contract, section 2).

**Operational mitigation, regardless of which of the above you run** (T2,
[gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts)):
> "Set `lock_timeout` in your migration scripts to a pause your app can tolerate. It's better to abort
> a deploy than take your application down." Combined with `log_min_duration_statement` and
> `log_lock_waits` to catch a long-running query before it collides with a migration's lock request.

**Recommended default for Solen:** for any table with live rows and traffic (most of Solen's 146
tables, at 28 salons the row counts are still small but requests are still real): constant/NULL
defaults only for `ADD COLUMN` (never a function-call default), `NOT VALID` + `VALIDATE` for every new
constraint including `NOT NULL`, always `CONCURRENTLY` for new indexes, and treat any type change or
rename on a table current code touches as an expand/contract job, not a single statement.
**Cost:** more migration files and more calendar steps for what used to be a one-liner.
**When the extra care is genuinely unnecessary:** a table that is empty or has no production consumers
yet (a brand-new feature table). Solen's own `pg_ha_migrations`-style Braintree philosophy converges
here: full caution is proportional to whether the table already has rows and readers, not to table size
alone.

---

## 4. Backfills: batched, resumable, idempotent, throttled

**The question:** once the schema has the new shape (the expand phase), how do you populate it for
existing rows without an `ACCESS EXCLUSIVE`-scale operation, and without a single giant transaction
that either takes forever or dies halfway and leaves things in an unknown state?

**What the evidence says:**

Stripe's own account of migrating "hundreds of millions" of Subscriptions objects uses a four-phase
dual-write pattern (T2, [stripe.com/blog/online-migrations](https://stripe.com/blog/online-migrations)):
dual-write to old and new tables to keep them in sync, backfill existing rows offline (Stripe
specifically ran this via a Hadoop/MapReduce job against a database snapshot, explicitly to avoid
hitting the production database directly), verify via a comparison library (GitHub's Scientist,
"run experiments that read from both tables and compare the results... Scientist experiments alerted
us as soon as a single piece of data was inconsistent in production"), then cut reads/writes over and
clean up the old path "in a lazy fashion."

GitLab's batched background migrations run the backfill as its own job system entirely separate from
the deploy-time migration, explicitly because "a long `UPDATE` there blocks the pipeline, risks a
statement timeout, and holds locks for the entire duration," whereas "a queued job runs on your own
schedule, survives worker restarts, can be throttled and monitored, and can be re-run safely if it
fails." Their two governing rules: "jobs must be safe to run multiple times" (idempotent) and batch
size is dynamically tuned based on an "exponential moving average of time efficiencies for the last N
jobs" (throttled, adaptively). (T2,
[docs.gitlab.com/development/database/batched_background_migrations](https://docs.gitlab.com/development/database/batched_background_migrations/))

The concrete mechanics for making a batch idempotent and resumable, converging across multiple
independent write-ups (T3, several blog sources but the same mechanism repeats):
- page by primary key ("chunk by id"), not by offset, so the scan stays correct even as rows are
  updated mid-run
- filter to only rows still needing work (a `WHERE new_column IS NULL` or equivalent), which makes a
  re-run after a crash pick up exactly where it left off and skip already-done rows
- use `INSERT ... ON CONFLICT DO UPDATE` / upsert semantics so a re-run corrects rather than duplicates
- a small sleep between batches to bound replication lag and I/O pressure on a shared database

**Where the real tradeoff lies:** all of this machinery (a job queue, adaptive batch sizing, an offline
snapshot pipeline, an automated comparison harness) is solving a problem that only exists at a certain
row count and request volume: when a single-transaction backfill would itself take long enough to hold
a lock past what the app can tolerate, or long enough that a deploy window closes before it finishes.
Below that threshold, the "backfill" is just an `UPDATE` statement that finishes in milliseconds and
the entire batching apparatus is pure overhead.

**Recommended default for Solen:** at current scale (146 tables, 28 salons, correspondingly small row
counts per table by industry standards), a backfill written as a single idempotent `UPDATE ... WHERE
column IS NULL` (or an `INSERT ... ON CONFLICT DO NOTHING` for a new derived table) inside the
migration itself, exactly like Solen's existing `20260707210517_loyalty_seed_migrate_A_to_B_cards.sql`
migration, is the correct level of engineering. That file already has the two properties that matter
most: it is idempotent (`where not exists (...)` guards against double-insertion on re-run) and it
completes fast because the source tables are small.
**Cost of NOT batching:** a single `UPDATE` across a genuinely large table (this is not yet true for
any Solen table, but would become true well before "28 salons" if e.g. a booking or notification-log
table grew into the tens of millions of rows) would hold whatever lock its operation implies for the
full duration, which for `ACCESS EXCLUSIVE`-requiring operations (like a bare `ADD CONSTRAINT ... CHECK`
without `NOT VALID`) becomes a real outage risk. **The trigger to move to batching**: when you can
measure (not guess) that a single-transaction version of the backfill would run for more than roughly
a few seconds against production data, or when it targets a table serving live read/write traffic
during business hours. Below that, batching adds code and failure modes without buying anything.

---

## 5. Seeding

**The question:** how should one-time or environment-specific reference/seed data (categories,
platform settings, discovery boards, rollout city lists) be inserted, and how does that differ from a
migration and from a per-developer test-data fixture?

**What the evidence says:** there is no single canonical standard here (no RFC, no vendor doc squarely
owns this), so this section is tiered T3/CONV, a converged practitioner consensus rather than an
authority. The repeated shape across independent write-ups:

- migrations are structural and strictly ordered; seeds insert or update rows and "should be idempotent
  and can run at any time after migrations." Mixing the two ("a migration that smuggles in test rows or
  a seed that alters columns") "will eventually fail a deploy in a way that is miserable to trace."
- separate reference data (categories, config, anything the running application depends on to function
  correctly in every environment including production) from test/development data (fixtures, demo
  salons, fake bookings). Reference data seeds run everywhere; test data seeds run only in dev/CI/staging.
- "a good seed script is idempotent, running it twice leaves the database in the same state as running
  it once," via `ON CONFLICT DO NOTHING` or an upsert.

**Solen's actual current practice, observed directly in the repo:** Solen already does this correctly
in spirit but blurs the migration/seed line in naming: files like
`20260602090000_seed_platform_settings_and_warnings.sql`, `20260530_seed_salon_amenities.sql`, and
`20260703130000_seed_rollout_cities_a5.sql` are reference-data seeds that live as ordinary numbered
migration files (not a separate seed mechanism), and Solen also has explicit test/demo seeding as API
routes (`app/api/admin/seed-test-salons`, `app/api/admin/test-salon/seed`) rather than SQL files, which
correctly keeps test-salon creation out of the production migration path.

**Where the real tradeoff lies:** a dedicated seed system (a `supabase/seed.sql` run only in local
dev, distinct from `supabase/migrations/`) buys a clean separation between "structure, applied once,
in order, everywhere" and "data, potentially re-run, potentially environment-specific." The cost is one
more concept and one more file location to remember, for a team small enough that everyone already
knows which migrations are secretly seeds.

**Recommended default for Solen:** keep reference-data seeds as migration files (current practice is
fine, do not introduce a parallel seed mechanism for reference data given the low file count and small
team), but enforce idempotency (`insert ... on conflict do nothing` / `where not exists`) on every one
of them, and keep test/demo data strictly in the existing `/api/admin/*seed*` routes, never as a
`supabase/migrations/*.sql` file. **Cost of not enforcing idempotency on a reference seed:** a seed
migration is, in Solen's model, applied exactly once and recorded in
`supabase_migrations.schema_migrations`, so accidental double-application is unlikely in the normal
apply path; the real risk is a manually re-run seed during an incident or a local-dev `db reset` replay,
where non-idempotent seeds throw a duplicate-key error and block the reset entirely. Cheap to add,
expensive to debug later.

---

## 6. Rollback plans (and why "just run the down migration" is usually a lie)

**The question:** when a migration turns out to be wrong after it has run in production, what actually
happens if you try to revert it, and what should the real incident-response plan be instead?

**What the evidence says:** covered in depth in section 1, restated here as the operational plan.

The core mechanical problem, stated plainly by the antman-does-software source: a down migration
"creates a significant problem: your migration history no longer makes sense," and worse, "rolling
back means that new data has nowhere to go" once "users interact very fast with your database after
deploy." A `down` that drops a column silently discards every value written to that column since the
`up` ran; a `down` that widens a type back down can truncate or reject data that only fits the wider
type; a `down` that removes a `NOT NULL` constraint doesn't undo the rows that already got backfilled
to satisfy it. None of these are hypothetical, they are the direct, mechanical consequence of the
migration having done its job in the interim.

Braintree's production tooling encodes the practical answer directly: no rollback support at all,
"only an `up` method," on the stated belief that this is "the only safe approach in production
environments" (T2, cited in section 1). Supabase's own CLI-generated down migrations carry an explicit
"review carefully, usually destructive" warning rather than a "safe to run" claim (T1, cited in section 1).

**Where the real tradeoff lies:** the appeal of a down migration is purely psychological, a single
command that promises "undo the last thing." That promise is genuine and safe in exactly one
environment: a database with zero concurrent production traffic between the up and the attempted down
(local dev, a CI throwaway database). It is false in every environment where real users kept writing
during the window, which describes production by definition.

**The actual rollback plan, in order of preference:**
1. **Forward fix.** Write a new migration that corrects the mistake (re-add the dropped column with a
   backfill from wherever the data can still be recovered, drop the bad constraint, fix the bad type).
   This is almost always possible because Postgres DDL is itself just more SQL; "rollback" is really
   "another forward change."
2. **Point-in-time restore / backup restore**, only for a genuine catastrophe (data corrupted or lost
   in a way no forward fix can reconstruct). This is a full-database operation with real cost (any
   writes since the restore point are lost for every table, not just the one you meant to fix), so it
   is a last resort, not a routine tool. UNVERIFIED: Solen's exact current Supabase tier and its
   specific PITR retention window were not confirmed from a fetched source this run; see "Unverified."
3. **Never** a mechanical `down` migration against production once the `up` has been live for any
   meaningful period. If a down migration exists in a file for documentation purposes, treat running it
   against production as equivalent in risk to writing a brand-new destructive migration by hand, because
   that is what it actually is.

**Recommended default for Solen:** this is already the practice implied by `_rules/DB_SCHEMA.md`
section 7 (`apply_migration` has no down path, and the documented recipe for a wrong migration is "add
a new migration," never "roll one back"). Make it explicit for any new contributor: there is no
`supabase db rollback` step in Solen's flow, and there should not be one added. **Cost:** a wrong
migration takes a bit more thought to fix forward than a naive "revert" would (you have to reason about
what already happened to the data), but that thought is unavoidable regardless, a mechanical revert
would have hidden the reasoning, not removed the need for it.

---

## Decision candidates

| Axis | Options | When each wins | Recommended for Solen | Tier |
|---|---|---|---|---|
| Down migrations | write+maintain paired down files vs. forward-only | down files only pay off in a zero-concurrent-traffic dev/CI reset loop | forward-only in production; local `supabase db reset` replays ups from zero, no down files needed | T2 |
| Schema change and code deploy | single combined deploy vs. expand/migrate/contract across releases | combined deploy is fine for additive changes nothing depends on yet; expand/contract required whenever live code reads/writes the changed shape | expand/contract for renames/type changes/removals on tables current code touches; single-step for genuinely new, unconsumed columns | T1 |
| New constraint on a live table | plain `ADD CONSTRAINT` vs. `NOT VALID` + separate `VALIDATE CONSTRAINT` | plain form fine only on empty/new tables | always `NOT VALID` + `VALIDATE` on any table with existing rows | T1 |
| New index on a live table | `CREATE INDEX` vs. `CREATE INDEX CONCURRENTLY` | plain form fine only on empty/new tables or inside a transaction that requires it | always `CONCURRENTLY` on tables with rows/traffic | T1 |
| Backfill execution | single in-migration statement vs. batched/throttled background job | single statement fine below "a few seconds" run time and outside an `ACCESS EXCLUSIVE`-holding operation; batching needed once a table is large enough that a single pass risks a long lock or timeout | single idempotent statement in the migration, matching current practice, until a specific table's row count makes that measurably slow | T2 (GitLab/Stripe evidence) but T3 on the exact size threshold, that must be measured on Solen's own data, not assumed |
| Seed data location | dedicated `seed.sql` mechanism vs. reference-data seeds as ordinary migrations | dedicated mechanism earns its keep once the team is large enough or the seed/migration distinction gets confused often | keep current practice (reference seeds as migrations, test seeds as `/api/admin` routes), enforce idempotency on both | T3/CONV |
| Rollback on a bad migration | mechanical down migration vs. forward-fix vs. full restore | mechanical down only ever safe pre-traffic; forward-fix is the default; full restore only for unrecoverable corruption | forward-fix by default, restore only as last resort, no down migrations in the production path | T2 |
| Recovering a schema-cache mismatch (added/renamed a table or column) | wait for automatic pickup vs. explicit `NOTIFY pgrst, 'reload schema'` vs. verify-then-move-on | needed any time DDL changes what PostgREST exposes | explicitly verify via a live API call after every schema-shape-changing migration; do not assume the cache updated | T1/T2 |

---

## Myths and traps

- **MYTH: "A migration that runs successfully means the feature works."** This is Solen's own
  documented #1 failure mode (silent no-ops) applied to schema changes specifically. A migration
  can apply cleanly and PostgREST can still return `PGRST204`/`PGRST205`-class errors ("column not
  found in schema cache") for the exact column that migration just added, until the PostgREST schema
  cache is refreshed. The refresh mechanism is `NOTIFY pgrst, 'reload schema';`, and PostgREST
  explicitly **debounces** rapid successive reload notifications within roughly a 100ms window rather
  than reloading on every single one (T1/T2,
  [docs.postgrest.org/en/latest/references/schema_cache.html](https://docs.postgrest.org/en/latest/references/schema_cache.html),
  [supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema)).
  UNVERIFIED: whether Solen's specific apply path (Supabase MCP `apply_migration`) always triggers this
  reload automatically on the hosted platform, or whether it can be needed manually, was not confirmed
  from a fetched source this run (the fetched Supabase troubleshooting page only documents the manual
  command, it does not state whether hosted projects auto-reload on every DDL statement). **Practical
  rule regardless of the answer: after any migration that changes what the API surface exposes, verify
  with a real request through the app/API, never trust the migration's own success as proof.**
- **MYTH: "Down migrations are a safety net."** They are a safety net only in an environment with zero
  concurrent writes between up and down, which production is not, by definition, past the moment it
  goes live. See section 6.
- **TRAP, specific to Solen's serverless/Netlify model:** Netlify functions are stateless and can be
  cold-started at any moment; there is no single long-lived process holding an in-memory schema cache
  the way a traditional long-running server would. This makes the PostgREST-side schema cache (not an
  app-side cache) the only place staleness can hide, reinforcing the point above: verify against the
  actual PostgREST/Supabase layer, not against "the app looks fine," because a freshly cold-started
  lambda calling a stale-cached PostgREST endpoint will fail in exactly the same way a warm one would.
- **TRAP, specific to Stripe Connect:** none of this file's migration guidance is about payments
  directly, but a migration that touches any table Stripe webhook handlers read or write
  (`bookings`, `salon_payouts`, `tips`, `processed_webhook_events`) inherits webhook idempotency risk
  if it is not itself idempotent: a webhook retry hitting a half-migrated table is a second, independent
  reason (beyond the migration's own correctness) that backfills touching these tables must be
  idempotent, not just correct.
- **TRAP, this project's #1 named failure mode, restated for migrations specifically:** a filter,
  RLS policy, or generated column added by a migration can look wired (the migration runs, the column
  exists in the live DB snapshot) and still not discriminate correctly, exactly like the `opening_hours`
  short/long day-name mismatch already documented in `_rules/LESSONS_LEARNED.md`. Prove a migration's
  new column/constraint actually behaves as intended (a bad row is actually rejected, a filter actually
  narrows results) with a real query, not just "the migration applied."
- **CONV, not a myth but worth flagging as a convention rather than a law:** "expand/contract across
  three releases" (GitLab's specific cadence) is a convention tuned to GitLab's release cadence and
  scale; the underlying two rules (never remove what's still depended on, never require what doesn't
  exist yet) are the actual law, the "three releases" number is not.

---

## Premature at our scale

Correct-at-scale advice that Solen should explicitly NOT adopt yet, each with the trigger that would
change the call:

- **A dedicated background-job system for batched migrations (GitLab's Sidekiq-based batched
  background migrations, with adaptive batch-size tuning via exponential moving averages).** This
  solves "a single-transaction backfill takes too long or holds a lock too long," a problem Solen does
  not currently have at its table sizes. **Trigger to revisit:** the first time a genuinely needed
  backfill, measured, would take more than a few seconds as a single statement against live production
  data, or the first table that grows into the range where a full-table scan itself becomes slow
  regardless of locking.
- **An offline snapshot-based backfill pipeline (Stripe's Hadoop/MapReduce approach, reading from a
  database snapshot instead of production directly).** This exists to protect a production database
  from the read load of computing a migration plan across hundreds of millions of rows. At Solen's
  scale, a plain `SELECT` against production to compute which rows need backfilling is not a
  meaningful load. **Trigger:** if a backfill's own read-side query starts measurably affecting
  production latency for real users.
- **A dual-write-plus-automated-comparison harness (Stripe's use of GitHub's Scientist library) for
  every data migration.** This is warranted when the cost of an undetected data mismatch is very high
  and the data volume makes manual spot-checking infeasible. For Solen's current volumes, a manual
  spot-check query (compare counts/samples between old and new representations before the contract
  phase) gets most of the same confidence for a fraction of the engineering cost. **Trigger:** once a
  migrated dataset is large enough, or business-critical enough (money-adjacent), that a manual
  spot-check genuinely cannot give confidence a human can act on.
- **A formal event-trigger-based auto-reload system for the PostgREST schema cache**, built and
  maintained in-house. Hosted Supabase's behavior here was not fully verified this run (see
  Unverified), but building custom DDL event triggers to guarantee cache freshness is a level of
  engineering that assumes a much higher migration frequency and lower tolerance for a manual
  `NOTIFY` than Solen currently has. **Trigger:** if manual verification after schema changes starts
  measurably slowing down the team's shipping cadence, not before.
- **Blue-green or shadow-database schema swaps** (an entire second copy of the database kept in sync
  and swapped atomically). This is warranted at a scale where even a few seconds of lock contention on
  the primary is unacceptable. Solen's traffic and table sizes do not justify the operational
  complexity and cost of maintaining a second live database copy. **Trigger:** sustained production
  traffic where even brief, well-managed locks (from `NOT VALID`/`VALIDATE`, `CONCURRENTLY`) start
  causing user-visible latency.

---

## Unverified

- Solen's exact current Supabase project tier and its specific point-in-time-recovery (PITR) retention
  window (how far back a restore can go) were not confirmed from a fetched source this run. This
  matters directly for section 6's "restore from backup" fallback plan: the plan is only as good as
  the actual retention window, which should be checked in the Supabase project dashboard or via the
  MCP `get_project`/`get_cost` tools, not assumed from a generic tier name.
- Whether hosted Supabase automatically reloads the PostgREST schema cache after every DDL statement
  applied through the Supabase MCP `apply_migration` tool specifically (as opposed to needing a manual
  `NOTIFY pgrst, 'reload schema'`) was not confirmed from a fetched source. The fetched Supabase
  troubleshooting page documents only the manual command; it does not state the automatic behavior on
  the hosted platform's standard configuration.
- The specific Postgres version number at which the "non-volatile `ADD COLUMN` default does not
  rewrite the table" optimization first shipped (commonly cited elsewhere as Postgres 11) was not
  present in the exact fetched text of the current `sql-altertable.html` page (which only describes
  current behavior, not its version history). Treat "Postgres 11+" as directionally likely but
  unconfirmed by a fetched primary source this run.
- No formal, single canonical standard for "seed data vs. migration" separation was found (unlike, say,
  an RFC or NIST-grade document for other topics); section 5's guidance is a converged practitioner
  consensus (T3/CONV), not a T1 standard, and should be read with that weaker confidence.

---

## Sources

All fetched this run (2026-07-16):

1. [postgresql.org/docs/current/sql-altertable.html](https://www.postgresql.org/docs/current/sql-altertable.html), current official ALTER TABLE docs: lock levels and rewrite behavior for ADD COLUMN with default, ALTER COLUMN TYPE, ADD CONSTRAINT, VALIDATE CONSTRAINT, SET NOT NULL.
2. [postgresql.org/docs/current/sql-createindex.html](https://www.postgresql.org/docs/current/sql-createindex.html), current official CREATE INDEX docs: CONCURRENTLY's lock behavior, two-scan cost, transaction-block restriction, INVALID-index failure mode and recovery.
3. [postgresql.org/docs/current/explicit-locking.html](https://www.postgresql.org/docs/current/explicit-locking.html), current official lock-modes reference: the full ACCESS SHARE through ACCESS EXCLUSIVE table with conflicts and typical acquiring commands.
4. [martinfowler.com/bliki/ParallelChange.html](https://martinfowler.com/bliki/ParallelChange.html), the canonical primary source for the expand/migrate/contract (Parallel Change) pattern, its two governing rules, and the contract-phase-discipline caveat.
5. [docs.gitlab.com/development/database/avoiding_downtime_in_migrations](https://docs.gitlab.com/development/database/avoiding_downtime_in_migrations/), GitLab's production zero-downtime Postgres migration rules: column drop/rename/type-change multi-release recipes, NOT NULL-via-post-deployment-migration rule.
6. [docs.gitlab.com/development/database/batched_background_migrations](https://docs.gitlab.com/development/database/batched_background_migrations/) (via search synthesis, cross-checked against the avoiding-downtime page), GitLab's batched background migration system: idempotency requirement, adaptive batch sizing.
7. [stripe.com/blog/online-migrations](https://stripe.com/blog/online-migrations), Stripe's own account of a large-scale production data migration: dual-write, offline MapReduce backfill, Scientist-based verification, lazy cleanup.
8. [gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts), operational mitigations: lock_timeout as a deploy-abort mechanism, log_lock_waits/log_min_duration_statement monitoring.
9. [supabase.com/docs/guides/deployment/database-migrations](https://supabase.com/docs/guides/deployment/database-migrations), Supabase's own official migration workflow docs: file structure, db push, the "never edit the remote directly" rule, and the destructive-down-migration warning.
10. [antman-does-software.com/why-you-will-never-write-another-down-migration](https://antman-does-software.com/why-you-will-never-write-another-down-migration), independent second source converging with Spatie/Braintree on forward-only practice and the "restore from backup for disasters" fallback.
11. [freek.dev/2900-why-i-dont-use-down-migrations](https://freek.dev/2900-why-i-dont-use-down-migrations), Spatie's stated production practice: never roll back, always roll forward with a hand-crafted new migration.
12. [github.com/braintree/pg_ha_migrations](https://github.com/braintree/pg_ha_migrations), Braintree's (a payments company, relevant analog to Solen's Stripe-Connect model) production migration tool: up-only migrations, table-size/emptiness guards, concurrent-index enforcement.
13. [pglocks.org](https://pglocks.org/), interactive Postgres lock-conflict reference, cross-checked against the official docs for CREATE INDEX CONCURRENTLY's brief final ACCESS EXCLUSIVE step.
14. [docs.postgrest.org/en/latest/references/schema_cache.html](https://docs.postgrest.org/en/latest/references/schema_cache.html), PostgREST's own schema-cache docs: manual NOTIFY reload mechanism, the ~100ms debounce window for rapid successive reload notifications.
15. [supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema), Supabase's troubleshooting page for the manual schema-cache reload command; confirmed it does not state hosted-platform automatic-reload behavior (see Unverified).

Grounding read (not web-fetched, local repo files read for Solen-fit context): `_rules/DB_SCHEMA.md`
section 7 (existing apply_migration law), `supabase/migrations/20260707210517_loyalty_seed_migrate_A_to_B_cards.sql`
(existing idempotent in-migration backfill example), a repo grep confirming `CONCURRENTLY` and
`NOT VALID` each appear in exactly one of Solen's 264 migration files today, and zero appearances of
`lock_timeout`/`statement_timeout`.
