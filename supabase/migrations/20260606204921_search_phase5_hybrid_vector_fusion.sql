-- Smart Search Phase 5: fuse semantic vector search + popularity into the ranker.
-- Applied via apply_migration 2026-06-06 (version 20260606204921); mirrored here.
-- Adds p_query_embedding (768-dim, passed by the results route from Gemini) as a
-- vector candidate source + weighted term, and wires the popularity term. The old
-- 2-arg signature is dropped; the 3-arg form defaults p_query_embedding=null.
--
-- NOTE: the vec candidacy here (threshold 0.55) is superseded by 20260606205451
-- (Phase 5b: measured floor 0.66 + top-K). This file is the faithful as-applied
-- history; replaying the chain ends on the 5b definition.

drop function if exists public.search_salons_ranked(text, int);

create or replace function public.search_salons_ranked(
  p_q text,
  p_limit int default 30,
  p_query_embedding text default null
)
returns table(salon_id uuid, score real)
language sql stable security definer set search_path = public, extensions
as $func$
  with
  w as (select * from public.search_ranking_weights where id = 1),
  qx as (select case when length(btrim(coalesce(p_q,''))) >= 2
                     then nullif(lower(public.f_unaccent(btrim(p_q))),'')
                     else null end as norm),
  syn as (select string_agg(distinct s.canonical,' ') as exp
          from public.search_synonyms s, qx
          where qx.norm is not null and s.is_active
            and lower(public.f_unaccent(s.term)) = qx.norm),
  cano as (select case when (select exp from syn) is not null
                       then string_to_array(lower(public.f_unaccent((select exp from syn))),' ')
                       else array[]::text[] end as toks),
  tq   as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select norm from qx),''))) as q),
  synq as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select exp from syn),''))) as q),
  tqx  as (select case
             when (select q from synq)::text = '' then (select q from tq)
             when (select q from tq)::text   = '' then (select q from synq)
             else (select q from tq) || (select q from synq) end as q),
  qemb as (select nullif(p_query_embedding,'')::vector as v),
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
      or s.name_en ilike '%'||(select norm from qx)||'%'
      or exists (select 1 from unnest((select toks from cano)) as t(tok)
                 where length(t.tok) >= 3 and s.name_de ilike '%'||t.tok||'%'))
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
  lex as (select * from svc union all select * from sal union all select * from stf),
  lexagg as (
    select salon_id, max(fts_direct) as fts_direct, max(fts_exp) as fts_exp,
           max(wsim) as wsim, max(exact) as exact
    from lex group by salon_id
  ),
  vec as (
    select sid as salon_id, max(vsim) as vsim
    from (
      select
        case se.entity_type
          when 'salon'   then se.entity_id
          when 'service' then (select s.salon_id from public.services s where s.id = se.entity_id)
        end as sid,
        1 - (se.embedding <=> (select v from qemb)) as vsim
      from public.search_embeddings se
      where (select v from qemb) is not null
        and se.entity_type in ('service','salon')
    ) x
    where x.sid is not null and x.vsim > 0.55
    group by x.sid
  ),
  cand as (select salon_id from lexagg union select salon_id from vec)
  select c.salon_id,
    (   w.w_fts        * (coalesce(la.fts_direct,0) + 0.6 * greatest(coalesce(la.fts_exp,0) - coalesce(la.fts_direct,0), 0))
      + w.w_fuzzy      * coalesce(la.wsim,0)
      + w.w_exact      * coalesce(la.exact,0)
      + w.w_rating     * (( sa.review_count::real * coalesce(sa.average_rating,0) + w.bayes_prior_m * w.bayes_global_c)
                          / nullif(sa.review_count + w.bayes_prior_m, 0) / 5.0)
      + w.w_vector     * coalesce(v.vsim,0)
      + w.w_popularity * coalesce(pop.popularity,0)
    )::real as score
  from cand c
  join public.salons sa on sa.id = c.salon_id
  left join lexagg la  on la.salon_id  = c.salon_id
  left join vec v      on v.salon_id   = c.salon_id
  left join public.search_popularity pop on pop.salon_id = c.salon_id
  cross join w
  where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false) = false
  order by score desc, sa.average_rating desc nulls last, sa.id
  limit greatest(coalesce(p_limit,30),1);
$func$;

update public.search_ranking_weights set w_vector = 0.35, updated_at = now() where id = 1;

grant execute on function public.search_salons_ranked(text,int,text) to anon, authenticated, service_role;
