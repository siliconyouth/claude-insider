-- Migration: 010_public_profiles
-- Description: Add username and privacy settings for public profiles
-- Created: 2025-12-13

-- Add username column to user table
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add privacy settings
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "profilePrivacy" JSONB DEFAULT '{
  "showEmail": false,
  "showActivity": true,
  "showCollections": true,
  "showStats": true
}'::jsonb;

-- Add social links (if not already present)
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "socialLinks" JSONB DEFAULT '{}'::jsonb;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_user_username ON public."user"(username);

-- Update RLS policy to allow public profile viewing
DROP POLICY IF EXISTS "Users can view own profile" ON public."user";

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public."user" FOR SELECT
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Anyone can view public profile info (limited fields handled in application)
CREATE POLICY "Anyone can view public profiles"
  ON public."user" FOR SELECT
  USING (username IS NOT NULL);

-- Function to generate username from name
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

  -- Limit length
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
