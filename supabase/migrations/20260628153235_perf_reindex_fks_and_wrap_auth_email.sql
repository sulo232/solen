-- exists-check: net-new — mirrors prod migration perf_reindex_fks_and_wrap_auth_email (applied via apply_migration, version 20260628153235), absent from the repo. Cleanup follow-up to 20260623224212 (FK indexes) + 20260623224355 (initplan); catches FKs added since + wraps auth.email().
-- Cleanup pass: (1) index any FK still missing one (idempotent — catches FKs added
-- after the first pass), (2) wrap auth.email() in a scalar subselect like uid/jwt/role.
do $$
declare r record; stmt text;
begin
  for r in
    select rel.relname, con.conkey, con.conrelid as relid,
      (select array_agg(att.attname order by k.ord)
         from unnest(con.conkey) with ordinality k(attnum, ord)
         join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum) as cols
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where con.contype = 'f' and ns.nspname = 'public'
  loop
    if not exists (
      select 1 from pg_index i
      where i.indrelid = r.relid and (string_to_array(i.indkey::text, ' '))[1] = r.conkey[1]::text
    ) then
      stmt := 'create index if not exists '
        || left('idx_' || r.relname || '_' || array_to_string(r.cols, '_'), 63)
        || ' on public.' || quote_ident(r.relname) || ' ('
        || (select string_agg(quote_ident(c), ', ') from unnest(r.cols) c) || ')';
      execute stmt;
    end if;
  end loop;
end $$;

do $$
declare p record; q text; wc text; sql text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and ((qual is not null and qual ~ 'auth\.email\(\)') or (with_check is not null and with_check ~ 'auth\.email\(\)'))
  loop
    q := p.qual; wc := p.with_check;
    if q is not null then
      q := regexp_replace(q, '\(\s*select\s+(auth\.email\(\))(\s+as\s+\w+)?\s*\)', '\1', 'gi');
      q := regexp_replace(q, '(auth\.email\(\))', '(select \1)', 'g');
    end if;
    if wc is not null then
      wc := regexp_replace(wc, '\(\s*select\s+(auth\.email\(\))(\s+as\s+\w+)?\s*\)', '\1', 'gi');
      wc := regexp_replace(wc, '(auth\.email\(\))', '(select \1)', 'g');
    end if;
    sql := 'alter policy ' || quote_ident(p.policyname) || ' on ' || quote_ident(p.schemaname) || '.' || quote_ident(p.tablename);
    if q is not null then sql := sql || ' using (' || q || ')'; end if;
    if wc is not null then sql := sql || ' with check (' || wc || ')'; end if;
    execute sql;
  end loop;
end $$;
