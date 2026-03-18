-- Migration 052: Salon SMS reminder settings
-- Phase 7: SMS reminder configuration per salon

ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS sms_reminder_24h boolean DEFAULT true;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS sms_reminder_1h boolean DEFAULT true;

-- Track sent SMS per booking to avoid duplicates
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS sms_sent_24h boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS sms_sent_1h boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS review_prompt_sent boolean DEFAULT false;
