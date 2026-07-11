-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Referral program (owner-greenlit 2026-07-03): admin enable/disable + admin-editable reward amount.
-- Additive rows in existing tables (idempotent).
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('referral', true, 'Referral program (invite a friend, both get credit)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_settings (key, value)
VALUES ('referral', '{"reward_amount": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;