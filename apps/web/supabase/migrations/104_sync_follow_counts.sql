-- Migration: Sync followers_count and following_count with actual user_follows data
-- This fixes any desync between counter columns and actual follow relationships

-- First, create a function to sync counts (can be called anytime)
CREATE OR REPLACE FUNCTION sync_follow_counts()
RETURNS void AS $$
BEGIN
  -- Update followers_count for all users
  UPDATE public."user" u
  SET followers_count = COALESCE(counts.follower_count, 0)
  FROM (
    SELECT following_id, COUNT(*) as follower_count
    FROM user_follows uf
    -- Only count follows from non-banned, non-AI users
    JOIN public."user" follower ON follower.id = uf.follower_id
    WHERE follower.banned = false AND follower.role != 'ai_assistant'
    GROUP BY following_id
  ) counts
  WHERE u.id = counts.following_id;

  -- Reset counts to 0 for users with no followers
  UPDATE public."user"
  SET followers_count = 0
  WHERE id NOT IN (
    SELECT DISTINCT following_id FROM user_follows uf
    JOIN public."user" follower ON follower.id = uf.follower_id
    WHERE follower.banned = false AND follower.role != 'ai_assistant'
  );

  -- Update following_count for all users
  UPDATE public."user" u
  SET following_count = COALESCE(counts.following_count, 0)
  FROM (
    SELECT follower_id, COUNT(*) as following_count
    FROM user_follows uf
    -- Only count follows to non-banned, non-AI users
    JOIN public."user" followed ON followed.id = uf.following_id
    WHERE followed.banned = false AND followed.role != 'ai_assistant'
    GROUP BY follower_id
  ) counts
  WHERE u.id = counts.follower_id;

  -- Reset counts to 0 for users following nobody
  UPDATE public."user"
  SET following_count = 0
  WHERE id NOT IN (
    SELECT DISTINCT follower_id FROM user_follows uf
    JOIN public."user" followed ON followed.id = uf.following_id
    WHERE followed.banned = false AND followed.role != 'ai_assistant'
  );
END;
$$ LANGUAGE plpgsql;

-- Run the sync now
SELECT sync_follow_counts();

-- Add a comment explaining the function
COMMENT ON FUNCTION sync_follow_counts() IS
  'Syncs followers_count and following_count columns with actual user_follows data.
   Excludes banned users and AI assistants from counts.
   Can be called via: SELECT sync_follow_counts();';
