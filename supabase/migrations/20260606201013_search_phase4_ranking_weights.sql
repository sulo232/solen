-- Smart Search Phase 4: tunable ranking weights + honest ranking blend.
-- Applied via apply_migration 2026-06-06 (version 20260606201013); mirrored here.
-- Single-row config table (live-tunable, no redeploy). Forward-compat slots for
-- vector (P5) and popularity (P6) default to 0, so those phases populate data +
-- flip a weight without re-altering this table. search_salons_ranked is rewritten
-- to read the weights and add: Bayesian rating (IMDb prior), an exact-substring
-- boost, and a synonym discount (0.6x on recall gained only via synonym canonicals).
--
-- NOTE: the search_salons_ranked body below is superseded by 20260606201404
-- (Phase 4b) which fixes the synonym AND-bug. This file is the faithful
-- as-applied history; replaying the chain ends on the 4b definition.

create table if not exists public.search_ranking_weights (
  id int primary key default 1,
  w_fts          real not null default 1.0,
  w_fuzzy        real not null default 0.6,
  w_exact        real not null default 0.5,
  w_rating       real not null default 0.2,
  w_vector       real not null default 0.0,  -- Phase 5 semantic; 0 until embeddings backfilled
  w_popularity   real not null default 0.0,  -- Phase 6 learning loop; 0 until events flow
  w_geo          real not null default 0.0,  -- proximity; 0 until >1 city
  w_avail        real not null default 0.0,  -- availability boost; 0 until pre-agg
  bayes_prior_m  real not null default 8,    -- prior weight (min effective votes)
  bayes_global_c real not null default 4.4,  -- global mean rating prior (live avg ~4.40)
  updated_at     timestamptz not null default now(),
  constraint search_ranking_weights_singleton check (id = 1)
);
insert into public.search_ranking_weights (id) values (1) on conflict (id) do nothing;

alter table public.search_ranking_weights enable row level security;
-- SECURITY DEFINER functions read this regardless of RLS; no public/anon policy.

create or replace function public.search_salons_ranked(p_q text, p_limit int default 30)
returns table(salon_id uuid, score real)
language sql stable security definer set search_path = public, extensions
as $func$
  with
  w as (select * from public.search_ranking_weights where id = 1),
  qx as (select nullif(lower(public.f_unaccent(btrim(coalesce(p_q,'')))),'') as norm),
  syn as (select string_agg(distinct s.canonical,' ') as exp
          from public.search_synonyms s, qx
          where s.is_active and lower(public.f_unaccent(s.term)) = qx.norm),
  tq  as (select websearch_to_tsquery('german',
            public.f_unaccent(coalesce((select norm from qx),''))) as q),
  tqx as (select websearch_to_tsquery('german',
            public.f_unaccent(coalesce((select norm from qx),'')||' '
                              ||coalesce((select exp from syn),''))) as q),
  svc as (
    select s.salon_id,
           ts_rank(s.search_doc,(select q from tq))  as fts_direct,
           ts_rank(s.search_doc,(select q from tqx)) as fts_exp,
           word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) as wsim,
           case when s.name_de ilike '%'||(select norm from qx)||'%'
                  or s.name_en ilike '%'||(select norm from qx)||'%' then 1 else 0 end as exact
    from public.services s
    where s.is_active and (
         s.search_doc @@ (select q from tqx)
      or word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) > 0.3
      or s.name_de ilike '%'||(select norm from qx)||'%'
      or s.name_en ilike '%'||(select norm from qx)||'%')
  ),
  sal as (
    select sa.id as salon_id,
           ts_rank(sa.search_doc,(select q from tq))  as fts_direct,
           ts_rank(sa.search_doc,(select q from tqx)) as fts_exp,
           word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) as wsim,
           case when sa.name ilike '%'||(select norm from qx)||'%' then 1 else 0 end as exact
    from public.salons sa
    where sa.search_doc @@ (select q from tqx)
      or word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) > 0.3
      or sa.name ilike '%'||(select norm from qx)||'%'
  ),
  stf as (
    select st.salon_id,
           0::real as fts_direct, 0::real as fts_exp,
           word_similarity((select norm from qx), lower(public.f_unaccent(st.name))) as wsim,
           case when st.name ilike '%'||(select norm from qx)||'%' then 1 else 0 end as exact
    from public.staff_members st
    where st.is_active and (
         st.name ilike '%'||(select norm from qx)||'%'
      or word_similarity((select norm from qx), lower(public.f_unaccent(st.name))) > 0.3)
  ),
  u as (select * from svc union all select * from sal union all select * from stf),
  agg as (
    select salon_id, max(fts_direct) as fts_direct, max(fts_exp) as fts_exp,
           max(wsim) as wsim, max(exact) as exact
    from u group by salon_id
  )
  select a.salon_id,
    (   w.w_fts    * (a.fts_direct + 0.6 * greatest(a.fts_exp - a.fts_direct, 0))
      + w.w_fuzzy  * coalesce(a.wsim,0)
      + w.w_exact  * a.exact
      + w.w_rating * (
          ( sa.review_count::real * coalesce(sa.average_rating,0)
            + w.bayes_prior_m * w.bayes_global_c )
          / nullif(sa.review_count + w.bayes_prior_m, 0) / 5.0 )
    )::real as score
  from agg a
  join public.salons sa on sa.id = a.salon_id
  cross join w
  where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false) = false
  order by score desc, sa.average_rating desc nulls last, sa.id
  limit greatest(coalesce(p_limit,30),1);
$func$;

grant execute on function public.search_salons_ranked(text,int) to anon, authenticated, service_role;

-- Teardown:
--   drop function if exists public.search_salons_ranked(text,int);
--   drop table if exists public.search_ranking_weights;
