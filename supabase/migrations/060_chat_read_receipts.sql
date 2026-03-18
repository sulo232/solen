-- Migration 060: Chat read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
