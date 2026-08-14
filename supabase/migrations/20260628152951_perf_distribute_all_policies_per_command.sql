-- exists-check: net-new — mirrors prod migration perf_distribute_all_policies_per_command (applied via apply_migration, version 20260628152951), absent from the repo. Follows 20260624071806 (same-cmd merge); this one splits FOR ALL policies into per-command policies to clear the remaining multiple_permissive_policies findings. Reviewer-verified (writer != reviewer) before apply.
-- Eliminate multiple_permissive_policies findings caused by a broad FOR ALL policy
-- overlapping per-command policies: split each ALL policy into explicit per-command
-- policies, OR-merged with the same-command specifics. Access-neutral by construction.
-- Reviewer-corrected: specific WITH CHECK uses coalesce(with_check, qual) so an UPDATE
-- policy that omits WITH CHECK keeps its USING-as-check (Postgres inherit rule).
do $$
declare
  tr record; c text; a_using text; a_check text; spec_using text; spec_check text; nu text; nc text; pn text;
begin
  create temp table _plan on commit drop as
    select tablename, roles, array_to_string(roles, ', ') as roles_csv, array_agg(policyname) as orig_names
    from pg_policies
    where schemaname = 'public' and permissive = 'PERMISSIVE' and cmd in ('ALL','SELECT','INSERT','UPDATE','DELETE')
    group by tablename, roles
    having count(*) filter (where cmd = 'ALL') >= 1 and count(*) > 1;

  for tr in select * from _plan loop
    select p.qual, coalesce(p.with_check, p.qual) into a_using, a_check
      from pg_policies p
      where p.schemaname='public' and p.permissive='PERMISSIVE'
        and p.tablename = tr.tablename and p.roles = tr.roles and p.cmd = 'ALL' limit 1;

    foreach c in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      select string_agg('(' || p.qual || ')', ' OR '),
             string_agg('(' || coalesce(p.with_check, p.qual) || ')', ' OR ')
        into spec_using, spec_check
        from pg_policies p
        where p.schemaname='public' and p.permissive='PERMISSIVE'
          and p.tablename = tr.tablename and p.roles = tr.roles and p.cmd = c;

      nu := null; nc := null;
      if c in ('SELECT','UPDATE','DELETE') then
        nu := '(' || a_using || ')';
        if spec_using is not null then nu := nu || ' OR ' || spec_using; end if;
      end if;
      if c in ('INSERT','UPDATE') then
        nc := '(' || a_check || ')';
        if spec_check is not null then nc := nc || ' OR ' || spec_check; end if;
      end if;

      execute format('create policy %I on public.%I for %s to %s %s %s',
        left(tr.tablename || '_' || lower(c) || '_' || substr(md5(tr.roles_csv), 1, 6) || '_m', 63),
        tr.tablename, c, tr.roles_csv,
        case when nu is not null then 'using (' || nu || ')' else '' end,
        case when nc is not null then 'with check (' || nc || ')' else '' end);
    end loop;

    foreach pn in array tr.orig_names loop
      execute format('drop policy %I on public.%I', pn, tr.tablename);
    end loop;
  end loop;
end $$;
