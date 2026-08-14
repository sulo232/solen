-- exists-check: net-new — mirrors prod migration perf_rls_initplan_wrap_followup (applied via apply_migration, version 20260628153423), absent from the repo. Idempotent re-run of the 20260623224355 initplan wrap to catch policies created since (e.g. hand_chart_notes_manage_salon with a bare auth.uid()).
-- Follow-up init-plan wrap for policies created after the first pass (e.g.
-- hand_chart_notes_manage_salon with a bare auth.uid()). Idempotent.
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
    q := p.qual; wc := p.with_check;
    if q is not null then
      q := regexp_replace(q, '\(\s*select\s+(auth\.(uid|jwt|role)\(\))(\s+as\s+\w+)?\s*\)', '\1', 'gi');
      q := regexp_replace(q, '(auth\.(uid|jwt|role)\(\))', '(select \1)', 'g');
    end if;
    if wc is not null then
      wc := regexp_replace(wc, '\(\s*select\s+(auth\.(uid|jwt|role)\(\))(\s+as\s+\w+)?\s*\)', '\1', 'gi');
      wc := regexp_replace(wc, '(auth\.(uid|jwt|role)\(\))', '(select \1)', 'g');
    end if;
    sql := 'alter policy ' || quote_ident(p.policyname) || ' on ' || quote_ident(p.schemaname) || '.' || quote_ident(p.tablename);
    if q is not null then sql := sql || ' using (' || q || ')'; end if;
    if wc is not null then sql := sql || ' with check (' || wc || ')'; end if;
    execute sql;
  end loop;
end $$;
