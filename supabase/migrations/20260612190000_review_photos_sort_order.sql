-- The salon API selects review_photos(sort_order); the column never landed
-- (schema drift) so the joined reviews query errored and the route returned
-- reviews: [] silently. 2026-06-12.
alter table public.review_photos
  add column if not exists sort_order integer not null default 0;
