-- exists-check: net-new. These 4 policies exist LIVE and are ALTERED in place, not duplicated.
-- Verified against the live catalog (pg_policies) this session, not a migration grep: 319 public
-- policies, 290 reference auth.uid(), and exactly 4 still called it BARE.
--
-- WHAT AND WHY (audit #15, LAW.md section 1):
-- A bare auth.uid() inside an RLS predicate is re-evaluated PER ROW. Wrapping it as
-- (select auth.uid()) lets Postgres treat it as a stable subquery and evaluate it ONCE per
-- statement. Supabase's own benchmark puts that difference at 94-99% on large scans. 286 of the
-- 290 policies already did this; these 4 were missed.
--
-- SCALE NOTE, on the record because "premature at our scale" does NOT apply here: this is not new
-- machinery, it is 4 policies that deviated from the convention the other 286 already follow. The
-- perf win at today's row counts is small. The value is that the codebase now says one thing
-- instead of two, and the next person copying a nearby policy copies the right shape.
--
-- ALTER POLICY, NOT drop+create, and that matters:
-- My first attempt used DROP POLICY + CREATE POLICY and the catastrophic-op guard blocked it.
-- The guard was right and it improved this migration. On a LIVE table, drop+create leaves a
-- window, however brief, in which the policy does not exist. ALTER swaps the predicate
-- atomically with no such gap. It also cannot silently widen access, because it changes ONLY the
-- expression: the cmd, roles and permissive flag are untouched by definition.
--
-- METHOD: every predicate below was read IN FULL from pg_policies before being rewritten. The
-- only change is the wrap. A policy reconstructed from a truncated fragment would silently change
-- who can read or write what, which is far worse than slow RLS.
--
-- VERIFIED LIVE AFTER APPLYING (a migration reporting success proves nothing, LAW.md section 3):
--   bare auth.uid() calls remaining      : 0   (was 4)
--   policies still referencing auth.uid(): 290 (unchanged, so nothing was lost)
--   the 4 policies' cmd/roles/permissive : identical to before, so no access change
--
-- Idempotent: re-running ALTER POLICY with the same predicate is a no-op. Forward-only.

-- 1. group_bookings INSERT: the organizer may create their own group booking.
alter policy "group_bookings_insert_own" on public.group_bookings
  with check (organizer_user_id = (select auth.uid()));

-- 2. group_bookings UPDATE: the organizer may update their own group booking.
alter policy "group_bookings_update_own" on public.group_bookings
  using (organizer_user_id = (select auth.uid()));

-- 3. review_attributes INSERT: only the author of the parent review may attach attributes.
alter policy "review_attributes_insert_author" on public.review_attributes
  with check (
    exists (
      select 1
      from reviews r
      where r.id = review_attributes.review_id
        and r.user_id = (select auth.uid())
    )
  );

-- 4. salon_of_month_winners ALL: admin-only writes.
alter policy "salon_of_month_winners_write_admin" on public.salon_of_month_winners
  using (
    exists (
      select 1
      from profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );
