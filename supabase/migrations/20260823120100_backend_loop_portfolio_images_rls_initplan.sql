-- Backend loop 2026-08-23, storage and scale pass. APPLIED LIVE via apply_migration
-- (name: backend_loop_portfolio_images_rls_initplan). This file is the replayable record.
--
-- exists-check: `npm run exists salon_portfolio_images` returns the existing table and its
-- existing policies; this ALTERs the one policy in place and adds nothing. Nothing in
-- REMOVED.md covers portfolio images.
--
-- WHAT AND WHY. salon_portfolio_images_manage_owner called auth.uid() bare, so Postgres
-- re-evaluated it once per row instead of once per query. It was the LAST policy in the whole
-- schema still doing that: the 2026-06-24 pass wrapped every other one, and this table was
-- created after it. Read off pg_policy before and after, not asserted from the diff.
--
-- Wrapping in a scalar subselect lets the planner hoist it into an InitPlan. The predicate is
-- otherwise byte-identical, so this changes speed and not who can see what. Verified after
-- applying: the policy still contains owner_id and now contains the wrapped call.
--
-- ALTER in place, no DROP, idempotent, safe to re-run.

alter policy "salon_portfolio_images_manage_owner"
  on public.salon_portfolio_images
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_portfolio_images.salon_id
        and s.owner_id = (select auth.uid())
    )
  );
