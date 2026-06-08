-- Smart Search Phase 1b: one-way synonym table (colloquial / fr / it → canonical).
-- Applied via apply_migration 2026-06-06; mirrored here (repo = source of truth).

create table if not exists public.search_synonyms (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'all',
  term text not null,
  canonical text not null,
  weight real not null default 1.0,
  source text not null default 'seed',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_search_synonyms_term on public.search_synonyms (lower(term), locale);

alter table public.search_synonyms enable row level security;
drop policy if exists search_synonyms_public_read on public.search_synonyms;
create policy search_synonyms_public_read on public.search_synonyms
  for select to anon, authenticated using (is_active);
-- writes: service_role only (bypasses RLS); no write policy for anon/authenticated.

insert into public.search_synonyms (locale, term, canonical) values
  ('de','herren','herren haarschnitt'),('de','männer','herren haarschnitt'),('de','mann','herren haarschnitt'),
  ('de','männerschnitt','herren haarschnitt'),('de','herrenschnitt','herren haarschnitt'),
  ('de','damen','damen haarschnitt'),('de','frauen','damen haarschnitt'),('de','damenschnitt','damen haarschnitt'),
  ('de','schnitt','haarschnitt'),('de','haare schneiden','haarschnitt'),
  ('de','farbe','färben'),('de','tönung','färben'),('de','tönen','färben'),('de','coloration','färben'),
  ('de','strähnen','strähnen balayage'),('de','highlights','strähnen balayage'),('de','balayage','strähnen balayage'),
  ('de','rasur','bart'),('de','nägel','nägel maniküre'),('de','nagel','nägel maniküre'),('de','maniküre','nägel maniküre'),
  ('de','pediküre','pediküre'),('de','fusspflege','pediküre'),
  ('de','wimpern','wimpern'),('de','lashes','wimpern'),('de','wimpernverlängerung','wimpern'),
  ('de','augenbrauen','augenbrauen'),('de','brauen','augenbrauen'),
  ('de','waxing','waxing'),('de','haarentfernung','waxing'),('de','sugaring','waxing'),
  ('de','make up','make-up'),('de','makeup','make-up'),('de','schminken','make-up'),
  ('fr','coupe homme','herren haarschnitt'),('fr','coupe femme','damen haarschnitt'),
  ('fr','couleur','färben'),('fr','coloration','färben'),('fr','mèches','strähnen balayage'),
  ('fr','barbe','bart'),('fr','manucure','nägel maniküre'),('fr','ongles','nägel maniküre'),
  ('fr','pédicure','pediküre'),('fr','massage','massage'),('fr','épilation','waxing'),('fr','coiffeur','haarschnitt'),
  ('it','taglio uomo','herren haarschnitt'),('it','taglio donna','damen haarschnitt'),
  ('it','colore','färben'),('it','barba','bart'),('it','manicure','nägel maniküre'),('it','unghie','nägel maniküre'),
  ('it','pedicure','pediküre'),('it','massaggio','massage'),('it','ceretta','waxing'),('it','depilazione','waxing')
on conflict (lower(term), locale) do nothing;

-- Teardown: drop table if exists public.search_synonyms;
