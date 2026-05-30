-- Staff profile stats — Fresha individual-profile reference (IMG_4885/4887) shows
-- an "Appointments completed / Clients served" stat row under the rating. Additive
-- columns + demo seed (atelier-haarwerk), applied via Supabase MCP 2026-05-30.

alter table public.staff_members add column if not exists appointments_completed integer not null default 0;
alter table public.staff_members add column if not exists clients_served integer not null default 0;

-- Demo seed (atelier-haarwerk staff) so the stat row populates like the reference.
update public.staff_members set
  appointments_completed = case name
    when 'Emina'  then 240
    when 'Lukas'  then 312
    when 'Mira'   then 96
    when 'Tobias' then 158
    else appointments_completed end,
  clients_served = case name
    when 'Emina'  then 181
    when 'Lukas'  then 224
    when 'Mira'   then 73
    when 'Tobias' then 119
    else clients_served end
where salon_id = 'dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89' and is_active = true;
