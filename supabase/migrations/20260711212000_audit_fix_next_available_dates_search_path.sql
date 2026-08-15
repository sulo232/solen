-- exists-check: net-new vs 031_audit_log.sql, 067_discovery.sql, 014_new_schema.sql, 004_salon_photos.sql, 053_salon_groups.sql, 080_salon_drafts.sql, 027_rls_hardening.sql, 042_off_peak_slots.sql because this is a forward-only fix migration for the already-live public.next_available_dates function (20260711094114), not a new schema/table/RLS/photos/groups/drafts concern; none of those files touch this function.
-- Ring 2b follow-up: public.next_available_dates (20260711094114) was missing the
-- search_path hardening every sibling stable SQL function sets (see
-- 20260531_discovery_recent_and_style_suggest.sql, 20260623131500_discovery_boards_for_you.sql).
-- Without a locked search_path, a session-level search_path change could redirect
-- unqualified references to a shadow object. Re-create with the same signature/body,
-- adding the lock; behavior is unchanged (all references in the body are already
-- schema-qualified as public.*).
create or replace function public.next_available_dates(p_salon_ids uuid[], p_after timestamptz)
returns table(salon_id uuid, next_date text)
language sql stable set search_path to 'public' as $$
  select distinct on (s.salon_id)
    s.salon_id,
    to_char(s.starts_at at time zone 'Europe/Zurich', 'YYYY-MM-DD') as next_date
  from public.availability_slots s
  where s.status = 'available'
    and s.starts_at > p_after
    and s.salon_id = any(p_salon_ids)
  order by s.salon_id, s.starts_at asc
$$;
