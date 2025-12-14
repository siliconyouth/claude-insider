-- =============================================================================
-- Migration: 022_fix_missing_schema_elements.sql
-- Description: Fixes missing schema elements from migrations 007, 008, and 010
-- Created: 2025-12-14
--
-- This migration addresses:
-- 1. Missing user profile columns from migration 010 (username, profilePrivacy)
-- 2. Missing admin_logs RLS and functions from migration 007
-- 3. Missing generate_collection_slug function from migration 008
-- =============================================================================

-- =============================================================================
-- PART 1: FIX MIGRATION 010 - User Profile Extensions
-- =============================================================================

-- Add username column to user table (for public profile URLs like /u/username)
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add privacy settings (controls what others can see on public profiles)
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "profilePrivacy" JSONB DEFAULT '{
  "showEmail": false,
  "showActivity": true,
  "showCollections": true,
  "showStats": true
}'::jsonb;

-- Create index for username lookups (for fast /u/username routes)
CREATE INDEX IF NOT EXISTS idx_user_username ON public."user"(username);

-- Function to generate username from name
-- Converts "John Doe" -> "john-doe", handles collisions with numeric suffix
CREATE OR REPLACE FUNCTION generate_username(p_name TEXT, p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base username from name (lowercase, alphanumeric, hyphens)
  base_username := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '-', 'g'));
  base_username := regexp_replace(base_username, '-+', '-', 'g'); -- Remove multiple hyphens
  base_username := trim(both '-' from base_username); -- Remove leading/trailing hyphens

  -- Limit length to 20 characters
  base_username := left(base_username, 20);

  -- If empty, use 'user'
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;

  -- Try to find unique username
  new_username := base_username;
  WHILE EXISTS (
    SELECT 1 FROM public."user"
    WHERE username = new_username
    AND id != p_user_id
  ) LOOP
    counter := counter + 1;
    new_username := base_username || '-' || counter;
  END LOOP;

  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Generate usernames for existing users without one
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id, name
    FROM public."user"
    WHERE username IS NULL AND name IS NOT NULL
  LOOP
    UPDATE public."user"
    SET username = generate_username(user_record.name, user_record.id)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- =============================================================================
-- PART 2: FIX MIGRATION 007 - Admin Logs RLS and Functions
-- =============================================================================

-- Enable RLS on admin_logs (was disabled, should be enabled for security)
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins and moderators can read all logs
-- Uses app.user_id setting which should be set by the application
DROP POLICY IF EXISTS "admin_logs_select_admin" ON public.admin_logs;
CREATE POLICY "admin_logs_select_admin"
ON public.admin_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role IN ('admin', 'moderator')
  )
);

-- Policy: Moderators and admins can create logs
DROP POLICY IF EXISTS "admin_logs_insert_moderator" ON public.admin_logs;
CREATE POLICY "admin_logs_insert_moderator"
ON public.admin_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role IN ('admin', 'moderator')
  )
);

-- Function to check if user has required role (with hierarchy)
-- Role hierarchy: user < editor < moderator < admin
-- Example: user_has_role('abc123', 'moderator') returns true if user is moderator or admin
CREATE OR REPLACE FUNCTION public.user_has_role(
  user_id TEXT,
  required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['user', 'editor', 'moderator', 'admin'];
  user_level INTEGER;
  required_level INTEGER;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM public."user"
  WHERE id = user_id;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Find position in hierarchy
  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  IF user_level IS NULL OR required_level IS NULL THEN
    RETURN FALSE;
  END IF;

  -- User has required role if their level is >= required level
  RETURN user_level >= required_level;
END;
$$;

-- Function to log admin action (for audit trail)
-- Returns the ID of the created log entry
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id TEXT,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- =============================================================================
-- PART 3: FIX MIGRATION 008 - Collection Slug Generator
-- =============================================================================

-- Function to generate unique slug for collection
-- Converts "My Collection" -> "my-collection", handles collisions per user
CREATE OR REPLACE FUNCTION public.generate_collection_slug(
  p_user_id TEXT,
  p_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- If empty, use 'collection'
  IF base_slug = '' THEN
    base_slug := 'collection';
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (
    SELECT 1 FROM public.collections
    WHERE user_id = p_user_id AND slug = final_slug
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- =============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration worked)
-- =============================================================================

-- Uncomment and run these to verify:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user' AND column_name IN ('username', 'profilePrivacy');
-- SELECT proname FROM pg_proc WHERE proname IN ('generate_username', 'user_has_role', 'log_admin_action', 'generate_collection_slug');
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'admin_logs';
-- SELECT policyname FROM pg_policies WHERE tablename = 'admin_logs';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
