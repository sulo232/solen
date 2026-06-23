-- exists-check: ADDITIVE constraint widening (verified live 2026-06-23). The discovery_items category CHECK
-- allowed hair/beard/nails/makeup/waxing but NOT lashes/brows , stale drift vs the app taxonomy (lashes + brows
-- are real DISCOVERY_CATEGORIES). This blocked importing lashes/brows looks. Widen the allowed set to include
-- them. Kept makeup/waxing in the list (additive, zero rows use them) to avoid touching existing-allowed values.
alter table public.discovery_items drop constraint if exists discovery_items_category_check;
alter table public.discovery_items add constraint discovery_items_category_check
  check (category = any (array['hair','beard','nails','makeup','waxing','lashes','brows']));
