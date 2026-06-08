# Migration Rebaseline + CI — "Never Drift Again"

_Created 2026-05-30. Companion to `_tasks/SCHEMA_DRIFT_AUDIT.md`._

## The problem (confirmed via `supabase db push --dry-run`)
Your local migration files and the remote DB's migration history have **diverged** —
not just "remote is behind":
- Remote `schema_migrations` has **42 versions** (14-digit timestamps like `20260309115410`)
  that **don't exist** in `supabase/migrations/`.
- Local repo has **141 files** using different naming (`068_…`, `20260328_…`).
- So `db push` is a dead end — it would try to re-apply migrations whose objects already
  exist on the remote → "already exists" conflicts.

Two phases below: **Phase A reconciles once; Phase B stops it ever recurring.**

---

## Phase A — One-time rebaseline (you run these; back up FIRST)
Goal: make local files + remote history agree on ONE clean baseline = your *actual current* schema.

```bash
cd /Users/sulo/Documents/solen
mkdir -p _backups

# 1. BACK UP (non-negotiable — this is reversible insurance)
supabase db dump --linked -f _backups/schema_$(date +%Y%m%d).sql              # schema
supabase db dump --linked --data-only -f _backups/data_$(date +%Y%m%d).sql    # data

# 2. Archive the old divergent migrations (keeps the SQL, clears the mess)
mkdir -p supabase/migrations_archive
git mv supabase/migrations/*.sql supabase/migrations_archive/

# 3. Capture the REAL remote schema as the new single baseline
supabase db pull baseline        # writes supabase/migrations/<ts>_baseline.sql from the live schema

# 4. Reconcile the history table so remote == just the baseline
#    Mark the 42 stale remote versions as reverted (full list is in the dry-run output):
supabase migration repair --status reverted 20260309115410 20260309130515 20260309131019 \
  20260309142230 20260309215619 20260310083825 20260310184604 20260310191155 20260312192841 \
  20260313204941 20260315215731 20260315215753 20260315215808 20260315215823 20260315215842 \
  20260315215901 20260316165434 20260316171144 20260316175022 20260316180029 20260316181056 \
  20260319233948 20260323212447 20260323212450 20260323212454 20260323212535 20260323212623 \
  20260328154211 20260329183130 20260330222502 20260330222508 20260510221737 20260510231255 \
  20260510231300 20260510231311 20260510231315 20260510235417 20260511073355 20260511074357 \
  20260511092905 20260516081405 20260528090650
#    Then mark the new baseline as applied (use the <ts> from step 3):
supabase migration repair --status applied <baseline-version>

# 5. Verify they finally agree
supabase migration list --linked   # local and remote should now match (just the baseline)
```

After this: **local files = remote schema = remote history.** Clean slate.
The archived migrations preserve the SQL for any not-yet-built feature tables
(barber/makeup/loyalty/vouchers/etc.) — re-introduce them as fresh migrations when
those features are actually built.

> ⚠️ Note: today's quick MCP patches (`staff_services`, `service_addons`, the 2 columns,
> staff ratings) are in the live schema, so `db pull` in step 3 captures them into the
> baseline automatically — no extra work.

---

## Phase B — CI auto-apply (the actual "never again")
Make every deploy apply pending migrations automatically, so code + schema ship together
and can never drift apart again.

`.github/workflows/db-migrate.yml`:
```yaml
name: Apply DB migrations
on:
  push:
    branches: [main]
    paths: ['supabase/migrations/**']
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase link --project-ref tocfnsmxmdxkrcmjzzdw
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```
Set two repo secrets (GitHub → Settings → Secrets and variables → Actions):
`SUPABASE_ACCESS_TOKEN` (from `supabase login` / dashboard) and `SUPABASE_DB_PASSWORD`.
After this, **you never apply migrations by hand again** — and prod schema can't fall behind code.

---

## Going-forward rules (the discipline that keeps it clean)
1. **Every schema change = a migration:** `supabase migration new <name>` → edit → commit.
   **Never** ad-hoc SQL or MCP patches on prod (that's literally how this drift started).
2. **`db push` only — never `db reset`** on the live DB. Reset wipes; it's dev-only, forever.
3. **Test risky migrations on a Supabase preview branch** before they hit `main`.
4. **One naming scheme** — the timestamped one `supabase migration new` generates. No more `068_…`.
```
