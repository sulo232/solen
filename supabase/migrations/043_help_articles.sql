-- Migration 043: Help center articles
-- Admin-managed help articles with categories and locale support

CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('customers', 'salons', 'contact')),
  locale text NOT NULL DEFAULT 'de',
  published boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_slug_locale UNIQUE (slug, locale)
);

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "help_articles_select_public" ON public.help_articles
  FOR SELECT USING (published = true);

-- Admins can manage all articles
CREATE POLICY "help_articles_manage_admin" ON public.help_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
