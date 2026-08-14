-- exists-check: extends 20260602083300_financial_retention_on_delete.sql (the anonymize trigger) and
-- ALTERs 14 pre-existing functions. Net-new file (never edit an applied historical migration), but it
-- OWNS no table. Face 10 of the backend hardening sweep; applied 2026-07-03 via MCP apply_migration,
-- mirrored here for repo reproducibility.

-- Additive/safe: pin search_path on functions flagged function_search_path_mutable, and extend the
-- GDPR erasure trigger to scrub PII it previously missed.

-- A. Pin search_path (prevents a search_path hijack, especially on the SECURITY DEFINER ones).
--    'public','pg_temp' keeps unqualified refs to public tables/extensions (cube/earthdistance) working.
ALTER FUNCTION public.handle_new_user() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_salon_rating() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.get_last_minute_slots(text, text) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.increment_unread(uuid, boolean) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.fn_sibling_salons(uuid) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.resequence_walkin_queue(uuid) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.generate_referral_code() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.create_group_booking(text, uuid, integer, text, jsonb) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_pricing_rules_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.salons_with_slot_in_hours(integer, integer, timestamp with time zone, timestamp with time zone) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.toggle_discovery_like(uuid, uuid) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.toggle_discovery_save(uuid, uuid, uuid) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.get_nearby_salon_ids(double precision, double precision, double precision) SET search_path = 'public', 'pg_temp';

-- C. Extend the GDPR erasure trigger. barber_walkin_queue and barber_cut_history have no FK on
--    customer_id so nothing cascades; reviews.comment is free text with potential PII.
CREATE OR REPLACE FUNCTION public.anonymize_financial_rows_on_profile_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.bookings
  SET user_id = NULL, guest_name = 'Deleted user', guest_email = NULL,
      guest_phone = '[redacted]', anonymized_at = now()
  WHERE user_id = OLD.id AND anonymized_at IS NULL;

  IF to_regclass('public.booking_disputes') IS NOT NULL THEN
    UPDATE public.booking_disputes
    SET reporter_id = CASE WHEN reporter_id = OLD.id THEN NULL ELSE reporter_id END,
        reported_id = CASE WHEN reported_id = OLD.id THEN NULL ELSE reported_id END,
        requested_by_user_id = CASE WHEN requested_by_user_id = OLD.id THEN NULL ELSE requested_by_user_id END,
        resolved_by = CASE WHEN resolved_by = OLD.id THEN NULL ELSE resolved_by END,
        guest_name = NULL, guest_email = NULL, guest_phone = NULL,
        customer_response = NULL, description = NULL
    WHERE reporter_id = OLD.id OR reported_id = OLD.id
       OR requested_by_user_id = OLD.id OR resolved_by = OLD.id;
  END IF;

  IF to_regclass('public.case_events') IS NOT NULL THEN
    UPDATE public.case_events SET actor_user_id = NULL, note = NULL WHERE actor_user_id = OLD.id;
  END IF;

  -- Added 2026-07-03 (Face 10): scrub barber PII (no customer_id FK so nothing cascades).
  IF to_regclass('public.barber_walkin_queue') IS NOT NULL THEN
    UPDATE public.barber_walkin_queue
    SET customer_name = 'Deleted user', customer_phone = '[redacted]'
    WHERE customer_id = OLD.id;
  END IF;

  IF to_regclass('public.barber_cut_history') IS NOT NULL THEN
    UPDATE public.barber_cut_history
    SET customer_name = 'Deleted user', notes = NULL, photo_url = NULL
    WHERE customer_id = OLD.id;
  END IF;

  -- reviews.comment is free text with potential PII; null it but keep the rating for aggregates.
  IF to_regclass('public.reviews') IS NOT NULL THEN
    UPDATE public.reviews SET comment = NULL WHERE user_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$function$;
