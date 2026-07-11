-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Replace project-banned decorative icons in the service_categories seed with
-- neutral Lucide names (owner bans: no Sparkles/star glyph, no Zap/lightning).
-- Idempotent: only touches rows still carrying the banned values.
-- No production renderer maps icon_name today (CategoryTree types it but renders
-- chevrons only), so this is a data-hygiene fix with zero UI impact.
UPDATE service_categories SET icon_name = 'Gem'  WHERE icon_name = 'Sparkles';
UPDATE service_categories SET icon_name = 'Hand' WHERE icon_name = 'Zap';