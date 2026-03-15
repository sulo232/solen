-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create salons table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.salons (
  id                          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                    uuid          NOT NULL REFERENCES public.profiles(id),
  name                        text          NOT NULL,
  slug                        text          NOT NULL UNIQUE,
  description_de              text,
  description_en              text,
  categories                  text[]        NOT NULL,
  quartier                    text          NOT NULL CHECK (quartier IN ('grossbasel','kleinbasel','gundeli','st_johann','iselin','bruderholz','breite')),
  address                     text          NOT NULL,
  latitude                    numeric(10,7) NOT NULL,
  longitude                   numeric(10,7) NOT NULL,
  phone                       text,
  instagram_url               text,
  cover_photo_url             text,
  gallery_urls                text[]        NOT NULL DEFAULT '{}',
  opening_hours               jsonb,
  average_rating              numeric(3,2)  NOT NULL DEFAULT 0,
  review_count                integer       NOT NULL DEFAULT 0,
  is_active                   boolean       NOT NULL DEFAULT true,
  last_verified_at            timestamptz   NOT NULL DEFAULT now(),
  verification_warnings       integer       NOT NULL DEFAULT 0 CHECK (verification_warnings BETWEEN 0 AND 3),
  last_minute_discount_percent integer      NOT NULL DEFAULT 0 CHECK (last_minute_discount_percent BETWEEN 0 AND 100),
  last_minute_window_hours    integer       NOT NULL DEFAULT 6,
  created_at                  timestamptz   NOT NULL DEFAULT now(),
  updated_at                  timestamptz   NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_salons_categories ON public.salons USING GIN (categories);
CREATE INDEX idx_salons_quartier   ON public.salons (quartier) WHERE is_active = true;
CREATE INDEX idx_salons_active     ON public.salons (is_active, average_rating DESC);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Public can read active salons
CREATE POLICY "salons_public_select"
  ON public.salons FOR SELECT
  USING (is_active = true);

-- Salon owners can read their own (even if inactive)
CREATE POLICY "salons_owner_select"
  ON public.salons FOR SELECT
  USING (owner_id = auth.uid());

-- Salon owners can update their own salon (except is_active)
CREATE POLICY "salons_owner_update"
  ON public.salons FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Salon owners can create their own salon
CREATE POLICY "salons_owner_insert"
  ON public.salons FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Only admin can freeze/unfreeze (update is_active)
-- Implemented via service role in Edge Functions
