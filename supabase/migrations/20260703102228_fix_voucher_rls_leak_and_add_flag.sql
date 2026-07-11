-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- SECURITY (owner-greenlit 2026-07-03): close the voucher enumeration leak. The vouchers SELECT policy
-- had a standalone `redeemed_at IS NULL` clause that let ANY authenticated user read every un-redeemed
-- voucher's code + amount. Remove it; readable only by admin, the buyer, the recipient (by email), or
-- the salon owner. (Redemption goes through the service-role route, so no one else needs to SELECT it.)
ALTER POLICY vouchers_select_4c9184_m ON public.vouchers USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'))
  OR (recipient_email = (SELECT auth.email()))
  OR (buyer_id = (SELECT auth.uid()))
  OR (salon_id IN (SELECT salons.id FROM public.salons WHERE salons.owner_id = (SELECT auth.uid())))
);

-- Voucher redemption feature flag, OFF until the redemption build lands (money feature).
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('vouchers', false, 'Voucher redemption at checkout')
ON CONFLICT (key) DO NOTHING;