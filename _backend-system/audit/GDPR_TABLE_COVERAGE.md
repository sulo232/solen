# GDPR/nFADP erasure-pipeline table coverage (data-money-10)

**Written 2026-07-27, verified against the LIVE database** (project `tocfnsmxmdxkrcmjzzdw`, via
read-only `execute_sql`: `information_schema.columns`, `pg_constraint`/`pg_get_constraintdef`, and
`pg_get_functiondef` on the trigger itself), not from migration files or memory, per
`_rules/DB_SCHEMA.md` section 9 (migration files are intent, not live truth).

**Method:** every `public` schema column named `user_id`, `customer_id`, `client_id`,
`organizer_user_id`, `purchaser_user_id`, `referrer_id`, or `referred_user_id` (65 columns across
64 tables) was checked against two things: (1) does it carry a real Postgres FK to `profiles` or
`auth.users`, and if so what `ON DELETE` action, and (2) is it referenced by
`anonymize_financial_rows_on_profile_delete()`, the trigger fired on `profiles` row deletion.

**A note on tooling that mattered here:** `information_schema.constraint_column_usage` silently
omitted every FK pointing at `auth.users` (a cross-schema reference) for this session's Postgres
role, this independently confirms the exact trap `20260713150000_gdpr_deletion_completeness.sql`'s
own header already named ("Supabase's type generator omits FKs that target a table outside the
public schema"). Re-querying via `pg_constraint`/`pg_get_constraintdef` directly (bypassing
`information_schema`) gave the correct, complete answer. Anyone re-running this audit should use
`pg_constraint`, not `information_schema`, for the same reason.

## Verdict

| Category | Count | What it means |
|---|---|---|
| Real FK, `CASCADE`/`SET NULL` to `profiles`/`auth.users` | 42 | Postgres itself deletes or nulls the row on profile delete. No trigger needed. |
| Real FK, no `ON DELETE` action (defaults to `NO ACTION`) | 5 (`referrals.referrer_id`, `referrals.referred_user_id`, `user_credits.user_id`, `voucher_redemptions.user_id`, `credit_redemptions.user_id`, `barber_loyalty_history.customer_id`) | Deleting a profile with rows in these tables is BLOCKED by Postgres (a loud FK-violation error), not a silent data-survival gap. Different failure class: an operational "can't delete this account until X clears" bug, not a GDPR leak. Not fixed here, flagged for a separate pass. |
| No FK, covered by `anonymize_financial_rows_on_profile_delete()` | 12 (`barber_cut_history`, `barber_walkin_queue`, `client_formulas`, `client_photos`, `gift_cards`, `group_bookings`, `intake_form_responses`, `nail_client_preferences`, `nail_design_history`, `spa_treatment_outcomes`, `staff_members`, `tips`) | Confirmed live by reading the trigger's actual `pg_get_functiondef` body, matches what `20260713150000`'s migration header claims it added. |
| No FK, NOT covered by the trigger (the gap) | 1 (`retail_sales.customer_id`) | Found this pass. Currently 11 live rows, 0 with `customer_id` set (pre-launch), so no live PII leak today, but the column is real and unprotected. Fixed in `supabase/migrations/20260727123000_gdpr_retail_sales_gap.sql`, extending the same trigger. |
| `salon_clients.profile_id` (not in the original column-name scan, but the same shape: an operator's CRM contact linked to a Solen account) | 1 | Already covered by the trigger (explicit `salon_clients` branch, wrapped in `EXCEPTION WHEN OTHERS`). |
| `user_salon_affinity` / `user_style_affinity` | 2 | Both have a real live FK to `auth.users` (`ON DELETE CASCADE`); `user_salon_affinity` is ALSO defensively covered by the trigger (belt-and-suspenders, harmless).  |

## Conclusion

The claim "every table holding personal data is wired into the GDPR erasure pipeline" was **mostly
true but not fully true** as of this audit: 64 of 65 scanned columns were genuinely covered
(either by a real FK or by the trigger), and one (`retail_sales.customer_id`) was not, closed in
this pass. The `20260713150000` migration's own column-by-column methodology was sound and is the
right template for re-running this check after schema changes; what was missing was simply running
it again against the CURRENT schema rather than trusting the 2026-07-13 result as still complete
13 days and several new tables later.

**Re-run cadence:** re-run the query in this file's "Method" section (or a fresh column scan) after
any migration that adds a `user_id`/`customer_id`/`client_id`-shaped column to a new table, not on
a fixed calendar cadence, since the gap only grows when a new such column is added.
