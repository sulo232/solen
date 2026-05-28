-- V3-D345 (2026-05-28): analytics table for salon PDP view tracking.
-- The /api/analytics/track-view route inserts here via the admin (service-role)
-- client. Table was missing (PGRST205), causing 500s on every salon page load.
-- Applied to the live `solen` project via Supabase MCP on 2026-05-28; this file
-- version-controls it so the schema is reproducible from migrations.

create table if not exists public.salon_page_views (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  source text not null default 'direct',
  created_at timestamptz not null default now()
);

-- Lock down: RLS enabled with NO policies = only the service-role (server admin
-- client) can read/write. Browser clients (anon/authenticated) are fully blocked.
-- The track-view route uses the admin client which bypasses RLS, so inserts work.
alter table public.salon_page_views enable row level security;

-- Indexes for the analytics queries (count per salon, sort by recency).
create index if not exists salon_page_views_salon_id_idx on public.salon_page_views (salon_id);
create index if not exists salon_page_views_created_at_idx on public.salon_page_views (created_at desc);
