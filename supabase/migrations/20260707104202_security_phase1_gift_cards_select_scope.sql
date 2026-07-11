-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
ALTER POLICY gift_cards_select_4c9184_m ON public.gift_cards
  USING (salon_id IN ( SELECT salons.id FROM salons WHERE salons.owner_id = ( SELECT auth.uid() ) ));