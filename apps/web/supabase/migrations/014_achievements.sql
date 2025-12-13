-- Achievements & Badges Migration
-- Track user milestones and display badges on profiles

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'contribution', 'engagement', 'milestone', 'special'
  points INT DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  requirement_type TEXT NOT NULL, -- 'count', 'streak', 'first', 'special'
  requirement_value INT DEFAULT 1,
  is_hidden BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (earned)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE, -- Show on profile
  UNIQUE(user_id, achievement_id)
);

-- Progress tracking for achievements
CREATE TABLE IF NOT EXISTS achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  achievement_slug TEXT NOT NULL,
  current_value INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_featured ON user_achievements(user_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user ON achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- Add achievements count to user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS achievements_count INT DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS achievement_points INT DEFAULT 0;

-- Seed default achievements
INSERT INTO achievements (slug, name, description, icon, category, points, tier, requirement_type, requirement_value, is_hidden) VALUES
  -- Contribution achievements
  ('first_comment', 'First Voice', 'Posted your first comment', 'chat', 'contribution', 10, 'bronze', 'first', 1, FALSE),
  ('comments_10', 'Conversationalist', 'Posted 10 comments', 'chat-bubble', 'contribution', 25, 'bronze', 'count', 10, FALSE),
  ('comments_50', 'Discussion Leader', 'Posted 50 comments', 'chat-bubble', 'contribution', 50, 'silver', 'count', 50, FALSE),
  ('comments_100', 'Community Voice', 'Posted 100 comments', 'chat-bubble', 'contribution', 100, 'gold', 'count', 100, FALSE),

  ('first_suggestion', 'First Edit', 'Submitted your first edit suggestion', 'pencil', 'contribution', 15, 'bronze', 'first', 1, FALSE),
  ('suggestions_5', 'Editor', 'Submitted 5 edit suggestions', 'pencil-square', 'contribution', 30, 'bronze', 'count', 5, FALSE),
  ('suggestions_25', 'Senior Editor', 'Submitted 25 edit suggestions', 'pencil-square', 'contribution', 75, 'silver', 'count', 25, FALSE),
  ('approved_suggestion', 'Quality Contributor', 'Had an edit suggestion approved', 'check', 'contribution', 50, 'silver', 'first', 1, FALSE),
  ('approved_10', 'Trusted Editor', 'Had 10 suggestions approved', 'badge-check', 'contribution', 150, 'gold', 'count', 10, FALSE),

  -- Engagement achievements
  ('first_favorite', 'Collector', 'Added your first favorite', 'heart', 'engagement', 5, 'bronze', 'first', 1, FALSE),
  ('favorites_25', 'Curator', 'Added 25 favorites', 'heart', 'engagement', 25, 'bronze', 'count', 25, FALSE),
  ('favorites_100', 'Archivist', 'Added 100 favorites', 'heart', 'engagement', 75, 'silver', 'count', 100, FALSE),

  ('first_collection', 'Organizer', 'Created your first collection', 'folder', 'engagement', 10, 'bronze', 'first', 1, FALSE),
  ('collections_5', 'Librarian', 'Created 5 collections', 'folder-open', 'engagement', 30, 'silver', 'count', 5, FALSE),

  ('first_follow', 'Socialite', 'Followed your first user', 'user-plus', 'engagement', 5, 'bronze', 'first', 1, FALSE),
  ('following_10', 'Networker', 'Following 10 users', 'users', 'engagement', 20, 'bronze', 'count', 10, FALSE),
  ('followers_10', 'Influencer', 'Gained 10 followers', 'users', 'engagement', 50, 'silver', 'count', 10, TRUE),
  ('followers_50', 'Community Star', 'Gained 50 followers', 'star', 'engagement', 150, 'gold', 'count', 50, TRUE),

  -- Milestone achievements
  ('profile_complete', 'Identity', 'Completed your profile', 'user-circle', 'milestone', 15, 'bronze', 'first', 1, FALSE),
  ('beta_tester', 'Pioneer', 'Joined as a beta tester', 'beaker', 'milestone', 100, 'gold', 'special', 1, FALSE),
  ('verified', 'Verified', 'Became a verified user', 'badge-check', 'milestone', 200, 'platinum', 'special', 1, TRUE),
  ('year_member', 'Veteran', 'Member for 1 year', 'calendar', 'milestone', 100, 'gold', 'special', 1, TRUE),
  ('two_factor', 'Security Conscious', 'Enabled two-factor authentication', 'shield-check', 'milestone', 25, 'silver', 'first', 1, FALSE),

  -- Special achievements
  ('early_adopter', 'Early Adopter', 'Joined in the first month', 'rocket', 'special', 150, 'gold', 'special', 1, FALSE),
  ('helpful_comment', 'Helpful', 'Received 10 upvotes on a comment', 'thumb-up', 'special', 50, 'silver', 'special', 1, TRUE),
  ('top_contributor', 'Top Contributor', 'Reached top 10 contributors', 'trophy', 'special', 500, 'platinum', 'special', 1, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievement(
  p_user_id TEXT,
  p_achievement_slug TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement achievements%ROWTYPE;
  v_progress INT;
  v_already_earned BOOLEAN;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement FROM achievements WHERE slug = p_achievement_slug;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if already earned
  SELECT EXISTS (
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id AND a.slug = p_achievement_slug
  ) INTO v_already_earned;

  IF v_already_earned THEN
    RETURN FALSE;
  END IF;

  -- Get current progress
  SELECT current_value INTO v_progress
  FROM achievement_progress
  WHERE user_id = p_user_id AND achievement_slug = p_achievement_slug;

  v_progress := COALESCE(v_progress, 0);

  -- Check if requirement is met
  IF v_progress >= v_achievement.requirement_value THEN
    -- Award achievement
    INSERT INTO user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement.id, v_progress);

    -- Update user stats
    UPDATE "user"
    SET
      achievements_count = COALESCE(achievements_count, 0) + 1,
      achievement_points = COALESCE(achievement_points, 0) + v_achievement.points
    WHERE id = p_user_id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment achievement progress
CREATE OR REPLACE FUNCTION increment_achievement_progress(
  p_user_id TEXT,
  p_achievement_slug TEXT,
  p_increment INT DEFAULT 1
)
RETURNS INT AS $$
DECLARE
  v_new_value INT;
BEGIN
  INSERT INTO achievement_progress (user_id, achievement_slug, current_value, updated_at)
  VALUES (p_user_id, p_achievement_slug, p_increment, NOW())
  ON CONFLICT (user_id, achievement_slug)
  DO UPDATE SET
    current_value = achievement_progress.current_value + p_increment,
    updated_at = NOW()
  RETURNING current_value INTO v_new_value;

  -- Try to award achievement
  PERFORM check_achievement(p_user_id, p_achievement_slug);

  RETURN v_new_value;
END;
$$ LANGUAGE plpgsql;

-- Function to award special achievement directly
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id TEXT,
  p_achievement_slug TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement achievements%ROWTYPE;
  v_already_earned BOOLEAN;
BEGIN
  -- Get achievement
  SELECT * INTO v_achievement FROM achievements WHERE slug = p_achievement_slug;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if already earned
  SELECT EXISTS (
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id AND a.slug = p_achievement_slug
  ) INTO v_already_earned;

  IF v_already_earned THEN
    RETURN FALSE;
  END IF;

  -- Award achievement
  INSERT INTO user_achievements (user_id, achievement_id, progress)
  VALUES (p_user_id, v_achievement.id, v_achievement.requirement_value);

  -- Update user stats
  UPDATE "user"
  SET
    achievements_count = COALESCE(achievements_count, 0) + 1,
    achievement_points = COALESCE(achievement_points, 0) + v_achievement.points
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

-- Everyone can view achievements
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (TRUE);

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Users can view others' non-hidden achievements
CREATE POLICY "Users can view others featured achievements" ON user_achievements
  FOR SELECT USING (is_featured = TRUE);

-- Users can manage their own featured status
CREATE POLICY "Users can update own featured" ON user_achievements
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- Progress is private
CREATE POLICY "Users can view own progress" ON achievement_progress
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_achievement TO authenticated;
GRANT EXECUTE ON FUNCTION increment_achievement_progress TO authenticated;
GRANT EXECUTE ON FUNCTION award_achievement TO authenticated;
