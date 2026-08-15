-- Staff accounts & permissions foundation.
-- Applied directly to the live DB via Supabase MCP on 2026-05-30 (recorded as
-- migration "staff_accounts_permissions"). The megabuild 069 track was never pushed
-- and the live DB is on a different lineage, so this documents the exact additive,
-- idempotent change. Matches the existing /api/staff/invite + /api/staff/accept-invite
-- routes (which expect staff_members.user_id, profiles.staff_salon_id, staff_invites
-- with token/status/expires_at/accepted_by) and adds access_role + permissions.

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS access_role TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_staff_members_user ON staff_members(user_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_salon_id UUID;

CREATE TABLE IF NOT EXISTS staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  staff_name TEXT,
  access_role TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_invites_salon ON staff_invites(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_invites_token ON staff_invites(token);
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invites_owner_manage" ON staff_invites;
CREATE POLICY "invites_owner_manage" ON staff_invites FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
