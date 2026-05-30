-- 20260530_seed_noncoiffeur_services.sql
-- Seed demo services + prices for active non-coiffeur salons that had none.
-- Why: only the 4 coiffeur demo salons (Atelier Haarwerk + 3) had services, so
-- the search map showed price pills for them and bare dots for the other 16
-- (barbershop / nails / makeup / waxing). With no service price, MapView falls
-- back to a dot. Seeding 3 category-typical services each gives every salon an
-- "ab X CHF" pill and makes them bookable. Basel market rates.
--
-- Idempotent: each INSERT only targets salons of that category with ZERO
-- existing services, so re-running (or a later `supabase db push`) is a no-op.
-- Only the live columns are used (services has no name_fr/name_it).

-- Barbershop → ab 28 CHF
INSERT INTO services (salon_id, name_de, name_en, category, duration_minutes, price)
SELECT s.id, v.name_de, v.name_en, 'barbershop', v.dur, v.price
FROM salons s
CROSS JOIN (VALUES
  ('Herrenschnitt', 'Men''s Haircut', 30, 45),
  ('Bart trimmen',  'Beard Trim',    20, 28),
  ('Coupe & Bart',  'Cut & Beard',   45, 68)
) AS v(name_de, name_en, dur, price)
WHERE s.is_active = true
  AND s.categories @> ARRAY['barbershop']::text[]
  AND NOT EXISTS (SELECT 1 FROM services sv WHERE sv.salon_id = s.id);

-- Nails → ab 55 CHF
INSERT INTO services (salon_id, name_de, name_en, category, duration_minutes, price)
SELECT s.id, v.name_de, v.name_en, 'nails', v.dur, v.price
FROM salons s
CROSS JOIN (VALUES
  ('Maniküre',  'Manicure',   45, 55),
  ('Gellack',   'Gel Polish', 60, 70),
  ('Pediküre',  'Pedicure',   60, 75)
) AS v(name_de, name_en, dur, price)
WHERE s.is_active = true
  AND s.categories @> ARRAY['nails']::text[]
  AND NOT EXISTS (SELECT 1 FROM services sv WHERE sv.salon_id = s.id);

-- Makeup → ab 75 CHF
INSERT INTO services (salon_id, name_de, name_en, category, duration_minutes, price)
SELECT s.id, v.name_de, v.name_en, 'makeup', v.dur, v.price
FROM salons s
CROSS JOIN (VALUES
  ('Tages-Make-up',  'Day Make-up',     45, 75),
  ('Abend-Make-up',  'Evening Make-up', 60, 110),
  ('Braut-Make-up',  'Bridal Make-up',  90, 190)
) AS v(name_de, name_en, dur, price)
WHERE s.is_active = true
  AND s.categories @> ARRAY['makeup']::text[]
  AND NOT EXISTS (SELECT 1 FROM services sv WHERE sv.salon_id = s.id);

-- Waxing → ab 22 CHF
INSERT INTO services (salon_id, name_de, name_en, category, duration_minutes, price)
SELECT s.id, v.name_de, v.name_en, 'waxing', v.dur, v.price
FROM salons s
CROSS JOIN (VALUES
  ('Augenbrauen',     'Eyebrows',   15, 22),
  ('Beine komplett',  'Full Legs',  45, 65),
  ('Intim-Waxing',    'Intimate',   30, 70)
) AS v(name_de, name_en, dur, price)
WHERE s.is_active = true
  AND s.categories @> ARRAY['waxing']::text[]
  AND NOT EXISTS (SELECT 1 FROM services sv WHERE sv.salon_id = s.id);
