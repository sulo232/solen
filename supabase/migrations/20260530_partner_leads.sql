-- exists-check: net-new vs every other migration in this folder, because no other file creates or
-- alters public.partner_leads (grepped the whole folder tonight: zero hits). This is not a new
-- design, it is the RESCUED original: the table has been live since May and this file, the only
-- record of how it was built, existed on one branch and nowhere else.
--
-- Partner lead capture for /fuer-salons (B2B signup form). The
-- /api/partner/leads route inserts here via the admin (service-role) client.
-- Table was MISSING — the route caught the 42P01 (undefined_table) error and
-- returned a fake success, so every submitted lead was silently dropped. This
-- creates the table so the funnel actually captures.
--
-- RESCUED 2026-08-14 from claude/magical-swanson-143371 before deleting that branch. Live check the
-- same night: the table exists and holds 5 captured leads. Idempotent, so re-running changes nothing.

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  salon_name text not null,
  source text not null default 'partner_page',
  created_at timestamptz not null default now()
);

-- Lock down: RLS enabled with NO policies = only the service-role (server admin
-- client) can read/write. Browser clients (anon/authenticated) are fully blocked.
-- The leads route uses the admin client which bypasses RLS, so inserts work.
alter table public.partner_leads enable row level security;

create index if not exists partner_leads_created_at_idx on public.partner_leads (created_at desc);
