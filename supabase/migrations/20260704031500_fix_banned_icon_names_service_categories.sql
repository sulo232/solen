-- Replace project-banned decorative icons in the service_categories seed with
-- neutral Lucide names (owner bans: no Sparkles/star glyph, no Zap/lightning).
-- Idempotent: only touches rows still carrying the banned values.
-- No production renderer maps icon_name today (CategoryTree types it but renders
-- chevrons only), so this is a data-hygiene fix with zero UI impact.
-- Applied live via apply_migration 2026-07-04.
UPDATE service_categories SET icon_name = 'Gem'  WHERE icon_name = 'Sparkles';
UPDATE service_categories SET icon_name = 'Hand' WHERE icon_name = 'Zap';
