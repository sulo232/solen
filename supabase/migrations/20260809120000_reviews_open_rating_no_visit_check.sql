-- exists-check: `npm run exists review` + `npm run exists reviews_insert_own` , the only INSERT
-- policy on public.reviews is reviews_insert_own (confirmed live via pg_policy); this ALTERs it in
-- place, it does not add a second policy. Nothing in REMOVED.md covers open ratings; the graveyard
-- entry there is for the "Verified visit" MARK, which stays dead.
--
-- Owner decision 4, 2026-08-09 (TASTE_LOG "4B like google maps"): anyone SIGNED IN can rate any
-- salon. No visit check, no verified mark, no gating of the score. This reverses
-- 20260709183909_audit_fix_reviews_insert_requires_booking, which required a confirmed or
-- completed booking at the same salon. He was offered the containment twice and refused it twice,
-- verbatim "no no real visit check jst normal su bro"; the fake-rating cost is recorded in
-- TASTE_LOG as knowingly accepted, so this is a deliberate loosening, not a regression.
--
-- What still holds: auth.uid() = user_id, so a row can never be written under another person's
-- identity, and the anon role has no INSERT on this table at all. Signed-in is the whole gate.
-- Walk-in and service-role writes were never affected (they bypass RLS).
--
-- ALTER in place (no DROP), idempotent, safe to re-run.
ALTER POLICY "reviews_insert_own" ON public.reviews
  WITH CHECK ((SELECT auth.uid()) = user_id);
