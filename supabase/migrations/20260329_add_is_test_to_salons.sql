-- supabase/migrations/20260329_add_is_test_to_salons.sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
