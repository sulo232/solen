-- Migration 054: Expanded notification preferences
-- Phase 13: Additional email notification categories

ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS messages_enabled boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS deals_enabled boolean DEFAULT false;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS new_salons_enabled boolean DEFAULT false;
