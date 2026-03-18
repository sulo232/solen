-- Phase 3: Payment modes for salons
-- Allows salons to choose: prepay (full Stripe), deposit (partial), or at_salon (no payment)

ALTER TABLE salons ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'at_salon'
  CHECK (payment_mode IN ('prepay', 'deposit', 'at_salon'));
ALTER TABLE salons ADD COLUMN IF NOT EXISTS deposit_percent int DEFAULT 20
  CHECK (deposit_percent >= 5 AND deposit_percent <= 100);
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_hours int DEFAULT 24;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS late_cancel_fee_percent int DEFAULT 50;
