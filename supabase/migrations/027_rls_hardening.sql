-- Migration 027: Security hardening — RLS fixes
-- Date: 2026-03-17
-- Context: Security audit found salon_directory has NO RLS, profiles leaks all data
-- ============================================================================

-- ============================================
-- 1. SALON_DIRECTORY — Enable RLS (currently DISABLED)
-- ============================================
ALTER TABLE public.salon_directory ENABLE ROW LEVEL SECURITY;

-- Public can READ directory listings (this is a public directory)
CREATE POLICY "salon_directory_select_public" ON public.salon_directory
  FOR SELECT USING (true);

-- Only admins can INSERT/UPDATE/DELETE directory data
CREATE POLICY "salon_directory_modify_admin" ON public.salon_directory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "salon_directory_update_admin" ON public.salon_directory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "salon_directory_delete_admin" ON public.salon_directory
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================
-- 2. PROFILES — Fix overly permissive SELECT
-- ============================================

-- Drop the broken policy (currently: FOR SELECT USING (auth.uid() = id OR true) — "OR true" means EVERYONE sees EVERYTHING)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- New policy: users can only see their OWN full profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Public view for safe profile display (only display_name + avatar_url)
-- Used by: salon cards, review author display, chat participant names
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, display_name, avatar_url
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================
-- 3. REVOKE DANGEROUS ANON PRIVILEGES
-- ============================================

-- Anon should NEVER be able to DELETE or TRUNCATE profiles
REVOKE DELETE ON public.profiles FROM anon;
REVOKE TRUNCATE ON public.profiles FROM anon;

-- Anon should NEVER be able to write to salon_directory
REVOKE INSERT ON public.salon_directory FROM anon;
REVOKE UPDATE ON public.salon_directory FROM anon;
REVOKE DELETE ON public.salon_directory FROM anon;
REVOKE TRUNCATE ON public.salon_directory FROM anon;
