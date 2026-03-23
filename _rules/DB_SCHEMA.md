# Database Schema

## 6. Supabase Schema (New — Migration 014+)

| Table | Key Columns | Notes |
|---|---|---|
| `salons` | `id`, `owner_id`, `name`, `slug`, `categories[]`, `quartier`, `address`, `latitude`, `longitude`, `is_active`, `average_rating`, `review_count`, `group_id`, `solen_score`, `solen_tier`, `score_details`, `cancellation_count`, `stripe_account_id`, `accepts_online_payment`, `phone_verified` | **No `status` column.** `is_active` is the field. RLS enforces `is_active=true` for anon. `group_id` FK → `salon_groups`. `solen_score` 0-100, `solen_tier` gold/teal/grey/dark, computed nightly by cron. |
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
| `service_packages` | `id`, `salon_id`, `name`, `service_id`, `sessions`, `bonus_sessions`, `price`, `is_active` | Multi-session punch cards. |
| `package_purchases` | `id`, `package_id`, `customer_id`, `sessions_used`, `payment_intent_id`, `purchased_at` | Package purchase tracking. |
| `client_formulas` | `id`, `salon_id`, `customer_id`, `brand`, `product_line`, `mix_formula`, `developer_volume`, `processing_minutes`, `notes` | Hair color formulas. |
| `client_photos` | `id`, `salon_id`, `customer_id`, `photo_url`, `photo_type`, `notes` | Before/after + progress photos. `photo_type`: before/after/progress. |
| `intake_forms` | `id`, `salon_id`, `customer_id`, `template_type`, `responses`, `ai_recommendation` | Consultation intake forms. `template_type`: hair/nail/waxing/makeup/spa. |
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

