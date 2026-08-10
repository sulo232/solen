-- S7 of the all-language sweep, 2026-07-27. APPLIED LIVE via apply_migration, then backfilled
-- here per _rules/DB_SCHEMA.md section 7. Owner asked how to handle text nobody controls:
-- "reviews section or salon services or desicriptuon and more yk".
--
-- WHY A SEPARATE TABLE rather than comment_fr / comment_it columns on reviews:
--   1. The customer's original must stay obviously primary. A machine translation sitting in
--      the same row, in a column that looks just like the real one, is how a translation
--      quietly becomes "what they said". Here it can never be mistaken for the source.
--   2. N locales without N columns.
--   3. Invalidation is a DELETE of a derived row, never a nullify of something authored.
--
-- ON-READ, not on-write: most reviews will never be read by someone in another language, so
-- translating all of them up front is waste. First request in a foreign locale fills the cache.

create table if not exists public.review_translations (
  id            uuid primary key default gen_random_uuid(),
  review_id     uuid not null references public.reviews(id) on delete cascade,
  locale        text not null check (locale in ('de','en','fr','it')),
  translated    text not null,
  source_locale text not null default 'de',
  created_at    timestamptz not null default now(),
  unique (review_id, locale)
);

comment on table public.review_translations is
  'Machine translations of reviews.comment, filled on first read in a foreign locale. The ORIGINAL always lives in reviews.comment and is always shown alongside; nothing here is authored content.';

create index if not exists review_translations_review_locale_idx
  on public.review_translations (review_id, locale);

alter table public.review_translations enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='review_translations' and policyname='review_translations_public_read') then
    create policy review_translations_public_read
      on public.review_translations for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='review_translations' and policyname='review_translations_service_write') then
    create policy review_translations_service_write
      on public.review_translations for insert to service_role with check (true);
  end if;
end $$;
