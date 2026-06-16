-- Full multi-lang support for discovery looks (owner 2026-06-14). Descriptions are already de/en/fr/it; add the
-- missing salon_script_en + per-locale products columns so the cut-script (booking note) and products render in
-- the viewer's language. Additive + reversible. Backfilled via POST /api/admin/discovery/backfill?mode=i18n.
alter table discovery_items
  add column if not exists salon_script_en text,
  add column if not exists products_de text[],
  add column if not exists products_en text[],
  add column if not exists products_fr text[],
  add column if not exists products_it text[];
