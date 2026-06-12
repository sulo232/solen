-- Waitlist entries can name a preferred stylist (owner 2026-06-12: "which staff,
-- because I don't believe it's in it"). Null = any staff (Keine Präferenz).
alter table public.waitlist
  add column if not exists staff_member_id uuid references public.staff_members(id) on delete set null;
