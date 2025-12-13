-- ============================================================================
-- Migration: 006_onboarding_extensions.sql
-- Description: Extends user table for social links, beta program, and feedback
-- ============================================================================

-- =============================================================================
-- USER TABLE EXTENSIONS
-- =============================================================================

-- Add social links as JSONB for flexible schema
-- Schema: { github, twitter, linkedin, bluesky, mastodon, discord, website }
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "socialLinks" JSONB DEFAULT '{}'::jsonb;

-- Track onboarding progress (which step the user is on)
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER DEFAULT 0;

-- Flag for OAuth users who have added a password
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "hasPassword" BOOLEAN DEFAULT FALSE;

-- =============================================================================
-- BETA APPLICATIONS TABLE
-- For manual review of beta tester applicants
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.beta_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  motivation TEXT NOT NULL CHECK (LENGTH(motivation) >= 20 AND LENGTH(motivation) <= 1000),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  use_case TEXT CHECK (LENGTH(use_case) <= 500),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One application per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own application
CREATE POLICY "Users can view own beta application"
  ON public.beta_applications FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can create their own application (one per user enforced by UNIQUE)
CREATE POLICY "Users can create beta application"
  ON public.beta_applications FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their pending application
CREATE POLICY "Users can update pending application"
  ON public.beta_applications FOR UPDATE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    AND status = 'pending'
  );

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access on beta_applications"
  ON public.beta_applications FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_beta_applications_user ON public.beta_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_applications_status ON public.beta_applications(status);
CREATE INDEX IF NOT EXISTS idx_beta_applications_created ON public.beta_applications(created_at DESC);

-- =============================================================================
-- FEEDBACK TABLE
-- For beta testers to submit bugs, features, and general feedback
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general')),
  title TEXT NOT NULL CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) >= 20 AND LENGTH(description) <= 5000),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  assigned_to TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Beta testers can create feedback
CREATE POLICY "Beta testers can create feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."user" u
      WHERE u.id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND u."isBetaTester" = true
    )
  );

-- Users can update their open feedback
CREATE POLICY "Users can update own open feedback"
  ON public.feedback FOR UPDATE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    AND status = 'open'
  );

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access on feedback"
  ON public.feedback FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER set_beta_applications_updated_at
  BEFORE UPDATE ON public.beta_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTION: Check if user is beta tester
-- =============================================================================

CREATE OR REPLACE FUNCTION is_beta_tester(check_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = check_user_id AND "isBetaTester" = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Get beta application status
-- =============================================================================

CREATE OR REPLACE FUNCTION get_beta_status(check_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  app_status TEXT;
BEGIN
  SELECT status INTO app_status
  FROM public.beta_applications
  WHERE user_id = check_user_id;

  RETURN COALESCE(app_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STORAGE BUCKET: avatars
-- Run in Supabase Dashboard > Storage:
-- 1. Create bucket: "avatars" (public)
-- 2. Set file size limit: 2MB (2097152 bytes)
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- ============================================================================

-- ============================================================================
-- Note: Run this migration in Supabase SQL editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this migration
-- 3. Run the query
-- 4. Then create the "avatars" storage bucket manually
-- ============================================================================
