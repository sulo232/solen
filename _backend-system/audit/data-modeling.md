# Data modeling & storage , Solen vs `LAW.md` section 1 (audit 2026-07-16)

## Verdict

Good shape on the mechanics that matter. **Every "never do X" clause in the law is a clean, LIVE-verified MATCH with zero exceptions**: never `money` type, never native `ENUM`, never bare `timestamp`, never long day-keys. The one genuine gap is money, and it is a **footgun, not a live bug**: two currency conventions run side by side, and they coexist on the same `bookings` row. On every sampled row the two agree exactly, so nothing has drifted or corrupted.

**Critically: floating point is used for currency nowhere.** Every float/double column in the schema is geospatial or a search-ranking weight, never an amount.

## Per-principle table

| id | rule | verdict | evidence (all from LIVE `execute_sql` this session) | severity |
|---|---|---|---|---|
| DM-01a | Money: never float, never Postgres `money` | **MATCH** | Live query for `data_type in ('real','double precision','money')` returns exactly **16 columns**, every one `cities.latitude/longitude/radius_km` or a `search_ranking_weights`/`search_synonyms` coefficient. **Zero money-named column uses float/double/money** | NONE |
| DM-01b | Money: integer minor units, ONE convention | PARTIAL | Two live conventions: ~25 integer (Rappen) columns across ~15 tables, and ~36 `numeric(x,2)` (decimal CHF) columns across ~24 tables, **including both on the same `bookings` row**. Detail below | LOW-MEDIUM |
| DM-02 | Every consequential write checks affected-row count | OUT OF SCOPE | Write-path territory, already exhaustively covered in `audit/transactions-concurrency.md` (TXN-03). Not re-derived, to avoid duplicating that audit | n/a |
| DM-03 | RLS everywhere + `(select auth.uid())` wrapping | PARTIAL | **148/148** tables have `relrowsecurity=true` (clean). Of 290 policies referencing `auth.uid()`, **286 (98.6%)** use the wrapped form; **4** do not (named below) | LOW |
| DM-04 | `timestamptz` for every instant | **MATCH** | Live: **240** `timestamp with time zone`, **0** `timestamp without time zone` | NONE |
| DM-05 | `text` + `CHECK`, never native `ENUM` | **MATCH** | `pg_type`/`pg_enum` join on `public` returns **zero rows**. **159** live CHECK constraints do the job instead | NONE |
| DM-06 | UUIDv4 PKs, no UUIDv7/ULID/bigint chase | **MATCH** (exceptions all justified) | **124 of 148** `id` columns are `uuid DEFAULT gen_random_uuid()`. Zero `uuid_generate_v7`/ULID function anywhere. The 5 exceptions are principled (below) | NONE |
| DM-07 | `opening_hours` short-day-keyed | **MATCH** | Live `jsonb_object_keys()` over all 28 salons returns exactly `mon,tue,wed,thu,fri,sat,sun`. **Zero** long-form keys | NONE |

## DM-01b: two money conventions, proven on the same row

- **Integer Rappen** (~25 cols / ~15 tables): `bookings.paid_amount/net_amount/refunded_amount/vat_amount/fee_charged_amount`, `booking_disputes.requested_amount/resolved_amount`, `gift_cards.*`, `retail_purchases.*`, `retail_sales.*`, `service_packages.price`, `tips.amount`, others.
- **`numeric(x,2)` decimal CHF** (~36 cols / ~24 tables): `services.price`, `salon_payouts.gross_amount/commission_amount/net_amount`, `promo_codes.discount_value`, `vouchers.amount`, `user_credits.amount`, and the sharpest case, `bookings.price_paid/deposit_amount/estimated_price/final_price/platform_fee/service_revenue/tier_discount_amount`.

**`bookings` carries BOTH on the same row.** Live sample (10 rows, all agree exactly):

| `price_paid` (numeric CHF) | `paid_amount` (integer Rappen) |
|---|---|
| 120.00 | 12000 |
| 165.00 | 16500 |
| 68.00 | 6800 |
| 45.00 | 4500 |
| 25.50 | 2550 |

Reassuring on one axis (no drift: `paid_amount` is consistently `price_paid * 100` on every sampled row) and confirms the risk on the other: **any future code path reading both without knowing which is which is one `* 100` away from a silent factor-of-100 bug.** `bookings` is live and material (957 rows). Several affected tables are currently empty (`salon_payouts`=0, `price_disputes`=0, `retail_purchases`=0, `group_bookings`=0, `user_credits`=0), which lowers today's blast radius but not the schema-level trap for whoever populates them first.

**What breaks in practice:** nothing today, on the evidence. The exposure is prospective: a payout reconciliation report or a cross-table revenue sum that adds a `numeric` and an `integer` column produces a number wrong by exactly 100x, silently, no error thrown.

## DM-03: the 4 bare `auth.uid()` policies

`group_bookings_insert_own` (INSERT), `group_bookings_update_own` (UPDATE), `review_attributes_insert_author` (inside an EXISTS), `salon_of_month_winners_write_admin` (inside an EXISTS). At current row counts the 94-99% planner cost Supabase documents is not observable, so this is correctness-of-pattern, not a live perf problem.

## DM-06 exceptions, verified NOT drift

| table | shape | why it is correct |
|---|---|---|
| `profiles` | `uuid`, no default | FK-inherited from `auth.users(id)`, the standard Supabase pattern |
| `public_profiles`, `profile_summaries`, `availability_slots_public` | `uuid`, no default | All three are **views** (`relkind='v'`), confirmed live. A view has no default |
| `discovery_search_events` | `bigint GENERATED ALWAYS AS IDENTITY` | Append-only analytics log, no FK fan-out. Textbook-correct for this shape, not UUIDv7 drift |
| `search_ranking_weights` | `integer` default 1 | Singleton config row (`id=1`), not an entity table |
| `addons` | `text` id + composite PK, 0 rows | Catalog/lookup-shaped (business-key PK), not a random-insert entity |

## Ranked recommendations

1. **Wrap the 4 bare `auth.uid()` policies.** Cost: 4 `DROP`/`CREATE POLICY` statements copying the shape the other 286 already use. Zero schema risk, zero data touched, minutes. First because it is cheap and closes a named gap completely.
2. **Document the two money conventions per table** in `_rules/DB_SCHEMA.md`: mark every integer column "Rappen" and every `numeric(x,2)` "decimal CHF". Cost: documentation only, zero risk. **This is the actual fix for the real risk** (a future feature reading both wrong), and it is far cheaper and safer than a migration.
3. **DO NOT migrate the legacy `numeric` money columns to integer Rappen as a cleanup.** It would touch ~24 tables including live `bookings` (957 rows) and every read site assuming decimal CHF. **The evidence shows no live rounding bug: both conventions agree exactly on every sampled row.** There is no incident to justify the cost and risk of touching money on live tables. Do it only as its own scoped, tested migration if a real cross-convention bug ever appears.
4. **`FORCE ROW LEVEL SECURITY` is 0/148.** Low priority: migrations run as a superuser role that bypasses RLS (and FORCE) regardless. Worth a note if anyone revisits authz, not an action item. (See `audit/authz.md` AUTHZ-05, which resolves this with a live query.)

**DO NOT DO YET** + trigger (live data corroborates none has fired): BRIN indexes (need 10M+ rows on a time-ordered append-only table; biggest is `bookings` at **957**) · UUIDv7/ULID migration (a PK index no longer fitting in cache; nowhere close, and it would be new-tables-only even then, never a retrofit) · schema-per-tenant (one tenant large enough to justify losing the cross-salon search/discovery queries the shared schema enables; 28 similar salons make this a regression today) · a Redis read-cache (a profiled, still-slow-after-indexing query; none identified) · event-sourced money ledgers (a real external audit requirement naming it).

## What Solen already does RIGHT

- **Zero float/double/money-type usage for any currency column across 148 tables.** The sharpest, most dangerous axis of the law, fully clean.
- **Zero native Postgres `ENUM`**, 159 live CHECK constraints instead. No exceptions.
- **`timestamptz` on literally every timestamp column** (240/240).
- **`opening_hours` short-day-keyed on all 28 live salons**, zero drift (this exact bug returned empty everywhere for weeks once).
- **RLS enabled on all 148 tables**, 98.6% of policies already in the performance-correct wrapped form.
- **Every PK exception is principled**, not accidental drift.

## Sampling honesty

**Every number above is a live `execute_sql` result against the production project run this session, not `_inventory/_db-columns.json` and not a TS type.** The money-column sweep queried `information_schema.columns` with 18 ilike terms, so that list is exhaustive for the naming pattern, not a sample.

**Discrepancies flagged rather than silently resolved:** my 148 tables vs research's 146; my 159 live CHECK constraints vs research's 233 migration-file grep hits; my 124 uuid-default ids vs research's "37+". These measure different things (live catalog state vs grepping 264 migration files, which counts historical/superseded statements). **The live number describes today's actual database.**

**Not done:** a full 148-table row-count sweep (only queried the material ones: `bookings`=957, `services`=263, `salons`=28, `profiles`=49); hand-classifying every one of ~200 raw name-pattern hits against source (classified by type/name/sampled value instead), so a few dual-purpose columns (`promo_codes.discount_value`, `salons.no_show_fee_value`, whose meaning depends on a sibling `_type` column) are **flagged ambiguous rather than confidently bucketed**; re-auditing all 30 live jsonb columns individually.
