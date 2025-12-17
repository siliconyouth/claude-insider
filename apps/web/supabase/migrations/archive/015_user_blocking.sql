-- Migration: 015_user_blocking.sql
-- User Blocking System
-- Allows users to block other users, preventing interactions

-- User blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- RLS policies
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks" ON user_blocks
  FOR SELECT
  USING (blocker_id = auth.uid()::text);

-- Users can create blocks
CREATE POLICY "Users can create blocks" ON user_blocks
  FOR INSERT
  WITH CHECK (blocker_id = auth.uid()::text);

-- Users can delete their own blocks
CREATE POLICY "Users can delete own blocks" ON user_blocks
  FOR DELETE
  USING (blocker_id = auth.uid()::text);

-- Function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(checker_id TEXT, target_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = checker_id AND blocked_id = target_id)
       OR (blocker_id = target_id AND blocked_id = checker_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Add blocked_count to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS blocked_count INTEGER DEFAULT 0;

-- Trigger to update blocked count when blocking/unblocking
CREATE OR REPLACE FUNCTION update_blocked_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "user" SET blocked_count = blocked_count + 1 WHERE id = NEW.blocker_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "user" SET blocked_count = blocked_count - 1 WHERE id = OLD.blocker_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blocked_count
AFTER INSERT OR DELETE ON user_blocks
FOR EACH ROW EXECUTE FUNCTION update_blocked_count();

-- When someone blocks a user, also remove any follow relationships
CREATE OR REPLACE FUNCTION remove_follows_on_block()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove follow in both directions
  DELETE FROM user_follows
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_remove_follows_on_block
AFTER INSERT ON user_blocks
FOR EACH ROW EXECUTE FUNCTION remove_follows_on_block();

-- Add full-text search index on user table for efficient search
CREATE INDEX IF NOT EXISTS idx_user_search ON "user"
USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(username, '') || ' ' || COALESCE(bio, '')));
