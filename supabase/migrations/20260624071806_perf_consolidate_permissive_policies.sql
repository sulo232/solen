-- exists-check: net-new — mirrors prod migration perf_consolidate_permissive_policies (applied via apply_migration, version 20260624071806), absent from the repo. Generic OR-merge of duplicate permissive policies; not a duplicate of any per-feature policy migration (029_review_policies.sql, 076_account_actions.sql, etc.).
-- Consolidate multiple PERMISSIVE policies per (table, cmd, roles) into one policy
-- whose USING is the OR of the members. Access-neutral by construction (Postgres
-- already OR-combines multiple permissive policies). Only PERMISSIVE policies are
-- touched; RESTRICTIVE are left alone. For ALL-command policies, WITH CHECK is
-- omitted so it inherits the (merged) USING — matching the originals, which also
-- omitted WITH CHECK. All 18 groups are role {public} with null WITH CHECK.
do $$
declare
  g record;
  m text;
begin
  -- 1. snapshot the consolidation plan BEFORE any change (stable loop source)
  create temp table _consol on commit drop as
    select tablename,
           cmd,
           array_to_string(roles, ', ') as roles_csv,
           string_agg('(' || qual || ')', ' OR ') as merged_using,
           array_agg(policyname) as members
    from pg_policies
    where schemaname = 'public' and permissive = 'PERMISSIVE'
    group by tablename, cmd, roles
    having count(*) > 1;

  -- 2. for each group: drop members, create one OR-merged policy
  for g in select * from _consol loop
    foreach m in array g.members loop
      execute format('drop policy %I on public.%I', m, g.tablename);
    end loop;
    execute format(
      'create policy %I on public.%I for %s to %s using (%s)',
      left(g.tablename || '_' || lower(g.cmd) || '_merged', 63),
      g.tablename, g.cmd, g.roles_csv, g.merged_using
    );
  end loop;
end $$;
