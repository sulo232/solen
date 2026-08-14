| file | verdict | detail | branch |
|---|---|---|---|
| 20260530140000_staff_scheduling_foundation.sql | ALREADY LIVE | table staff_breaks, table salon_closures, table staff_time_o | claude/nice-hugle-c0b706 |
| 20260530150000_staff_accounts_permissions.sql | ALREADY LIVE | table staff_invites, staff_members.user_id, staff_members.ac | claude/nice-hugle-c0b706 |
| 20260530160000_calendar_crm_and_sales.sql | ALREADY LIVE | table sales, table salon_clients, table sale_line_items | claude/nice-hugle-c0b706 |
| 20260530170000_calendar_slot_client_link.sql | ALREADY LIVE | availability_slots.client_id | claude/nice-hugle-c0b706 |
| 20260530_partner_leads.sql | ALREADY LIVE | table partner_leads | claude/magical-swanson-143371 |
| 20260531100000_salon_calendar_color_settings.sql | ALREADY LIVE | salons.calendar_color_by | claude/nice-hugle-c0b706 |
| 20260616120000_client_notes_allow_reminder_note_types.sql | no table/column to check | policy, index, grant or function only | claude/crazy-bose-57e405 |
| 20260623100000_add_bookings_arrived_at.sql | ALREADY LIVE | bookings.arrived_at | claude/crazy-bose-57e405 |
| 20260623100100_add_bookings_completed_at.sql | ALREADY LIVE | bookings.completed_at | claude/crazy-bose-57e405 |
| 20260623224212_perf_add_missing_fk_indexes.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260623224355_perf_rls_initplan_wrap_auth_calls.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260623_affinity_signals_v2.sql | no table/column to check | policy, index, grant or function only | feat/search-book-points |
| 20260623_salon_engagement_phase4.sql | ALREADY LIVE | table salon_engagement | feat/search-book-points |
| 20260623_search_book_attribution.sql | ALREADY LIVE | bookings.attributed_search_event_id | feat/search-book-points |
| 20260623_user_salon_affinity.sql | ALREADY LIVE | table user_salon_affinity | feat/search-book-points |
| 20260624064701_perf_discovery_feed_for_you_join_promote.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260624070907_security_close_anon_write_holes.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260624071806_perf_consolidate_permissive_policies.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260624120000_salon_resubmit_discriminator.sql | ALREADY LIVE | salons.rejected_at | claude/crazy-bose-57e405 |
| 20260624140000_allow_infill_reminder_note_type.sql | no table/column to check | policy, index, grant or function only | claude/crazy-bose-57e405 |
| 20260624150000_add_deals_enabled_to_notification_preferences.sql | ALREADY LIVE | notification_preferences.deals_enabled | claude/crazy-bose-57e405 |
| 20260625120000_hand_chart_notes.sql | ALREADY LIVE | table hand_chart_notes | claude/crazy-bose-57e405 |
| 20260628152951_perf_distribute_all_policies_per_command.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260628153235_perf_reindex_fks_and_wrap_auth_email.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260628153423_perf_rls_initplan_wrap_followup.sql | no table/column to check | policy, index, grant or function only | claude/adoring-curie-22ecac |
| 20260630_ob2_profiling_columns.sql | ALREADY LIVE | salons.acquisition_source | claude/bold-hellman-b31513 |
| 20260703100000_harden_fn_searchpath_and_gdpr_trigger.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703100100_harden_revoke_internal_trigger_rpc.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703110000_perf_bookings_composite_indexes.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703120000_perf_booking_counts_by_salon_rpc.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703130000_perf_salon_client_summary_rpc.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703140000_perf_earliest_slots_by_service_rpc.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703150000_fix_booking_disputes_status_check.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703150100_drop_leftover_test_table.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703160000_referral_flag_and_reward_setting.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703160100_fix_voucher_rls_leak_and_flag.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703170000_lock_staff_members_sensitive_columns_POSTDEPLOY.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703180000_voucher_redemption_ledger_and_rpcs.sql | ALREADY LIVE | table voucher_redemptions, bookings.voucher_code | claude/clever-mirzakhani-1af8ef |
| 20260703190000_credit_redemption_ledger_and_rpcs.sql | ALREADY LIVE | table credit_redemptions, bookings.referral_code | claude/clever-mirzakhani-1af8ef |
| 20260703191000_referral_credit_double_mint_backstop.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703192000_fix_redeem_idempotency.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703193000_twint_feature_flag.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703194000_gdpr_deletion_columns.sql | ALREADY LIVE | profiles.deletion_requested_at, profiles.account_status | claude/clever-mirzakhani-1af8ef |
| 20260703195000_gap_hunt_d3_d5_d8_hardening.sql | ALREADY LIVE | profiles.no_show_count | claude/clever-mirzakhani-1af8ef |
| 20260703200000_repair_short_slots_REVIEW.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260703201000_verification_token_and_bell_read_state.sql | ALREADY LIVE | profiles.dashboard_notifications_read_at, salons.verificatio | claude/clever-mirzakhani-1af8ef |
| 20260703210000_demo_data_flag.sql | no table/column to check | policy, index, grant or function only | claude/sad-austin-a99451 |
| 20260704031500_fix_banned_icon_names_service_categories.sql | no table/column to check | policy, index, grant or function only | claude/clever-mirzakhani-1af8ef |
| 20260706_e2e_security_hardening.sql | no table/column to check | policy, index, grant or function only | claude/happy-jackson-514459 |
| 20260707120000_security_phase1_profiles_privilege_guard.sql | no table/column to check | policy, index, grant or function only | claude/cranky-bose-5621bf |
| 20260707130000_security_phase1_gift_cards_select_scope.sql | no table/column to check | policy, index, grant or function only | claude/cranky-bose-5621bf |
| 20260707160000_bookings_one_active_per_slot.sql | no table/column to check | policy, index, grant or function only | claude/cranky-bose-5621bf |
| 20260707170000_purge_past_available_slots_fn.sql | no table/column to check | policy, index, grant or function only | claude/cranky-bose-5621bf |
| 20260707180000_purge_fn_lockdown.sql | no table/column to check | policy, index, grant or function only | claude/cranky-bose-5621bf |
| 20260707193000_salons_auto_complete_enabled_drift_reconcile.sql | ALREADY LIVE | salons.auto_complete_enabled | claude/cranky-bose-5621bf |
| 20260711170000_revoke_anon_promo_reserve_rpcs.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711170100_revoke_anon_member_discount_reserve_rpcs.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711210028_backend_loop_widen_client_notes_system_type.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711211500_audit_fix_bookings_protected_fields_guard.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711212000_audit_fix_next_available_dates_search_path.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711231500_audit_fix_quartier_subscriptions_drop_public_insert.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711232000_perf_discovery_items_rls_initplan.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711233000_audit_fix_slot_hours_zurich_tz.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260711233100_audit_fix_member_discount_caller_guard.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712010000_audit_fix_partner_leads_missing_migration.sql | PARTIAL | table is | claude/backend-analysis-improvements-77f02b |
| 20260712010500_audit_fix_profile_summaries_missing_migration.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712104000_walkin_queue_dedupe_unique.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712140000_audit_fix_profile_views_writable_critical.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712150000_audit_fix_chat_media_insert_policy.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712150000_audit_fix_quick_action_token_single_use.sql | NOT LIVE | bookings.consumed_at | claude/backend-analysis-improvements-77f02b |
| 20260712150500_audit_fix_group_booking_salon_check.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712160000_create_missing_storage_buckets.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712160500_c1_availability_slots_public_view.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712161000_c1_flip_availability_slots_owner_only.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712170000_create_staff_portfolio_bucket.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260712180000_fix_chat_media_insert_folder_ownership.sql | no table/column to check | policy, index, grant or function only | claude/backend-analysis-improvements-77f02b |
| 20260716150000_null_fabricated_salon_amenities.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260716210000_review_photos_insert_policy.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717120000_backend_law_fix13_storage_mime_allowlists.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717130000_wrap_bare_auth_uid_rls_policies.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717140000_csp_violation_reports.sql | NOT LIVE | table csp_violation_reports | claude/quirky-ellis-ef5559 |
| 20260717150000_null_safe_discovery_toggle_guards.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717160000_salon_payouts_full_unique_index.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717170000_package_purchases_fks.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717180000_availability_slots_c1_barrier_view_and_owner_only.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717190000_bookings_money_column_comments.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260717200000_walkin_tracking_token_hash.sql | NOT LIVE | barber_walkin_queue.tracking_token_hash | claude/quirky-ellis-ef5559 |
| 20260718100000_walkin_tracking_token_nullable_and_null.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260718110000_revoke_trigger_fn_rpc_execute.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260718120000_scope_public_bucket_listing.sql | no table/column to check | policy, index, grant or function only | claude/quirky-ellis-ef5559 |
| 20260721100000_salon_payment_mode_admin_enforce.sql | NOT LIVE | salons.payment_mode_admin, salons.payment_mode_enforced | claude/quirky-ellis-ef5559 |