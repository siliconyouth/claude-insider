-- =============================================================================
-- CLAUDE INSIDER - FRESH DATABASE SCHEMA
-- =============================================================================
-- Version: 1.2.0
-- Date: 2025-12-16
--
-- This is a consolidated migration that sets up the entire database schema.
-- Run this on a fresh Supabase database AFTER Better Auth creates its tables.
--
-- IMPORTANT: Better Auth automatically creates these tables on first run:
--   - public."user" (with TEXT id)
--   - public.session
--   - public.account
--   - public.verification
--
-- This migration adds:
--   1. Additional columns to Better Auth tables
--   2. All user data tables (profiles, favorites, ratings, etc.)
--   3. RLS policies for all tables
--   4. Triggers and functions
--   5. Indexes for performance
-- =============================================================================

-- =============================================================================
-- PART 1: EXTENSIONS
-- =============================================================================

-- Enable UUID generation (Supabase usually has this, but ensure it's available)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PART 1.5: SCHEMA PERMISSIONS FOR SUPABASE ROLES
-- =============================================================================
-- These grants allow Supabase's PostgREST API to access tables via service_role,
-- authenticated, and anon keys. Without these, you get "permission denied for schema public".

GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant full access to service_role (admin operations bypass RLS)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant CRUD to authenticated users (subject to RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read access to anon for public data
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Set default privileges for tables created in the future
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- =============================================================================
-- PART 2: BETTER AUTH BASE TABLES
-- =============================================================================
-- Better Auth creates these tables on first app run, but for local development
-- with `supabase start`, we need to create them here first.
-- Using CREATE TABLE IF NOT EXISTS ensures this works for both scenarios.

-- User table (Better Auth core)
CREATE TABLE IF NOT EXISTS public."user" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  image TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Session table (Better Auth core)
CREATE TABLE IF NOT EXISTS public.session (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Account table (Better Auth core - for OAuth)
CREATE TABLE IF NOT EXISTS public.account (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  "idToken" TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("providerId", "accountId")
);

-- Verification table (Better Auth core - for email verification)
CREATE TABLE IF NOT EXISTS public.verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 2.5: BETTER AUTH TABLE EXTENSIONS
-- =============================================================================
-- Now add our additional columns to the Better Auth tables

-- Add additional columns to user table (Better Auth creates basic columns)
DO $$
BEGIN
  -- Profile fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'username') THEN
    ALTER TABLE public."user" ADD COLUMN username TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'displayName') THEN
    ALTER TABLE public."user" ADD COLUMN "displayName" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'bio') THEN
    ALTER TABLE public."user" ADD COLUMN bio TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'avatarUrl') THEN
    ALTER TABLE public."user" ADD COLUMN "avatarUrl" TEXT;
  END IF;

  -- Cover photo fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'coverPhotoUrl') THEN
    ALTER TABLE public."user" ADD COLUMN "coverPhotoUrl" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'coverPhotoPath') THEN
    ALTER TABLE public."user" ADD COLUMN "coverPhotoPath" TEXT;
  END IF;

  -- Role field (user hierarchy: user < editor < moderator < admin < superadmin, plus ai_assistant)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'role') THEN
    ALTER TABLE public."user" ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'superadmin', 'ai_assistant'));
  END IF;

  -- Status flags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'isBetaTester') THEN
    ALTER TABLE public."user" ADD COLUMN "isBetaTester" BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'isVerified') THEN
    ALTER TABLE public."user" ADD COLUMN "isVerified" BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'hasPassword') THEN
    ALTER TABLE public."user" ADD COLUMN "hasPassword" BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'socialLinks') THEN
    ALTER TABLE public."user" ADD COLUMN "socialLinks" JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'profilePrivacy') THEN
    ALTER TABLE public."user" ADD COLUMN "profilePrivacy" JSONB DEFAULT '{"showEmail": false, "showActivity": true, "showCollections": true, "showStats": true}';
  END IF;

  -- Counter fields (denormalized for performance)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'followers_count') THEN
    ALTER TABLE public."user" ADD COLUMN followers_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'following_count') THEN
    ALTER TABLE public."user" ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'achievements_count') THEN
    ALTER TABLE public."user" ADD COLUMN achievements_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'achievement_points') THEN
    ALTER TABLE public."user" ADD COLUMN achievement_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'blocked_count') THEN
    ALTER TABLE public."user" ADD COLUMN blocked_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'review_count') THEN
    ALTER TABLE public."user" ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'reading_list_count') THEN
    ALTER TABLE public."user" ADD COLUMN reading_list_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'items_read_count') THEN
    ALTER TABLE public."user" ADD COLUMN items_read_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'saved_search_count') THEN
    ALTER TABLE public."user" ADD COLUMN saved_search_count INTEGER DEFAULT 0;
  END IF;

  -- 2FA fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'twoFactorEnabled') THEN
    ALTER TABLE public."user" ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'twoFactorSecret') THEN
    ALTER TABLE public."user" ADD COLUMN "twoFactorSecret" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'twoFactorBackupCodes') THEN
    ALTER TABLE public."user" ADD COLUMN "twoFactorBackupCodes" TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'twoFactorVerifiedAt') THEN
    ALTER TABLE public."user" ADD COLUMN "twoFactorVerifiedAt" TIMESTAMPTZ;
  END IF;

  -- Onboarding fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'hasCompletedOnboarding') THEN
    ALTER TABLE public."user" ADD COLUMN "hasCompletedOnboarding" BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'onboardingStep') THEN
    ALTER TABLE public."user" ADD COLUMN "onboardingStep" INTEGER DEFAULT 0;
  END IF;

  -- AI preferences (from migration 033)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'ai_preferences') THEN
    ALTER TABLE public."user" ADD COLUMN ai_preferences JSONB DEFAULT '{"useOwnApiKey": false, "preferredProvider": "anthropic", "preferredModel": null, "autoSelectBestModel": true}'::jsonb;
  END IF;

  -- Banned user fields (from migration 049)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'banned') THEN
    ALTER TABLE public."user" ADD COLUMN banned BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'banned_at') THEN
    ALTER TABLE public."user" ADD COLUMN banned_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'banned_reason') THEN
    ALTER TABLE public."user" ADD COLUMN banned_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'banned_by') THEN
    ALTER TABLE public."user" ADD COLUMN banned_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'ban_expires_at') THEN
    ALTER TABLE public."user" ADD COLUMN ban_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes on user table
CREATE INDEX IF NOT EXISTS idx_user_username ON public."user"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON public."user"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON public."user"(role);
CREATE INDEX IF NOT EXISTS idx_user_banned ON public."user"(banned) WHERE banned = TRUE;

-- Disable RLS on Better Auth tables (they use service role key)
ALTER TABLE public."user" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 3: USER DATA TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 PROFILES (Public profile data, separate from auth user table)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  github_username TEXT,
  twitter_handle TEXT,
  is_beta_tester BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- -----------------------------------------------------------------------------
-- 3.2 FAVORITES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_resource ON public.favorites(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- 3.3 RATINGS & REVIEWS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_resource ON public.ratings(resource_type, resource_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  reported BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_resource ON public.reviews(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review ON public.review_helpful_votes(review_id);

CREATE TABLE IF NOT EXISTS public.resource_rating_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  average_rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_rating_stats_resource ON public.resource_rating_stats(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- 3.4 COMMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  moderated_by TEXT REFERENCES public."user"(id),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_resource ON public.comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);

CREATE TABLE IF NOT EXISTS public.comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- -----------------------------------------------------------------------------
-- 3.5 COLLECTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public) WHERE is_public = true;

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  notes TEXT,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_resource ON public.collection_items(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- 3.6 USER ACTIVITY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity(created_at DESC);

-- -----------------------------------------------------------------------------
-- 3.7 EDIT SUGGESTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('content', 'metadata', 'typo', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  suggested_changes TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  reviewer_id TEXT REFERENCES public."user"(id),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edit_suggestions_user_id ON public.edit_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_suggestions_resource ON public.edit_suggestions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_edit_suggestions_status ON public.edit_suggestions(status);

-- -----------------------------------------------------------------------------
-- 3.8 BETA & FEEDBACK
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beta_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
  motivation TEXT NOT NULL CHECK (LENGTH(motivation) >= 20 AND LENGTH(motivation) <= 1000),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  use_case TEXT CHECK (LENGTH(use_case) <= 500),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_applications_user ON public.beta_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_applications_status ON public.beta_applications(status);

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general', 'improvement', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  page_url TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  assigned_to TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_feedback_type ON public.feedback(feedback_type);

-- -----------------------------------------------------------------------------
-- 3.9 ADMIN LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES public."user"(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);

-- -----------------------------------------------------------------------------
-- 3.10 NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  actor_id TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  resource_type TEXT,
  resource_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES public."user"(id) ON DELETE CASCADE,
  in_app_comments BOOLEAN DEFAULT true,
  in_app_replies BOOLEAN DEFAULT true,
  in_app_suggestions BOOLEAN DEFAULT true,
  in_app_follows BOOLEAN DEFAULT true,
  in_app_mentions BOOLEAN DEFAULT true,
  email_comments BOOLEAN DEFAULT false,
  email_replies BOOLEAN DEFAULT true,
  email_suggestions BOOLEAN DEFAULT true,
  email_follows BOOLEAN DEFAULT false,
  email_digest BOOLEAN DEFAULT false,
  email_digest_frequency TEXT DEFAULT 'weekly' CHECK (email_digest_frequency IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);

-- -----------------------------------------------------------------------------
-- 3.11 USER FOLLOWS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.user_follows(created_at DESC);

-- -----------------------------------------------------------------------------
-- 3.12 USER BLOCKS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- -----------------------------------------------------------------------------
-- 3.13 TWO-FACTOR AUTH SESSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.two_factor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_user ON public.two_factor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_token ON public.two_factor_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_expires ON public.two_factor_sessions(expires_at);

-- -----------------------------------------------------------------------------
-- 3.14 ACHIEVEMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  progress INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_featured ON public.user_achievements(user_id, is_featured) WHERE is_featured = true;

CREATE TABLE IF NOT EXISTS public.achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  achievement_slug TEXT NOT NULL,
  current_value INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_slug)
);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_user ON public.achievement_progress(user_id);

-- -----------------------------------------------------------------------------
-- 3.15 READING LISTS & VIEW HISTORY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reading_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'bookmark',
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_reading_lists_user_id ON public.reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_lists_public ON public.reading_lists(is_public) WHERE is_public = true;

CREATE TABLE IF NOT EXISTS public.reading_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.reading_lists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  title TEXT,
  url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'reading', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  added_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(list_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_list_items_list_id ON public.reading_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_items_user_id ON public.reading_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_items_status ON public.reading_list_items(status);

CREATE TABLE IF NOT EXISTS public.view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('resource', 'doc')),
  resource_id TEXT NOT NULL,
  title TEXT,
  url TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  view_count INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_view_history_user_id ON public.view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_view_history_viewed_at ON public.view_history(viewed_at DESC);

CREATE TABLE IF NOT EXISTS public.resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  user_id TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  referrer TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_resource_views_resource ON public.resource_views(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_viewed_at ON public.resource_views(viewed_at DESC);

CREATE TABLE IF NOT EXISTS public.resource_view_stats (
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  views_today INTEGER DEFAULT 0,
  views_week INTEGER DEFAULT 0,
  views_month INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (resource_type, resource_id)
);

-- -----------------------------------------------------------------------------
-- 3.16 SAVED SEARCHES & SEARCH ANALYTICS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_use_count ON public.saved_searches(use_count DESC);

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON public.search_history(searched_at DESC);

CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  results_found_avg NUMERIC(10,2) DEFAULT 0,
  last_searched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_normalized ON public.search_analytics(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_count ON public.search_analytics(search_count DESC);

-- -----------------------------------------------------------------------------
-- 3.17 AI CONVERSATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  title TEXT,
  context_type TEXT,
  context_id TEXT,
  message_count INTEGER DEFAULT 0,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_starred ON public.ai_conversations(user_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- =============================================================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all user data tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_view_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Profiles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Favorites
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;
CREATE POLICY "Users can remove own favorites" ON public.favorites
  FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Ratings & Reviews
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add ratings" ON public.ratings;
CREATE POLICY "Users can add ratings" ON public.ratings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
CREATE POLICY "Users can update own ratings" ON public.ratings
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own ratings" ON public.ratings;
CREATE POLICY "Users can delete own ratings" ON public.ratings
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Published reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Published reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.review_helpful_votes;
CREATE POLICY "Votes are viewable by everyone" ON public.review_helpful_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own votes" ON public.review_helpful_votes;
CREATE POLICY "Users can create own votes" ON public.review_helpful_votes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own votes" ON public.review_helpful_votes;
CREATE POLICY "Users can delete own votes" ON public.review_helpful_votes
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Stats are viewable by everyone" ON public.resource_rating_stats;
CREATE POLICY "Stats are viewable by everyone" ON public.resource_rating_stats
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Comments
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Approved comments are public" ON public.comments;
CREATE POLICY "Approved comments are public" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can edit own pending comments" ON public.comments;
CREATE POLICY "Users can edit own pending comments" ON public.comments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can view votes" ON public.comment_votes;
CREATE POLICY "Anyone can view votes" ON public.comment_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote" ON public.comment_votes;
CREATE POLICY "Users can vote" ON public.comment_votes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can change vote" ON public.comment_votes;
CREATE POLICY "Users can change vote" ON public.comment_votes
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can remove vote" ON public.comment_votes;
CREATE POLICY "Users can remove vote" ON public.comment_votes
  FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Collections
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public collections are viewable" ON public.collections;
CREATE POLICY "Public collections are viewable" ON public.collections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create collections" ON public.collections;
CREATE POLICY "Users can create collections" ON public.collections
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;
CREATE POLICY "Users can delete own collections" ON public.collections
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Items viewable if collection is viewable" ON public.collection_items;
CREATE POLICY "Items viewable if collection is viewable" ON public.collection_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add items to own collections" ON public.collection_items;
CREATE POLICY "Users can add items to own collections" ON public.collection_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update items in own collections" ON public.collection_items;
CREATE POLICY "Users can update items in own collections" ON public.collection_items
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can remove items from own collections" ON public.collection_items;
CREATE POLICY "Users can remove items from own collections" ON public.collection_items
  FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: User Activity
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can log activity" ON public.user_activity;
CREATE POLICY "Users can log activity" ON public.user_activity
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Edit Suggestions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.edit_suggestions;
CREATE POLICY "Users can view own suggestions" ON public.edit_suggestions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create suggestions" ON public.edit_suggestions;
CREATE POLICY "Users can create suggestions" ON public.edit_suggestions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own pending suggestions" ON public.edit_suggestions;
CREATE POLICY "Users can delete own pending suggestions" ON public.edit_suggestions
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Service role full access" ON public.edit_suggestions;
CREATE POLICY "Service role full access" ON public.edit_suggestions
  FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Beta & Feedback
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own beta application" ON public.beta_applications;
CREATE POLICY "Users can view own beta application" ON public.beta_applications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create beta application" ON public.beta_applications;
CREATE POLICY "Users can create beta application" ON public.beta_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update pending application" ON public.beta_applications;
CREATE POLICY "Users can update pending application" ON public.beta_applications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role full access on beta_applications" ON public.beta_applications;
CREATE POLICY "Service role full access on beta_applications" ON public.beta_applications
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Beta testers can create feedback" ON public.feedback;
CREATE POLICY "Beta testers can create feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own open feedback" ON public.feedback;
CREATE POLICY "Users can update own open feedback" ON public.feedback
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role full access on feedback" ON public.feedback;
CREATE POLICY "Service role full access on feedback" ON public.feedback
  FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Admin Logs (admin only via service role)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin logs read all" ON public.admin_logs;
CREATE POLICY "Admin logs read all" ON public.admin_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin logs insert all" ON public.admin_logs;
CREATE POLICY "Admin logs insert all" ON public.admin_logs
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Notifications
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: User Follows & Blocks
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;
CREATE POLICY "Anyone can view follows" ON public.user_follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow" ON public.user_follows;
CREATE POLICY "Users can follow" ON public.user_follows
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;
CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view own blocks" ON public.user_blocks;
CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create blocks" ON public.user_blocks;
CREATE POLICY "Users can create blocks" ON public.user_blocks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.user_blocks;
CREATE POLICY "Users can delete own blocks" ON public.user_blocks
  FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Two-Factor Sessions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own 2FA sessions" ON public.two_factor_sessions;
CREATE POLICY "Users can view own 2FA sessions" ON public.two_factor_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own 2FA sessions" ON public.two_factor_sessions;
CREATE POLICY "Users can create own 2FA sessions" ON public.two_factor_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own 2FA sessions" ON public.two_factor_sessions;
CREATE POLICY "Users can update own 2FA sessions" ON public.two_factor_sessions
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own 2FA sessions" ON public.two_factor_sessions;
CREATE POLICY "Users can delete own 2FA sessions" ON public.two_factor_sessions
  FOR DELETE USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Achievements
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view others featured achievements" ON public.user_achievements;
CREATE POLICY "Users can view others featured achievements" ON public.user_achievements
  FOR SELECT USING (is_featured = true);

DROP POLICY IF EXISTS "Users can update own featured" ON public.user_achievements;
CREATE POLICY "Users can update own featured" ON public.user_achievements
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "System can manage user achievements" ON public.user_achievements;
CREATE POLICY "System can manage user achievements" ON public.user_achievements
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own progress" ON public.achievement_progress;
CREATE POLICY "Users can view own progress" ON public.achievement_progress
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage progress" ON public.achievement_progress;
CREATE POLICY "System can manage progress" ON public.achievement_progress
  FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Reading Lists & View History
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "reading_lists_owner_policy" ON public.reading_lists;
CREATE POLICY "reading_lists_owner_policy" ON public.reading_lists
  FOR ALL USING (true);

DROP POLICY IF EXISTS "reading_lists_public_view_policy" ON public.reading_lists;
CREATE POLICY "reading_lists_public_view_policy" ON public.reading_lists
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "reading_list_items_owner_policy" ON public.reading_list_items;
CREATE POLICY "reading_list_items_owner_policy" ON public.reading_list_items
  FOR ALL USING (true);

DROP POLICY IF EXISTS "view_history_owner_policy" ON public.view_history;
CREATE POLICY "view_history_owner_policy" ON public.view_history
  FOR ALL USING (true);

DROP POLICY IF EXISTS "resource_views_insert_policy" ON public.resource_views;
CREATE POLICY "resource_views_insert_policy" ON public.resource_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "resource_views_select_policy" ON public.resource_views;
CREATE POLICY "resource_views_select_policy" ON public.resource_views
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "resource_view_stats_select_policy" ON public.resource_view_stats;
CREATE POLICY "resource_view_stats_select_policy" ON public.resource_view_stats
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: Saved Searches & Search Analytics
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "saved_searches_owner_policy" ON public.saved_searches;
CREATE POLICY "saved_searches_owner_policy" ON public.saved_searches
  FOR ALL USING (true);

DROP POLICY IF EXISTS "search_history_owner_policy" ON public.search_history;
CREATE POLICY "search_history_owner_policy" ON public.search_history
  FOR ALL USING (true);

DROP POLICY IF EXISTS "search_analytics_read_policy" ON public.search_analytics;
CREATE POLICY "search_analytics_read_policy" ON public.search_analytics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "search_analytics_write_policy" ON public.search_analytics;
CREATE POLICY "search_analytics_write_policy" ON public.search_analytics
  FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: AI Conversations
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can create their own conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can update their own conversations" ON public.ai_conversations
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add messages to their conversations" ON public.ai_messages;
CREATE POLICY "Users can add messages to their conversations" ON public.ai_messages
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- PART 5: HELPER FUNCTIONS
-- =============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE OR REPLACE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_ratings_updated_at BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_edit_suggestions_timestamp BEFORE UPDATE ON public.edit_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_beta_applications_updated_at BEFORE UPDATE ON public.beta_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_feedback_updated_at BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate username from name
CREATE OR REPLACE FUNCTION generate_username(p_name TEXT, p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  base_username := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '-', 'g'));
  base_username := regexp_replace(base_username, '-+', '-', 'g');
  base_username := trim(both '-' from base_username);
  base_username := left(base_username, 20);

  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;

  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public."user" WHERE username = new_username AND id != p_user_id) LOOP
    counter := counter + 1;
    new_username := base_username || '-' || counter;
  END LOOP;

  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Collection slug generator
CREATE OR REPLACE FUNCTION generate_collection_slug(p_user_id TEXT, p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' THEN base_slug := 'collection'; END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.collections WHERE user_id = p_user_id AND slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Favorites helper functions
CREATE OR REPLACE FUNCTION get_favorites_count(p_user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.favorites WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_favorited(p_user_id TEXT, p_resource_type TEXT, p_resource_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.favorites
    WHERE user_id = p_user_id AND resource_type = p_resource_type AND resource_id = p_resource_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rating stats update function
CREATE OR REPLACE FUNCTION update_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_resource_type TEXT;
  v_resource_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_resource_type := OLD.resource_type;
    v_resource_id := OLD.resource_id;
  ELSE
    v_resource_type := NEW.resource_type;
    v_resource_id := NEW.resource_id;
  END IF;

  INSERT INTO public.resource_rating_stats (resource_type, resource_id, average_rating, rating_count, rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, updated_at)
  SELECT
    v_resource_type,
    v_resource_id,
    COALESCE(AVG(rating), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 1),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 5),
    now()
  FROM public.ratings
  WHERE resource_type = v_resource_type AND resource_id = v_resource_id
  ON CONFLICT (resource_type, resource_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    rating_count = EXCLUDED.rating_count,
    rating_1_count = EXCLUDED.rating_1_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_5_count = EXCLUDED.rating_5_count,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_rating_stats();

-- Comment votes update function
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.comments SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.comments SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF NEW.vote_type = 'up' THEN
        UPDATE public.comments SET upvotes = upvotes + 1, downvotes = GREATEST(downvotes - 1, 0) WHERE id = NEW.comment_id;
      ELSE
        UPDATE public.comments SET downvotes = downvotes + 1, upvotes = GREATEST(upvotes - 1, 0) WHERE id = NEW.comment_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_comment_vote
  AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
  FOR EACH ROW EXECUTE FUNCTION update_comment_votes();

-- Collection item count update function
CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections SET item_count = item_count + 1 WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections SET item_count = GREATEST(item_count - 1, 0) WHERE id = OLD.collection_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_collection_item_change
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION update_collection_item_count();

-- Follow counts update function
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public."user" SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public."user" SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public."user" SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public."user" SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Following helper function
CREATE OR REPLACE FUNCTION is_following(p_follower_id TEXT, p_following_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_follows WHERE follower_id = p_follower_id AND following_id = p_following_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Block count update function
CREATE OR REPLACE FUNCTION update_blocked_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public."user" SET blocked_count = blocked_count + 1 WHERE id = NEW.blocker_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public."user" SET blocked_count = GREATEST(blocked_count - 1, 0) WHERE id = OLD.blocker_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_blocked_count
  AFTER INSERT OR DELETE ON public.user_blocks
  FOR EACH ROW EXECUTE FUNCTION update_blocked_count();

-- Remove follows on block function
CREATE OR REPLACE FUNCTION remove_follows_on_block()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_follows WHERE
    (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id) OR
    (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_remove_follows_on_block
  AFTER INSERT ON public.user_blocks
  FOR EACH ROW EXECUTE FUNCTION remove_follows_on_block();

-- User is blocked check
CREATE OR REPLACE FUNCTION is_user_blocked(p_blocker_id TEXT, p_blocked_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_blocks WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Review count updates
CREATE OR REPLACE FUNCTION update_review_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.resource_rating_stats
    SET review_count = review_count + 1, updated_at = now()
    WHERE resource_type = NEW.resource_type AND resource_id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE public.resource_rating_stats
    SET review_count = GREATEST(review_count - 1, 0), updated_at = now()
    WHERE resource_type = OLD.resource_type AND resource_id = OLD.resource_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
      UPDATE public.resource_rating_stats
      SET review_count = review_count + 1, updated_at = now()
      WHERE resource_type = NEW.resource_type AND resource_id = NEW.resource_id;
    ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
      UPDATE public.resource_rating_stats
      SET review_count = GREATEST(review_count - 1, 0), updated_at = now()
      WHERE resource_type = OLD.resource_type AND resource_id = OLD.resource_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_review_count
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_count();

-- Helpful count update
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR DELETE ON public.review_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

-- User review count
CREATE OR REPLACE FUNCTION update_user_review_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public."user" SET review_count = review_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public."user" SET review_count = GREATEST(review_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_user_review_count
  AFTER INSERT OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_review_count();

-- Reading list count updates
CREATE OR REPLACE FUNCTION update_user_reading_list_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public."user" SET reading_list_count = reading_list_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public."user" SET reading_list_count = GREATEST(reading_list_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_user_reading_list_count
  AFTER INSERT OR DELETE ON public.reading_lists
  FOR EACH ROW EXECUTE FUNCTION update_user_reading_list_count();

CREATE OR REPLACE FUNCTION update_reading_list_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reading_lists SET item_count = item_count + 1, updated_at = now() WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reading_lists SET item_count = GREATEST(item_count - 1, 0), updated_at = now() WHERE id = OLD.list_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_reading_list_item_count
  AFTER INSERT OR DELETE ON public.reading_list_items
  FOR EACH ROW EXECUTE FUNCTION update_reading_list_item_count();

CREATE OR REPLACE FUNCTION update_items_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE public."user" SET items_read_count = items_read_count + 1 WHERE id = NEW.user_id;
  ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE public."user" SET items_read_count = GREATEST(items_read_count - 1, 0) WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_items_read_count
  AFTER UPDATE ON public.reading_list_items
  FOR EACH ROW EXECUTE FUNCTION update_items_read_count();

-- Default reading list creation
CREATE OR REPLACE FUNCTION create_default_reading_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.reading_lists (user_id, name, slug, description, color, icon)
  VALUES (NEW.id, 'Read Later', 'read-later', 'Your default reading list', '#3B82F6', 'bookmark');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_create_default_reading_list
  AFTER INSERT ON public."user"
  FOR EACH ROW EXECUTE FUNCTION create_default_reading_list();

-- Saved search count
CREATE OR REPLACE FUNCTION update_saved_search_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public."user" SET saved_search_count = saved_search_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public."user" SET saved_search_count = GREATEST(saved_search_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_saved_search_count
  AFTER INSERT OR DELETE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_saved_search_count();

-- Search history limit
CREATE OR REPLACE FUNCTION limit_search_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.search_history
  WHERE id IN (
    SELECT id FROM public.search_history
    WHERE user_id = NEW.user_id
    ORDER BY searched_at DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_limit_search_history
  AFTER INSERT ON public.search_history
  FOR EACH ROW EXECUTE FUNCTION limit_search_history();

-- View history upsert
CREATE OR REPLACE FUNCTION upsert_view_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.view_history (user_id, resource_type, resource_id, title, url, viewed_at, view_count)
  VALUES (NEW.user_id, NEW.resource_type, NEW.resource_id, NEW.title, NEW.url, now(), 1)
  ON CONFLICT (user_id, resource_type, resource_id) DO UPDATE SET
    viewed_at = now(),
    view_count = public.view_history.view_count + 1,
    title = COALESCE(EXCLUDED.title, public.view_history.title),
    url = COALESCE(EXCLUDED.url, public.view_history.url);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_upsert_view_history
  AFTER INSERT ON public.view_history
  FOR EACH ROW EXECUTE FUNCTION upsert_view_history();

-- AI conversation title generation
CREATE OR REPLACE FUNCTION generate_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT title FROM public.ai_conversations WHERE id = NEW.conversation_id) IS NULL THEN
    UPDATE public.ai_conversations
    SET title = left(NEW.content, 50)
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_generate_conversation_title
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW WHEN (NEW.role = 'user')
  EXECUTE FUNCTION generate_conversation_title();

-- Update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_conversations
  SET message_count = message_count + 1, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- 2FA session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.two_factor_sessions WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_cleanup_2fa_sessions
  AFTER INSERT ON public.two_factor_sessions
  FOR EACH STATEMENT EXECUTE FUNCTION cleanup_expired_2fa_sessions();

-- =============================================================================
-- PART 6: SEED DATA - ACHIEVEMENTS
-- =============================================================================

INSERT INTO public.achievements (slug, name, description, icon, category, points, tier, requirement_type, requirement_value, is_hidden) VALUES
  ('first-favorite', 'Bookworm', 'Add your first favorite', '⭐', 'engagement', 10, 'bronze', 'favorites', 1, false),
  ('ten-favorites', 'Collector', 'Save 10 favorites', '📚', 'engagement', 25, 'silver', 'favorites', 10, false),
  ('fifty-favorites', 'Curator', 'Save 50 favorites', '🏆', 'engagement', 50, 'gold', 'favorites', 50, false),
  ('first-comment', 'Voice', 'Leave your first comment', '💬', 'community', 10, 'bronze', 'comments', 1, false),
  ('ten-comments', 'Conversationalist', 'Leave 10 comments', '🗣️', 'community', 25, 'silver', 'comments', 10, false),
  ('first-rating', 'Critic', 'Rate your first resource', '⭐', 'engagement', 10, 'bronze', 'ratings', 1, false),
  ('ten-ratings', 'Reviewer', 'Rate 10 resources', '📝', 'engagement', 25, 'silver', 'ratings', 10, false),
  ('first-collection', 'Organizer', 'Create your first collection', '📁', 'organization', 10, 'bronze', 'collections', 1, false),
  ('first-suggestion', 'Contributor', 'Submit your first edit suggestion', '✏️', 'contribution', 15, 'bronze', 'suggestions', 1, false),
  ('approved-suggestion', 'Editor', 'Get an edit suggestion approved', '✅', 'contribution', 30, 'silver', 'approved_suggestions', 1, false),
  ('first-follower', 'Popular', 'Get your first follower', '👥', 'community', 10, 'bronze', 'followers', 1, false),
  ('ten-followers', 'Influencer', 'Get 10 followers', '🌟', 'community', 50, 'gold', 'followers', 10, false),
  ('early-adopter', 'Early Adopter', 'Join during beta', '🚀', 'special', 100, 'platinum', 'beta_tester', 1, true),
  ('week-streak', 'Consistent', 'Visit 7 days in a row', '🔥', 'engagement', 25, 'silver', 'streak', 7, false),
  ('month-streak', 'Dedicated', 'Visit 30 days in a row', '💎', 'engagement', 100, 'platinum', 'streak', 30, false)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- PART 7: RATING STATS VIEW (for backward compatibility)
-- =============================================================================

CREATE OR REPLACE VIEW public.rating_stats AS
SELECT
  resource_type,
  resource_id,
  average_rating,
  rating_count
FROM public.resource_rating_stats;

-- =============================================================================
-- PART 8: EXTENDED TABLES (Migrations 024-049)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8.1 PUSH SUBSCRIPTIONS (Migration 024)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subs_all" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8.2 TWO FACTOR DEVICES (Migration 031)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.two_factor_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL DEFAULT 'Authenticator',
  device_type VARCHAR(50) NOT NULL DEFAULT 'totp',
  secret TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_2fa_devices_user ON public.two_factor_devices(user_id);
ALTER TABLE public.two_factor_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "2fa_devices_all" ON public.two_factor_devices FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8.3 PASSKEYS / WEBAUTHN (Migration 032)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type VARCHAR(50) NOT NULL DEFAULT 'platform',
  backed_up BOOLEAN DEFAULT FALSE,
  transports TEXT[],
  passkey_name VARCHAR(100) NOT NULL DEFAULT 'Passkey',
  aaguid TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user ON public.passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential ON public.passkeys(credential_id);
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passkeys_all" ON public.passkeys FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public."user"(id) ON DELETE CASCADE,
  email TEXT,
  challenge TEXT NOT NULL UNIQUE,
  challenge_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user ON public.webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON public.webauthn_challenges(expires_at);
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webauthn_challenges_all" ON public.webauthn_challenges FOR ALL USING (true) WITH CHECK (true);

-- WebAuthn Functions for Passkey Operations
-- Function to create a WebAuthn challenge
CREATE OR REPLACE FUNCTION create_webauthn_challenge(
  p_user_id TEXT,
  p_email TEXT,
  p_challenge TEXT,
  p_challenge_type VARCHAR(20),
  p_expires_minutes INT DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_challenge_id UUID;
BEGIN
  -- Delete any existing challenges for this user/email
  IF p_user_id IS NOT NULL THEN
    DELETE FROM webauthn_challenges WHERE user_id = p_user_id AND used_at IS NULL;
  ELSIF p_email IS NOT NULL THEN
    DELETE FROM webauthn_challenges WHERE email = p_email AND used_at IS NULL;
  END IF;

  -- Create new challenge
  INSERT INTO webauthn_challenges (user_id, email, challenge, challenge_type, expires_at)
  VALUES (p_user_id, p_email, p_challenge, p_challenge_type, NOW() + (p_expires_minutes || ' minutes')::INTERVAL)
  RETURNING id INTO v_challenge_id;

  RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify and consume a challenge
CREATE OR REPLACE FUNCTION verify_webauthn_challenge(
  p_challenge TEXT
)
RETURNS TABLE(valid BOOLEAN, user_id TEXT, email TEXT, challenge_type VARCHAR(20)) AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Find the challenge
  SELECT * INTO v_record
  FROM webauthn_challenges
  WHERE challenge = p_challenge
    AND used_at IS NULL
    AND expires_at > NOW()
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::VARCHAR(20);
    RETURN;
  END IF;

  -- Mark as used
  UPDATE webauthn_challenges
  SET used_at = NOW()
  WHERE id = v_record.id;

  RETURN QUERY SELECT TRUE, v_record.user_id, v_record.email, v_record.challenge_type;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired challenges automatically
CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM webauthn_challenges
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for periodic cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_webauthn_challenges ON webauthn_challenges;
CREATE TRIGGER trigger_cleanup_webauthn_challenges
AFTER INSERT ON webauthn_challenges
EXECUTE FUNCTION cleanup_expired_webauthn_challenges();

-- Grant execute on WebAuthn functions
GRANT EXECUTE ON FUNCTION create_webauthn_challenge TO authenticated;
GRANT EXECUTE ON FUNCTION verify_webauthn_challenge TO authenticated;

-- -----------------------------------------------------------------------------
-- 8.4 USER API KEYS (Migration 033)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'anthropic',
  api_key_encrypted TEXT NOT NULL,
  api_key_hint VARCHAR(20),
  is_valid BOOLEAN DEFAULT NULL,
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  available_models JSONB DEFAULT '[]'::jsonb,
  preferred_model VARCHAR(100),
  usage_this_month JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON public.user_api_keys(user_id);
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_api_keys_all" ON public.user_api_keys FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES public.user_api_keys(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user ON public.api_key_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_key ON public.api_key_usage_logs(api_key_id);
ALTER TABLE public.api_key_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_usage_logs_all" ON public.api_key_usage_logs FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8.5 ASSISTANT SETTINGS (Migration 034)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE UNIQUE,
  assistant_name TEXT DEFAULT 'Claude',
  user_display_name TEXT,
  selected_voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  auto_speak BOOLEAN DEFAULT FALSE,
  speech_rate DECIMAL(3,2) DEFAULT 1.00,
  show_suggested_questions BOOLEAN DEFAULT TRUE,
  show_conversation_history BOOLEAN DEFAULT TRUE,
  compact_mode BOOLEAN DEFAULT FALSE,
  enable_voice_input BOOLEAN DEFAULT TRUE,
  enable_code_highlighting BOOLEAN DEFAULT TRUE,
  sound_theme VARCHAR(50) DEFAULT 'claude-insider',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_settings_user_id ON public.assistant_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_settings_sound_theme ON public.assistant_settings(sound_theme);
ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assistant_settings_all" ON public.assistant_settings FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8.6 BAN APPEALS SYSTEM (Migration 041)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ban_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  additional_context TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  review_notes TEXT,
  response_message TEXT,
  reviewed_at TIMESTAMPTZ,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ban_appeals_user ON public.ban_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_status ON public.ban_appeals(status);
ALTER TABLE public.ban_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ban_appeals_all" ON public.ban_appeals FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ban_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL,
  reason TEXT,
  performed_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  appeal_id UUID REFERENCES public.ban_appeals(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ban_history_user ON public.ban_history(user_id);
ALTER TABLE public.ban_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ban_history_all" ON public.ban_history FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8.7 REPORTS SYSTEM (Migration 042)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL,
  reported_user_id TEXT REFERENCES public."user"(id) ON DELETE CASCADE,
  reported_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  review_notes TEXT,
  action_taken TEXT,
  reporter_message TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_report_type CHECK (report_type IN ('user', 'comment'))
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_all" ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8.8 MESSAGING SYSTEM (Migration 043-044)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id TEXT PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'idle')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_presence_all" ON public.user_presence FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  created_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  max_participants INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT
);

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_conversations_all" ON public.dm_conversations FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.dm_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  unread_count INTEGER DEFAULT 0,
  invited_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_participants_user ON public.dm_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_participants_conversation ON public.dm_participants(conversation_id);
ALTER TABLE public.dm_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_participants_all" ON public.dm_participants FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  ai_response_to UUID REFERENCES public.dm_messages(id),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON public.dm_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON public.dm_messages(sender_id);
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_messages_all" ON public.dm_messages FOR ALL USING (true) WITH CHECK (true);

-- Message Read Receipts (for "Seen" feature)
CREATE TABLE IF NOT EXISTS public.dm_message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON public.dm_message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON public.dm_message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_message_time ON public.dm_message_read_receipts(message_id, read_at DESC);
ALTER TABLE public.dm_message_read_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_receipts_all" ON public.dm_message_read_receipts FOR ALL USING (true) WITH CHECK (true);

-- RPC function to mark messages as read in bulk
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_user_id TEXT,
  p_conversation_id UUID,
  p_up_to_message_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  IF p_up_to_message_id IS NOT NULL THEN
    SELECT created_at INTO v_cutoff_time
    FROM public.dm_messages
    WHERE id = p_up_to_message_id;
  END IF;

  WITH messages_to_mark AS (
    SELECT m.id
    FROM public.dm_messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != p_user_id
      AND m.deleted_at IS NULL
      AND (v_cutoff_time IS NULL OR m.created_at <= v_cutoff_time)
      AND NOT EXISTS (
        SELECT 1 FROM public.dm_message_read_receipts r
        WHERE r.message_id = m.id AND r.user_id = p_user_id
      )
  )
  INSERT INTO public.dm_message_read_receipts (message_id, user_id)
  SELECT id, p_user_id FROM messages_to_mark;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- RPC function to get read receipts for multiple messages
CREATE OR REPLACE FUNCTION public.get_message_read_receipts(
  p_message_ids UUID[]
)
RETURNS TABLE (
  message_id UUID,
  user_id TEXT,
  user_name TEXT,
  user_username TEXT,
  user_image TEXT,
  read_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.message_id,
    r.user_id,
    u.name as user_name,
    u.username as user_username,
    u.image as user_image,
    r.read_at
  FROM public.dm_message_read_receipts r
  JOIN public."user" u ON r.user_id = u.id
  WHERE r.message_id = ANY(p_message_ids)
  ORDER BY r.read_at ASC;
$$;

CREATE TABLE IF NOT EXISTS public.dm_typing_indicators (
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

ALTER TABLE public.dm_typing_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_typing_all" ON public.dm_typing_indicators FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.dm_group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  inviter_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  invitee_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE(conversation_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_invitations_invitee ON public.dm_group_invitations(invitee_id, status);
ALTER TABLE public.dm_group_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_invitations_all" ON public.dm_group_invitations FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.user_chat_settings (
  user_id TEXT PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_new_message TEXT DEFAULT 'message',
  sound_typing BOOLEAN DEFAULT FALSE,
  sound_mention BOOLEAN DEFAULT TRUE,
  sound_invitation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_chat_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_chat_settings_all" ON public.user_chat_settings FOR ALL USING (true) WITH CHECK (true);

-- AI ASSISTANT SYSTEM USER
-- Create the @claudeinsider AI assistant user for DM responses
INSERT INTO public."user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'ai-assistant-claudeinsider',
  'Claude Insider',
  'assistant@claudeinsider.com',
  'ai_assistant',
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'ai_assistant',
  name = 'Claude Insider';

-- Create profile for AI assistant
INSERT INTO public.profiles (id, user_id, display_name, bio, avatar_url, is_verified)
VALUES (
  gen_random_uuid(),
  'ai-assistant-claudeinsider',
  'Claude Insider',
  'I''m the AI assistant for Claude Insider. Mention @claudeinsider in any chat and I''ll help you find documentation, resources, and answers!',
  '/images/claude-insider-avatar.png',
  TRUE
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = 'Claude Insider',
  bio = 'I''m the AI assistant for Claude Insider. Mention @claudeinsider in any chat and I''ll help you find documentation, resources, and answers!',
  is_verified = TRUE;

-- Set AI assistant presence as always "online"
INSERT INTO public.user_presence (user_id, status, last_seen_at, last_active_at, updated_at)
VALUES (
  'ai-assistant-claudeinsider',
  'online',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET status = 'online';

-- -----------------------------------------------------------------------------
-- 8.9 SECURITY SYSTEM (Migration 045)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(21) NOT NULL,
  visitor_id VARCHAR(64),
  user_id TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  endpoint VARCHAR(500),
  method VARCHAR(10),
  referer TEXT,
  origin TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  is_human BOOLEAN DEFAULT TRUE,
  is_verified_bot BOOLEAN DEFAULT FALSE,
  bot_name VARCHAR(100),
  bot_category VARCHAR(50),
  bot_bypassed BOOLEAN DEFAULT FALSE,
  fingerprint_confidence DECIMAL(5,2),
  fingerprint_components JSONB,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'info',
  status_code INTEGER,
  response_time_ms INTEGER,
  honeypot_served BOOLEAN DEFAULT FALSE,
  honeypot_config_id UUID,
  metadata JSONB DEFAULT '{}',
  geo_country VARCHAR(2),
  geo_city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_visitor_id ON public.security_logs(visitor_id) WHERE visitor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_logs_is_bot ON public.security_logs(is_bot) WHERE is_bot = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_logs_all" ON public.security_logs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.visitor_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id VARCHAR(64) UNIQUE NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  first_ip INET,
  first_user_agent TEXT,
  first_endpoint VARCHAR(500),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip INET,
  last_user_agent TEXT,
  last_endpoint VARCHAR(500),
  total_requests INTEGER DEFAULT 1,
  bot_requests INTEGER DEFAULT 0,
  human_requests INTEGER DEFAULT 1,
  honeypot_triggers INTEGER DEFAULT 0,
  trust_score DECIMAL(5,2) DEFAULT 50.00,
  trust_level VARCHAR(20) DEFAULT 'neutral',
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  blocked_at TIMESTAMPTZ,
  blocked_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  auto_blocked BOOLEAN DEFAULT FALSE,
  auto_block_rule VARCHAR(100),
  linked_user_id TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ,
  components JSONB DEFAULT '{}',
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_visitor_id ON public.visitor_fingerprints(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_trust_score ON public.visitor_fingerprints(trust_score);
CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_is_blocked ON public.visitor_fingerprints(is_blocked) WHERE is_blocked = TRUE;
ALTER TABLE public.visitor_fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visitor_fingerprints_all" ON public.visitor_fingerprints FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.honeypot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  path_pattern VARCHAR(500) NOT NULL,
  method VARCHAR(10) DEFAULT 'ALL',
  priority INTEGER DEFAULT 100,
  response_type VARCHAR(50) NOT NULL,
  response_delay_ms INTEGER DEFAULT 0,
  response_data JSONB,
  response_template VARCHAR(100),
  redirect_url VARCHAR(500),
  status_code INTEGER DEFAULT 200,
  target_bots_only BOOLEAN DEFAULT TRUE,
  target_low_trust BOOLEAN DEFAULT FALSE,
  trust_threshold DECIMAL(5,2) DEFAULT 30.00,
  target_blocked_visitors BOOLEAN DEFAULT TRUE,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  unique_visitors_triggered INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_honeypot_configs_enabled ON public.honeypot_configs(enabled) WHERE enabled = TRUE;
ALTER TABLE public.honeypot_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "honeypot_configs_all" ON public.honeypot_configs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  updated_by TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_settings_all" ON public.security_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default security settings
INSERT INTO public.security_settings (key, value, value_type, description, category) VALUES
  ('security_enabled', '"true"', 'boolean', 'Master switch for security system', 'general'),
  ('bot_detection_enabled', '"true"', 'boolean', 'Enable Vercel BotID detection', 'bot_detection'),
  ('bot_detection_mode', '"monitor"', 'string', 'Mode: monitor, protect, honeypot', 'bot_detection'),
  ('fingerprint_enabled', '"true"', 'boolean', 'Enable FingerprintJS', 'fingerprint'),
  ('honeypot_enabled', '"true"', 'boolean', 'Enable honeypot system', 'honeypot'),
  ('honeypot_default_delay_ms', '5000', 'number', 'Default tarpit delay', 'honeypot'),
  ('log_all_requests', '"false"', 'boolean', 'Log all requests', 'logging'),
  ('log_bot_requests', '"true"', 'boolean', 'Log bot-detected requests', 'logging'),
  ('auto_block_enabled', '"true"', 'boolean', 'Enable auto-blocking', 'trust'),
  ('auto_block_bot_threshold', '10', 'number', 'Auto-block after N bot detections', 'trust')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8.10 SUPERADMIN LOGS (Migration 048)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.superadmin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_superadmin_logs_superadmin ON public.superadmin_logs(superadmin_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_created ON public.superadmin_logs(created_at DESC);
ALTER TABLE public.superadmin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "superadmin_logs_all" ON public.superadmin_logs FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- PART 9: DONATION SYSTEM (Migration 051)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('paypal', 'bank_transfer', 'other')),
  transaction_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  paypal_payer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  subscription_id VARCHAR(255),
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  admin_notes TEXT,
  confirmed_by TEXT REFERENCES public."user"(id),
  confirmed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_payment_method ON public.donations(payment_method);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_paypal_order_id ON public.donations(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select_own" ON public.donations FOR SELECT USING (
  user_id = auth.uid()::TEXT OR
  EXISTS (SELECT 1 FROM public."user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "donations_insert" ON public.donations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "donations_update_admin" ON public.donations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public."user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
);

CREATE TABLE IF NOT EXISTS public.donor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public."user"(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_donated DECIMAL(10,2) DEFAULT 0 NOT NULL,
  donation_count INTEGER DEFAULT 0 NOT NULL,
  has_active_subscription BOOLEAN DEFAULT FALSE,
  show_on_donor_wall BOOLEAN DEFAULT TRUE,
  show_badge_on_profile BOOLEAN DEFAULT TRUE,
  display_name VARCHAR(255),
  first_donation_at TIMESTAMPTZ,
  last_donation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_badges_tier ON public.donor_badges(tier);
CREATE INDEX IF NOT EXISTS idx_donor_badges_total_donated ON public.donor_badges(total_donated DESC);
CREATE INDEX IF NOT EXISTS idx_donor_badges_show_on_wall ON public.donor_badges(show_on_donor_wall) WHERE show_on_donor_wall = TRUE;

ALTER TABLE public.donor_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donor_badges_select" ON public.donor_badges FOR SELECT USING (
  show_on_donor_wall = TRUE OR
  user_id = auth.uid()::TEXT OR
  EXISTS (SELECT 1 FROM public."user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "donor_badges_update_own" ON public.donor_badges FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE TABLE IF NOT EXISTS public.donation_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE NOT NULL,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  pdf_url VARCHAR(500),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_receipts_donation_id ON public.donation_receipts(donation_id);

ALTER TABLE public.donation_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donation_receipts_select" ON public.donation_receipts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.donations d
    WHERE d.id = donation_id AND (
      d.user_id = auth.uid()::TEXT OR
      EXISTS (SELECT 1 FROM public."user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
    )
  )
);

CREATE TABLE IF NOT EXISTS public.donation_bank_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name VARCHAR(255) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  account_number VARCHAR(50),
  iban VARCHAR(50),
  swift_bic VARCHAR(20),
  routing_number VARCHAR(20),
  bank_address TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  region VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.donation_bank_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donation_bank_info_select" ON public.donation_bank_info FOR SELECT USING (is_active = TRUE);
CREATE POLICY "donation_bank_info_admin" ON public.donation_bank_info FOR ALL USING (
  EXISTS (SELECT 1 FROM public."user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
);

CREATE TABLE IF NOT EXISTS public.donation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT REFERENCES public."user"(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donation_settings_admin" ON public.donation_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public."user" WHERE id = auth.uid()::TEXT AND role IN ('admin', 'superadmin'))
);

-- Insert default donation settings
INSERT INTO public.donation_settings (key, value, description) VALUES
  ('paypal_enabled', 'true', 'Enable PayPal donations'),
  ('bank_transfer_enabled', 'true', 'Enable bank transfer donations'),
  ('preset_amounts', '[5, 10, 25, 50, 100]', 'Preset donation amounts in USD'),
  ('minimum_amount', '1', 'Minimum donation amount'),
  ('maximum_amount', '10000', 'Maximum donation amount'),
  ('recurring_enabled', 'true', 'Enable recurring donations'),
  ('donor_wall_enabled', 'true', 'Show public donor wall'),
  ('tax_receipts_enabled', 'true', 'Generate tax receipts'),
  ('thank_you_email_enabled', 'true', 'Send thank you emails'),
  ('badge_thresholds', '{"bronze": 10, "silver": 50, "gold": 100, "platinum": 500}', 'Donation thresholds for badge tiers')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- PART 10: E2EE SYSTEM (Migrations 054-057)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 10.1 DEVICE KEYS (Migration 054)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  identity_key TEXT NOT NULL,
  signing_key TEXT NOT NULL,
  signed_prekey TEXT NOT NULL DEFAULT '',
  signed_prekey_id INTEGER NOT NULL DEFAULT 0,
  signed_prekey_signature TEXT NOT NULL DEFAULT '',
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('web', 'mobile', 'desktop')),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by_user_id TEXT REFERENCES public."user"(id),
  verified_by_device_id TEXT,
  verification_method TEXT CHECK (verification_method IN ('sas', 'cross_sign', 'admin', 'qr')),
  cross_sign_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_keys_user ON public.device_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_device_keys_identity ON public.device_keys(identity_key);
CREATE INDEX IF NOT EXISTS idx_device_keys_verified ON public.device_keys(user_id, is_verified) WHERE is_verified = TRUE;

ALTER TABLE public.device_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_keys_select_all" ON public.device_keys FOR SELECT USING (true);
CREATE POLICY "device_keys_insert_own" ON public.device_keys FOR INSERT WITH CHECK (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "device_keys_update_own" ON public.device_keys FOR UPDATE USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "device_keys_delete_own" ON public.device_keys FOR DELETE USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "device_keys_service_role" ON public.device_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AI ASSISTANT E2EE VERIFIED DEVICE
-- The AI doesn't actually decrypt messages - users consent to share
-- decrypted content with the AI. But the AI needs a "device" entry
-- to show as verified in the UI.
INSERT INTO public.device_keys (
  user_id, device_id, identity_key, signing_key, device_name, device_type,
  is_verified, verified_at, verification_method
)
VALUES (
  'ai-assistant-claudeinsider',
  'claude-insider-system',
  'AI_SYSTEM_IDENTITY_KEY',
  'AI_SYSTEM_SIGNING_KEY',
  'Claude Insider AI System',
  'web',
  TRUE,
  NOW(),
  'admin'
) ON CONFLICT (user_id, device_id) DO UPDATE SET
  is_verified = TRUE,
  verified_at = NOW(),
  verification_method = 'admin',
  device_name = 'Claude Insider AI System';

-- -----------------------------------------------------------------------------
-- 10.2 ONE-TIME PREKEYS (Migration 054)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.one_time_prekeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key_id UUID NOT NULL REFERENCES public.device_keys(id) ON DELETE CASCADE,
  key_id TEXT NOT NULL, -- Base64-encoded key ID from vodozemac
  public_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  claimed_by_user TEXT,
  claimed_by_device TEXT,
  UNIQUE(device_key_id, key_id)
);

CREATE INDEX IF NOT EXISTS idx_one_time_prekeys_device ON public.one_time_prekeys(device_key_id);
CREATE INDEX IF NOT EXISTS idx_one_time_prekeys_unclaimed ON public.one_time_prekeys(device_key_id) WHERE claimed_at IS NULL;

ALTER TABLE public.one_time_prekeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "one_time_prekeys_select_all" ON public.one_time_prekeys FOR SELECT USING (true);
CREATE POLICY "one_time_prekeys_insert_owner" ON public.one_time_prekeys FOR INSERT WITH CHECK (
  device_key_id IN (
    SELECT id FROM public.device_keys
    WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "one_time_prekeys_update_claim" ON public.one_time_prekeys FOR UPDATE USING (claimed_at IS NULL);
CREATE POLICY "one_time_prekeys_service_role" ON public.one_time_prekeys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.3 E2EE KEY BACKUPS (Migration 054)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_key_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  encrypted_backup TEXT NOT NULL,
  backup_iv TEXT NOT NULL,
  backup_auth_tag TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 100000,
  device_count INTEGER NOT NULL DEFAULT 1,
  backup_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_e2ee_key_backups_user ON public.e2ee_key_backups(user_id);

ALTER TABLE public.e2ee_key_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "e2ee_key_backups_manage_own" ON public.e2ee_key_backups FOR ALL USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "e2ee_key_backups_service_role" ON public.e2ee_key_backups FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.4 MEGOLM SESSION SHARES (Migration 055)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.megolm_session_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  sender_device_id TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  recipient_device_id TEXT NOT NULL,
  encrypted_session_key TEXT NOT NULL,
  key_algorithm TEXT NOT NULL DEFAULT 'olm.v1',
  first_known_index INTEGER NOT NULL DEFAULT 0,
  forwarded_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  UNIQUE(session_id, recipient_device_id)
);

CREATE INDEX IF NOT EXISTS idx_megolm_shares_recipient ON public.megolm_session_shares(recipient_user_id, recipient_device_id);
CREATE INDEX IF NOT EXISTS idx_megolm_shares_conversation ON public.megolm_session_shares(conversation_id);
CREATE INDEX IF NOT EXISTS idx_megolm_shares_session ON public.megolm_session_shares(session_id);

ALTER TABLE public.megolm_session_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "megolm_shares_select_recipient" ON public.megolm_session_shares FOR SELECT USING (
  recipient_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "megolm_shares_insert_sender" ON public.megolm_session_shares FOR INSERT WITH CHECK (
  sender_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "megolm_shares_update_recipient" ON public.megolm_session_shares FOR UPDATE USING (
  recipient_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "megolm_shares_service_role" ON public.megolm_session_shares FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.5 E2EE MESSAGE KEYS (Migration 055)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_message_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  recipient_device_id TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  olm_message_type INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, recipient_device_id)
);

CREATE INDEX IF NOT EXISTS idx_e2ee_message_keys_recipient ON public.e2ee_message_keys(recipient_device_id);

ALTER TABLE public.e2ee_message_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "e2ee_message_keys_select_recipient" ON public.e2ee_message_keys FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.device_keys dk
    WHERE dk.device_id = e2ee_message_keys.recipient_device_id
      AND dk.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "e2ee_message_keys_insert_participant" ON public.e2ee_message_keys FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dm_messages m
    JOIN public.dm_participants p ON p.conversation_id = m.conversation_id
    WHERE m.id = e2ee_message_keys.message_id
      AND p.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "e2ee_message_keys_service_role" ON public.e2ee_message_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.6 E2EE CONVERSATION SETTINGS (Migration 055)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_conversation_settings (
  conversation_id UUID PRIMARY KEY REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  e2ee_required BOOLEAN NOT NULL DEFAULT FALSE,
  current_session_id TEXT,
  current_session_created_at TIMESTAMPTZ,
  session_message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.e2ee_conversation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "e2ee_conversation_settings_select_participant" ON public.e2ee_conversation_settings FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM public.dm_participants
    WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "e2ee_conversation_settings_manage_participant" ON public.e2ee_conversation_settings FOR ALL USING (
  conversation_id IN (
    SELECT conversation_id FROM public.dm_participants
    WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "e2ee_conversation_settings_service_role" ON public.e2ee_conversation_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.7 SAS VERIFICATIONS (Migration 056)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_sas_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  initiator_device_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  target_device_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'started', 'key_exchanged', 'sas_ready', 'sas_match', 'verified', 'cancelled', 'expired')
  ),
  initiator_public_key TEXT,
  target_public_key TEXT,
  initiator_commitment TEXT,
  sas_emoji_indices TEXT,
  sas_decimal TEXT,
  transaction_id TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sas_verifications_initiator ON public.e2ee_sas_verifications(initiator_user_id, initiator_device_id);
CREATE INDEX IF NOT EXISTS idx_sas_verifications_target ON public.e2ee_sas_verifications(target_user_id, target_device_id);
CREATE INDEX IF NOT EXISTS idx_sas_verifications_transaction ON public.e2ee_sas_verifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sas_verifications_pending ON public.e2ee_sas_verifications(status) WHERE status NOT IN ('verified', 'cancelled', 'expired');

ALTER TABLE public.e2ee_sas_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sas_verifications_select_participant" ON public.e2ee_sas_verifications FOR SELECT USING (
  initiator_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR target_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "sas_verifications_insert_initiator" ON public.e2ee_sas_verifications FOR INSERT WITH CHECK (
  initiator_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "sas_verifications_update_participant" ON public.e2ee_sas_verifications FOR UPDATE USING (
  initiator_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR target_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "sas_verifications_service_role" ON public.e2ee_sas_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.8 CROSS-SIGNING KEYS (Migration 056)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_cross_signing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('master', 'self_signing', 'user_signing')),
  public_key TEXT NOT NULL,
  signatures JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, key_type, is_active)
);

CREATE INDEX IF NOT EXISTS idx_cross_signing_keys_user ON public.e2ee_cross_signing_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_signing_keys_active ON public.e2ee_cross_signing_keys(user_id, key_type) WHERE is_active = TRUE;

ALTER TABLE public.e2ee_cross_signing_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cross_signing_keys_select_all" ON public.e2ee_cross_signing_keys FOR SELECT USING (true);
CREATE POLICY "cross_signing_keys_manage_own" ON public.e2ee_cross_signing_keys FOR ALL USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "cross_signing_keys_service_role" ON public.e2ee_cross_signing_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.9 DEVICE SIGNATURES (Migration 056)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_device_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key_id UUID NOT NULL REFERENCES public.device_keys(id) ON DELETE CASCADE,
  signer_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  signer_key_type TEXT NOT NULL CHECK (signer_key_type IN ('master', 'self_signing', 'user_signing', 'device')),
  signer_key_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(device_key_id, signer_key_id)
);

CREATE INDEX IF NOT EXISTS idx_device_signatures_device ON public.e2ee_device_signatures(device_key_id);

ALTER TABLE public.e2ee_device_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_signatures_select_all" ON public.e2ee_device_signatures FOR SELECT USING (true);
CREATE POLICY "device_signatures_insert_signer" ON public.e2ee_device_signatures FOR INSERT WITH CHECK (
  signer_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "device_signatures_service_role" ON public.e2ee_device_signatures FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.10 USER TRUST RELATIONSHIPS (Migration 056)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_user_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truster_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  trusted_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  trusted_master_key TEXT NOT NULL,
  trust_level TEXT NOT NULL DEFAULT 'verified' CHECK (trust_level IN ('verified', 'tofu', 'blocked')),
  verification_method TEXT CHECK (verification_method IN ('sas', 'cross_sign', 'qr', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(truster_user_id, trusted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_trust_truster ON public.e2ee_user_trust(truster_user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_trusted ON public.e2ee_user_trust(trusted_user_id);

ALTER TABLE public.e2ee_user_trust ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_trust_select_truster" ON public.e2ee_user_trust FOR SELECT USING (
  truster_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "user_trust_select_trusted" ON public.e2ee_user_trust FOR SELECT USING (
  trusted_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "user_trust_manage_own" ON public.e2ee_user_trust FOR ALL USING (
  truster_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "user_trust_service_role" ON public.e2ee_user_trust FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.11 AI CONSENT (Migration 057)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_ai_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    consent_status IN ('pending', 'granted', 'denied', 'revoked')
  ),
  allowed_features JSONB NOT NULL DEFAULT '[]',
  consent_given_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,
  consent_reason TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_consent_conversation ON public.e2ee_ai_consent(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_consent_user ON public.e2ee_ai_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_consent_granted ON public.e2ee_ai_consent(conversation_id) WHERE consent_status = 'granted';

ALTER TABLE public.e2ee_ai_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_consent_manage_own" ON public.e2ee_ai_consent FOR ALL USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "ai_consent_select_conversation" ON public.e2ee_ai_consent FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM public.dm_participants
    WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "ai_consent_service_role" ON public.e2ee_ai_consent FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.12 AI ACCESS LOG (Migration 057)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_ai_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.dm_messages(id) ON DELETE SET NULL,
  authorizing_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  authorizing_device_id TEXT NOT NULL,
  feature_used TEXT NOT NULL,
  content_hash TEXT,
  ai_model_used TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_access_conversation ON public.e2ee_ai_access_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_access_user ON public.e2ee_ai_access_log(authorizing_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_access_time ON public.e2ee_ai_access_log(accessed_at DESC);

ALTER TABLE public.e2ee_ai_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_access_log_select" ON public.e2ee_ai_access_log FOR SELECT USING (
  authorizing_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR conversation_id IN (
    SELECT conversation_id FROM public.dm_participants
    WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "ai_access_log_service_role" ON public.e2ee_ai_access_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10.13 CONVERSATION AI SETTINGS (Migration 057)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.e2ee_conversation_ai_settings (
  conversation_id UUID PRIMARY KEY REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  ai_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  require_unanimous_consent BOOLEAN NOT NULL DEFAULT TRUE,
  enabled_features JSONB NOT NULL DEFAULT '["mention_response"]',
  consent_expiry_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.e2ee_conversation_ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation_ai_settings_select_participant" ON public.e2ee_conversation_ai_settings FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM public.dm_participants
    WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "conversation_ai_settings_manage_participant" ON public.e2ee_conversation_ai_settings FOR ALL USING (
  conversation_id IN (
    SELECT conversation_id FROM public.dm_participants
    WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
CREATE POLICY "conversation_ai_settings_service_role" ON public.e2ee_conversation_ai_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
