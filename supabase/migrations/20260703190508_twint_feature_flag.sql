-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('twint', false, 'Offer TWINT at checkout (flip on once TWINT is enabled on the Stripe platform + connected accounts have the twint_payments capability)')
ON CONFLICT (key) DO NOTHING;