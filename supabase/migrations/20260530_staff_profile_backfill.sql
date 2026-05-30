-- Staff profile backfill — the /api/staff/[id]/profile endpoint + StaffProfilePage
-- expect columns/tables the live DB was missing (schema drift). Additive; applied
-- via the Supabase MCP 2026-05-30, version-controlled here.

alter table public.staff_members add column if not exists bio text;
alter table public.staff_members add column if not exists instagram_url text;
alter table public.staff_members add column if not exists years_experience integer;
alter table public.staff_members add column if not exists review_count integer not null default 0;

create table if not exists public.staff_portfolio_images (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists staff_portfolio_images_staff_id_idx on public.staff_portfolio_images(staff_id);
alter table public.staff_portfolio_images enable row level security;
drop policy if exists "staff_portfolio_images_public_read" on public.staff_portfolio_images;
create policy "staff_portfolio_images_public_read" on public.staff_portfolio_images for select using (true);

create table if not exists public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);
alter table public.review_photos enable row level security;
drop policy if exists "review_photos_public_read" on public.review_photos;
create policy "review_photos_public_read" on public.review_photos for select using (true);

-- Demo seed (atelier-haarwerk): bios, experience, and distribute the salon's
-- reviews across its staff so per-staff Reviews/ratings populate. Portfolio left
-- empty intentionally (profile shows the "no portfolio yet" state, like Fresha).
update public.staff_members set
  bio = case name
    when 'Emina'  then 'Coloristin mit Leidenschaft für sonnige Balayagen und natürliche Übergänge. Jede Kundin verlässt den Salon mit einem Look, der zu ihr passt.'
    when 'Lukas'  then 'Spezialist für Herrenschnitte und klassische Cuts. Präzise, schnell und immer auf den Punkt.'
    when 'Mira'   then 'Stylistin für Hochsteckfrisuren und Brautstyling. Von elegant bis verspielt – dein grosser Tag in besten Händen.'
    when 'Tobias' then 'Schnitt und Styling mit Liebe zum Detail. Beratung auf Augenhöhe für deinen Alltagslook.'
    else bio end,
  instagram_url = 'https://instagram.com/atelier.haarwerk',
  years_experience = case name when 'Emina' then 8 when 'Lukas' then 6 when 'Mira' then 11 when 'Tobias' then 4 else years_experience end
where salon_id = 'dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89' and is_active = true;

with rr as (
  select id, row_number() over (order by created_at) - 1 as rn
  from reviews where salon_id = 'dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89'
)
update reviews set
  staff_member_id = (array['9291047d-05c1-4a72-b4f5-3e38d14e60ee','c8af954b-62bc-434b-9853-27c314797993','f0b98f39-6bb0-4495-9f7b-57e5612c0b9e','de7646cf-a7ae-43dc-bb4f-cb4e0b42763d']::uuid[])[(rr.rn % 4) + 1],
  comment = coalesce(comment, (array['Super zufrieden, komme definitiv wieder!','Tolle Beratung und ein perfektes Ergebnis.','Sehr freundlich und absolut professionell.','Genau wie besprochen – einfach top!'])[(rr.rn % 4) + 1])
from rr where reviews.id = rr.id;

update public.staff_members s set review_count = (
  select count(*) from reviews r where r.staff_member_id = s.id
) where s.salon_id = 'dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89';
