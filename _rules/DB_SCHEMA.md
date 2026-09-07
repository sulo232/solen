# Database Schema

## 6. Supabase Schema (New — Migration 014+)

| Table | Key Columns | Notes |
|---|---|---|
| `salons` | `id`, `owner_id`, `name`, `slug`, `categories[]`, `quartier`, `address`, `latitude`, `longitude`, `is_active`, `average_rating`, `review_count`, `group_id`, `solen_score`, `solen_tier`, `score_details`, `cancellation_count`, `stripe_account_id`, `accepts_online_payment`, `phone_verified` | **No `status` column.** `is_active` is the field. RLS enforces `is_active=true` for anon. `group_id` FK → `salon_groups`. `solen_score` 0-100, `solen_tier` gold/teal/grey/dark, computed nightly by cron. **`opening_hours`** = jsonb keyed by SHORT day names (`mon`/`tue`/`wed`/`thu`/`fri`/`sat`/`sun`), each `{open,close}` "HH:MM"; a missing day = closed. NOT long names — `lib/salon-hours.ts isOpenNow` reads both but new code writes short. |
| `salon_payouts` | `id`, `salon_id`, `booking_id`, `stripe_payment_intent_id`, `gross_amount`, `commission_percent`, `commission_amount`, `net_amount`, `status` | Tracks payouts to Stripe Connect accounts. |
| `services` | `id`, `salon_id`, `name_de`, `name_en`, `category`, `duration_minutes`, `price`, `is_active` | |
| `staff_members` | `id`, `salon_id`, `name`, `avatar_url`, `specialties[]`, `is_active` | |
| `availability_slots` | `id`, `salon_id`, `service_id`, `staff_member_id`, `starts_at`, `ends_at`, `status` | status: available/booked/blocked |
| `bookings` | `id`, `user_id`, `salon_id`, `service_id`, `slot_id`, `starts_at`, `ends_at`, `price_paid`, `status`, `is_first_visit`, `is_recurring`, `sms_sent_24h`, `sms_sent_1h`, `review_prompt_sent` | SMS/review flags added in session 3. |
| `profiles` | `id`, `display_name`, `avatar_url`, `role`, `onboarding_completed`, `banned_at`, `ban_reason`, `no_show_count`, `account_status`, `deletion_requested_at`, `tos_version`, `tos_accepted_at`, `birthday` | role: customer/salon_owner/staff/admin. `account_status`: active/warned/suspended/banned. |
| `conversations` | `id`, `customer_id`, `salon_id`, `unread_count_salon` | |
| `messages` | `id`, `conversation_id`, `sender_id`, `content`, `message_type` | |
| `salon_directory` | `name`, `phone`, `email`, `address`, `google_place_id`, `claim_code` | RLS enabled (read-only for public, admin-only writes). |
| `feature_flags` | `key` (PK), `enabled`, `description`, `updated_by` | Kill switch. `maintenance_mode` = global off switch. |
| `audit_log` | `actor_id`, `action`, `target_type`, `target_id`, `metadata`, `ip_address` | Logs admin actions. Admin-only read. |
| `data_deletion_log` | `user_email`, `requested_at`, `completed_at`, `tables_cleared` | GDPR compliance. Admin-only read. |
| `staff_portfolio_images` | `id`, `staff_member_id`, `image_url`, `caption`, `sort_order` | Instagram-style staff gallery. RLS: public read, salon owner manage. |
| `service_addons` | `id`, `service_id`, `name`, `price`, `duration_minutes` | Add-on suggestions during booking. |
| `favorites` | `user_id`, `salon_id`, `created_at` | User favorites. RLS: own only. |
| `notifications` | `id`, `user_id`, `type`, `title`, `body`, `read`, `data`, `created_at` | In-app notification center data. Read/update only own. |
| `notification_preferences` | `user_id` (PK), `rebooking_enabled`, `messages_enabled`, `deals_enabled`, `new_salons_enabled` | User notification settings. Extended in migration 054. |
| `price_offers` | `id`, `conversation_id`, `salon_id`, `customer_id`, `amount_chf`, `status`, `stripe_payment_intent_id`, `expires_at` | In-chat price negotiation. |
| `price_disputes` | `id`, `booking_id` (UNIQUE), `original_amount`, `requested_amount`, `salon_reason`, `status`, `auto_approve_at` | Post-visit upcharge disputes. Max 50% upcharge. |
| `booking_disputes` | `id`, `booking_id` (UNIQUE), `reporter_id`, `reported_id`, `issue_type`, `description`, `salon_response`, `status`, `resolution`, `mediation_started_at`, `mediation_deadline_at` | Customer-initiated dispute handling (T&S §13). |
| `loyalty_cards` | `id`, `salon_id`, `stamps_needed`, `reward_text`, `is_active` | Salon stamp card definitions. |
| `loyalty_stamps` | `id`, `loyalty_card_id`, `customer_id`, `stamped_at` | Individual stamps collected. |
| `client_notes` | `id`, `salon_id`, `customer_id`, `note`, `note_type`, `booking_id`, `created_by` | CRM notes (permanent/booking). |
| `review_replies` | `id`, `review_id` (UNIQUE), `salon_id`, `reply_text`, `is_public` | Salon owner replies to reviews. |
| `off_peak_slots` | `id`, `salon_id`, `day_of_week`, `start_time`, `end_time`, `discount_percent`, `is_active` | Off-peak discount hours. |
| `help_articles` | `id`, `slug`, `title`, `content`, `category`, `locale`, `published`, `sort_order` | Help center articles. Admin CMS. |
| `review_photos` | `id`, `review_id`, `photo_url`, `sort_order` | Review photo attachments. Stored in `review-photos` Supabase bucket. RLS: public read, reviewer write. |
| `salon_groups` | `id`, `name`, `slug`, `logo_url`, `description`, `website` | Multi-location chains. RLS: public read, admin write. `salons.group_id` FK references this. |
| `chat_templates` | `id`, `salon_id`, `text`, `sort_order`, `created_at` | Quick-reply templates for salon chat. RLS: salon owner only. Max 10 per salon. |
| `client_tags` | `id`, `salon_id`, `customer_id`, `tag`, `color`, `created_at` | Color-coded client tags (allergy/preference). Colors: gray, red, orange, teal, blue, purple. UNIQUE(salon_id, customer_id, tag). RLS: salon owner only. |
| `feature_requests` | `id`, `admin_id`, `element_selector`, `element_tag`, `element_text`, `component_hint`, `page_url`, `description`, `priority`, `status`, `generated_roadmap`, `roadmap_version`, `claude_prompt`, `token_usage` | Admin visual editor requests. RLS: admin-only all ops. |
| `discovery_items` | `id`, `category`, `content_type`, `name_*`, `description_*`, `image_url`, `tiktok_url`, `tiktok_embed_html`, `tiktok_thumbnail_url`, `media_type`, `source`, `gender`, `texture`, `tags[]`, `salon_script_*`, `cut_guide`, `price_min`, `price_max`, `like_count`, `save_count`, `view_count`, `status`, `owner_user_id`, `owner_salon_id` | Discovery content. RLS: public read (published+active), owner manage. |
| `discovery_staging` | `id`, `source`, `source_id`, `source_url`, `image_url`, `title`, `author_name`, `category`, `gender`, `ai_result`, `status` | Import staging area. RLS: admin-only. |
| `discovery_likes` | `id`, `user_id`, `item_id`, `created_at` | UNIQUE(user_id, item_id). Toggle via `toggle_discovery_like` RPC. |
| `discovery_saves` | `id`, `user_id`, `item_id`, `collection_id`, `created_at` | UNIQUE(user_id, item_id). Toggle via `toggle_discovery_save` RPC. |
| `discovery_comments` | `id`, `item_id`, `user_id`, `text`, `is_flagged`, `created_at` | Max 500 chars. Auto-flagged via content-flags. |
| `discovery_interactions` | `id`, `item_id`, `user_id`, `interaction_type`, `duration_ms`, `created_at` | Fire-and-forget analytics logging. |
| `discovery_boards` | `id`, `name`, `slug`, `category`, `gender`, `cover_images[]`, `pin_count` | Curated collections. |
| `discovery_collections` | `id`, `user_id`, `name`, `is_public` | User save collections. |
| `discovery_products` | `id`, `name`, `brand`, `price`, `affiliate_url`, `image_url` | Product recommendations. |
| `staff_invites` | `id`, `salon_id`, `email`, `staff_name`, `invited_by`, `token`, `accepted_at` | Staff invite tokens. UNIQUE(salon_id, email). |
| `staff_services` | `staff_member_id`, `service_id` | Many-to-many staff↔service mapping. PK(staff_member_id, service_id). |
| `staff_breaks` | `id`, `staff_member_id`, `day_of_week`, `start_time`, `end_time`, `label` | Recurring break slots. |
| `staff_time_off` | `id`, `staff_member_id`, `start_date`, `end_date`, `reason`, `approved` | Time-off requests. |
| `salon_closures` | `id`, `salon_id`, `date`, `reason` | One-off closure days. UNIQUE(salon_id, date). |
| `recurring_rules` | `id`, `salon_id`, `staff_member_id`, `day_of_week`, `start_time`, `end_time`, `recurrence_type` | Recurring availability rules. |
| `tips` | `id`, `booking_id`, `tipper_id`, `staff_member_id`, `amount`, `payment_intent_id`, `paid_at` | Post-service tips. |
| `gift_cards` | `id`, `salon_id`, `code`, `original_amount`, `remaining_amount`, `purchaser_id`, `recipient_name`, `recipient_email`, `message`, `is_active`, `expires_at` | Digital gift cards. UNIQUE(code). |
| `service_packages` | `id`, `salon_id`, `name`, `service_id`, `sessions`, `bonus_sessions`, `price`, `is_active` | LEGACY — packages feature REMOVED 2026-06-11 (owner); table kept for old rows + admin refunds. |
| `package_purchases` | `id`, `package_id`, `customer_id`, `sessions_used`, `payment_intent_id`, `purchased_at` | LEGACY — packages feature REMOVED 2026-06-11; kept for refunds of historical purchases. |
| `client_formulas` | `id`, `salon_id`, `customer_id`, `brand`, `product_line`, `mix_formula`, `developer_volume`, `processing_minutes`, `notes` | Hair color formulas. |
| `client_photos` | `id`, `salon_id`, `customer_id`, `photo_url`, `photo_type`, `notes` | Before/after + progress photos. `photo_type`: before/after/progress. |
| `intake_forms` | `id`, `salon_id`, `customer_id`, `template_type`, `responses`, `ai_recommendation` | Consultation intake forms. `template_type`: hair/nail/spa (waxing + makeup template values are deprecated as of V2-D15-3 — Makeup category retired, Wellness merged into Spa, Waxing deferred post-launch; existing rows with those values are preserved but no new templates of those types). |
| `processed_webhook_events` | `event_id` (PK), `processed_at` | Stripe webhook idempotency. |
| `nail_design_history` | `id`, `salon_id`, `customer_id`, `staff_member_id`, `shape`, `length`, `material`, `style_tags[]`, `color_codes[]`, `photos[]`, `notes`, `service_id`, `booking_id` | Per-client nail design records. |
| `nail_preferences` | `id`, `customer_id`, `salon_id`, `preferred_shape`, `preferred_length`, `preferred_material`, `preferred_brand`, `skin_sensitivity` | Client nail preferences per salon. |
| `nail_allergies` | `id`, `customer_id`, `allergen`, `severity`, `notes`, `reported_at` | Client nail product allergies. Severity: mild/moderate/severe. |
| `nail_inspo_images` | `id`, `user_id`, `image_url`, `source`, `board_id`, `tags[]` | Client inspiration images. Source: upload/board/discovery. |
| `nail_inspo_boards` | `id`, `user_id`, `name`, `cover_url`, `is_public` | User-created inspiration boards. |
| `nail_dynamic_pricing_rules` | `id`, `salon_id`, `rule_type`, `day_of_week`, `start_time`, `end_time`, `modifier`, `is_active` | Dynamic price modifiers. Types: peak_hour/off_peak/weekend/last_minute/loyalty. |
| `nail_retail_products` | `id`, `salon_id`, `name`, `price`, `category`, `image_url`, `stock_count`, `is_active` | In-salon retail products. Categories: nail_care/tools/polish/accessories. |
| `barber_walkin_queue` | `id`, `salon_id`, `customer_id`, `customer_name`, `customer_phone`, `service_id`, `assigned_barber_id`, `preferred_barber_id`, `status`, `position`, `estimated_wait_minutes`, `tracking_token`, `joined_at`, `called_at`, `started_at`, `completed_at`, `join_method` | Walk-in queue. Status: waiting/in_chair/completed/no_show/cancelled. `tracking_token` UNIQUE for anonymous tracking. |
| `barber_cut_history` | `id`, `salon_id`, `customer_id`, `staff_member_id`, `service_id`, `booking_id`, `fade_type`, `top_style`, `guard_length`, `beard_style`, `lineup`, `products_used[]`, `photos[]`, `notes`, `cut_at` | Per-client cut records with spec badges. |
| `barber_loyalty_programs` | `id`, `salon_id`, `name`, `stamps_required`, `reward_type`, `reward_value`, `is_active` | Salon loyalty program config. reward_type: free_service/discount_chf/discount_pct. UNIQUE(salon_id). |
| `barber_loyalty_cards` | `id`, `program_id`, `customer_id`, `stamps_collected`, `status`, `redeemed_at` | Individual loyalty cards. Status: active/completed/redeemed. |
| `barber_loyalty_history` | `id`, `card_id`, `stamped_by`, `stamped_at`, `booking_id` | Stamp event log for audit trail. |
| `barber_chairs` | `id`, `salon_id`, `chair_count`, `buffer_minutes` | Chair configuration per salon. UNIQUE(salon_id). Upsert pattern. |
| `search_embeddings` | `id`, `entity_type`, `entity_id`, `category`, `text_content`, `embedding` (vector 768), `updated_at` | pgvector embeddings for AI-powered search. RLS: public read, admin write. |
| `notifications` | `id`, `user_id`, `type`, `title`, `body`, `read`, `data`, `created_at` | In-app notification center. RLS: own only. |
| `account_warnings` | `id`, `salon_id`, `user_id`, `reason`, `severity`, `metadata`, `created_at` | Strike system tracking for salons / users (warning/strike). |

| View | Columns | Notes |
|---|---|---|
| `public_profiles` | `id`, `display_name`, `avatar_url` | Safe public view. Use this (not `profiles`) when displaying OTHER users' names/avatars. |
| `v_trending_salons` | `salon_id`, `solen_score`, `recent_booking_count`, `trending_score` | Computes live trending score based on `solen_score` and recent 14-day bookings. |
| `salon_drafts` | `id`, `user_id` (UNIQUE), `draft_data` (jsonb), `current_step`, `updated_at` | Wizard draft persistence. One draft per user. Auto-deleted on salon creation. |

## 7. Migration law: additive-idempotent apply_migration, and how to re-backfill local files

**Never `supabase db push` or `supabase db reset` against the live project.** All schema changes go
through the Supabase MCP `apply_migration` tool, additive and idempotent only (`create table if not
exists`, `add column if not exists`, `create or replace function`, `create policy` guarded by a
`drop policy if exists` for the same name, never a bare `DROP TABLE` / destructive rewrite). This
applies the SQL live AND records it in `supabase_migrations.schema_migrations` (columns: `version`,
`name`, `statements text[]`), but it does NOT write a local file under `supabase/migrations/`. Over
time this causes local/live drift: the live DB has more applied versions than the repo has files for.

**How to detect drift.** Compare the local `supabase/migrations/*.sql` filenames (version prefix) against
`select version, name from supabase_migrations.schema_migrations order by version` on the live project.
Any live version with no matching local file is missing and should be backfilled.

**How to backfill a missing migration file (the recipe used in ring 11, 2026-07-11):**
1. For each missing version, run (read-only, via the Supabase MCP `execute_sql` tool):
   ```sql
   select array_to_string(statements, E'\n;\n') from supabase_migrations.schema_migrations where version = '<version>';
   ```
   Batch a few small ones per query; fetch large ones individually.
2. Write `supabase/migrations/<version>_<name>.sql` with a short header noting it was backfilled
   (date + "applied live via MCP apply_migration; file restored for fresh-env reproducibility") followed
   by the SQL body verbatim, unmodified. Never edit the body to "clean it up": the file must match what
   was actually applied.
3. Before adding a missing local migration file, run `npm run exists <name>` and inspect any matching
   inventory so existing history is reused. Respect an actual tool denial and resolve its cause;
   do not create a skip flag or change settings to bypass it. Backfilling local history does not
   authorize another live migration.
4. After backfilling, regenerate `lib/database.types.ts` via the MCP `generate_typescript_types` tool
   and overwrite the file. The backfilled `.sql` files do not change the live schema (it was already
   applied), so `npx tsc --noEmit` error count should be unchanged before/after; confirm with a count,
   don't assume.
5. If any hand-written stub files exist under invented version prefixes for schema that was actually
   applied under a different (true remote) version, replace them: write the canonical file under the true
   remote version with identical content, then delete the stub. Never leave two files describing the same
   live migration under two different version numbers.

This keeps `supabase/migrations/` a faithful, re-appliable record of the live schema for a fresh
environment, even though the day-to-day apply path (MCP `apply_migration`) does not write local files
on its own.

## 8. Money representation: integer minor units (Rappen), no exceptions on new columns

**Chosen representation, written down 2026-07-26 (was previously only implied by migration
comments, never a project rule): every money column is `integer`, storing the amount in Rappen
(CHF minor units, 1 CHF = 100 Rappen), never `numeric`.** This was already the stated intent for
`bookings.paid_amount` / `refunded_amount` / `vat_amount` and the `retail_purchases` /
`package_purchases` tables (their migration headers say "UNIT CONTRACT: integer Rappen
end-to-end", see `supabase/migrations/20260602100000_purchase_refunds.sql:12`), but it lived only
in scattered comments, not a rule a session would actually read. Two representations with no
written rule means the next new money column is a coin flip.

**Why integer Rappen and not `numeric(10,2)`:** float/decimal CHF math accumulates rounding error
across VAT splits, refunds, and commission cuts; integer minor units make every arithmetic step
exact and match the unit Stripe itself uses (Stripe amounts are integer minor units). Converting at
the UI/API boundary via `lib/stripe.ts toRappen()` / `fromRappen()` keeps the DB layer exact and
pushes the CHF-decimal formatting to display code only.

**Deviation list, current live schema** (checked 2026-07-26 via `information_schema.columns` on
the live project; 90 columns matched a money-keyword scan of all 146 public tables, of which 58
are real currency-amount columns after excluding rate/percent/multiplier columns like `vat_rate`,
`commission_rate`, `commission_percent`, `price_modifier`, `member_commission_waiver_rate`, and
`late_cancel_fee_percent`, which are not currency amounts and are out of scope for this rule).
24 of the 58 already follow the integer-Rappen rule (`bookings.paid_amount` / `net_amount` /
`refunded_amount` / `vat_amount` / `fee_charged_amount`, `retail_purchases.*`,
`package_purchases.*`, `booking_disputes.requested_amount` / `resolved_amount`, `gift_cards.*`,
`group_bookings.total_amount`, `retail_sales.*`, `service_packages.price`,
`staff_services.price_override`, `tips.amount`, `case_events.amount`,
`discovery_items.price_min` / `price_max`, `nail_retail_products.price`). The other 34 are
`numeric(x,2)` and deviate from the rule, grouped by table:

| Table | Deviating column(s) | Live type |
|---|---|---|
| `bookings` | `deposit_amount`, `estimated_price`, `final_price`, `platform_fee`, `price_paid`, `tier_discount_amount` | `numeric(10,2)` / `numeric(8,2)` |
| `salon_payouts` | `gross_amount`, `commission_amount`, `net_amount` | `numeric(10,2)` |
| `price_disputes` | `original_amount`, `requested_amount`, `admin_amount` | `numeric(10,2)` |
| `salons` | `cancellation_fee_value`, `no_show_deposit_amount`, `no_show_fee_value` | `numeric(8,2)` / `numeric(10,2)` |
| `vouchers` | `amount`, `remaining_amount` | `numeric(8,2)` |
| `salon_analytics` | `avg_booking_price`, `total_revenue` | `numeric(10,2)` |
| `services` | `price` | `numeric(8,2)` |
| `service_options` | `price` | `numeric(10,2)` |
| `service_bundles` | `custom_price` | `numeric(8,2)` |
| `addons` | `price` | `numeric(10,2)` |
| `availability_slots` | `price_override` | `numeric(8,2)` |
| `inventory` | `price` | `numeric(10,2)` |
| `makeup_kit_items` | `cost_per_unit` | `numeric(10,2)` |
| `sale_line_items` | `price` | `numeric(10,2)` |
| `sales` | `total` | `numeric(10,2)` |
| `user_credits` | `amount` | `numeric(10,2)` |
| `credit_redemptions` | `amount_redeemed` | `numeric` (unscaled) |
| `voucher_purchases` | `amount_paid` | `numeric(10,2)` |
| `voucher_redemptions` | `amount_redeemed` | `numeric` (unscaled) |
| `price_offers` | `amount_chf` | `numeric(10,2)` |
| `promo_codes` | `min_booking_amount` | `numeric(10,2)` |
| `referrals` | `reward_amount` | `numeric(10,2)` |

**Correction to a common assumption:** `bookings.platform_fee` is frequently assumed to be integer
Rappen alongside `paid_amount` / `net_amount` on the same row (migration `068_megabuild_foundation.sql:25` declared it `INTEGER`, but that migration's own money-column block was never
applied live, per the note in `20260601_refund_appeal_foundation.sql:41`). The live column is
`numeric(10,2)`. Any code that reads `bookings.paid_amount` and `bookings.platform_fee` in the same
expression is mixing Rappen and CHF-decimal today; check the actual arithmetic before trusting a
"they're both Rappen" assumption.

**What to do when writing a new money column:** `integer`, name it `_amount` or `_fee` or similar,
comment it `-- Rappen` inline (match the existing convention in `20260602100000_purchase_refunds.sql`), and convert at the boundary with `lib/stripe.ts`. Never add a new `numeric(x,2)`
money column. The 34 columns above are existing debt, not a precedent; fixing them is a separate,
deliberate migration (each one needs its call sites audited for the unit they assume), not
something to do opportunistically while touching an unrelated file.

## 9. `supabase/migrations` is a history of intents, not a description of the database

**Written down 2026-07-27 after two independent research agents each filed a CRITICAL finding
that was a migration-file truth presented as a live-database truth.** The `supabase/migrations`
folder is a HISTORY: it records what was intended to run, in what order, at what time. It is not,
and must never be read as, a live description of the current schema, policies, or data. A file
present in the folder tells you what a fresh replay would produce, nothing about what exists now.

**Any claim about current schema, policy, or data state is made against the LIVE database.**
Authorities, in order, highest first:
1. A read-only SQL query against the live project (Supabase MCP `execute_sql`, or `pg_policies` /
   `information_schema.columns` directly). This is ground truth.
2. `_inventory/_db-snapshot.json` and `_db-columns.json`. A recent, generated snapshot of the live
   state, good for a fast check, not a substitute for a query when the finding is load-bearing.
3. The migration files under `supabase/migrations/`. Last, and evidence only about what a REPLAY
   would produce, never about what is true now. A later file can rename, drop, or leave untouched
   a policy the reader assumes an earlier file still controls; the only way to know which survived
   is to query `pg_policies` (or the equivalent live catalog) directly.

**"Is this true now" and "would a restore make this true" are two different questions.** Every
audit, finding, or migration-folder read states explicitly which one it is answering. "Migration
`005_reviews_trust.sql:29` creates a permissive `FOR UPDATE USING (true)` policy" is a true and
useful sentence about the replay case; it is a false and dangerous sentence if presented as "the
reviews table currently has a permissive UPDATE policy" without having queried `pg_policies` to
confirm the later migration that touched the same table didn't drop or replace it. Two ring
findings in this run made exactly that substitution: a permissive RLS policy read off migration
`005` and `009` (different policy names, so the drop in `009` looked like it missed the one from
`005`) turned out not to exist on the live `reviews` table at all, which has exactly four
correctly scoped policies when queried directly. Nine `wheelchair_accessible`-style amenity
booleans fabricated from a hash of the salon id in `20260530_seed_salon_amenities.sql` counted 0
true across all 20 active salons live: the seed was never applied, or was reverted, and the file
alone gave no way to tell.

**The corollary that makes this dangerous, not just imprecise:** a replay-only landmine (a
migration whose SQL, if replayed today, would create a bad policy, a fabricated column, a
permissive default) is invisible to every current check in this estate, because nothing here ever
replays the migration folder onto a clean database to prove what it would actually produce. There
is no CI step, no local script, no scheduled job that does this. So a bad statement can sit in
`supabase/migrations/` indefinitely, contradicted or superseded by later live-only changes (see
section 7: `apply_migration` writes live and to `schema_migrations` but not to a local file, so
live and file history already diverge in the other direction too), and nothing will ever flag it
until someone actually tries a fresh-environment restore. Treat a migration-derived finding as
provisional until checked against the live catalog, precisely because there is no safety net that
would catch the gap for you.

**The freshness trap, so "check the snapshot" isn't quietly treated as "check the database":**
`_db-columns.json` records column NAMES only, no types, no defaults, no constraints, so it cannot
answer a type or nullability question at all. And the snapshot drifts: as of this writing it was
14 days stale and undercounted by 4 tables (146 recorded vs 150 live). A snapshot hit is a good
first pass, never the final word on a load-bearing claim, always confirm with a live query before
a finding is filed as CRITICAL or a fix is shipped against it.

## 10. Migration lock hygiene: `NOT VALID`/`VALIDATE`, `CONCURRENTLY`, `lock_timeout`

**Written down 2026-07-27 (data-money-04).** A DDL statement takes an `ACCESS EXCLUSIVE` lock for
its duration; against a table with real rows, a bare `ADD CONSTRAINT ... CHECK`/`NOT NULL` or a
non-`CONCURRENTLY` `CREATE (UNIQUE) INDEX` blocks every other query on that table for as long as
the full-table scan takes, and queues behind any long-running query already holding a weaker lock.
At Solen's current scale this has caused zero incidents (audited 2026-07-16), but the pattern is
free to apply and expensive to discover you needed only after a migration hangs behind a slow
query in production.

**The rule, with a stated floor so "premature at our scale" has a number instead of a guess:** for
any table whose live row count (check via a read-only `execute_sql` count, or the `_inventory`
snapshot) exceeds **2,000 rows**, a new migration must:
- Add a `CHECK`/`NOT NULL` constraint as `NOT VALID` first, then `VALIDATE CONSTRAINT` in a
  follow-up statement (the `VALIDATE` step still scans the table, but takes only a `SHARE UPDATE
  EXCLUSIVE` lock, which does not block concurrent reads/writes the way the plain form's
  `ACCESS EXCLUSIVE` does).
- Add a `CREATE INDEX` as `CREATE INDEX CONCURRENTLY` (a `UNIQUE` index too, same keyword).
- Precede every DDL statement in the migration with `SET LOCAL lock_timeout = '5s';` so a lock
  that can't be acquired promptly fails loud instead of queuing invisibly behind other traffic.

Below 2,000 rows the plain form is fine and should not be forced; most of Solen's tables are well
under this today, so this is a floor for the tables that matter (`bookings`, `profiles`,
`booking_disputes`, `nail_retail_products`, `promo_codes` and any future high-row-count table), not
a blanket rule to retrofit everywhere.

**Current state (audited 2026-07-16, migration count re-verified 2026-07-27 at 269 files, three
more than the audit's 264):** the correct two-step pattern is used in exactly 2 files / 3
constraints; at least 9 other `ADD CONSTRAINT ... CHECK` statements across 7 files ran as bare
adds against tables confirmed to hold rows; 0 of 161 `CREATE (UNIQUE) INDEX` statements use
`CONCURRENTLY`; 0 of 264 files set `lock_timeout` or `statement_timeout`. This is existing debt,
not something to retrofit opportunistically; the rule binds new migrations going forward.

## 11. Backup coverage: a new table decides its `BACKUP_TABLES` membership at creation time

**Written down 2026-07-27 (data-money-06).** `lib/backup/export.ts`'s `BACKUP_TABLES` is a
hardcoded array (line 26) that the nightly export backs up; nothing else in the repo references
it, so it does not grow automatically as the schema grows. As of the 2026-07-16 audit it covered
24 of the DB's 146 live tables (16%), a deliberate business-critical subset for those 24, not a
statement about the ~120 tables added since.

**The rule:** any migration that `CREATE TABLE`s a new table holding user-generated content,
business state, or data not reconstructible from Stripe's own ledger must, in the same change,
either add the table name to `BACKUP_TABLES` in `lib/backup/export.ts`, or leave a comment in the
migration explaining why it is exempt (pure cache/derived view, ephemeral analytics, or a table
Stripe's ledger already makes reconstructible). A backup list that silently falls behind schema
growth looks complete (the cron still reports success every night) while its real coverage shrinks
as a fraction of the schema, which is worse than an honestly-incomplete backup because nobody goes
looking for a gap that isn't reporting an error.

