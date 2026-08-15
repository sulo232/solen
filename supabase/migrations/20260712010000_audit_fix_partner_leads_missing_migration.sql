-- exists-check: net-new vs supabase/migrations/031_audit_log.sql, 014_new_schema.sql,
-- 058_client_tags.sql, 080_salon_drafts.sql, 004_salon_photos.sql, 040_client_notes.sql,
-- 053_salon_groups.sql, 034_service_addons.sql because none of those files reference or
-- create partner_leads; that table has no migration file at all (grep confirms it, and
-- npm run exists partner_leads only hits app/api/partner/leads/route.ts + generated
-- lib/database.types.ts). This is the missing migration for that already-live table, not
-- an extension of an unrelated one.
--
-- Ring: partner_leads is a LIVE table (5 rows, RLS enabled per _inventory/_db-snapshot.json)
-- written by app/api/partner/leads/route.ts, but it had no migration file, so its schema was
-- not reproducible from source (audit finding, low severity). This documents the live schema,
-- reconstructed from lib/database.types.ts (generated from the live DB) plus the columns
-- confirmed live in _inventory/_db-columns.json (id, email, salon_name, source, created_at).
--
-- CREATE TABLE IF NOT EXISTS is a no-op against the already-existing live table; this migration
-- exists purely so the schema is versioned going forward, not to change any live behavior.
-- No RLS policies are added here (unknown live policy state cannot be safely reconstructed from
-- outside the DB), only ENABLE ROW LEVEL SECURITY, which is idempotent and matches the live
-- rls=true captured in the snapshot. The only write path remains the service-role admin client
-- in app/api/partner/leads/route.ts, which bypasses RLS entirely.
CREATE TABLE IF NOT EXISTS partner_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  salon_name text NOT NULL,
  source text NOT NULL DEFAULT 'partner_page',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_leads ENABLE ROW LEVEL SECURITY;
