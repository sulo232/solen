-- NOT YET APPLIED as of this commit. To be applied via the Supabase MCP
-- `apply_migration` tool (never `supabase db push`, this project's migration
-- history has diverged from the remote schema_migrations table, same note
-- carried by 20260904171636_email_reminder_sent_columns.sql), by the
-- orchestrator after this round is reviewed.
--
-- exists-check: `npm run exists refund_policy` (2026-09-04), 0 hits.
-- platform_settings already has a 'commission' key ({rate_percent}), the
-- platform's cut of a charge, but nothing for whether a REFUND also gives
-- that commission back (lib/bookings/refund-config.ts D7). This adds that
-- key; no new table or column, platform_settings already exists live
-- (055_platform_commission.sql / 20260602090000_seed_platform_settings_and_warnings.sql).
--
-- cron-health SLICE stripe-refunds (b): lib/bookings/refund-config.ts today
-- resolves refundApplicationFeeDefault from ONLY an env var
-- (REFUND_APP_FEE_DEFAULT), with a comment naming the exact key this seeds
-- ('refund_policy') as the place to wire it once the table gains one, "ahead
-- of the env fallback". This migration adds that row; getRefundConfig() is
-- updated in the same round to read it first, falling back to the env var
-- and then the hardcoded default when the row or key is absent.
--
-- Value shape mirrors the existing 'commission' row: a jsonb object under a
-- descriptive key, using this table's existing key/value/updated_at/updated_by
-- columns, no DDL. `refund_application_fee_default: false` matches the
-- current hardcoded default (D7: keep the commission unless the law requires
-- giving it back), so seeding this row changes NOTHING about today's
-- behavior; it only makes the value admin-configurable going forward.
INSERT INTO public.platform_settings (key, value)
VALUES ('refund_policy', '{"refund_application_fee_default": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
