-- Migration: 076_stripe_connect_salons.sql
-- Purpose: Add missing stripe_account_id and accepts_online_payment fields to salons table for Stripe Connect onboarding

ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS accepts_online_payment BOOLEAN DEFAULT false;
