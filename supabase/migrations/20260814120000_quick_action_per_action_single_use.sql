-- exists-check: `npm run exists confirm_link_used_at` = 0 matches, run 2026-08-14. Net-new vs
-- 20260712150000_audit_fix_quick_action_token_single_use.sql, which is the closest match and was
-- read in full before writing this. That file cannot be edited instead: it was already applied to
-- the live database an hour ago and this project is forward-only (apply_migration only, never db
-- push/reset), so a correction has to be its own file.
--
-- 20260814120000_quick_action_per_action_single_use
--
-- Corrects 20260712150000_audit_fix_quick_action_token_single_use, recovered from an unmerged
-- branch on 2026-08-14, which lands a SINGLE `consumed_at` marker shared by both branches of
-- app/api/bookings/[id]/quick-action/route.ts.
--
-- WHY THAT WAS WRONG, found by the review panel the same hour, before any customer met it: the
-- marker is per BOOKING ROW while the links are per ACTION. A guest clicks the confirm link, the
-- row is marked used, and their CANCEL link is then refused for ever with "Link already used",
-- despite never having been clicked. Guest bookings carry a null user_id and therefore have no
-- signed-in cancel route, so that is the only cancellation channel they have. An email
-- link-scanner auto-clicking confirm, which is the exact threat the original fix cites, would have
-- locked a real customer out of cancelling. Strictly worse than the replay it closed.
--
-- One marker per action. Using one link can no longer affect the other.
--
-- `consumed_at` is deliberately LEFT IN PLACE and no longer read by any code: dropping a column on
-- a live table to tidy up is a bigger risk than an unused nullable one, and forward-only means
-- additive.
--
-- Additive, idempotent, forward-only.

alter table public.bookings add column if not exists confirm_link_used_at timestamptz default null;
alter table public.bookings add column if not exists cancel_link_used_at timestamptz default null;

comment on column public.bookings.confirm_link_used_at is
  'Set when the one-click CONFIRM email link is used. Gates replay of that link only.';
comment on column public.bookings.cancel_link_used_at is
  'Set when the one-click CANCEL email link is used. Separate from confirm so using one link never blocks the other.';
