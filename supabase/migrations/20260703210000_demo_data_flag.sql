-- exists-check: reuses public.feature_flags (028_feature_flags.sql), no new flag system.
-- npm run exists demo_data -> only hit is lib/demo-data.ts (a separate, unrelated demo-salons
-- constants module) + an unrelated makeup/waxing graveyard entry. No demo_data flag row exists.
--
-- Demo-data single-switch (owner 2026-07-03): pre-launch the homepage keeps fabricated
-- fallback data (fake ratings/prices/reviews/counts) since there are no real salons yet.
-- This flag lets the owner kill ALL of it with one row flip when real salons exist,
-- instead of a redeploy. Default true (demo on) = current pre-launch behavior unchanged.
-- Idempotent, additive, no drops.
insert into public.feature_flags (key, enabled, description)
values ('demo_data', true, 'Homepage demo/fallback data (fake ratings, prices, reviews, counts). Flip to false at launch when real salons exist.')
on conflict (key) do nothing;
