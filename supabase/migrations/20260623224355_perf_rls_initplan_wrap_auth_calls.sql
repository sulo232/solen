-- exists-check: net-new — mirrors prod migration perf_rls_initplan_wrap_auth_calls (applied via apply_migration, version 20260623224355), absent from the repo. Not a duplicate of 029_review_policies.sql / 033_guest_checkout.sql (those define specific policies; this rewrites auth.* calls across all policies for the initplan fix).
-- Wrap auth.uid()/auth.jwt()/auth.role() in a scalar subselect so the planner
-- evaluates them ONCE per query (initplan) instead of once per row. Semantically
-- identical; fixes the auth_rls_initplan performance advisor findings.
-- Atomic: any malformed rewrite aborts the whole migration (no partial state).
do $$
declare p record; q text; wc text; sql text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and qual ~ 'auth\.(uid|jwt|role)\(\)')
        or (with_check is not null and with_check ~ 'auth\.(uid|jwt|role)\(\)')
      )
  loop
    q := p.qual;
    wc := p.with_check;
    -- 1) collapse any existing wraps (tolerating an "AS alias") back to bare call,
    -- 2) then wrap every bare call once. Net effect is idempotent.
    if q is not null then
      q := regexp_replace(q, '\(\s*select\s+(auth\.(uid|jwt|role)\(\))(\s+as\s+\w+)?\s*\)', '\1', 'gi');
      q := regexp_replace(q, '(auth\.(uid|jwt|role)\(\))', '(select \1)', 'g');
    end if;
    if wc is not null then
      wc := regexp_replace(wc, '\(\s*select\s+(auth\.(uid|jwt|role)\(\))(\s+as\s+\w+)?\s*\)', '\1', 'gi');
      wc := regexp_replace(wc, '(auth\.(uid|jwt|role)\(\))', '(select \1)', 'g');
    end if;
    sql := 'alter policy ' || quote_ident(p.policyname)
        || ' on ' || quote_ident(p.schemaname) || '.' || quote_ident(p.tablename);
    if q is not null then sql := sql || ' using (' || q || ')'; end if;
    if wc is not null then sql := sql || ' with check (' || wc || ')'; end if;
    execute sql;
  end loop;
end $$;
