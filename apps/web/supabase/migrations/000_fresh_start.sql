-- =============================================================================
-- CLAUDE INSIDER - FRESH DATABASE SCHEMA
-- =============================================================================
-- Version: 1.0.0
-- Date: 2025-12-14
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
-- PART 2: BETTER AUTH TABLE EXTENSIONS
-- =============================================================================
-- Better Auth creates: user, session, account, verification
-- We add additional columns and disable RLS on auth tables

-- Add additional columns to user table (Better Auth creates basic columns)
DO $$
BEGIN
  -- Profile fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'username') THEN
    ALTER TABLE public."user" ADD COLUMN username TEXT UNIQUE;
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
END $$;

-- Create indexes on user table
CREATE INDEX IF NOT EXISTS idx_user_username ON public."user"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON public."user"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON public."user"(role);

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
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  page_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);

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
-- END OF MIGRATION
-- =============================================================================
