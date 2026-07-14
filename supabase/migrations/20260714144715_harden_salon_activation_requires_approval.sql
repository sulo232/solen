-- applied live via MCP apply_migration 2026-07-14; file backfilled for fresh-env reproducibility.
-- exists-check: net-new guard trigger (npm run exists guard_salon_activation = 0 matches). Companion
-- one-time data backfill (run live, not a migration): UPDATE public.salons SET approved_at = now()
-- WHERE is_active AND approved_at IS NULL;
--
-- Harden the go-live approval gate at the DB level (app-level checks get bypassed , the backend's
-- number one lesson). A salon is only marketplace-visible (is_active) after an admin approves it
-- (approved_at set by PATCH /api/admin/salons/[id]/approve). Mirrors guard_profile_privilege_columns:
-- service_role (admin approve / seed / backfill) is exempt; the owner's session client (go-live) is
-- gated. Scoped to the false->true transition (and INSERT) so editing an already-live salon is never
-- blocked. Verified live (rolled-back): authenticated activation BLOCKED, service_role ALLOWED.
CREATE OR REPLACE FUNCTION public.guard_salon_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role'
     AND NEW.is_active = true
     AND NEW.approved_at IS NULL
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.is_active, false) = false)
  THEN
    RAISE EXCEPTION 'A salon can only go live after admin approval (approved_at is null).'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_guard_salon_activation
  BEFORE INSERT OR UPDATE ON public.salons
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_salon_activation();
