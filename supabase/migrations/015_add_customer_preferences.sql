-- Migration 015: Add customer_preferences JSONB column to profiles
-- Phase 1 of roadmap-v4-booking-preferences.md
-- Stores customer preferences: allergies, skin type, stylist gender, accessibility needs, language, notes

-- Add customer_preferences column to profiles table
ALTER TABLE profiles ADD COLUMN customer_preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.customer_preferences IS 'Customer booking preferences: allergies, skinType, stylistGender, accessibilityNeeds, language, notes';

-- Create index for JSONB query performance (optional but recommended)
CREATE INDEX idx_profiles_customer_preferences ON profiles USING gin (customer_preferences);
