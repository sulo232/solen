# Solen backend ops runbook (Ring 6 of the backend improvement loop, 2026-07-11)

One page: how the backend is monitored, backed up, restored, and what it costs. Refresh the cost + size numbers monthly (the loop protocol's monthly re-measure).

## Monitoring (built in Ring 1, 2026-07-11)
- Every cron logs {ok, processed, duration_ms, errors} to the `cron_runs` table (live). A failing cron turns the GitHub Actions run RED (ping-cron hard-asserts ok:true) and GitHub emails the owner.
- Backend errors on money/cron/webhook paths email ADMIN_EMAIL via `lib/error-report.ts` (throttled per scope, 15 min).
- `/api/health` probes DB + Redis + env and returns 200/503 with per-dep JSON. FOLLOW-UP: add one retry to the db probe (a single 2s timeout blip produced a false 503 on dev 2026-07-11); do before wiring an external uptime monitor.
- OWNER (one-time, ~5 min): point a free uptime monitor (e.g. UptimeRobot) at https://solen.ch/api/health and alert on 503 or timeout. Not agent-doable (account signup).
- Founder daily digest email lands 05:15 UTC daily (yesterday's bookings, cron failures from cron_runs, pending reviews).

## Backups + disaster recovery
- Project: Supabase `solen` (ref tocfnsmxmdxkrcmjzzdw), region eu-west-2, Postgres 17.6, status ACTIVE_HEALTHY (verified 2026-07-11 via get_project).
- OWNER (one-time check): Supabase dashboard -> Settings -> Database -> Backups. On the Pro plan you have daily backups (7-day window); PITR (point-in-time recovery) is a paid add-on. Record here which is on. If on the free plan: NO automatic backups exist , upgrading or a scheduled pg_dump is strongly recommended before real revenue.
- Schema reproducibility: RESTORED 2026-07-11 (Ring 11) , all 260 applied migrations now have committed .sql files under supabase/migrations/ (59 were backfilled from supabase_migrations.schema_migrations; recipe documented in _rules/DB_SCHEMA.md section 7). A fresh environment can now be provisioned from files.
- Restore procedure (data): 1. Supabase dashboard -> Backups -> restore to a NEW project (never in place first). 2. Point a staging env at it, verify with `npm run smoke` (10 live shape checks). 3. Only then repoint prod env vars. RPO = backup cadence (daily on Pro, or PITR window); RTO ~ 1-2h (restore + env repoint + owner `sync`).
- Law reminder: the LIVE DB is canonical; never `supabase db push`/`reset`; additive idempotent apply_migration only, then backfill the file per the recipe.
- **VERIFIED 2026-07-11: pitr_enabled=false and the platform backups list is EMPTY** on the live Supabase project. Until the owner turns on a Pro-plan backup or PITR (see the OWNER line above), the in-house nightly export below is the ONLY restorable backup this project has.
- **In-house nightly data safety net (Ring 6, added 2026-07-11):** `/api/cron/db-backup` (`app/api/cron/db-backup/route.ts`, core logic in `lib/backup/export.ts`) runs daily 03:45 UTC via `.github/workflows/cron-jobs.yml`. It exports the 24 business-critical tables (salons, profiles, bookings, services, staff_members, staff_services, staff_schedules, reviews, review_replies, salon_payouts, promo_codes, referrals, user_credits, credit_redemptions, vouchers, voucher_purchases, gift_cards, loyalty_cards, loyalty_stamps, loyalty_status, salon_clients, feature_flags, cities, service_categories) as one JSON array per table to the PRIVATE `db-backups` storage bucket, at `backups/<YYYY-MM-DD>/<table>.json`. NOT `availability_slots` (regenerable via `generate-slots`) and NOT `discovery_items` (media-heavy + regenerable from its own source feeds). Retention: after a fully clean run, date-folders older than 14 days are deleted. This is a DATA safety net only, not schema: schema comes from `supabase/migrations/`.
- **Restore procedure (in-house backup):**
  1. Download the folder for the date you want to restore from: Supabase dashboard -> Storage -> `db-backups` -> `backups/<YYYY-MM-DD>/` -> download each `<table>.json`, or pull them via the admin client / Storage API with the service-role key (the bucket has no public policies, service-role only).
  2. Provision the target DB's schema first (fresh env: apply every file under `supabase/migrations/`, see the reproducibility note above; existing env: schema is already current).
  3. Restore rows table by table, upserting (`on conflict (id) do update` / the Supabase client `.upsert()`) rather than a plain insert, so a partial/retried restore is idempotent.
  4. **FK order matters.** Restore in FK-dependency order, derived directly from this schema's foreign keys (checkable via each table's `Relationships` array in `lib/database.types.ts`, or `supabase/migrations/20260326000000_multi_city.sql:32` for `salons.city_id`) , NOT from `app/api/cron/process-deletions/route.ts` (that file's `TABLES_CLEARED` is a GDPR-anonymization order covering only ~8 of these 24 tables, not an insert-safe topological order for the full backup set). Correct order: `cities` and `service_categories` first (no FK to any other backup table; `service_categories.parent_id` self-references, so insert rows with a null `parent_id` before their children), then `profiles` (no FK to any other backup table), then `salons` (`city_id` -> `cities` is a non-deferrable FK and every live salon row has a non-null `city_id`, so `cities` and `profiles` must land first; `owner_id`/`approved_by` -> `profiles`), then `services` and `staff_members` (both -> `salons`), then `staff_services` (-> `staff_members`, `services`) and `staff_schedules` (-> `salons`, `staff_members`), then `bookings` (-> `salons`, `services`, `staff_members`, `profiles`), then the tables keyed off `bookings`/`profiles`/`salons` with no cross-deps among themselves: `promo_codes`, `user_credits`, `loyalty_cards`, `referrals`, `loyalty_status`, `gift_cards`, `vouchers`, `salon_clients`, `feature_flags`, `salon_payouts`, then last their own children: `reviews` (-> `bookings`/`salons`/`staff_members`/`profiles`), `review_replies` (-> `reviews`), `credit_redemptions` (-> `bookings`, `user_credits`), `voucher_purchases` (-> `promo_codes`), `loyalty_stamps` (-> `bookings`, `loyalty_cards`). When in doubt about a specific column's FK target, check `_rules/DB_SCHEMA.md` or the live snapshot, not memory.
  5. Verify with `npm run smoke` before repointing anything live.
  6. Kill-test / dry-run harness: `npx tsx scripts/db-backup-kill-test.ts` exercises the export function end to end against a throwaway `backups-test/` prefix and proves 0 leftovers; it does not restore, it proves the export path itself is sound.

## Data retention (Swiss nFADP notes)
- search_events: query/session/user_id anonymized after 90 days (pg_cron job `search-events-retention`, live).
- GDPR account deletion: /api/cron/process-deletions handles the full 19-FK set (fixed 2026-07-03, batched Ring 3a).
- cron_runs (new table): grows ~30 rows/day. FOLLOW-UP: add a 90-day purge clause to one of the pg_cron jobs when it passes ~10k rows.
- audit_log: 59 rows today, money-path only , fine; revisit at 50k rows.
- PII in logs: OTPs no longer logged (2026-07-10 sweep); console.error carries ids not PII by convention , keep it that way.

## Cost snapshot (2026-07-11; owner fills the CHF numbers monthly from each dashboard)
| service | plan / usage note | monthly cost |
|---|---|---|
| Supabase | project eu-west-2, DB 76 MB -> a few MB after slot purge; well inside any tier | OWNER |
| Netlify | one site, builds on owner `sync` | OWNER |
| Upstash Redis | rate-limit counters only, tiny | OWNER (likely free tier) |
| Resend | booking/cron emails + new daily digest (+1/day) | OWNER |
| GitHub Actions | cron pings every 15 min ~ 3k min/month , inside the free 2k? CHECK: public repos free, private = 2,000 free min; the ping job is ~30s so ~1,500 min/month, close to the cap , consider */30 for the 15-min jobs if billed | OWNER |
| Stripe | per-transaction only | n/a |

## Open owner decisions (carried from the loop)
1. Netlify env presence check (UPSTASH_*, CRON_SECRET, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, ADMIN_EMAIL) , if UPSTASH is missing, prod rate limits are OFF today (they will fail closed on abuse-prone routes only after the next `sync`).
2. Netlify runtime for `runtime="edge"` routes (functions tab / build log) , decides the Stripe-on-edge cleanup.
3. Slot purge: the RPC `purge_past_available_slots(p_days, p_limit)` exists live and is scheduled by nothing; 156,296 dead past rows (95% of the table). Decision = schedule it weekly (pg_cron or a GH-cron route). Recommendation: yes.
4. Voucher/credits seam: 4 atomic RPCs (redeem_voucher, redeem_user_credits, restore_voucher, restore_user_credits) are built + live but wired to NOTHING; user credits can be earned but never spent. Decide: build the spend path (wire the RPCs into checkout + refund restore) or drop the RPCs and hide credit earn. Recommendation: build the spend path when vouchers/credits get prioritized; the RPCs are correct and ready.
5. Deployed edge functions: 6 dead functions still deployed on Supabase (410-neutered; sources deleted from the repo). Delete via `supabase functions delete <name>` when convenient.
6. vouchers/confirm route: 0 live callers, webhook owns finalization , retire to a 410 stub or keep gated (memo in _plans/WEBHOOK_RESILIENCE.md).
7. Sentry: parked owner option; email alerting shipped instead.

## Security maintenance (the only security note in this campaign)
The 2026-07 security campaign (141 findings + 16 sweep rings) is closed and structurally guarded (hooks, shared constants, DB triggers/indexes). Standing rules: run get_advisors after any schema change; keep the no-getsession gate wired; no new sweeps scheduled , next security look only on a real trigger (new payment flow, new auth surface, or an incident).
