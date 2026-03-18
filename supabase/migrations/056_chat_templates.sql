-- Migration 056: Chat templates for quick-reply chips
-- Salon owners can define reusable quick-reply messages

CREATE TABLE IF NOT EXISTS chat_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS: salon owner manages their own templates
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_manage_templates" ON chat_templates
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_chat_templates_salon ON chat_templates(salon_id);
