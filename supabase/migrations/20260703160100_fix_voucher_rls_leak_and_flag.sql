-- exists-check: net-new. Owner-greenlit 2026-07-03. Applied via MCP apply_migration; mirrored here.

-- SECURITY: the vouchers SELECT policy had a standalone `redeemed_at IS NULL` clause that let ANY
-- authenticated user read every un-redeemed voucher's code + amount (enumeration / free-money hole).
-- Remove it. Readable only by admin, the buyer, the recipient (by email), or the salon owner.
-- Redemption goes through the service-role route, so no other role needs to SELECT vouchers.
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
