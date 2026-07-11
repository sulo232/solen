-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Ring 16: the per-stylist daily_limit cap was enforced by app-level SELECT count() then INSERT , a
-- check-then-act race (two concurrent bookings on different slots for the same stylist both pass and
-- oversell the cap). This BEFORE INSERT trigger runs in the insert's OWN transaction and takes a
-- per-(stylist, day) advisory xact lock, serializing count+insert atomically. Normal under-limit
-- inserts are untouched; only the rare race-loser is rejected. Additive, idempotent (CREATE OR
-- REPLACE), fail-open when the cap is off (the default).
CREATE OR REPLACE FUNCTION public.enforce_staff_daily_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
  v_limit   int;
  v_count   int;
  v_day     date;
BEGIN
  IF NEW.staff_member_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS NULL OR NEW.status NOT IN ('pending', 'pending_approval', 'confirmed', 'completed') THEN
    RETURN NEW;
  END IF;

  SELECT daily_limit_enabled, daily_limit
    INTO v_enabled, v_limit
  FROM public.salons
  WHERE id = NEW.salon_id;

  IF NOT COALESCE(v_enabled, false) OR v_limit IS NULL OR v_limit <= 0 THEN
    RETURN NEW;
  END IF;

  v_day := (NEW.starts_at)::date;

  PERFORM pg_advisory_xact_lock(hashtext(NEW.staff_member_id::text || ':' || v_day::text)::bigint);

  SELECT count(*)
    INTO v_count
  FROM public.bookings
  WHERE staff_member_id = NEW.staff_member_id
    AND salon_id = NEW.salon_id
    AND (starts_at)::date = v_day
    AND status IN ('pending', 'pending_approval', 'confirmed', 'completed');

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'staff_daily_limit_reached'
      USING ERRCODE = 'check_violation',
            HINT = 'This stylist has reached the salon daily booking limit.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_enforce_staff_daily_limit
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_staff_daily_limit();