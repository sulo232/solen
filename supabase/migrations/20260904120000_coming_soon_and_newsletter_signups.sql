-- exists-check: `npm run exists coming_soon` and `npm run exists newsletter` (run 2026-09-04) both
-- return zero matches for coming_soon_signups / newsletter_subscribers as a table, migration, or
-- entry in lib/database.types.ts. Both keywords DO surface the two API routes below that already
-- write to these table names, plus comingSoonNotifySchema / newsletterSchema in lib/validations.ts.
--
-- 20260904120000_coming_soon_and_newsletter_signups
--
-- Half-landed feature, confirmed live today with to_regclass('public.coming_soon_signups') and
-- to_regclass('public.newsletter_subscribers') both returning null: the routes and their upsert
-- calls shipped, the tables backing them never did. Every signup through
-- app/[locale]/coming-soon/page.tsx and the newsletter form in
-- app/[locale]/_components/layout/Footer.tsx has been silently dropped since (the routes catch
-- the resulting Postgres error and either answer ok:true anyway, or 500).
--
-- COLUMN SHAPE matches exactly what each route reads and writes, no more:
--   coming_soon_signups: app/api/coming-soon-notify/route.ts:36-38 upserts {email, feature} with
--   onConflict "email,feature" -> composite unique constraint on (email, feature).
--   newsletter_subscribers: app/api/newsletter/route.ts:32-34 upserts {email} with onConflict
--   "email" -> unique constraint on email.
--
-- RLS: enabled, deliberately ZERO policies, same posture as cron_locks / csp_violation_reports.
-- Both routes write via the service-role admin client (createAdminSupabaseClient),
-- which bypasses RLS; anon/authenticated get nothing,
-- and no browser-side client has a legitimate reason to read or write these directly.
--
-- Additive, idempotent, forward-only. No data, no drops.

create table if not exists public.coming_soon_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  feature text not null default 'default',
  created_at timestamptz not null default now()
);

create unique index if not exists coming_soon_signups_email_feature_key
  on public.coming_soon_signups (email, feature);

alter table public.coming_soon_signups enable row level security;

comment on table public.coming_soon_signups is
  'Email capture for Coming Soon pages, written by app/api/coming-soon-notify/route.ts (service-role only, no public policies).';

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (email);

alter table public.newsletter_subscribers enable row level security;

comment on table public.newsletter_subscribers is
  'Newsletter signups from the site footer form, written by app/api/newsletter/route.ts (service-role only, no public policies).';
