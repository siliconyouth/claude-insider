-- Migration: 016_ratings_reviews.sql
-- Content Ratings & Reviews System
-- Allows users to rate and review resources

-- Ratings table (quick star ratings without review)
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,  -- 'resource', 'doc'
  resource_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Reviews table (full reviews with optional rating)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  helpful_count INTEGER DEFAULT 0,
  reported BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Resource rating aggregates (cached for performance)
CREATE TABLE IF NOT EXISTS resource_rating_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_type, resource_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ratings_resource ON ratings(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_resource ON reviews(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_rating_stats_resource ON resource_rating_stats(resource_type, resource_id);

-- RLS policies
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_rating_stats ENABLE ROW LEVEL SECURITY;

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own ratings" ON ratings
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own ratings" ON ratings
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own ratings" ON ratings
  FOR DELETE USING (user_id = auth.uid()::text);

-- Reviews policies
CREATE POLICY "Published reviews are viewable by everyone" ON reviews
  FOR SELECT USING (status = 'published' OR user_id = auth.uid()::text);

CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (user_id = auth.uid()::text);

-- Helpful votes policies
CREATE POLICY "Votes are viewable by everyone" ON review_helpful_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can create own votes" ON review_helpful_votes
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own votes" ON review_helpful_votes
  FOR DELETE USING (user_id = auth.uid()::text);

-- Stats are viewable by everyone
CREATE POLICY "Stats are viewable by everyone" ON resource_rating_stats
  FOR SELECT USING (true);

-- Function to update rating stats
CREATE OR REPLACE FUNCTION update_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_resource_type TEXT;
  v_resource_id TEXT;
  v_avg DECIMAL(3, 2);
  v_count INTEGER;
  v_r1 INTEGER;
  v_r2 INTEGER;
  v_r3 INTEGER;
  v_r4 INTEGER;
  v_r5 INTEGER;
BEGIN
  -- Determine resource info based on operation
  IF TG_OP = 'DELETE' THEN
    v_resource_type := OLD.resource_type;
    v_resource_id := OLD.resource_id;
  ELSE
    v_resource_type := NEW.resource_type;
    v_resource_id := NEW.resource_id;
  END IF;

  -- Calculate new stats from ratings table
  SELECT
    COALESCE(AVG(rating), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 1),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 5)
  INTO v_avg, v_count, v_r1, v_r2, v_r3, v_r4, v_r5
  FROM ratings
  WHERE resource_type = v_resource_type AND resource_id = v_resource_id;

  -- Upsert stats
  INSERT INTO resource_rating_stats (
    resource_type, resource_id, average_rating, rating_count,
    rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
    updated_at
  ) VALUES (
    v_resource_type, v_resource_id, v_avg, v_count,
    v_r1, v_r2, v_r3, v_r4, v_r5, NOW()
  )
  ON CONFLICT (resource_type, resource_id) DO UPDATE SET
    average_rating = v_avg,
    rating_count = v_count,
    rating_1_count = v_r1,
    rating_2_count = v_r2,
    rating_3_count = v_r3,
    rating_4_count = v_r4,
    rating_5_count = v_r5,
    updated_at = NOW();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating stats updates
CREATE TRIGGER trigger_update_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW EXECUTE FUNCTION update_rating_stats();

-- Function to update review count in stats
CREATE OR REPLACE FUNCTION update_review_count()
RETURNS TRIGGER AS $$
DECLARE
  v_resource_type TEXT;
  v_resource_id TEXT;
  v_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_resource_type := OLD.resource_type;
    v_resource_id := OLD.resource_id;
  ELSE
    v_resource_type := NEW.resource_type;
    v_resource_id := NEW.resource_id;
  END IF;

  -- Count published reviews
  SELECT COUNT(*) INTO v_count
  FROM reviews
  WHERE resource_type = v_resource_type
    AND resource_id = v_resource_id
    AND status = 'published';

  -- Update stats
  UPDATE resource_rating_stats
  SET review_count = v_count, updated_at = NOW()
  WHERE resource_type = v_resource_type AND resource_id = v_resource_id;

  -- Insert if not exists
  IF NOT FOUND THEN
    INSERT INTO resource_rating_stats (resource_type, resource_id, review_count)
    VALUES (v_resource_type, v_resource_id, v_count)
    ON CONFLICT (resource_type, resource_id) DO UPDATE SET
      review_count = v_count, updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for review count updates
CREATE TRIGGER trigger_update_review_count
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_review_count();

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
  v_review_id UUID;
  v_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_review_id := OLD.review_id;
  ELSE
    v_review_id := NEW.review_id;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM review_helpful_votes
  WHERE review_id = v_review_id;

  UPDATE reviews SET helpful_count = v_count WHERE id = v_review_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful count
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR DELETE ON review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

-- Add review_count to user table for tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Trigger to update user review count
CREATE OR REPLACE FUNCTION update_user_review_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "user" SET review_count = review_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "user" SET review_count = review_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_review_count
AFTER INSERT OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_review_count();
