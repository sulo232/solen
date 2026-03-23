-- ============================================================
-- Migration: 075_compliance_roles_schema.sql
-- Description: Updates role enum, adds account_status, tos_version, deletion_requested_at
-- ============================================================

-- 1. Update profiles.role to include 'staff'
-- Drop existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Create new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('customer', 'salon_owner', 'staff', 'admin'));

-- 2. Add Account Status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check 
  CHECK (account_status IN ('active', 'warned', 'suspended', 'banned'));

-- 3. Add Account Deletion Timestamp
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- 4. Add Terms of Service Tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tos_version TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

-- 5. Add Phone Verification to salons
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
