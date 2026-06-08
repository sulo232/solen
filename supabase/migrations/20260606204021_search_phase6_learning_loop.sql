-- Smart Search Phase 6: the learning loop (built safe, dormant until traffic).
-- Applied via apply_migration 2026-06-06 (version 20260606204021); mirrored here.
-- search_events (consent-gated + erasure via FK + RLS-locked) is written ONLY by
-- the rate-limited /api/search/event endpoint (service-role). search_popularity is
-- a DEBIASED materialized view (per-session, time-decayed, position-debiased,
-- Bayesian-shrunk). pg_cron refreshes it nightly + de-identifies raw queries at 90d.

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid references public.profiles(id) on delete set null,  -- erasure: nulled on profile delete
  query text,                                        -- raw; de-identified at 90d (retention)
  query_norm text,                                   -- f_unaccent(lower(query)); kept for mining
  locale text,
  city_id uuid,
  results_count int,
  clicked_type text check (clicked_type in ('service','salon','stylist')),
  clicked_id uuid,
  clicked_position int,
  booked boolean not null default false,             -- verified server-side, never client-trusted
  consent_given boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_search_events_created  on public.search_events (created_at);
create index if not exists idx_search_events_qnorm     on public.search_events (query_norm);
create index if not exists idx_search_events_clicked   on public.search_events (clicked_type, clicked_id);
create index if not exists idx_search_events_session   on public.search_events (session_id);

alter table public.search_events enable row level security;
-- No anon/authenticated policy: writes come only via the service-role endpoint
-- (bypasses RLS); reads are admin/service-role only.

drop materialized view if exists public.search_popularity;
create materialized view public.search_popularity as
with clicks as (
  select
    case e.clicked_type
      when 'salon'   then e.clicked_id
      when 'service' then (select s.salon_id from public.services s where s.id = e.clicked_id)
      when 'stylist' then (select st.salon_id from public.staff_members st where st.id = e.clicked_id)
    end as salon_id,
    e.session_id, e.clicked_position, e.created_at
  from public.search_events e
  where e.clicked_id is not null and e.clicked_type is not null and e.session_id is not null
),
per_session as (
  select salon_id, session_id,
         max( (1 + ln(greatest(coalesce(clicked_position,1),1)))
              * exp(- extract(epoch from (now()-created_at)) / 86400.0 / 14.0)
            ) as sig
  from clicks
  where salon_id is not null
  group by salon_id, session_id
),
agg as (select salon_id, count(*)::int as sessions, sum(sig) as raw from per_session group by salon_id)
select salon_id, sessions, (raw / (sessions + 5.0))::real as popularity
from agg;
create unique index if not exists idx_search_popularity_salon on public.search_popularity (salon_id);

create or replace view public.search_zero_results as
select query_norm, locale, count(*)::int as hits, max(created_at) as last_seen
from public.search_events
where results_count = 0 and query_norm is not null
group by query_norm, locale
order by count(*) desc;

select cron.schedule('search-popularity-refresh', '0 3 * * *',
  $$ refresh materialized view concurrently public.search_popularity $$);
select cron.schedule('search-events-retention', '30 3 * * *',
  $$ update public.search_events
       set query = null, session_id = null, user_id = null
     where created_at < now() - interval '90 days'
       and (query is not null or session_id is not null or user_id is not null) $$);

-- Teardown:
--   select cron.unschedule('search-popularity-refresh');
--   select cron.unschedule('search-events-retention');
--   drop view if exists public.search_zero_results;
--   drop materialized view if exists public.search_popularity;
--   drop table if exists public.search_events;
