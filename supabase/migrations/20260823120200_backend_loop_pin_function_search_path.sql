-- Backend loop 2026-08-23. APPLIED LIVE via apply_migration
-- (name: backend_loop_pin_function_search_path). This file is the replayable record.
--
-- exists-check: all three functions already exist (read from pg_proc, signatures below are
-- copied from pg_get_function_identity_arguments). This ALTERs them in place and creates
-- nothing. No REMOVED.md entry covers any of them.
--
-- WHAT AND WHY. Three of our own functions had no pinned search_path. All three are SECURITY
-- INVOKER (prosecdef = false, checked before writing this), so this is NOT the privilege-
-- escalation case the linter warns about. It is determinism: without a pinned path a function
-- resolves its table names against whatever search_path the caller happens to have, so the same
-- function can read a different table depending on who calls it.
--
-- MEASURED, with the right scope. Of the 302 functions in the public schema, 237 still have no
-- pinned path, and NONE of those are ours: they belong to the installed extensions (cube,
-- earthdistance, btree_gist and friends) and are not ours to alter. Counting only functions with
-- no extension dependency: 3 of 65 unpinned before this migration, 0 of 65 after, and 0 of those
-- were SECURITY DEFINER either way.
--
-- The first attempt at this migration failed with 42883 because it guessed no-argument
-- signatures. The signatures below were then read from the catalogue. Cheap version of the same
-- lesson that runs through this whole audit: read the thing, do not assume its shape.
--
-- ALTER in place, no body change, idempotent, safe to re-run.

alter function public.booking_revenue_sum(uuid, timestamptz)
  set search_path = public, pg_temp;

alter function public.salons_with_slot_in_hours(integer, integer, timestamptz, timestamptz)
  set search_path = public, pg_temp;

alter function public.record_csp_violation(text, text, text, text)
  set search_path = public, pg_temp;
