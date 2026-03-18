-- Migration 044: Service Categories (3-level tree) + seed data
-- Phase 1.1 of roadmap-treatwell-v5

-- ─── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de text NOT NULL,
  name_en text,
  name_fr text,
  name_it text,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.service_categories(id) ON DELETE CASCADE,
  icon_name text,
  sort_order int DEFAULT 0,
  level int DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON public.service_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_categories_level ON public.service_categories(level);

-- RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_categories_public_read" ON public.service_categories
  FOR SELECT USING (true);

-- Only admins can write (via service role key)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated

-- ─── Seed Data ───────────────────────────────────────────────────────────────
-- Level 1: Top categories (match existing services.category values)
-- Level 2: Subcategories
-- Level 3: Specific treatments

-- ═══ COIFFEUR ═══
INSERT INTO public.service_categories (name_de, name_en, slug, icon_name, sort_order, level) VALUES
('Coiffeur', 'Hair Salon', 'coiffeur', 'Scissors', 1, 1);

-- Coiffeur > Damen
INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, icon_name, sort_order, level) VALUES
('Damen', 'Women', 'coiffeur-damen', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur'), NULL, 1, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Haarschnitt Damen', 'Women''s Haircut', 'damen-haarschnitt', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 1, 3),
('Balayage', 'Balayage', 'damen-balayage', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 2, 3),
('Strähnen', 'Highlights', 'damen-straehnen', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 3, 3),
('Färben', 'Hair Coloring', 'damen-faerben', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 4, 3),
('Föhnen & Styling', 'Blow Dry & Styling', 'damen-foehnen', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 5, 3),
('Hochsteckfrisur', 'Updo', 'damen-hochsteckfrisur', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 6, 3),
('Dauerwelle', 'Perm', 'damen-dauerwelle', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 7, 3),
('Keratin-Behandlung', 'Keratin Treatment', 'damen-keratin', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 8, 3),
('Extensions', 'Hair Extensions', 'damen-extensions', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-damen'), 9, 3);

-- Coiffeur > Herren
INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, icon_name, sort_order, level) VALUES
('Herren', 'Men', 'coiffeur-herren', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur'), NULL, 2, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Haarschnitt Herren', 'Men''s Haircut', 'herren-haarschnitt', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-herren'), 1, 3),
('Fade', 'Fade', 'herren-fade', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-herren'), 2, 3),
('Buzz Cut', 'Buzz Cut', 'herren-buzzcut', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-herren'), 3, 3),
('Färben Herren', 'Men''s Coloring', 'herren-faerben', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-herren'), 4, 3);

-- Coiffeur > Kinder
INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, icon_name, sort_order, level) VALUES
('Kinder', 'Children', 'coiffeur-kinder', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur'), NULL, 3, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Kinderhaarschnitt', 'Children''s Haircut', 'kinder-haarschnitt', (SELECT id FROM public.service_categories WHERE slug = 'coiffeur-kinder'), 1, 3);

-- ═══ BARBERSHOP ═══
INSERT INTO public.service_categories (name_de, name_en, slug, icon_name, sort_order, level) VALUES
('Barbershop', 'Barbershop', 'barbershop', 'User', 2, 1);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Bartpflege', 'Beard Grooming', 'barber-bartpflege', (SELECT id FROM public.service_categories WHERE slug = 'barbershop'), 1, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Bart trimmen', 'Beard Trim', 'barber-bart-trimmen', (SELECT id FROM public.service_categories WHERE slug = 'barber-bartpflege'), 1, 3),
('Rasur', 'Shave', 'barber-rasur', (SELECT id FROM public.service_categories WHERE slug = 'barber-bartpflege'), 2, 3),
('Bart & Schnitt Kombi', 'Beard & Cut Combo', 'barber-kombi', (SELECT id FROM public.service_categories WHERE slug = 'barber-bartpflege'), 3, 3);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Herrenschnitt', 'Men''s Cut', 'barber-herrenschnitt', (SELECT id FROM public.service_categories WHERE slug = 'barbershop'), 2, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Skin Fade', 'Skin Fade', 'barber-skin-fade', (SELECT id FROM public.service_categories WHERE slug = 'barber-herrenschnitt'), 1, 3),
('Classic Cut', 'Classic Cut', 'barber-classic-cut', (SELECT id FROM public.service_categories WHERE slug = 'barber-herrenschnitt'), 2, 3);

-- ═══ NAILS ═══
INSERT INTO public.service_categories (name_de, name_en, slug, icon_name, sort_order, level) VALUES
('Nails', 'Nails', 'nails', 'Sparkles', 3, 1);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Maniküre', 'Manicure', 'nails-manikuere', (SELECT id FROM public.service_categories WHERE slug = 'nails'), 1, 2),
('Pediküre', 'Pedicure', 'nails-pedikuere', (SELECT id FROM public.service_categories WHERE slug = 'nails'), 2, 2),
('Nail Art', 'Nail Art', 'nails-nail-art', (SELECT id FROM public.service_categories WHERE slug = 'nails'), 3, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Klassische Maniküre', 'Classic Manicure', 'nails-klassische-manikuere', (SELECT id FROM public.service_categories WHERE slug = 'nails-manikuere'), 1, 3),
('Gel-Maniküre', 'Gel Manicure', 'nails-gel-manikuere', (SELECT id FROM public.service_categories WHERE slug = 'nails-manikuere'), 2, 3),
('Shellac', 'Shellac', 'nails-shellac', (SELECT id FROM public.service_categories WHERE slug = 'nails-manikuere'), 3, 3),
('Acryl-Nägel', 'Acrylic Nails', 'nails-acryl', (SELECT id FROM public.service_categories WHERE slug = 'nails-manikuere'), 4, 3),
('Klassische Pediküre', 'Classic Pedicure', 'nails-klassische-pedikuere', (SELECT id FROM public.service_categories WHERE slug = 'nails-pedikuere'), 1, 3),
('Medizinische Pediküre', 'Medical Pedicure', 'nails-medizinische-pedikuere', (SELECT id FROM public.service_categories WHERE slug = 'nails-pedikuere'), 2, 3);

-- ═══ SPA ═══
INSERT INTO public.service_categories (name_de, name_en, slug, icon_name, sort_order, level) VALUES
('Spa & Massage', 'Spa & Massage', 'spa', 'Waves', 4, 1);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Massage', 'Massage', 'spa-massage', (SELECT id FROM public.service_categories WHERE slug = 'spa'), 1, 2),
('Gesichtsbehandlung', 'Facial Treatment', 'spa-gesicht', (SELECT id FROM public.service_categories WHERE slug = 'spa'), 2, 2),
('Körperbehandlung', 'Body Treatment', 'spa-koerper', (SELECT id FROM public.service_categories WHERE slug = 'spa'), 3, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Klassische Massage', 'Classic Massage', 'spa-klassische-massage', (SELECT id FROM public.service_categories WHERE slug = 'spa-massage'), 1, 3),
('Hot Stone Massage', 'Hot Stone Massage', 'spa-hot-stone', (SELECT id FROM public.service_categories WHERE slug = 'spa-massage'), 2, 3),
('Aromatherapie', 'Aromatherapy', 'spa-aromatherapie', (SELECT id FROM public.service_categories WHERE slug = 'spa-massage'), 3, 3),
('Thai Massage', 'Thai Massage', 'spa-thai-massage', (SELECT id FROM public.service_categories WHERE slug = 'spa-massage'), 4, 3),
('Anti-Aging Facial', 'Anti-Aging Facial', 'spa-anti-aging', (SELECT id FROM public.service_categories WHERE slug = 'spa-gesicht'), 1, 3),
('Hydrafacial', 'Hydrafacial', 'spa-hydrafacial', (SELECT id FROM public.service_categories WHERE slug = 'spa-gesicht'), 2, 3),
('Microneedling', 'Microneedling', 'spa-microneedling', (SELECT id FROM public.service_categories WHERE slug = 'spa-gesicht'), 3, 3);

-- ═══ MAKEUP ═══
INSERT INTO public.service_categories (name_de, name_en, slug, icon_name, sort_order, level) VALUES
('Makeup', 'Makeup', 'makeup', 'Palette', 5, 1);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Tages-Makeup', 'Day Makeup', 'makeup-tages', (SELECT id FROM public.service_categories WHERE slug = 'makeup'), 1, 2),
('Abend-Makeup', 'Evening Makeup', 'makeup-abend', (SELECT id FROM public.service_categories WHERE slug = 'makeup'), 2, 2),
('Braut-Makeup', 'Bridal Makeup', 'makeup-braut', (SELECT id FROM public.service_categories WHERE slug = 'makeup'), 3, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Natürliches Tages-Makeup', 'Natural Day Makeup', 'makeup-natuerlich', (SELECT id FROM public.service_categories WHERE slug = 'makeup-tages'), 1, 3),
('Smokey Eyes', 'Smokey Eyes', 'makeup-smokey-eyes', (SELECT id FROM public.service_categories WHERE slug = 'makeup-abend'), 1, 3),
('Braut-Styling komplett', 'Complete Bridal Styling', 'makeup-braut-komplett', (SELECT id FROM public.service_categories WHERE slug = 'makeup-braut'), 1, 3),
('Wimpern & Brauen', 'Lashes & Brows', 'makeup-wimpern-brauen', (SELECT id FROM public.service_categories WHERE slug = 'makeup'), 4, 2),
('Wimpernverlängerung', 'Lash Extensions', 'makeup-wimpernverlaengerung', (SELECT id FROM public.service_categories WHERE slug = 'makeup-wimpern-brauen'), 1, 3),
('Augenbrauen-Styling', 'Brow Styling', 'makeup-augenbrauen', (SELECT id FROM public.service_categories WHERE slug = 'makeup-wimpern-brauen'), 2, 3);

-- ═══ WAXING ═══
INSERT INTO public.service_categories (name_de, name_en, slug, icon_name, sort_order, level) VALUES
('Waxing', 'Waxing', 'waxing', 'Zap', 6, 1);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Gesicht Waxing', 'Face Waxing', 'waxing-gesicht', (SELECT id FROM public.service_categories WHERE slug = 'waxing'), 1, 2),
('Körper Waxing', 'Body Waxing', 'waxing-koerper', (SELECT id FROM public.service_categories WHERE slug = 'waxing'), 2, 2);

INSERT INTO public.service_categories (name_de, name_en, slug, parent_id, sort_order, level) VALUES
('Oberlippe', 'Upper Lip', 'waxing-oberlippe', (SELECT id FROM public.service_categories WHERE slug = 'waxing-gesicht'), 1, 3),
('Augenbrauen Waxing', 'Eyebrow Waxing', 'waxing-augenbrauen', (SELECT id FROM public.service_categories WHERE slug = 'waxing-gesicht'), 2, 3),
('Beine komplett', 'Full Legs', 'waxing-beine', (SELECT id FROM public.service_categories WHERE slug = 'waxing-koerper'), 1, 3),
('Achseln', 'Underarms', 'waxing-achseln', (SELECT id FROM public.service_categories WHERE slug = 'waxing-koerper'), 2, 3),
('Bikinizone', 'Bikini Area', 'waxing-bikini', (SELECT id FROM public.service_categories WHERE slug = 'waxing-koerper'), 3, 3),
('Rücken', 'Back', 'waxing-ruecken', (SELECT id FROM public.service_categories WHERE slug = 'waxing-koerper'), 4, 3),
('Brazilian Waxing', 'Brazilian Waxing', 'waxing-brazilian', (SELECT id FROM public.service_categories WHERE slug = 'waxing-koerper'), 5, 3);
