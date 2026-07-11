-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- E2E audit A4 F2: salons.average_rating / review_count drifted because the cache
-- trigger (a) counted hidden reviews and (b) only fired AFTER INSERT, so a
-- moderated (is_hidden=true) or deleted review was never removed from the cached
-- aggregate that feeds search ranking. Fix: exclude hidden, recompute on
-- INSERT/UPDATE/DELETE (DELETE handled via COALESCE(NEW,OLD)).
CREATE OR REPLACE FUNCTION public.update_salon_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE sid uuid := COALESCE(NEW.salon_id, OLD.salon_id);
BEGIN
  UPDATE public.salons
  SET
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE salon_id = sid AND is_hidden = false),
    review_count   = (SELECT COUNT(*) FROM public.reviews WHERE salon_id = sid AND is_hidden = false)
  WHERE id = sid;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE TRIGGER reviews_update_salon_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_salon_rating();