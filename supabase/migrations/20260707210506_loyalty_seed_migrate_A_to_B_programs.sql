-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Loyalty consolidation (System A loyalty_cards/loyalty_stamps -> System B barber_loyalty_*).
-- All source data is [seed-demo]. Additive + idempotent (not-exists guards); A kept dormant.
-- Step 1: a barber_loyalty_programs row per A seed card's salon. reward_type='free_service'
-- maps cleanly (both rewards are "Gratis <service>"). stamps_required <- stamps_needed.
insert into public.barber_loyalty_programs (salon_id, name, stamps_required, reward_type, reward_value, is_active)
select lc.salon_id, 'Treuekarte', lc.stamps_needed, 'free_service', 0, coalesce(lc.is_active, true)
from public.loyalty_cards lc
where not exists (select 1 from public.barber_loyalty_programs p where p.salon_id = lc.salon_id);