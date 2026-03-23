-- ============================================================
-- MEGABUILD Phase 1: Foundation Tables
-- Extends salons, bookings, price_disputes + webhook idempotency
-- ============================================================

-- Salons enhancements (accepts_online_payment already exists — do NOT re-add)
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_fee_percent INTEGER DEFAULT 30;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER DEFAULT 24;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_assign_method TEXT DEFAULT 'least_booked_week'
  CHECK (auto_assign_method IN ('least_booked_week','least_booked_today','round_robin','manual_priority'));
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_complete_enabled BOOLEAN DEFAULT true;

-- Bookings enhancements (payment_intent_id already exists — do NOT re-add)
-- Drop existing CHECK on payment_status if it exists, then re-add with full enum
DO $$ BEGIN
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending','card_saved','deposit_held','paid','none','refunded','partially_refunded','disputed'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_amount INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_booking_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_via TEXT DEFAULT 'stripe'
  CHECK (paid_via IN ('stripe','package','gift_card','walk_in'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS acquisition_source TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Extend existing price_disputes table (Decision D4 — do NOT create price_adjustments)
ALTER TABLE price_disputes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE price_disputes ADD COLUMN IF NOT EXISTS customer_responded_at TIMESTAMPTZ;

-- Webhook idempotency (prevents replay attacks)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
