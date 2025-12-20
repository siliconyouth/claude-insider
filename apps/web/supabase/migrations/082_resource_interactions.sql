-- Migration: 082_resource_interactions
-- Description: Create tables for resource user interactions (favorites, ratings, views)
-- Created: 2025-12-20

-- Drop existing tables if they exist with wrong structure
DROP TABLE IF EXISTS resource_view_stats_daily CASCADE;
DROP TABLE IF EXISTS resource_views CASCADE;
DROP TABLE IF EXISTS resource_ratings CASCADE;
DROP TABLE IF EXISTS resource_favorites CASCADE;

-- =============================================================================
-- RESOURCE FAVORITES TABLE
-- =============================================================================

CREATE TABLE resource_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_favorites_resource ON resource_favorites(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_favorites_user ON resource_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_favorites_created ON resource_favorites(created_at DESC);

-- =============================================================================
-- RESOURCE RATINGS TABLE
-- =============================================================================

CREATE TABLE resource_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, user_id),
  CONSTRAINT resource_ratings_value_check CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource ON resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_user ON resource_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_value ON resource_ratings(rating);

-- =============================================================================
-- RESOURCE VIEWS TABLE
-- =============================================================================

CREATE TABLE resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  visitor_id VARCHAR(255),
  ip_hash VARCHAR(64),
  user_agent TEXT,
  referrer VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_views_resource ON resource_views(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_created ON resource_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_views_user ON resource_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resource_views_visitor ON resource_views(visitor_id) WHERE visitor_id IS NOT NULL;

-- Partition by month for large-scale view tracking (optional, can enable later)
-- CREATE INDEX IF NOT EXISTS idx_resource_views_month ON resource_views(date_trunc('month', created_at));

-- =============================================================================
-- RESOURCE VIEW STATS DAILY TABLE (for analytics)
-- =============================================================================

CREATE TABLE resource_view_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,

  UNIQUE(resource_id, date)
);

CREATE INDEX IF NOT EXISTS idx_resource_view_stats_resource ON resource_view_stats_daily(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_view_stats_date ON resource_view_stats_daily(date DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_view_stats_daily ENABLE ROW LEVEL SECURITY;

-- Favorites: Users can see their own, create, delete
CREATE POLICY "Users can view their own favorites"
  ON resource_favorites FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create their own favorites"
  ON resource_favorites FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON resource_favorites FOR DELETE
  USING (auth.uid()::text = user_id);

-- Ratings: Public read, authenticated write
CREATE POLICY "Public can view ratings"
  ON resource_ratings FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create their own ratings"
  ON resource_ratings FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own ratings"
  ON resource_ratings FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Views: Insert only (no read for regular users)
CREATE POLICY "Anyone can create views"
  ON resource_views FOR INSERT
  WITH CHECK (TRUE);

-- View stats: Public read
CREATE POLICY "Public can view stats"
  ON resource_view_stats_daily FOR SELECT
  USING (TRUE);

-- =============================================================================
-- FUNCTIONS: Update denormalized counts
-- =============================================================================

-- Function to update favorites count
CREATE OR REPLACE FUNCTION update_resource_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE resources
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.resource_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE resources
    SET favorites_count = GREATEST(0, favorites_count - 1)
    WHERE id = OLD.resource_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_resource_favorites_count
  AFTER INSERT OR DELETE ON resource_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_favorites_count();

-- Function to update ratings stats
CREATE OR REPLACE FUNCTION update_resource_ratings_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_count INTEGER;
  new_avg DECIMAL(3, 2);
BEGIN
  -- Calculate new stats
  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO new_count, new_avg
  FROM resource_ratings
  WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id);

  -- Update the resource
  UPDATE resources
  SET ratings_count = new_count,
      average_rating = new_avg
  WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_resource_ratings_stats
  AFTER INSERT OR UPDATE OR DELETE ON resource_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_ratings_stats();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_resource_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resources
  SET views_count = views_count + 1
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_resource_views_count
  AFTER INSERT ON resource_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_resource_views();

-- =============================================================================
-- FUNCTION: Aggregate daily view stats (called by cron)
-- =============================================================================

CREATE OR REPLACE FUNCTION aggregate_resource_views_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO resource_view_stats_daily (resource_id, date, views, unique_visitors)
  SELECT
    resource_id,
    DATE(created_at) as date,
    COUNT(*) as views,
    COUNT(DISTINCT COALESCE(user_id, visitor_id, ip_hash)) as unique_visitors
  FROM resource_views
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE
  GROUP BY resource_id, DATE(created_at)
  ON CONFLICT (resource_id, date)
  DO UPDATE SET
    views = EXCLUDED.views,
    unique_visitors = EXCLUDED.unique_visitors;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Update ratings updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_resource_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_resource_ratings_updated_at
  BEFORE UPDATE ON resource_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_ratings_updated_at();
