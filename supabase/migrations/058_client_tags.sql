-- Migration 058: Client tags for salon CRM
-- Salon owners can tag clients with allergy/preference tags

CREATE TABLE IF NOT EXISTS client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag text NOT NULL CHECK (char_length(tag) <= 50),
  color text DEFAULT 'gray' CHECK (color IN ('gray', 'red', 'orange', 'teal', 'blue', 'purple')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, customer_id, tag)
);

ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;

-- Only salon owner can manage tags for their salon's clients
CREATE POLICY "salon_owner_manage_tags" ON client_tags
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_client_tags_salon_customer ON client_tags(salon_id, customer_id);
CREATE INDEX idx_client_tags_tag ON client_tags(tag);
