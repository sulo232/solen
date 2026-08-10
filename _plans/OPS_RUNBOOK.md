# Solen backend ops runbook (Ring 6 of the backend improvement loop, 2026-07-11)

One page: how the backend is monitored, backed up, restored, and what it costs. Refresh the cost + size numbers monthly (the loop protocol's monthly re-measure).

## Incident response (owner ask 2026-07-27: "9 yr we need whole principle for that")

Closes `observability-9`, the last BLOCKED line in `_plans/PRINCIPLES_LOOP.md`. It lives here,
not in a new file, because this runbook is what you already open when something is wrong.
Research and sources: `_design-system/research/owner-answers-2026-07-27/incident-principle.md`.

### The principle

> When something is broken in production you are doing two jobs, and only one at a time:
> **deciding** (what severity, what do I press) and **doing** (typing the fix). Stop the
> bleeding before you understand it. Write down what happened while it is happening, not
> after. Anything that reached a customer, cost money, or that you learned about from a human
> instead of from the digest gets one page written within 48 hours, and every action item in
> it carries a name and a date.

Role separation matters even at n=1: the reason Google SRE splits incident commander from
ops lead is that the person with their hands in the code stops making good decisions about
scope. Alone, you do it in time slices, not in parallel. That is what "only one at a time"
means above.

### Severity, named against Solen's actual flows

**Rule zero, borrowed verbatim from PagerDuty because it is the one that saves the most time:
if you are unsure between two levels it is the higher one. Do not debate severity during an
incident.**

**SEV1 , money or data is wrong. Act now, whatever time it is.**
- A customer was charged and no booking exists, or a booking exists and no charge does.
  Signal: the `reconcile` cron mismatch email, or a repeating `stripe-webhook-signature` /
  `stripe-webhook-claim` alert from `app/api/stripe/webhook/route.ts:43,71`.
- Stripe webhook delivery failing more than about an hour. A rotated `STRIPE_WEBHOOK_SECRET`
  is the named cause.
- `/api/health` returning 503 on two consecutive 15-minute checks, or the DB unreachable.
- Any data loss or corruption, at any scale. One row counts.
- A walk-in customer paid and got no queue number. That person is physically standing in a shop.

**SEV2 , a core flow is broken, no money at risk, no workaround.**
- Booking creation failing (`app/api/bookings/route.ts`).
- Slots empty or wrong platform-wide (`app/api/slots/route.ts`, the `generate-slots` cron).
  This is the silent one: an empty slots response is indistinguishable from "fully booked".
- Login or signup broken. Site up but unusable.

**SEV3 , degraded, or a workaround exists.** One salon's data wrong, emails or SMS delayed,
a single missed cron, a page rendering badly. Handle in working hours. Gets a worklog line;
gets a postmortem only on the third recurrence.

### The 9pm ladder

Ordered so the first three steps need no diagnosis. Diagnosis is step 6.

```
1. WRITE THE CLOCK. Open a scratch file. First line: time + what you saw + how you found out.
   Keep appending. This becomes the postmortem.

2. SEVERITY. Money or data wrong = SEV1. Core flow dead with no workaround = SEV2. Else SEV3.
   Unsure = the higher one.

3. STOP THE BLEEDING, in this order. Do NOT diagnose first.
   a. Did you deploy in the last hour? Netlify -> Deploys -> last good -> Publish deploy.
      (_rules/RELEASE.md). Under a minute, no commit needed.
   b. Not a deploy? Kill the flow with a flag: /dashboard/feature-flags-admin
      payments | bookings | maintenance_mode. Live within 30s (lib/feature-flags.ts FLAG_TTL_MS).
      KNOW THIS: the flag read fails OPEN, so if Supabase is down the switch does nothing.
      KNOW THIS: maintenance_mode gates API mutations, not page rendering.
   c. NEVER disable the Stripe webhook ENDPOINT. If it is disabled when Stripe retries, those
      events are gone forever. Let it return 5xx; Stripe retries for 3 days.

4. SNAPSHOT BEFORE YOU CLEAN. Copy the request id, the Stripe event id, the error text.
   Netlify function logs age out in 24h to 7d.

5. CHECK IT STOPPED. /api/health, then the actual flow in a browser.

6. ONLY NOW diagnose.

7. MONEY CHECK before closing any SEV1: run reconcile, compare Stripe against the DB for the
   whole window, replay missed events with
   GET /v1/events?delivery_success=false&ending_before=<last good event id>  (30-day window).
   Handlers are idempotent via processed_webhook_events, so replay is safe.

8. Within 48h: _plans/POSTMORTEMS/YYYY-MM-DD-<slug>.md
```

Time to mitigate beats time to fix. Rolling back a deploy you do not yet understand is the
correct move, not a shortcut.

### When a postmortem is required

Any SEV1 or SEV2. Any data loss at any scale. Any incident that needed a rollback or a flag
flip. The third recurrence of the same SEV3. And, the one that matters most here: **any
incident you learned about from a human rather than from the digest, a red Actions run, or an
alert email** , that detection gap is itself the finding. Template and field list:
`_plans/POSTMORTEMS/_TEMPLATE.md`. Blameless: contributing causes are plural, and each one
explains what made the wrong thing look reasonable at the time.

### The honest gaps this principle does NOT close

Named so they read as decisions rather than omissions.

1. **Nothing pages.** Verified: no `ADMIN_PHONE`, no ntfy/Pushover/Telegram/PagerDuty
   anywhere; Sentry was removed on purpose. The fastest automated signal is a 15-minute health
   check that emails through GitHub; everything else waits for the 05:15 UTC digest. A SEV1
   that starts at 6pm Friday and does not take the site down is invisible until Saturday
   morning. **Recommendation: a free ntfy or Pushover topic wired as a second sink inside
   `lib/alert-admin.ts`, gated to SEV1-class scopes.** It is the only option buildable end to
   end without an account purchase, and it turns a 24h blind window into minutes.
2. **No customer communication path.** No status page, no salon broadcast, no template. The
   comms role has nothing to speak into.
3. **No Stripe replay script.** Step 7 is a hand-written curl at 9pm today.
4. **24h RPO, no PITR.** For a SEV1 data incident, "restore" means losing up to a day.
5. `app/api/bookings/route.ts` does not `reportError` on a booking-creation failure, only on
   the confirmation email, so a SEV2 booking outage surfaces only in the next morning's
   failure-rate SLI.

### Four decisions only the owner can make

1. **Does anything page you, and are you willing to be woken?** See recommendation above.
2. **When does the severity clock start?** Solen is pre-launch with seed data, so today
   nothing is genuinely SEV1: no real customer can be harmed. State a condition , "from the
   first real paid booking" is the natural one , after which these definitions bind. Without
   it this section is theatre from day one.
3. **The honest response-time floor.** "I respond to SEV1 within X" where X is a number you
   will actually hit alone. Everything downstream follows from it.
4. **Who tells the salons, through what channel?** Even a two-line WhatsApp template plus a
   rule about which severity triggers it would close the comms gap.

---

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
4. Voucher/credits seam (CORRECTED 2026-07-14): the credit RPCs are NOT unwired. `redeem_user_credits`/`restore_user_credits` were wired end to end on 2026-07-11 (commit `57f9f11ff`) into `app/api/stripe/booking-pay-intent/route.ts` (redeem on pay, restore on full refund / PI-shrink failure / payment_failed) with `FOR UPDATE` + a `UNIQUE(credit_id, booking_id)` idempotency constraint, so referral credits ARE earned AND spent today (gated on the live `credits` feature flag). The GIFT-VOUCHER spend half (`redeem_voucher`/`restore_voucher` + the `voucher_code` field) is built + flag-on but still has NO frontend entry point (`lib/validations.ts:161-166` accepts the field, no UI sends it), so only that half is dormant. Decision left: wire a voucher-code UI field into checkout, or leave the gift-voucher spend backend-only. (The earlier "wired to NOTHING / earned but never spent" wording was stale.)
5. Deployed edge functions: 6 dead functions still deployed on Supabase (410-neutered; sources deleted from the repo). Delete via `supabase functions delete <name>` when convenient.
6. vouchers/confirm route: 0 live callers, webhook owns finalization , retire to a 410 stub or keep gated (memo in _plans/WEBHOOK_RESILIENCE.md).
7. Sentry: parked owner option; email alerting shipped instead.

## Security maintenance (the only security note in this campaign)
The 2026-07 security campaign (141 findings + 16 sweep rings) is closed and structurally guarded (hooks, shared constants, DB triggers/indexes). Standing rules: run get_advisors after any schema change; keep the no-getsession gate wired; no new sweeps scheduled , next security look only on a real trigger (new payment flow, new auth surface, or an incident).


## What to add next (owner ask 2026-07-11, recommended order)
1. RECOMMENDED FIRST: free uptime monitor (UptimeRobot) on https://solen.ch/api/health , 5 min, alerts you when the site is down before customers notice. Only non-agent item (account signup).
2. One scripted E2E booking test in CI (search -> book -> pay test-mode -> cancel) , the highest-value missing test.
3. Playwright visual specs wired into CI (manual today; needs browser install + dev-server step in the workflow).
4. A staging site (second Netlify site on a branch) , changes get seen live before customers; would have caught the thumbnail outage class.
5. Sentry retry (parked option) , email alerts cover today; stack traces pay off as traffic grows.
6. Web-vitals real-user monitoring (PostHog supports it).
7. Watch-items: GitHub Actions minutes near the free cap (15-min cron cadence), tsc 4 -> 0, the typed-database adoption sprint.


## R-batch additions (owner "do all recommendations", 2026-07-11 PM)
- Uptime monitor: LIVE as a piggybacked step on the every-15-min Actions job (red run + GitHub email on a down site; 1 retry to skip blips; zero extra Actions minutes). UptimeRobot stays an optional nicer upgrade (owner account).
- Staging site (owner, ~10 min in the Netlify dashboard): Site settings -> Build & deploy -> Branch deploys -> add branch `staging` (or enable Deploy Previews for PRs). Then `git branch staging` in the repo; every change lands on staging.solen.netlify.app-style URL before main. No repo changes needed beyond the branch.
- Sentry: BLOCKED on two owner steps , a Sentry account/DSN, and a physical dependency install (node_modules is shared across worktrees; a lock-only install cannot execute code). Email alerting via lib/error-report.ts covers the need today. If wanted later: `npm i @sentry/nextjs`, set SENTRY_DSN, re-add the two config files (deleted 2026-07-11, see git history).
- Actions minutes: repo visibility unverifiable from the sandbox (TLS). If PRIVATE, note each scheduled job bills a rounded-up minute per run, so the current schedule is roughly 3,000+ min/month vs 2,000 free , check the Actions usage page; the right fix is merging ping jobs (as done for the uptime step), NOT slowing the booking timers.
- Typed-database adoption: EXPLICITLY PARKED as its own sprint (~2000 type errors when the generated types are applied to the clients; plan's DO-NOT-DO table). Not silently skipped.
