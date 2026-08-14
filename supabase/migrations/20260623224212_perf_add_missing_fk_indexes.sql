-- exists-check: net-new — mirrors prod migration perf_add_missing_fk_indexes (applied via apply_migration, version 20260623224212), absent from the repo. Not a duplicate of 007_stylist_selection_fee.sql / 20260326000001_add_missing_salon_columns.sql (those add columns, not FK indexes).
-- Add a covering index for every foreign key that lacks one (142 FKs).
-- Idempotent (IF NOT EXISTS), additive, no behavior change. Fixes the
-- unindexed_foreign_keys performance advisor findings.
do $$
declare r record; stmt text;
begin
  for r in
    select rel.relname,
      con.conkey,
      con.conrelid as relid,
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
      where i.indrelid = r.relid
        and (string_to_array(i.indkey::text, ' '))[1] = r.conkey[1]::text
    ) then
      stmt := 'create index if not exists '
        || left('idx_' || r.relname || '_' || array_to_string(r.cols, '_'), 63)
        || ' on public.' || quote_ident(r.relname) || ' ('
        || (select string_agg(quote_ident(c), ', ') from unnest(r.cols) c) || ')';
      execute stmt;
    end if;
  end loop;
end $$;
