-- Migration: 015_admin_approval.sql
-- Adds admin approval workflow columns to salons table

ALTER TABLE salons ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE salons ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
