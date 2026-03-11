-- Calendar sync: OAuth tokens + event ID tracking
-- Run via Supabase SQL Editor or CLI

-- Table to store OAuth tokens for Google Calendar / Outlook
CREATE TABLE IF NOT EXISTS calendar_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'outlook')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Add calendar event ID columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gcal_event_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS outlook_event_id text;

-- RLS: users can only see their own tokens
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens"
  ON calendar_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON calendar_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON calendar_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON calendar_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for API endpoints
CREATE POLICY "Service role full access"
  ON calendar_tokens FOR ALL
  USING (auth.role() = 'service_role');
