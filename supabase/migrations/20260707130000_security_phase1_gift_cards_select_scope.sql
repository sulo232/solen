-- Migration: 20260707130000_security_phase1_gift_cards_select_scope.sql
-- exists-check: net-new vs the gift_cards RLS in its original migration; migrations are
--   append-only so a new timestamped ALTER is the correct additive pattern. Tightens an
--   existing policy (no DROP). `npm run exists gift_cards_select` = 0 matches.
--
-- Phase-1 security audit (2026-07-07). Live-confirmed via pg_policies: the gift_cards SELECT
-- policy is `(salon_id IN <owner's salons>) OR true` , the `OR true` makes EVERY gift card
-- (code + remaining balance) readable by the anon role. Gift cards are killed/hidden, but the
-- table is still live and this is a real data leak.
--
-- Every legitimate reader uses the service-role admin client (app/api/gift-cards/balance,
-- app/api/analytics/gift-card-revenue, app/api/stripe/webhook/gift-card-handler), which
-- bypasses RLS, so removing the anon `OR true` breaks no legitimate path (verified by grep:
-- no client-side/anon SELECT on gift_cards exists). Salon owners keep read access to their
-- own salon's cards.
--
-- ALTER POLICY (not DROP+CREATE) so this is a non-destructive, reversible tightening.

ALTER POLICY gift_cards_select_4c9184_m ON public.gift_cards
  USING (salon_id IN ( SELECT salons.id FROM salons WHERE salons.owner_id = ( SELECT auth.uid() ) ));
