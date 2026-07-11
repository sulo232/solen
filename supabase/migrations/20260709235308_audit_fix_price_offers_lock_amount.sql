-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Latent CRITICAL (price-offer accept trusts price_offers.amount_chf, but the RLS UPDATE policy's
-- NULL with_check backfills only row-ownership, so the customer can rewrite amount_chf via direct
-- REST before accepting). RLS cannot express column-level restriction, so lock it with a BEFORE
-- UPDATE trigger: a customer may only change status/stripe_payment_intent_id; not amount_chf,
-- salon_id, customer_id, or description. Salon-owner and service-role (auth.uid() null) updates are
-- unaffected. Strictly additive (CREATE OR REPLACE FUNCTION + CREATE TRIGGER).
CREATE OR REPLACE FUNCTION public.price_offers_lock_customer_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.salons WHERE id = OLD.salon_id;
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.customer_id AND auth.uid() IS DISTINCT FROM v_owner THEN
    IF NEW.amount_chf   IS DISTINCT FROM OLD.amount_chf
    OR NEW.salon_id     IS DISTINCT FROM OLD.salon_id
    OR NEW.customer_id  IS DISTINCT FROM OLD.customer_id
    OR NEW.description  IS DISTINCT FROM OLD.description THEN
      RAISE EXCEPTION 'price_offers: customer may only change offer status, not its financial/identity fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_price_offers_lock_customer_columns
  BEFORE UPDATE ON public.price_offers
  FOR EACH ROW EXECUTE FUNCTION public.price_offers_lock_customer_columns();