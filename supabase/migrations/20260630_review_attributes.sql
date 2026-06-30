-- exists-check: net-new table DDL (review_attributes); `npm run exists review_attributes` had 0 hits before this. Sibling to the dated migrations under supabase/migrations/. Not extending any listed file (those are lib/* + rules, unrelated to review schema).
-- review_attributes: customer-confirmed salon amenities on a salon review (Google-Maps style).
-- Applied live via apply_migration "add_review_attributes" on 2026-06-30; this file is the repo record.
-- Additive + idempotent. Do NOT run via `supabase db push/reset` (CASCADE data loss); the live DB is canonical.

create table if not exists public.review_attributes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  attribute_key text not null,
  created_at timestamptz not null default now(),
  unique (review_id, attribute_key)
);

create index if not exists review_attributes_review_id_idx on public.review_attributes(review_id);

alter table public.review_attributes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='review_attributes' and policyname='review_attributes_select_public') then
    create policy "review_attributes_select_public" on public.review_attributes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='review_attributes' and policyname='review_attributes_insert_author') then
    create policy "review_attributes_insert_author" on public.review_attributes for insert
      with check (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));
  end if;
end $$;
