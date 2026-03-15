-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create staff_members and services tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ── staff_members ─────────────────────────────────────────────────────────────
CREATE TABLE public.staff_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id    uuid        NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  avatar_url  text,
  specialties text[]      NOT NULL DEFAULT '{}',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_salon ON public.staff_members (salon_id) WHERE is_active = true;

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_public_select"
  ON public.staff_members FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = staff_members.salon_id AND s.is_active = true
    )
  );

CREATE POLICY "staff_owner_manage"
  ON public.staff_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = staff_members.salon_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = staff_members.salon_id AND s.owner_id = auth.uid()
    )
  );

-- ── services ──────────────────────────────────────────────────────────────────
CREATE TABLE public.services (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id         uuid         NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name_de          text         NOT NULL,
  name_en          text         NOT NULL,
  category         text         NOT NULL CHECK (category IN ('coiffeur','barbershop','nails','spa','makeup','waxing')),
  duration_minutes integer      NOT NULL CHECK (duration_minutes > 0),
  price            numeric(8,2) NOT NULL CHECK (price >= 0),
  description_de   text,
  description_en   text,
  suitable_for     text[]       NOT NULL DEFAULT '{adult}',
  suitable_gender  text[]       NOT NULL DEFAULT '{male,female,non_binary}',
  is_active        boolean      NOT NULL DEFAULT true,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_salon    ON public.services (salon_id) WHERE is_active = true;
CREATE INDEX idx_services_category ON public.services (category) WHERE is_active = true;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_public_select"
  ON public.services FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = services.salon_id AND s.is_active = true
    )
  );

CREATE POLICY "services_owner_manage"
  ON public.services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = services.salon_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = services.salon_id AND s.owner_id = auth.uid()
    )
  );
