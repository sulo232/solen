-- exists-check: net-new. `npm run exists availability_slots_public` = no hit (new view). Sibling of
-- the base table availability_slots; this is the safe-columns public projection for C1.
-- APPLIED LIVE 2026-07-12 via MCP. C1 barrier view: public, safe-columns-only projection of
-- availability_slots (NO client_id/booked_by/booking_id/price_override/block_reason). Runs as owner
-- (default) so it survives the later base-RLS owner-only flip. Read-only (SELECT grant only).
-- The base-RLS flip (the actual switch-on that closes the leak) is a SEPARATE migration that must be
-- live-tested as a non-owner customer before applying (RLS-CLIENT-TRAP lesson).
create or replace view public.availability_slots_public
  with (security_barrier = true) as
  select id, salon_id, service_id, staff_member_id, starts_at, ends_at, status, last_minute_discount_percent
  from public.availability_slots;
revoke all on public.availability_slots_public from anon, authenticated;
grant select on public.availability_slots_public to anon, authenticated;
