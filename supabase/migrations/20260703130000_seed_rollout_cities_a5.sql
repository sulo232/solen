-- B3/cities rollout (owner 2026-07-03): seed the additional Swiss cities Solen will enable
-- "bit by bit", DISABLED. Basel-only is the live launch state (set via data / the admin toggle,
-- not here, since is_active is owner-managed rollout state). Coords/names are geographic facts.
INSERT INTO public.cities (slug, name_de, name_en, name_fr, name_it, is_active, display_order, latitude, longitude, radius_km)
VALUES
  ('luzern',    'Luzern',    'Lucerne',   'Lucerne',   'Lucerna',   false, 4, 47.0502, 8.3093, 12),
  ('geneve',    'Genf',      'Geneva',    'Genève',    'Ginevra',   false, 5, 46.2044, 6.1432, 15),
  ('lausanne',  'Lausanne',  'Lausanne',  'Lausanne',  'Losanna',   false, 6, 46.5197, 6.6323, 12),
  ('neuchatel', 'Neuenburg', 'Neuchâtel', 'Neuchâtel', 'Neuchâtel', false, 7, 46.9925, 6.9310, 10)
ON CONFLICT (slug) DO NOTHING;
