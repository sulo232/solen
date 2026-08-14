-- exists-check: net-new (no referral flag/setting existed). Owner-greenlit referral program build
-- (2026-07-03). Applied via MCP apply_migration; mirrored here. Additive rows in existing tables.

-- Admin enable/disable toggle for the referral program.
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('referral', true, 'Referral program (invite a friend, both get credit)')
ON CONFLICT (key) DO NOTHING;

-- Admin-editable global reward amount (CHF). Stored in platform_settings, mirroring the commission row.
INSERT INTO public.platform_settings (key, value)
VALUES ('referral', '{"reward_amount": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;
