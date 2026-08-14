-- Calendar polish brick 1: salon CRM (clients with context) + recorded sales.
-- Applied directly to the live DB via Supabase MCP on 2026-05-30 (recorded as
-- migration "calendar_crm_and_sales"). Additive + idempotent. Owner-only RLS.
--
-- salon_clients: a per-salon CRM record. profile_id null = walk-in / no account.
-- Holds the client context surfaced on the calendar panel (allergies, VIP, no-show, notes).
-- sales / sale_line_items: in-person checkout. v1 RECORDS the sale (cash/card/stripe as a
-- field) — no live card processing yet.

CREATE TABLE IF NOT EXISTS salon_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  allergies TEXT,
  is_vip BOOLEAN DEFAULT false,
  no_show_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_salon_clients_salon ON salon_clients(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_clients_profile ON salon_clients(profile_id);
ALTER TABLE salon_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "salon_clients_owner_manage" ON salon_clients;
CREATE POLICY "salon_clients_owner_manage" ON salon_clients FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  client_id UUID REFERENCES salon_clients(id) ON DELETE SET NULL,
  slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash','card','stripe','other')),
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid','refunded','void')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_salon ON sales(salon_id);
CREATE INDEX IF NOT EXISTS idx_sales_salon_created ON sales(salon_id, created_at);
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_owner_manage" ON sales;
CREATE POLICY "sales_owner_manage" ON sales FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS sale_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sale_line_items_sale ON sale_line_items(sale_id);
ALTER TABLE sale_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sale_line_items_owner_manage" ON sale_line_items;
CREATE POLICY "sale_line_items_owner_manage" ON sale_line_items FOR ALL
  USING (sale_id IN (SELECT id FROM sales WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())))
  WITH CHECK (sale_id IN (SELECT id FROM sales WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())));
