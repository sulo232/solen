-- Partner lead capture for /fuer-salons (B2B signup form). The
-- /api/partner/leads route inserts here via the admin (service-role) client.
-- Table was MISSING — the route caught the 42P01 (undefined_table) error and
-- returned a fake success, so every submitted lead was silently dropped. This
-- creates the table so the funnel actually captures.
-- Apply to the live `solen` project via Supabase MCP; this file version-controls
-- it so the schema is reproducible from migrations.

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
