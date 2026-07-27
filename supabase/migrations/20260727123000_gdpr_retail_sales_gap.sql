-- exists-check: extends public.anonymize_financial_rows_on_profile_delete() (CREATE OR REPLACE,
-- same function name; npm run exists anonymize_financial_rows confirms it, 2026-07-27). Net-new
-- vs 20260602083300_financial_retention_on_delete.sql / 20260703001317_.../20260713150000_...
-- is only the retail_sales branch added below.
-- ============================================================
-- 20260727123000_gdpr_retail_sales_gap
-- data-money-10: a live pg_constraint audit (2026-07-27, see
-- _backend-system/audit/GDPR_TABLE_COVERAGE.md for the full table-by-table verdict) found one
-- table with a personal-data column that neither a real FK nor the anonymize trigger covers:
-- retail_sales.customer_id (uuid, nullable, no FK to profiles/auth.users). Every OTHER dangling
-- customer_id/client_id/user_id-shaped column already found by the 20260713150000 migration's
-- own column-by-column audit is confirmed still covered live (verified this session by reading
-- pg_get_functiondef on the trigger). retail_sales currently holds 11 rows, 0 with customer_id
-- set (pre-launch seed data), so this is not a live PII leak today, but the column exists and the
-- next order that sets it would create exactly the dangling-id-survives-deletion gap the rest of
-- this trigger exists to close.
-- ============================================================

CREATE OR REPLACE FUNCTION public.anonymize_financial_rows_on_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.bookings SET user_id = NULL, guest_name = 'Deleted user', guest_email = NULL, guest_phone = '[redacted]', anonymized_at = now() WHERE user_id = OLD.id AND anonymized_at IS NULL;
  IF to_regclass('public.booking_disputes') IS NOT NULL THEN
    UPDATE public.booking_disputes SET reporter_id = CASE WHEN reporter_id = OLD.id THEN NULL ELSE reporter_id END, reported_id = CASE WHEN reported_id = OLD.id THEN NULL ELSE reported_id END, requested_by_user_id = CASE WHEN requested_by_user_id = OLD.id THEN NULL ELSE requested_by_user_id END, resolved_by = CASE WHEN resolved_by = OLD.id THEN NULL ELSE resolved_by END, guest_name = NULL, guest_email = NULL, guest_phone = NULL, customer_response = NULL, description = NULL WHERE reporter_id = OLD.id OR reported_id = OLD.id OR requested_by_user_id = OLD.id OR resolved_by = OLD.id;
  END IF;
  IF to_regclass('public.case_events') IS NOT NULL THEN UPDATE public.case_events SET actor_user_id = NULL, note = NULL WHERE actor_user_id = OLD.id; END IF;
  IF to_regclass('public.barber_walkin_queue') IS NOT NULL THEN UPDATE public.barber_walkin_queue SET customer_id = NULL, customer_name = 'Deleted user', customer_phone = '[redacted]' WHERE customer_id = OLD.id; END IF;
  IF to_regclass('public.barber_cut_history') IS NOT NULL THEN UPDATE public.barber_cut_history SET customer_id = NULL, customer_name = 'Deleted user', notes = NULL, photo_url = NULL WHERE customer_id = OLD.id; END IF;
  IF to_regclass('public.reviews') IS NOT NULL THEN UPDATE public.reviews SET comment = NULL WHERE user_id = OLD.id; END IF;
  IF to_regclass('public.client_formulas') IS NOT NULL THEN UPDATE public.client_formulas SET customer_id = NULL, notes = NULL WHERE customer_id = OLD.id; END IF;
  IF to_regclass('public.intake_form_responses') IS NOT NULL THEN UPDATE public.intake_form_responses SET customer_id = NULL, responses = '{}'::jsonb, ai_recommendation = NULL WHERE customer_id = OLD.id; END IF;
  IF to_regclass('public.client_photos') IS NOT NULL THEN UPDATE public.client_photos SET customer_id = NULL, photo_url = NULL WHERE customer_id = OLD.id; END IF;
  IF to_regclass('public.nail_design_history') IS NOT NULL THEN UPDATE public.nail_design_history SET customer_id = NULL, notes = NULL, photo_url = NULL WHERE customer_id = OLD.id; END IF;
  IF to_regclass('public.nail_client_preferences') IS NOT NULL THEN UPDATE public.nail_client_preferences SET customer_id = NULL, allergy_notes = NULL, notes = NULL WHERE customer_id = OLD.id; END IF;
  IF to_regclass('public.package_purchases') IS NOT NULL THEN UPDATE public.package_purchases SET user_id = NULL WHERE user_id = OLD.id; END IF;
  IF to_regclass('public.gift_cards') IS NOT NULL THEN UPDATE public.gift_cards SET purchaser_user_id = NULL, purchaser_email = NULL WHERE purchaser_user_id = OLD.id; END IF;
  IF to_regclass('public.group_bookings') IS NOT NULL THEN UPDATE public.group_bookings SET organizer_user_id = NULL, organizer_name = 'Deleted user', organizer_phone = NULL, notes = NULL WHERE organizer_user_id = OLD.id; END IF;
  IF to_regclass('public.tips') IS NOT NULL THEN UPDATE public.tips SET user_id = NULL WHERE user_id = OLD.id; END IF;
  IF to_regclass('public.staff_members') IS NOT NULL THEN UPDATE public.staff_members SET user_id = NULL WHERE user_id = OLD.id; END IF;
  IF to_regclass('public.salon_clients') IS NOT NULL THEN BEGIN UPDATE public.salon_clients SET profile_id = NULL, email = NULL, name = 'Deleted client', phone = NULL, notes = NULL WHERE profile_id = OLD.id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'salon_clients scrub failed for %: %', OLD.id, SQLERRM; END; END IF;
  IF to_regclass('public.user_salon_affinity') IS NOT NULL THEN BEGIN DELETE FROM public.user_salon_affinity WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'user_salon_affinity delete failed for %: %', OLD.id, SQLERRM; END; END IF;
  IF to_regclass('public.spa_treatment_outcomes') IS NOT NULL THEN BEGIN UPDATE public.spa_treatment_outcomes SET client_id = NULL, skin_before = NULL, skin_after = NULL, follow_up_notes = NULL WHERE client_id = OLD.id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'spa_treatment_outcomes scrub failed for %: %', OLD.id, SQLERRM; END; END IF;
  -- data-money-10 (2026-07-27): retail_sales.customer_id has no FK to profiles/auth.users, so a
  -- deleted profile's id would otherwise survive here forever with no trigger touching it.
  IF to_regclass('public.retail_sales') IS NOT NULL THEN BEGIN UPDATE public.retail_sales SET customer_id = NULL WHERE customer_id = OLD.id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'retail_sales scrub failed for %: %', OLD.id, SQLERRM; END; END IF;
  RETURN OLD;
END;
$function$;
