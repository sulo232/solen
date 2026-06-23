-- exists-check: net-new (verified live 2026-06-23: no discovery_boards_for_you). Companion to
-- 20260623124500_user_style_affinity.sql , extends the DNA point system to the Kollektionen row (owner:
-- "kollections needs to be for you"). Orders boards by the viewer's style affinity; reads only existing tables.
create or replace function public.discovery_boards_for_you(p_user_id uuid)
returns setof discovery_boards
language sql stable set search_path to 'public'
as $func$
  select b.*
  from discovery_boards b
  where b.is_active
  order by
    coalesce((
      select sum(ua.score) from user_style_affinity ua
      where ua.user_id = p_user_id and (
        (ua.attr_type = 'tag'     and lower(coalesce(b.style_name,'') || ' ' || coalesce(b.name,'')) like '%' || ua.attr_value || '%')
        or (ua.attr_type = 'texture' and ua.attr_value = b.texture)
        or (ua.attr_type = 'gender'  and ua.attr_value = b.gender)
      )
    ), 0) desc,
    b.sort_order asc nulls last
  limit 10;
$func$;

grant execute on function public.discovery_boards_for_you(uuid) to service_role, authenticated, anon;
