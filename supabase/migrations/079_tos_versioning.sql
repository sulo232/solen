-- Add TOS versioning columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tos_accepted_version TEXT,
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.tos_accepted_version IS 'Version string of T&S user last accepted, e.g. 2026-03-23-v1';
COMMENT ON COLUMN public.profiles.tos_accepted_at IS 'Timestamp when user accepted the current T&S version';
