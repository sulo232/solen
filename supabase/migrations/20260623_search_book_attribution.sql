-- exists-check: net-new migration, ADDITIVE. Extends live tables public.bookings + public.search_events
-- (both already exist; acquisition_source + booked + session_id already present). NOT a dup of
-- lib/booking-*.ts / lib/bookings/reference.ts (those are runtime code; this is DDL).
--
-- Phase 1 of the search→book points/affinity system (_tasks/SEARCH_BOOK_POINTS_SPEC.md).
-- Idempotent. Closes the funnel attribution gap: links a booking back to the search_events row
-- whose click led to it. Verified live 2026-06-23: bookings.acquisition_source and
-- search_events.booked + session_id ALREADY exist — so this only adds the FK column on the
-- booking side + the session-window lookup index. No booking_id added to search_events.

alter table public.bookings
  add column if not exists attributed_search_event_id uuid
  references public.search_events(id) on delete set null;

comment on column public.bookings.attributed_search_event_id is
  'search_events row whose click led to this booking (last-touch, 60-min window). NULL = organic/direct.';

-- Speeds the per-session recent-events window scan the booking attribution does on each booking.
create index if not exists idx_search_events_session_created
  on public.search_events (session_id, created_at desc);
