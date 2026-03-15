-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: pg_cron scheduled jobs
-- Requires: pg_cron extension enabled in Supabase dashboard
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_cron (run once, idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Salon verification — runs on the 1st of every month at 08:00 UTC ─────────
SELECT cron.schedule(
  'salon-verification-monthly',
  '0 8 1 * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/salon-verification',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ── Recurring booking processor — runs daily at 00:01 UTC ────────────────────
SELECT cron.schedule(
  'recurring-booking-processor-daily',
  '1 0 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/recurring-booking-processor',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ── Booking reminders — runs daily at 08:00 UTC ───────────────────────────────
-- Sends 24h-before reminder emails
SELECT cron.schedule(
  'booking-reminders-daily',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/booking-reminders',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
