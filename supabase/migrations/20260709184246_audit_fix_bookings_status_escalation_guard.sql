-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Audit LOYALTY C1 (DB-direct vector): a customer could PATCH/REST their own booking to
-- status='completed' to farm Solen Status tier + the member discount. The API vector is closed
-- (route guard), this closes the direct-Supabase-REST vector. BEFORE UPDATE trigger: service_role
-- (crons/webhook/admin client), the salon owner, and admins pass; a customer self-marking
-- completed/no_show is rejected. status='cancelled' is NOT gated, so customer-cancel is unaffected.
CREATE OR REPLACE FUNCTION public.guard_booking_status_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- backend writes (service role: crons, webhook, admin client) always pass
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- only a status change TO completed/no_show is gated (cancel/other are free)
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('completed', 'no_show') THEN
    IF NOT EXISTS (SELECT 1 FROM public.salons s WHERE s.id = NEW.salon_id AND s.owner_id = (SELECT auth.uid()))
       AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin') THEN
      RAISE EXCEPTION 'Only the salon or an admin may mark a booking as %', NEW.status USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_booking_status_escalation') THEN
    CREATE TRIGGER trg_guard_booking_status_escalation
      BEFORE UPDATE ON public.bookings
      FOR EACH ROW EXECUTE FUNCTION public.guard_booking_status_escalation();
  END IF;
END $$;