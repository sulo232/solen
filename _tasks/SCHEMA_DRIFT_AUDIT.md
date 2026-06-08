# Database Schema Drift Audit — 2026-05-29

## TL;DR
The live Supabase DB (`solen`, project `tocfnsmxmdxkrcmjzzdw`) is **missing roughly half
the schema** the repo's migrations define: **~78 tables and ~98 columns are absent**.
The entire "megabuild" feature layer has no backing tables here (loyalty, vouchers,
gift cards, group/guest bookings, staff scheduling, notifications, referrals,
`review_replies`, nail/barber/makeup features, the calendar/dashboard backend).
Core flows (homepage, search, discovery, basic salon) work because those tables exist;
anything touching the missing schema 404s / 500s.

## Root cause
Migration history is inconsistent. The repo has **141** migration files; the DB's
`supabase_migrations.schema_migrations` records only **42** (all timestamp-named, e.g.
`20260309115410`). The numeric "megabuild" migrations (`068_megabuild_foundation`,
`069_megabuild_staff`, …) and many feature migrations were never applied to this DB,
and aren't in its applied-list at all.

## Fixed so far (additive, safe — applied 2026-05-29)
- `salons.cancellation_window_hours` INTEGER DEFAULT 24  (from migration 068)
- `staff_members.average_rating` NUMERIC(3,2) DEFAULT 0  (from migration 069)

These two unblocked the **salon booking flow**, which was 404ing for *every* salon
(the page's salon query selects `cancellation_window_hours`; the staff query selects
`average_rating`). Verified working at `/de/salon/atelier-haarwerk/booking`.

## ⚠️ Production check needed
If production uses this same database (or a sibling at the same migration state),
**booking + any megabuild feature is broken there too**. Verify prod's schema separately.

## Recommended fix — do NOT brute-force via ad-hoc SQL
Applying ~100 migrations' worth of tables/columns by hand is corruption-prone: foreign-key
ordering, RLS policies, triggers, functions, and non-idempotent steps. On a DB with data,
that risks a worse outcome than the drift. Use the proper path:

- **If this DB's data is disposable (seed/demo):** `supabase db reset` rebuilds from all
  migrations into a pristine schema, then re-seed. Simplest route to "everything matches."
- **If data must be preserved:** take a backup, then `supabase db push` to apply pending
  migrations in order. The messy tracking likely needs `supabase migration repair` first to
  reconcile which migrations the DB considers applied.

## Full missing list (as of 2026-05-29, after the 2 fixes above)

### Missing tables (~78)
account_warnings, addons, barber_chairs, barber_cut_history, barber_loyalty_cards,
barber_loyalty_history, barber_loyalty_programs, barber_walkin_queue, booking_disputes,
booking_waitlist, bridal_workflows, chat_templates, client_formulas, client_notes,
client_photos, client_tags, consultation_notes, fade_blueprints, favorites, gift_cards,
group_bookings, guest_bookings, help_articles, intake_form_responses, inventory,
loyalty_cards, loyalty_stamps, makeup_face_charts, makeup_kit_items,
nail_client_preferences, nail_design_history, nail_dynamic_pricing_rules,
nail_inspo_boards, nail_inspo_images, nail_retail_products, nail_stations,
notification_preferences, notifications, off_peak_slots, package_purchases,
platform_settings, price_disputes, price_offers, pricing_rules, promo_codes,
push_subscriptions, quartier_subscriptions, referrals, review_photos, review_replies,
salon_analytics, salon_closures, salon_drafts, salon_groups, salon_last_minute_settings,
salon_payouts, salon_photos, service_addons, service_categories, service_packages,
sms_reminders, spa_treatment_rooms, staff_breaks, staff_calendars, staff_invites,
staff_portfolio_images, staff_schedules, staff_services, staff_time_off,
stylist_availability, tips, user_credits, voucher_purchases, vouchers,
waxing_sensitivity_log, waxing_zone_preferences, wellness_journals

### Missing columns (~98)
blocked_dates: end_date, start_date
bookings: acquisition_source, completed_at, crm_photo_url, extras_addons, extras_bleaching,
  group_booking_id, is_express_rebook, paid_amount, paid_via, rebooked_from_id,
  refunded_amount, reviewed, service_revenue, stripe_customer_id, stripe_payment_method_id,
  stripe_setup_intent_id, stylist_selection_fee, utm_campaign, utm_medium, utm_source,
  walkin_queue_id
client_formulas: ends_formula, mid_lengths_formula, root_formula, shade_code, staff_member_id
price_disputes: customer_responded_at, expires_at
profiles: birthday, customer_preferences, staff_salon_id
referrals: code, max_uses, reward_amount
reviews: google_review_id, owner_reply, owner_reply_at, photo_url, source
salon_photos: photo_type
salons: auto_assign_method, auto_complete_enabled, cancellation_fee_percent,
  cancellation_hours, deposit_percent, facebook_url, late_cancel_fee_percent, payment_mode,
  service_settings, vacation_end, vacation_start, walk_in_available
services: buffer_minutes, curing_minutes, daily_limit_per_staff, finishing_minutes,
  gender_tags, material_type, photo_urls, processing_minutes, reminder_cycle_days,
  station_required, store_id
staff_members: accent_color, can_edit_schedule, can_manage_portfolio, can_view_own_bookings,
  cover_photo_url, instagram_url, review_count, slug, user_id, years_experience
staff_portfolio_images: barber_style, before_photo_url, fade_type, is_before_after,
  nail_material, nail_shape, nail_style, tags
staff_services: price_override, tier_label
store_staff: bookable, selection_fee, specialties
stores: avg_rating, cancellation_policy, categories, email, google_place_id, instagram,
  is_verified, lat, lng, opening_hours, photo_url, review_count

(Note: several "missing columns" belong to tables that are themselves missing — those
resolve once the table is created by its migration.)

## How this list was produced
Extracted every `ADD COLUMN` / `CREATE TABLE` target from `supabase/migrations/*.sql`,
diffed against `information_schema` on the live DB via the Supabase MCP.
