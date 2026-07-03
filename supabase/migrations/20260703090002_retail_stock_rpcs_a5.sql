-- exists-check: net-new vs lib/stripe.ts and the existing RPCs (probed live 2026-07-03:
--   decrement_retail_stock / decrement_stock / increment_field all PGRST202 = absent). The generic
--   increment_field is unconditional (no >=1 guard, can drive stock negative, no rowCount signal),
--   so it does NOT satisfy the A-5 council guard. Idiom mirrors public.next_walkin_ticket_seq
--   (20260602150000): single-statement UPDATE ... RETURNING, SECURITY DEFINER.
--
-- A5 Phase A-5 (apply live via MCP apply_migration "retail_stock_rpcs_a5" 2026-07-03; repo mirror).
-- Stock is mutated ONLY here (webhook settle + full refund), never client-side. The deleted
-- /api/nail/retail/checkout POS stub was the second, Stripe-bypassing, read-then-write path (graveyard).
--
-- Both functions are SINGLE-statement guarded UPDATEs (no read-then-write race) that RETURN the
-- row id ONLY when a row actually changed, so the caller can distinguish "decremented / re-incremented"
-- from "skipped" (out of stock, or stock_count IS NULL = untracked SKU) and log the skip.
-- v1: quantity is 1 per SKU per purchase, so each call adjusts by exactly 1.

-- Decrement: guarded so it NEVER goes negative and NEVER touches an untracked (NULL stock) SKU.
-- Returns 0 rows when the product is out of stock or untracked (caller logs, does not fail the settle).
CREATE OR REPLACE FUNCTION public.decrement_retail_stock(p_product_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.nail_retail_products
     SET stock_count = stock_count - 1
   WHERE id = p_product_id
     AND stock_count IS NOT NULL
     AND stock_count >= 1
  RETURNING id;
$$;

-- Re-increment on a FULL refund. An untracked SKU (NULL stock) is skipped;
-- a tracked SKU is bumped back by 1. Returns 0 rows when the SKU is untracked (stock_count IS NULL).
CREATE OR REPLACE FUNCTION public.increment_retail_stock(p_product_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.nail_retail_products
     SET stock_count = stock_count + 1
   WHERE id = p_product_id
     AND stock_count IS NOT NULL
  RETURNING id;
$$;
