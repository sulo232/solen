-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Step 2: one barber_loyalty_cards per (customer, salon) with the aggregated stamp count.
-- status = redeemable when count >= program.stamps_required else active. qr_token is NOT NULL
-- with no default; seed a placeholder (real QR is regenerated when the customer opens their card).
insert into public.barber_loyalty_cards (program_id, salon_id, customer_id, stamps, status, qr_token)
select p.id, lc.salon_id, ls.customer_id, count(*)::int,
       case when count(*) >= p.stamps_required then 'redeemable' else 'active' end,
       'seed-' || gen_random_uuid()::text
from public.loyalty_stamps ls
join public.loyalty_cards lc on lc.id = ls.loyalty_card_id
join public.barber_loyalty_programs p on p.salon_id = lc.salon_id
where not exists (
  select 1 from public.barber_loyalty_cards bc
  where bc.salon_id = lc.salon_id and bc.customer_id = ls.customer_id
)
group by p.id, lc.salon_id, ls.customer_id, p.stamps_required;