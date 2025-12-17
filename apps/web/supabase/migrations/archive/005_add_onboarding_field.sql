-- ============================================================================
-- Migration: 005_add_onboarding_field.sql
-- Description: Add hasCompletedOnboarding field to user table for OAuth onboarding flow
-- ============================================================================

-- Add the hasCompletedOnboarding column to track OAuth user onboarding status
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- Note: Run this migration in Supabase SQL editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this migration
-- 3. Run the query
-- ============================================================================
