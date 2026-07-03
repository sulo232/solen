-- A5 Phase A-1 (applied live via MCP apply_migration "retail_generalize_a5" 2026-07-03; this file
-- is the repo mirror). Plan: _plans/BUNDLES_PRODUCTS.md v2 (council-amended).
-- (1) Widen nail_retail_products.category as a STRICT UNION of the LIVE constraint values (the
--     live CHECK had drifted out-of-band and already carried care/styling/tools/accessories)
--     plus the general marketplace categories. All live rows stay valid.
ALTER TABLE public.nail_retail_products
  DROP CONSTRAINT IF EXISTS nail_retail_products_category_check;
ALTER TABLE public.nail_retail_products
  ADD CONSTRAINT nail_retail_products_category_check
  CHECK (category = ANY (ARRAY[
    'cuticle_oil','hand_cream','press_on','nail_kit','polish','other',
    'care','styling','tools','accessories',
    'hair_care','skin_care','nails'
  ]::text[]));

-- (2) retail_purchases: the Stripe settle handler writes vat_amount/net_amount/vat_rate but the
--     live table lacked them (probed 2026-07-03) , the settle UPDATE would have failed on a real
--     purchase. Amounts in Rappen ints (matching paid_amount), rate as numeric percent.
ALTER TABLE public.retail_purchases ADD COLUMN IF NOT EXISTS vat_amount integer;
ALTER TABLE public.retail_purchases ADD COLUMN IF NOT EXISTS net_amount integer;
ALTER TABLE public.retail_purchases ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2);
