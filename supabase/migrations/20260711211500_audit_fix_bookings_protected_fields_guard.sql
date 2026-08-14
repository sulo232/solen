-- exists-check: net-new vs 039_loyalty.sql, 002_profiles.sql, 031_audit_log.sql, 058_client_tags.sql,
-- 004_salon_photos.sql, 053_salon_groups.sql, 037_price_offers.sql, 040_client_notes.sql because none
-- of them define a bookings guard; this extends the SAME pattern as the sibling
-- 20260709184246_audit_fix_bookings_status_escalation_guard.sql (a BEFORE UPDATE trigger on
-- public.bookings), just gating a different set of columns.
--
-- Audit finding (high, 20260601_sp1_bookings_guest_rls.sql ~line 44): the bookings_update_own
-- policy's implicit WITH CHECK (RLS reuses USING when no WITH CHECK is given) lets a customer
-- write ANY new values to their own booking row, including price_paid / the loyalty tier fields /
-- every payment column, not just status. Only the status escalation vector (mark completed/no_show)
-- was closed, by trg_guard_booking_status_escalation in
-- 20260709184246_audit_fix_bookings_status_escalation_guard.sql.
--
-- Not fixed with a stricter WITH CHECK: RLS policy expressions have no OLD row to diff against
-- (WITH CHECK only sees the NEW row), so field-level immutability needs a BEFORE UPDATE trigger,
-- same mechanism as the status-escalation guard above. Also NOT edited into
-- 20260601_sp1_bookings_guest_rls.sql directly: that migration predates the loyalty tier columns
-- (added later in 20260614010000_solen_plus_phase1_perks.sql) and, per this repo's own convention,
-- every prior hardening pass on this table shipped as its own new audit_fix_* migration rather than
-- an edit to an already-applied historical file (see 20260709184246, 20260710225432, etc).
--
-- service_role (crons/webhook/admin client), the salon owner, and admins pass; a customer changing
-- a price/tier/payment column on their own booking is rejected.
CREATE OR REPLACE FUNCTION public.guard_booking_protected_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- backend writes (service role: crons, webhook, admin client) always pass
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.price_paid               IS DISTINCT FROM OLD.price_paid
     OR NEW.applied_tier          IS DISTINCT FROM OLD.applied_tier
     OR NEW.tier_discount_amount  IS DISTINCT FROM OLD.tier_discount_amount
     OR NEW.payment_status        IS DISTINCT FROM OLD.payment_status
     OR NEW.paid_amount           IS DISTINCT FROM OLD.paid_amount
     OR NEW.platform_fee          IS DISTINCT FROM OLD.platform_fee
     OR NEW.refunded_amount       IS DISTINCT FROM OLD.refunded_amount
     OR NEW.paid_via              IS DISTINCT FROM OLD.paid_via
     OR NEW.stripe_customer_id        IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_payment_method_id  IS DISTINCT FROM OLD.stripe_payment_method_id
     OR NEW.stripe_setup_intent_id    IS DISTINCT FROM OLD.stripe_setup_intent_id
     OR NEW.fee_charge_status     IS DISTINCT FROM OLD.fee_charge_status
     OR NEW.fee_charged_amount    IS DISTINCT FROM OLD.fee_charged_amount
     OR NEW.fee_charge_intent_id  IS DISTINCT FROM OLD.fee_charge_intent_id
     OR NEW.fee_charge_kind       IS DISTINCT FROM OLD.fee_charge_kind
  THEN
    IF NOT EXISTS (SELECT 1 FROM public.salons s WHERE s.id = NEW.salon_id AND s.owner_id = (SELECT auth.uid()))
       AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin') THEN
      RAISE EXCEPTION 'Only the salon or an admin may change price, tier, or payment fields on a booking' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_booking_protected_fields') THEN
    CREATE TRIGGER trg_guard_booking_protected_fields
      BEFORE UPDATE ON public.bookings
      FOR EACH ROW EXECUTE FUNCTION public.guard_booking_protected_fields();
  END IF;
END $$;
