-- exists-check: gap-hunt N5 + D18 (2026-07-03). Applied via apply_migration; mirrored. Additive.
-- N5: salon email-verification gets a real one-time DB token (the old btoa(JSON) link token
-- could never be resolved by auth.getUser, so the email flow never worked end to end).
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamptz;

-- D18: dashboard notification bell read-state. The bell aggregates cancellations/reviews/
-- walk-ins on the fly (no notification rows), so unread = items newer than this watermark.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_notifications_read_at timestamptz;
