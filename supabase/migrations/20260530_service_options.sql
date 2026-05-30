-- Required single-select service options (Fresha "Select an option · Required").
-- A service with rows here forces choosing one variant (e.g. hair length); the
-- chosen option's price + duration replace the service's base price for that
-- cart line. Applied additively via the Supabase MCP 2026-05-30; this file
-- version-controls it so a future rebaseline keeps it.

create table if not exists public.service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name_de text not null,
  name_en text not null,
  price numeric(10,2) not null default 0,
  duration_minutes integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists service_options_service_id_idx on public.service_options(service_id);
alter table public.service_options enable row level security;
drop policy if exists "service_options_public_read" on public.service_options;
create policy "service_options_public_read" on public.service_options for select using (true);

-- Demo seed (atelier-haarwerk): hair-length variants for two services.
insert into public.service_options (service_id, name_de, name_en, price, duration_minutes, sort_order) values
  ('373df028-1b70-4546-90a5-057786afdf4b', 'Kurzes Haar',       'Short hair',  75, 45, 1),
  ('373df028-1b70-4546-90a5-057786afdf4b', 'Mittellanges Haar', 'Medium hair', 85, 60, 2),
  ('373df028-1b70-4546-90a5-057786afdf4b', 'Langes Haar',       'Long hair',  105, 75, 3),
  ('4ca38c3e-fe11-4efb-a922-f2a05b739d6e', 'Kurzes Haar',       'Short hair',  39, 25, 1),
  ('4ca38c3e-fe11-4efb-a922-f2a05b739d6e', 'Mittellanges Haar', 'Medium hair', 45, 30, 2),
  ('4ca38c3e-fe11-4efb-a922-f2a05b739d6e', 'Langes Haar',       'Long hair',   59, 40, 3)
on conflict do nothing;
