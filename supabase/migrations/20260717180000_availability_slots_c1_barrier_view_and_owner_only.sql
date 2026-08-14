-- exists-check: these two objects ALREADY EXIST live. This file REPRODUCES them so a fresh env
-- build / DR restore / CI replay ends at the current state instead of the pre-C1 world.
--
-- #9 (live re-audit 2026-07-17). The C1 change (availability_slots base-table SELECT made owner-only
-- + a safe-columns barrier view for the public booking-browse read) is LIVE in the database but had
-- NO migration file anywhere in this repo/main: the originals live only on the unmerged branch
-- backend-analysis-improvements-77f02b, and that branch's flip file even carries a WRONG "NOT
-- APPLIED" header (it WAS applied, 2026-07-13, confirmed in supabase_migrations). So a rebuild from
-- migrations would silently reopen the exact leak C1 closed: the base table world-readable again.
-- These definitions were captured from the LIVE catalog (pg_get_viewdef / pg_policy) this session,
-- not copied from the branch file, so they match reality.
--
-- Idempotent (create or replace / guarded alter), additive, forward-only.

-- 1. Safe-columns barrier view. Excludes the PII/pricing columns (client_id, booked_by, booking_id,
--    price_override, block_reason) on purpose; runs as owner (no security_invoker) so the public
--    booking-browse read reaches available slots while the base table stays owner-only.
create or replace view public.availability_slots_public
  with (security_barrier = true) as
  select id, salon_id, service_id, staff_member_id, starts_at, ends_at, status, last_minute_discount_percent
  from public.availability_slots;
revoke all on public.availability_slots_public from anon, authenticated;
grant select on public.availability_slots_public to anon, authenticated;

-- 2. The C1 flip: base-table SELECT is owner-only. ALTER (not drop+create) so there is never a
--    window with no policy. Guarded so a fresh build where 014_new_schema.sql already created this
--    policy alters it in place; if the policy name is ever absent this is a no-op rather than a hard
--    fail (the base RLS is still deny-by-default without it).
do $$
begin
  if exists (
    select 1 from pg_policy
    where polrelid = 'public.availability_slots'::regclass
      and polname = 'availability_slots_select_4c9184_m'
  ) then
    alter policy availability_slots_select_4c9184_m on public.availability_slots
      using (
        exists (
          select 1 from public.salons
          where salons.id = availability_slots.salon_id
            and salons.owner_id = (select auth.uid())
        )
      );
  end if;
end $$;
