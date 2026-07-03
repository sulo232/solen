-- A5 Phase B-1 (applied live via MCP apply_migration "service_bundles_a5" 2026-07-03; repo mirror).
-- Fresha-style multi-service bundles. NET-NEW shape (service_packages = legacy session-packs).
-- Owner-sanctioned un-kill 2026-07-03 (REMOVED.md). custom_price = numeric CHF-DECIMAL matching
-- services.price (council: never Rappen ints here; convert *100 only at the Stripe boundary).
CREATE TABLE IF NOT EXISTS public.service_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  pricing_mode text NOT NULL DEFAULT 'percent'
    CHECK (pricing_mode IN ('sum','custom','percent')),
  custom_price numeric(8,2),
  percent_off smallint CHECK (percent_off IS NULL OR percent_off BETWEEN 1 AND 99),
  is_active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pricing_mode <> 'custom' OR custom_price IS NOT NULL),
  CHECK (pricing_mode <> 'percent' OR percent_off IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS public.service_bundle_items (
  bundle_id uuid NOT NULL REFERENCES public.service_bundles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bundle_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_service_bundles_salon ON public.service_bundles(salon_id);
CREATE INDEX IF NOT EXISTS idx_service_bundle_items_service ON public.service_bundle_items(service_id);

ALTER TABLE public.service_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bundle_items ENABLE ROW LEVEL SECURITY;

-- customers read bundles ONLY of customer-visible salons (council: services' is_active-only
-- policy is NOT enough; gate on the marketplace-visibility predicate).
DROP POLICY IF EXISTS bundles_public_read ON public.service_bundles;
CREATE POLICY bundles_public_read ON public.service_bundles
  FOR SELECT USING (
    is_active = true
    AND salon_id IN (
      SELECT id FROM public.salons
      WHERE is_active = true
        AND listed_on_marketplace IS NOT FALSE
        AND COALESCE(is_test, false) = false
    )
  );
DROP POLICY IF EXISTS bundles_owner_manage ON public.service_bundles;
CREATE POLICY bundles_owner_manage ON public.service_bundles
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = (SELECT auth.uid()))
  );

-- the child table carries ITS OWN policies (RLS is per-table; join through the parent).
DROP POLICY IF EXISTS bundle_items_public_read ON public.service_bundle_items;
CREATE POLICY bundle_items_public_read ON public.service_bundle_items
  FOR SELECT USING (
    bundle_id IN (
      SELECT b.id FROM public.service_bundles b
      WHERE b.is_active = true
        AND b.salon_id IN (
          SELECT id FROM public.salons
          WHERE is_active = true
            AND listed_on_marketplace IS NOT FALSE
            AND COALESCE(is_test, false) = false
        )
    )
  );
DROP POLICY IF EXISTS bundle_items_owner_manage ON public.service_bundle_items;
CREATE POLICY bundle_items_owner_manage ON public.service_bundle_items
  FOR ALL USING (
    bundle_id IN (
      SELECT b.id FROM public.service_bundles b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE s.owner_id = (SELECT auth.uid())
    )
  );

-- >=2 items gate: a bundle cannot ACTIVATE with fewer than 2 items (a 0/1-item bundle must never
-- surface as a 0-CHF bookable).
CREATE OR REPLACE FUNCTION public.service_bundles_min_items()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active = true
     AND (SELECT count(*) FROM public.service_bundle_items WHERE bundle_id = NEW.id) < 2 THEN
    RAISE EXCEPTION 'bundle % cannot be activated with fewer than 2 services', NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_service_bundles_min_items ON public.service_bundles;
CREATE TRIGGER trg_service_bundles_min_items
  BEFORE INSERT OR UPDATE OF is_active ON public.service_bundles
  FOR EACH ROW EXECUTE FUNCTION public.service_bundles_min_items();

-- bookings tag (B-5): nullable, additive.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS bundle_id uuid REFERENCES public.service_bundles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_bundle ON public.bookings(bundle_id) WHERE bundle_id IS NOT NULL;
