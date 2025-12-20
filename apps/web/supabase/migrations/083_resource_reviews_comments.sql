-- Migration: 083_resource_reviews_comments
-- Description: Create tables for resource reviews and comments (moderated)
-- Created: 2025-12-20

-- Drop existing tables if they exist with wrong structure
DROP TABLE IF EXISTS resource_comment_likes CASCADE;
DROP TABLE IF EXISTS resource_comments CASCADE;
DROP TABLE IF EXISTS resource_review_votes CASCADE;
DROP TABLE IF EXISTS resource_reviews CASCADE;

-- =============================================================================
-- RESOURCE REVIEWS TABLE
-- =============================================================================

CREATE TABLE resource_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Review content
  title VARCHAR(255),
  content TEXT NOT NULL,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  rating INTEGER NOT NULL,

  -- Moderation (reviews require approval)
  status VARCHAR(50) DEFAULT 'pending',
  moderated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT,

  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One review per user per resource
  UNIQUE(resource_id, user_id),

  -- Constraints
  CONSTRAINT resource_reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT resource_reviews_status_check CHECK (status IN (
    'pending', 'approved', 'rejected', 'flagged'
  )),
  CONSTRAINT resource_reviews_content_check CHECK (char_length(content) >= 10)
);

CREATE INDEX IF NOT EXISTS idx_resource_reviews_resource ON resource_reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_user ON resource_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_status ON resource_reviews(status);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_rating ON resource_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_created ON resource_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_helpful ON resource_reviews(helpful_count DESC) WHERE status = 'approved';

-- =============================================================================
-- RESOURCE REVIEW VOTES TABLE
-- =============================================================================

CREATE TABLE resource_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES resource_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_review_votes_review ON resource_review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_resource_review_votes_user ON resource_review_votes(user_id);

-- =============================================================================
-- RESOURCE COMMENTS TABLE
-- =============================================================================

CREATE TABLE resource_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES resource_comments(id) ON DELETE CASCADE,

  -- Comment content
  content TEXT NOT NULL,

  -- Moderation
  status VARCHAR(50) DEFAULT 'approved',
  moderated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,

  -- Engagement
  likes_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT resource_comments_status_check CHECK (status IN (
    'pending', 'approved', 'rejected', 'flagged'
  )),
  CONSTRAINT resource_comments_content_check CHECK (char_length(content) >= 1)
);

CREATE INDEX IF NOT EXISTS idx_resource_comments_resource ON resource_comments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_comments_user ON resource_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_comments_parent ON resource_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resource_comments_status ON resource_comments(status);
CREATE INDEX IF NOT EXISTS idx_resource_comments_created ON resource_comments(created_at DESC);

-- =============================================================================
-- RESOURCE COMMENT LIKES TABLE
-- =============================================================================

CREATE TABLE resource_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES resource_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_comment_likes_comment ON resource_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_resource_comment_likes_user ON resource_comment_likes(user_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE resource_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies (defensive creation)
DO $$
BEGIN
  -- Reviews policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public can view approved reviews' AND tablename = 'resource_reviews') THEN
    CREATE POLICY "Public can view approved reviews" ON resource_reviews FOR SELECT USING (status = 'approved');
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view their own reviews' AND tablename = 'resource_reviews') THEN
    CREATE POLICY "Users can view their own reviews" ON resource_reviews FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can create reviews' AND tablename = 'resource_reviews') THEN
    CREATE POLICY "Users can create reviews" ON resource_reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can update their own pending reviews' AND tablename = 'resource_reviews') THEN
    CREATE POLICY "Users can update their own pending reviews" ON resource_reviews FOR UPDATE USING (auth.uid()::text = user_id AND status = 'pending');
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can delete their own reviews' AND tablename = 'resource_reviews') THEN
    CREATE POLICY "Users can delete their own reviews" ON resource_reviews FOR DELETE USING (auth.uid()::text = user_id);
  END IF;

  -- Review votes policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public can view review votes' AND tablename = 'resource_review_votes') THEN
    CREATE POLICY "Public can view review votes" ON resource_review_votes FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can vote on reviews' AND tablename = 'resource_review_votes') THEN
    CREATE POLICY "Users can vote on reviews" ON resource_review_votes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can change their vote' AND tablename = 'resource_review_votes') THEN
    CREATE POLICY "Users can change their vote" ON resource_review_votes FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can remove their vote' AND tablename = 'resource_review_votes') THEN
    CREATE POLICY "Users can remove their vote" ON resource_review_votes FOR DELETE USING (auth.uid()::text = user_id);
  END IF;

  -- Comments policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public can view approved comments' AND tablename = 'resource_comments') THEN
    CREATE POLICY "Public can view approved comments" ON resource_comments FOR SELECT USING (status = 'approved');
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view their own comments' AND tablename = 'resource_comments') THEN
    CREATE POLICY "Users can view their own comments" ON resource_comments FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can create comments' AND tablename = 'resource_comments') THEN
    CREATE POLICY "Users can create comments" ON resource_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can update their own comments' AND tablename = 'resource_comments') THEN
    CREATE POLICY "Users can update their own comments" ON resource_comments FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can delete their own comments' AND tablename = 'resource_comments') THEN
    CREATE POLICY "Users can delete their own comments" ON resource_comments FOR DELETE USING (auth.uid()::text = user_id);
  END IF;

  -- Comment likes policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public can view comment likes' AND tablename = 'resource_comment_likes') THEN
    CREATE POLICY "Public can view comment likes" ON resource_comment_likes FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can like comments' AND tablename = 'resource_comment_likes') THEN
    CREATE POLICY "Users can like comments" ON resource_comment_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can unlike comments' AND tablename = 'resource_comment_likes') THEN
    CREATE POLICY "Users can unlike comments" ON resource_comment_likes FOR DELETE USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- =============================================================================
-- FUNCTIONS: Update denormalized counts
-- =============================================================================

-- Function to update review counts
CREATE OR REPLACE FUNCTION update_resource_reviews_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE resources
    SET reviews_count = reviews_count + 1
    WHERE id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE resources
    SET reviews_count = GREATEST(0, reviews_count - 1)
    WHERE id = OLD.resource_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changed to approved
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE resources
      SET reviews_count = reviews_count + 1
      WHERE id = NEW.resource_id;
    -- Status changed from approved
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE resources
      SET reviews_count = GREATEST(0, reviews_count - 1)
      WHERE id = NEW.resource_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_reviews_count ON resource_reviews;
CREATE TRIGGER trigger_resource_reviews_count
  AFTER INSERT OR UPDATE OR DELETE ON resource_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_reviews_count();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_resource_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE resources
    SET comments_count = comments_count + 1
    WHERE id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE resources
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.resource_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE resources
      SET comments_count = comments_count + 1
      WHERE id = NEW.resource_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE resources
      SET comments_count = GREATEST(0, comments_count - 1)
      WHERE id = NEW.resource_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_comments_count ON resource_comments;
CREATE TRIGGER trigger_resource_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON resource_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_comments_count();

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE resource_reviews
      SET helpful_count = helpful_count + 1
      WHERE id = NEW.review_id;
    ELSE
      UPDATE resource_reviews
      SET not_helpful_count = not_helpful_count + 1
      WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE resource_reviews
      SET helpful_count = GREATEST(0, helpful_count - 1)
      WHERE id = OLD.review_id;
    ELSE
      UPDATE resource_reviews
      SET not_helpful_count = GREATEST(0, not_helpful_count - 1)
      WHERE id = OLD.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_helpful != NEW.is_helpful THEN
    IF NEW.is_helpful THEN
      UPDATE resource_reviews
      SET helpful_count = helpful_count + 1,
          not_helpful_count = GREATEST(0, not_helpful_count - 1)
      WHERE id = NEW.review_id;
    ELSE
      UPDATE resource_reviews
      SET helpful_count = GREATEST(0, helpful_count - 1),
          not_helpful_count = not_helpful_count + 1
      WHERE id = NEW.review_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_review_helpful_count ON resource_review_votes;
CREATE TRIGGER trigger_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON resource_review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE resource_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE resource_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_likes_count ON resource_comment_likes;
CREATE TRIGGER trigger_comment_likes_count
  AFTER INSERT OR DELETE ON resource_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- =============================================================================
-- TRIGGER: Update timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION update_resource_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_reviews_updated_at ON resource_reviews;
CREATE TRIGGER trigger_resource_reviews_updated_at
  BEFORE UPDATE ON resource_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_reviews_updated_at();

CREATE OR REPLACE FUNCTION update_resource_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_comments_updated_at ON resource_comments;
CREATE TRIGGER trigger_resource_comments_updated_at
  BEFORE UPDATE ON resource_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_comments_updated_at();
