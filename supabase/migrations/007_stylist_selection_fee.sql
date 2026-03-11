-- ═══════════════════════════════════════════════
-- 007 – Stylist Selection Fee
-- • selection_fee on store_staff (0–20 CHF)
-- • stylist_selection_fee on bookings for payout overview
-- ═══════════════════════════════════════════════

-- 1. Per-stylist selection fee (max 20 CHF, default 0)
ALTER TABLE store_staff ADD COLUMN IF NOT EXISTS selection_fee NUMERIC(6,2) DEFAULT 0 CHECK (selection_fee >= 0 AND selection_fee <= 20);

-- 2. Store the fee on the booking record for later payout tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stylist_selection_fee NUMERIC(6,2) DEFAULT 0;
