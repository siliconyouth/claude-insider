-- Migration: 012_user_following
-- Description: User following system and activity feed
-- Created: 2025-12-13

-- User follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate follows
  UNIQUE(follower_id, following_id),
  -- Prevent self-follows
  CHECK (follower_id != following_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON user_follows(created_at DESC);

-- Add follower counts to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment counts
    UPDATE "user" SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    UPDATE "user" SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts
    UPDATE "user" SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.following_id;
    UPDATE "user" SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follow count updates
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON user_follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- Function to follow a user
CREATE OR REPLACE FUNCTION follow_user(
  p_follower_id TEXT,
  p_following_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Can't follow yourself
  IF p_follower_id = p_following_id THEN
    RETURN FALSE;
  END IF;

  -- Insert follow (ignore if already exists)
  INSERT INTO user_follows (follower_id, following_id)
  VALUES (p_follower_id, p_following_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to unfollow a user
CREATE OR REPLACE FUNCTION unfollow_user(
  p_follower_id TEXT,
  p_following_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_follows
  WHERE follower_id = p_follower_id AND following_id = p_following_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is following another
CREATE OR REPLACE FUNCTION is_following(
  p_follower_id TEXT,
  p_following_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows
DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
CREATE POLICY "Anyone can view follows"
  ON user_follows FOR SELECT
  USING (true);

-- Users can follow others
DROP POLICY IF EXISTS "Users can follow" ON user_follows;
CREATE POLICY "Users can follow"
  ON user_follows FOR INSERT
  WITH CHECK (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can unfollow
DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  USING (follower_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Grant access
GRANT ALL ON user_follows TO authenticated;
GRANT SELECT ON user_follows TO anon;
