-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
CREATE OR REPLACE FUNCTION public.guard_profile_privilege_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    NEW.role           := OLD.role;
    NEW.is_admin       := OLD.is_admin;
    NEW.is_suspended   := OLD.is_suspended;
    NEW.account_status := OLD.account_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_guard_profile_privilege_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privilege_columns();