-- =====================================================
-- Migration: 019_saved_searches.sql
-- Description: Saved searches and search history
-- Version: 0.46.0
-- =====================================================

-- Saved Searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Search History (server-side for logged-in users)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  result_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT now()
);

-- Search Analytics (for popular queries)
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  result_count_avg FLOAT DEFAULT 0,
  no_results_count INTEGER DEFAULT 0,
  last_searched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_use_count ON saved_searches(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_normalized ON search_analytics(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_count ON search_analytics(search_count DESC);

-- Add saved search count to user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS saved_search_count INTEGER DEFAULT 0;

-- Trigger to update saved search count
CREATE OR REPLACE FUNCTION update_saved_search_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "user" SET saved_search_count = saved_search_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "user" SET saved_search_count = saved_search_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_search_count ON saved_searches;
CREATE TRIGGER trigger_update_saved_search_count
  AFTER INSERT OR DELETE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_search_count();

-- Limit search history to 50 per user
CREATE OR REPLACE FUNCTION limit_search_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM search_history
  WHERE id IN (
    SELECT id FROM search_history
    WHERE user_id = NEW.user_id
    ORDER BY searched_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_limit_search_history ON search_history;
CREATE TRIGGER trigger_limit_search_history
  AFTER INSERT ON search_history
  FOR EACH ROW
  EXECUTE FUNCTION limit_search_history();

-- Function to update or insert search analytics
CREATE OR REPLACE FUNCTION upsert_search_analytics(
  p_query TEXT,
  p_result_count INTEGER
) RETURNS void AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := lower(trim(regexp_replace(p_query, '\s+', ' ', 'g')));

  INSERT INTO search_analytics (query, normalized_query, result_count_avg, no_results_count)
  VALUES (p_query, normalized, p_result_count, CASE WHEN p_result_count = 0 THEN 1 ELSE 0 END)
  ON CONFLICT (normalized_query) DO UPDATE SET
    search_count = search_analytics.search_count + 1,
    result_count_avg = (search_analytics.result_count_avg * search_analytics.search_count + p_result_count) / (search_analytics.search_count + 1),
    no_results_count = search_analytics.no_results_count + CASE WHEN p_result_count = 0 THEN 1 ELSE 0 END,
    last_searched_at = now();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Saved searches: owner only
DROP POLICY IF EXISTS saved_searches_owner_policy ON saved_searches;
CREATE POLICY saved_searches_owner_policy ON saved_searches
  FOR ALL USING (user_id = auth.uid());

-- Search history: owner only
DROP POLICY IF EXISTS search_history_owner_policy ON search_history;
CREATE POLICY search_history_owner_policy ON search_history
  FOR ALL USING (user_id = auth.uid());

-- Search analytics: anyone can read
DROP POLICY IF EXISTS search_analytics_read_policy ON search_analytics;
CREATE POLICY search_analytics_read_policy ON search_analytics
  FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON saved_searches TO authenticated;
GRANT ALL ON search_history TO authenticated;
GRANT SELECT ON search_analytics TO authenticated;
GRANT SELECT ON search_analytics TO anon;
GRANT EXECUTE ON FUNCTION upsert_search_analytics(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_search_analytics(TEXT, INTEGER) TO anon;

-- Create unique constraint for upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'search_analytics_normalized_query_key'
  ) THEN
    ALTER TABLE search_analytics ADD CONSTRAINT search_analytics_normalized_query_key UNIQUE (normalized_query);
  END IF;
END $$;

-- =====================================================
-- End of Migration
-- =====================================================
