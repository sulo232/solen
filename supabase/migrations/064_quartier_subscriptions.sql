-- Migration 064: Quartier email subscriptions
-- Users subscribe to get notified when new salons open in their quartier.

CREATE TABLE IF NOT EXISTS quartier_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  quartier text NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  UNIQUE(email, quartier)
);

ALTER TABLE quartier_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public insert)
CREATE POLICY "quartier_sub_insert_public" ON quartier_subscriptions
  FOR INSERT WITH CHECK (true);

-- Only admin can read subscriptions
CREATE POLICY "quartier_sub_select_admin" ON quartier_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
