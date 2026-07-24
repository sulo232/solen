-- Salon portfolio images: per-photo CATEGORY for the salon gallery.
-- Owner ask (2026-07-25, PDP_OVERHAUL.md X2/3b-3e): "portfolio to be categories...
-- like men's cut or a woman's cut, that the salon itself can upload those stuff and
-- categorize it... and a whole system behind it and also in the dashboard."
-- Model A (fixed taxonomy per salon category) was picked over free-text tags (B)
-- and service-derived categories (C). Canonical key list + labels live in
-- lib/portfolio-categories.ts (read by the API route, GalleryManager, and the PDP
-- gallery), the CHECK constraint below is kept in lockstep BY HAND with that
-- module's PORTFOLIO_CATEGORY_KEYS.
--
-- salons.gallery_urls (text[]) has nowhere to hang a per-photo category, so this
-- table is the new categorized read/write path. gallery_urls is KEPT and NOT
-- dropped in this migration (other code still reads it directly, see
-- _docs/BACKEND.md section 3), the gallery API route dual-writes both.
--
-- Exists-check note: a legacy `salon_photos` table already exists live (0 rows,
-- migration 004_salon_photos.sql) but its `salon_id` column is INTEGER with no FK,
-- predating the current UUID `salons.id` (migration 014_new_schema.sql), it cannot
-- join to the live salons table at all and its RLS write policies have no ownership
-- check ("USING (true)"). Not reused: wrong type, orphaned, unsafe shape. This table
-- follows the CURRENT staff_portfolio_images / services pattern instead.

create table if not exists public.salon_portfolio_images (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  image_url text not null,
  -- Every valid taxonomy value across the 4 salon-category verticals, flattened +
  -- deduped ("styling" is shared by barbershop + coiffeur). NULL = uncategorized
  -- (backfilled rows start here). A plain CHECK can't see which salon owns the row,
  -- so it only guards "is this a REAL taxonomy value", "is it valid for THIS
  -- salon's own category" is the finer check, done in the API via
  -- lib/portfolio-categories.ts's getPortfolioCategoriesForSalon(), the same
  -- DB-CHECK-plus-app-layer split this codebase already uses for services.category.
  category text check (category is null or category in (
    'haircut', 'fade', 'beard', 'styling',
    'womens_cut', 'mens_cut', 'color',
    'manicure', 'pedicure', 'nail_art', 'gel',
    'face', 'massage', 'waxing', 'other'
  )),
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists salon_portfolio_images_salon_id_idx
  on public.salon_portfolio_images (salon_id);

alter table public.salon_portfolio_images enable row level security;

-- Public can view (mirrors staff_portfolio_images / services: gallery photos are
-- public marketing content, never gated).
drop policy if exists "salon_portfolio_images_select_public" on public.salon_portfolio_images;
create policy "salon_portfolio_images_select_public" on public.salon_portfolio_images
  for select using (true);

-- Only the salon's own owner can write (mirrors staff_portfolio_images's
-- "portfolio_images_manage_owner" / services' "services_manage_owner" EXISTS shape).
drop policy if exists "salon_portfolio_images_manage_owner" on public.salon_portfolio_images;
create policy "salon_portfolio_images_manage_owner" on public.salon_portfolio_images
  for all using (
    exists (
      select 1 from public.salons s
      where s.id = salon_portfolio_images.salon_id
      and s.owner_id = auth.uid()
    )
  );

-- Backfill: every existing salons.gallery_urls entry becomes a row here, category
-- NULL (uncategorized until the owner assigns one), sort_order = its array
-- position (0-based, preserving the existing display order). Idempotent: only
-- inserts a (salon_id, image_url) pair that isn't already present, so re-running
-- this migration (or a future upload through the gallery route that ALSO writes
-- gallery_urls) never duplicates a row.
insert into public.salon_portfolio_images (salon_id, image_url, category, sort_order)
select s.id, u.url, null, (u.ord - 1)
from public.salons s
cross join lateral unnest(s.gallery_urls) with ordinality as u(url, ord)
where s.gallery_urls is not null
  and array_length(s.gallery_urls, 1) > 0
  and not exists (
    select 1 from public.salon_portfolio_images spi
    where spi.salon_id = s.id and spi.image_url = u.url
  );
