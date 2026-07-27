-- Owner batch 2026-07-27. Three additive, idempotent changes. APPLIED LIVE via
-- apply_migration on 2026-07-27, then backfilled here per _rules/DB_SCHEMA.md section 7.
--
-- 1+2. Per-salon review controls. Owner: "salon can disable or enable reviews n stuff yk or
--      pictures". Default TRUE so every existing salon is unchanged (verified: 28/28 true).
--      DELIBERATE SEMANTIC, recorded because it is a product decision the column name does
--      not carry: reviews_enabled = false BLOCKS NEW reviews and leaves existing ones
--      VISIBLE. It is not a delete switch. A marketplace whose salons can erase criticism is
--      worth nothing to the customer reading it; declining future reviews is a legitimate
--      business choice, rewriting history is not.
alter table public.salons
  add column if not exists reviews_enabled boolean not null default true;

comment on column public.salons.reviews_enabled is
  'Salon accepts NEW reviews. false blocks new submissions; existing reviews stay visible (owner decision 2026-07-27).';

alter table public.salons
  add column if not exists review_photos_enabled boolean not null default true;

comment on column public.salons.review_photos_enabled is
  'Customers may attach photos to a review of this salon. false blocks new uploads; existing photos stay visible.';

-- 3. Let a photo be reported. content_reports.target_id is already a bare polymorphic uuid,
--    so only the taxonomy needed widening. Same shape as the harassment-reason widening in
--    20260727130000_content_reports_harassment_reason.sql. The reporter must be signed in,
--    which the existing insert policy (auth.role() = 'authenticated') already enforces ,
--    owner, verbatim: "report signed in ... cz ppl can mass report etc".
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.content_reports'::regclass
      and conname = 'content_reports_target_type_check'
  ) then
    alter table public.content_reports drop constraint content_reports_target_type_check;
  end if;
end $$;

alter table public.content_reports
  add constraint content_reports_target_type_check
  check (target_type in ('salon', 'review', 'user', 'photo'));
