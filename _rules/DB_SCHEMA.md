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
3. The pre-build exists-check hook can block a brand-new migration filename; run `npm run exists <name>`
   once per file, and if still blocked, `touch .claude/exists-skip.flag` (consumed per write, re-touch as
   needed).
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

## 8. Money units: two conventions coexist, integer Rappen and numeric CHF (owner decision 2026-07-16, document not migrate)

**THE RULE, READ THIS FIRST: the column's SQL type tells you the unit, not its name.** An `integer` /
`INTEGER` money column holds **Rappen** (Swiss centimes, `12000` = CHF 120.00). A `numeric(x,2)` /
`decimal(x,2)` money column holds **CHF** as a decimal string (`120.00` = CHF 120.00). **Never sum or
compare a Rappen column with a CHF column without converting one of them first.** Doing that silently
is wrong by exactly **100x**. Before touching ANY column below, check which table it is on: the same
column name (`net_amount`, `price`, `price_override`, `reward_value`) means a DIFFERENT unit on a
different table. Table beats name, every time.

Verified live on prod (`tocfnsmxmdxkrcmjzzdw`, read-only queries, 2026-07-16): `bookings.price_paid`
(numeric, `'120.00'`) and `bookings.paid_amount` (integer, `12000`) agree exactly on every sampled row
today. Nothing has drifted. That is precisely why this is a documentation fix, not a migration; see
the decision at the bottom.

### 8.1 Rappen, integer (27 columns)

| Table.column | Notes |
|---|---|
| `bookings.paid_amount` | The settled Stripe charge, `pi.amount`. |
| `bookings.platform_fee` | Solen's commission cut of `paid_amount`. |
| `bookings.refunded_amount` | Cumulative Rappen refunded; CAS target for `issue-refund.ts`. |
| `bookings.fee_charged_amount` | Cancellation/no-show fee actually charged (`lib/bookings/charge-fee.ts`). |
| `bookings.vat_amount` | VAT portion of `paid_amount`. VAT-inclusive: `net_amount + vat_amount == paid_amount`. |
| `bookings.net_amount` | `paid_amount` minus `vat_amount`. |
| `bookings.tier_discount_amount` | **Type is `numeric`, not `integer`, but the convention is still Rappen by code contract**: `app/api/stripe/booking-pay-intent/route.ts:707` writes `actualDiscountRappen` into it with the comment `// Rappen, == the PI's application_fee reduction`. The one column in this table where SQL type and real unit disagree, watch it. |
| `booking_disputes.requested_amount` | Customer-complaint dispute (T&S §13). Separate table from `price_disputes` below, which is CHF. |
| `booking_disputes.resolved_amount` | Same table. |
| `case_events.amount` | Dispute timeline event; Rappen "when the event moved money" (column comment). |
| `gift_cards.original_amount` | |
| `gift_cards.remaining_amount` | |
| `package_purchases.paid_amount` | LEGACY (packages feature removed 2026-06-11), kept for historical refunds. |
| `package_purchases.refunded_amount` | Same. |
| `package_purchases.vat_amount` | Added by the VAT migration only when the table exists; guarded add. |
| `package_purchases.net_amount` | Same guard. |
| `retail_purchases.paid_amount` | Online retail-product checkout (Connect destination charge). |
| `retail_purchases.refunded_amount` | |
| `retail_purchases.vat_amount` | |
| `retail_purchases.net_amount` | |
| `retail_sales.total_price` | **No local migration file, live-only (schema drift, see §7).** Confirmed Rappen from real values (`4500` etc, matching CHF 45.00 nail-retail-product prices). Written by `app/api/dashboard/nail/retail-sales/route.ts`. |
| `retail_sales.unit_price` | Same table, same drift note. |
| `service_packages.price` | LEGACY (same removed feature as `package_purchases`). |
| `staff_services.price_override` | Per-staff override of a service price. **Different convention from the similarly-named `availability_slots.price_override` below**, which is CHF. Added later (nail foundation migration), Rappen from day one. |
| `nail_retail_products.price` | |
| `tips.amount` | 100% to the salon, no application fee. |
| `group_bookings.total_amount` | No live writer found in `app/` or `lib/` today (0 rows); classified from the `INTEGER` column definition only. Flag as unconfirmed-by-usage if this feature gets built out. |

### 8.2 CHF, numeric/decimal (35 columns)

| Table.column | Notes |
|---|---|
| `bookings.price_paid` | `numeric(8,2)`. The original booking price at time of slot creation. |
| `bookings.estimated_price` | No dedicated column comment, but `20260614010000_solen_plus_phase1_perks.sql:93` does `coalesce(final_price, price_paid, estimated_price, 0) >= min_value_chf`, treating all three as interchangeable CHF fallbacks. Proof by usage, not just by type. |
| `bookings.final_price` | Same proof. |
| `availability_slots.price_override` | `numeric(8,2)`. **Different convention from `staff_services.price_override` above**, which is Rappen. Same English name, same rough purpose (override a service price), different table, different unit. This is the sharpest same-name trap in the whole schema. |
| `services.price` | The service catalogue price customers see. |
| `service_options.price` | |
| `service_bundles.custom_price` | `numeric(8,2)`. Un-killed 2026-07-03; column comment already says "numeric CHF-decimal". |
| `sale_line_items.price` | **No local migration file, live-only (schema drift).** Part of an in-salon POS `sales` + `sale_line_items` pair (staff/slot/payment_method columns) that is a DIFFERENT feature from `retail_sales` above. Only 1 seed row live; no app code writes to it today (only referenced in generated `lib/database.types.ts`), likely dormant. |
| `sales.total` | Same table pair, same drift + dormancy note. |
| `salon_analytics.avg_booking_price` | Computed rollup. |
| `salon_analytics.total_revenue` | Computed rollup. |
| `salon_payouts.gross_amount` | `numeric(10,2)`. Column comment: "the webhook writes these amounts in CHF... deliberately NOT integer Rappen (the Rappen lock is for bookings.paid_amount/refunded_amount)." The clearest explicit convention note in any migration. |
| `salon_payouts.commission_amount` | Same table. |
| `salon_payouts.net_amount` | Same table. **Different convention from `bookings.net_amount` above**, which is Rappen. |
| `vouchers.amount` | `numeric(8,2)`. |
| `vouchers.remaining_amount` | `numeric(8,2)`. |
| `voucher_purchases.amount_paid` | Explicitly contrasted with the Rappen convention in `20260602100000_purchase_refunds.sql`'s header comment. |
| `voucher_redemptions.amount_redeemed` | Bare `numeric`; confirmed CHF because the RPC adds it straight onto `vouchers.remaining_amount` (CHF) with no scaling. |
| `referrals.reward_amount` | `numeric(10,2)`, default 10.00. |
| `user_credits.amount` | `numeric(10,2)`. |
| `user_credits.remaining` | `numeric(10,2)`, same table (easy to miss, name has no "amount" in it). |
| `credit_redemptions.amount_redeemed` | Bare `numeric`; confirmed CHF because the RPC adds it straight onto `user_credits.remaining` (CHF), same proof pattern as vouchers above. |
| `makeup_kit_items.cost_per_unit` | `numeric(10,2)`. 0 live rows (makeup category retired), type-only. |
| `price_disputes.original_amount` | `decimal(10,2)`. Salon-upcharge disputes, separate table from `booking_disputes` above, which is Rappen. |
| `price_disputes.requested_amount` | Same table. |
| `price_disputes.admin_amount` | Same table. |
| `price_offers.amount_chf` | `decimal(10,2)`. In-chat price negotiation; name is self-documenting. |
| `salons.deposit_max` | **No local migration file, live-only (schema drift).** Confirmed CHF from live value format (`100.00`). |
| `salons.deposit_min` | Same drift note; live value `5.00`. |
| `salons.no_show_deposit_amount` | Same drift note; live value `20.00`. |
| `addons.price` | `decimal(10,2)`. 0 live rows; legacy add-on catalogue, likely superseded by `service_addons` (see §6). Type-only classification. |
| `inventory.price` | `decimal(10,2)`. 0 live rows; likely superseded by `nail_retail_products`. Type-only classification. |
| `discovery_items.price_min` | **Exception to the "integer = Rappen" heuristic.** Plain `INT`, but holds a WHOLE-CHF display price band (`45`, `75`, `80`...), not Rappen, confirmed by `app/[locale]/_components/homepage/Entdecken.tsx:50`'s comment "Lowest price (CHF) from discovery_items.price_min". If you ever compute with this column, do not run it through `toRappen` or divide by 100: it is already CHF. |
| `discovery_items.price_max` | Same exception, same file. |
| `promo_codes.min_booking_amount` | `numeric(10,2)`. Minimum basket size to use a promo code. |

### 8.3 NOT MONEY, despite a money-ish name (do not "fix" these into Rappen)

| Table.column | Why it isn't money |
|---|---|
| `availability_slots.last_minute_discount_percent`, `off_peak_slots.discount_percent`, `salons.last_minute_discount_percent`, `salons.late_cancel_fee_percent`, `salons.deposit_percent`, `salon_last_minute_settings.global_discount_percent`, `salon_payouts.commission_percent`, `staff_members.commission_rate`, `tier_perks.discount_pct` | Percentages / rates (0-100, or a 0-1 fraction for `discount_pct`, e.g. `0.05 = 5%`). Real values confirm: `staff_members.commission_rate` samples as `40`, `35`, `0`. |
| `salons.vat_rate`, `bookings.vat_rate`, `salons.member_commission_waiver_rate` | Rates, not amounts (`8.1` = 8.1%, `0.02` = 2%). |
| `salon_analytics.total_bookings`, `salon_analytics.total_reviews`, `salon_analytics.cancellation_rate`, `salon_analytics.last_minute_conversion_rate` | Counts and rates from the analytics rollup, not currency. |
| `package_purchases.sessions_total`, `service_packages.total_sessions`, `tier_perks.max_discount_uses_per_window` | Counts (sessions, uses), not currency. |
| `loyalty_cards.stamps_needed`, `barber_loyalty_cards.stamps`, `barber_loyalty_programs.stamps_required`, `barber_loyalty_history.stamps_collected` | Stamp counts, not currency. |
| `loyalty_status.next_threshold`, `loyalty_status.to_next`, `loyalty_status.visits` | Visit counts for the Solen Status tier system, not currency, despite "threshold" sounding financial. |
| `salons.student_discount` | **Boolean**, not an amount. A toggle for "this salon offers a student discount," not the discount's size. |
| `bookings.member_discount_reserved` | **Boolean**, not a reservation of money. A flag consumed by `redeem_member_discount()` / `release_member_discount()`. |
| `nail_dynamic_pricing_rules.price_modifier` | `numeric(4,2)`, `CHECK (price_modifier BETWEEN 0.5 AND 2.0)`. A **multiplier**, not an amount, real values confirm it: `1.15` (peak), `0.90` (off-peak). This was flagged as needing a real check; checked, and it is not money. |
| `search_ranking_weights.vec_threshold` | Vector-similarity cosine threshold for search ranking, not currency. |
| `search_synonyms.price_canonical` | `text`. A canonical search-synonym hint string (e.g. `'schnitt'`), not a price value, despite the name. |
| `spa_treatment_rooms.capacity`, `nail_retail_products.low_stock_threshold` | Room/stock counts, not currency. |
| `user_style_affinity.attr_value` | `text`. A style-DNA attribute tag (matched the keyword scan on "value" only), not currency. |
| `platform_settings.value`, `platform_stats.value` | `jsonb` key/value stores, not a single-unit column at all. Real data shows both CHF (`{"reward_amount": 10}`) and percent (`{"rate_percent": 15}`) nested under different keys in the SAME jsonb column. Check the key before assuming a unit. |

### 8.4 Ambiguous: the unit depends on a sibling column, check it every time

| Table.column | Depends on | What actually happens |
|---|---|---|
| `promo_codes.discount_value` | `promo_codes.discount_type` (`'percent'` \| `'fixed'`) | Live data confirms both: `discount_type='percent'` rows hold a plain percent number (`10.00`, `20.00`); `discount_type='fixed'` rows hold CHF (`15.00`, matching code `CHF15RABATT`). Never read `discount_value` without also reading `discount_type`. |
| `pricing_rules.modifier_value` | `pricing_rules.modifier_type` (`'fixed_chf'` \| `'percentage'`) | Table is 0 rows live, so this is from the `CHECK` constraint, not sampled data: `fixed_chf` → CHF numeric, `percentage` → percent number, same column. |
| `salons.cancellation_fee_value` | `salons.cancellation_fee_type` (`'free'` \| `'flat'` \| `'percentage'`) | Confirmed in code, `lib/cancellation-policy.ts:26` `computePolicyFeeCents()`: "CHF for 'flat', percent 0-100 for 'percentage'." Same numeric(8,2) column holds either unit depending on the sibling. |
| `salons.no_show_fee_value` | `salons.no_show_fee_type` (`'free'` \| `'flat'` \| `'percentage'`) | Same function, same rule as `cancellation_fee_value` above. |
| `barber_loyalty_programs.reward_value`, `barber_loyalty_history.reward_value` | `reward_type` (`'free_service'` \| `'chf_discount'` \| `'percentage_discount'`) | Live data only has `reward_type='free_service'` rows (`reward_value` samples as `1`, `0`), where the value looks like a small index/count, not currency. `chf_discount` and `percentage_discount` are declared in `lib/validations.ts:621` / `lib/types.ts:1028` but **no code path branches on them today** (grepped, zero hits), the money-vs-percent behavior for this column is not yet implemented, flagged rather than guessed. |

### 8.5 The owner's decision, dated 2026-07-16: document, do not migrate

**Decision (`_backend-system/QUESTIONS.md` Q3, owner: "q3 document"): write every column's unit down here.
Do not migrate either convention onto the other.**

**Why:** both conventions are internally consistent today. Every sampled `bookings` row where both
`price_paid` and `paid_amount` are populated agrees exactly (`120.00` CHF == `12000` Rappen). There is
**no incident**: nothing has drifted, no bug has been traced to this split, and a migration would touch
roughly two dozen tables including the live `bookings` table (957 rows) plus every read site that
assumes decimal CHF. That is a large, live-data-touching change with no concrete problem driving it.
Documentation is free; a migration is not.

**What WOULD justify revisiting this:** an actual 100x bug happening, a real feature that summed or
compared a Rappen column against a CHF column without converting and produced a wrong number a human
noticed (a wrong invoice, a wrong payout, a wrong refund). Until that happens, this section is the
control: read it before writing any new code that touches more than one money column, especially
across tables.

### 8.6 The one canonical helper (there is only a CHF-to-Rappen direction, no reverse helper)

**`toRappen(chf: number): number`** in `lib/stripe.ts:23` (`Math.round(chf * 100)`). **Use this** any
time a CHF numeric value needs to become a Rappen integer at a boundary (Stripe API calls, a Rappen
column write, a Rappen comparison). It is already imported and used this way in
`lib/cancellation-policy.ts`, `lib/bookings/customer-cancel-money.ts`, `lib/bookings/charge-fee.ts`,
and `lib/credits/redeem.ts`.

**There is no `fromRappen` / `toCHF` helper.** Grepped `lib/` for `fromRappen`, `toCHF`,
`rappenToChf`, `chfFromRappen`: zero hits. Callers that need to go the other way (Rappen integer to
a CHF number for display or computation) do it inline, either a bare `/ 100` (e.g. the
`salon_payouts` migration comment: "gross_amount = pi.amount / 100") or by passing the Rappen number
straight into `formatCurrency()` after dividing manually. `lib/format-currency.ts`'s `formatCurrency()`
itself takes a plain CHF number, it does not know about Rappen and does not convert. If a second
call site needs the reverse conversion, write one `fromRappen()` next to `toRappen()` rather than
inlining `/ 100` again.

