-- =====================================================
-- Migration: 017_reading_lists.sql
-- Description: Reading lists, bookmarks, and view history
-- Version: 0.44.0
-- =====================================================

-- Reading Lists table
CREATE TABLE IF NOT EXISTS reading_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Read Later',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  slug TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'bookmark',
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Reading List Items table
CREATE TABLE IF NOT EXISTS reading_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES reading_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'doc', 'resource', etc.
  resource_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'reading', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  added_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(list_id, resource_type, resource_id)
);

-- View History table
CREATE TABLE IF NOT EXISTS view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  view_count INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, resource_type, resource_id)
);

-- Resource Views (anonymous tracking for popular content)
CREATE TABLE IF NOT EXISTS resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  referrer TEXT,
  user_agent TEXT
);

-- Resource View Stats (cached aggregates)
CREATE TABLE IF NOT EXISTS resource_view_stats (
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  views_today INTEGER DEFAULT 0,
  views_week INTEGER DEFAULT 0,
  views_month INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (resource_type, resource_id)
);

-- Indexes for reading lists
CREATE INDEX IF NOT EXISTS idx_reading_lists_user_id ON reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_lists_public ON reading_lists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_reading_list_items_list_id ON reading_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_items_user_id ON reading_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_items_status ON reading_list_items(status);

-- Indexes for view history
CREATE INDEX IF NOT EXISTS idx_view_history_user_id ON view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_view_history_viewed_at ON view_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_views_resource ON resource_views(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_viewed_at ON resource_views(viewed_at DESC);

-- Add reading list count to user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS reading_list_count INTEGER DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS items_read_count INTEGER DEFAULT 0;

-- Trigger to update reading list item count
CREATE OR REPLACE FUNCTION update_reading_list_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reading_lists SET item_count = item_count + 1, updated_at = now() WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reading_lists SET item_count = item_count - 1, updated_at = now() WHERE id = OLD.list_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reading_list_item_count ON reading_list_items;
CREATE TRIGGER trigger_update_reading_list_item_count
  AFTER INSERT OR DELETE ON reading_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_list_item_count();

-- Trigger to update user reading list count
CREATE OR REPLACE FUNCTION update_user_reading_list_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "user" SET reading_list_count = reading_list_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "user" SET reading_list_count = reading_list_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_reading_list_count ON reading_lists;
CREATE TRIGGER trigger_update_user_reading_list_count
  AFTER INSERT OR DELETE ON reading_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reading_list_count();

-- Trigger to update items read count when item is completed
CREATE OR REPLACE FUNCTION update_items_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      UPDATE "user" SET items_read_count = items_read_count + 1 WHERE id = NEW.user_id;
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      UPDATE "user" SET items_read_count = GREATEST(items_read_count - 1, 0) WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_items_read_count ON reading_list_items;
CREATE TRIGGER trigger_update_items_read_count
  AFTER UPDATE ON reading_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_items_read_count();

-- Trigger to update view history on duplicate
CREATE OR REPLACE FUNCTION upsert_view_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to update existing record
  UPDATE view_history
  SET view_count = view_count + 1,
      viewed_at = now()
  WHERE user_id = NEW.user_id
    AND resource_type = NEW.resource_type
    AND resource_id = NEW.resource_id;

  -- If no row was updated, allow the insert
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Return NULL to skip the insert
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_upsert_view_history ON view_history;
CREATE TRIGGER trigger_upsert_view_history
  BEFORE INSERT ON view_history
  FOR EACH ROW
  EXECUTE FUNCTION upsert_view_history();

-- Function to create default reading list for user
CREATE OR REPLACE FUNCTION create_default_reading_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reading_lists (user_id, name, slug, description)
  VALUES (NEW.id, 'Read Later', 'read-later', 'Your default reading list');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only add trigger if it doesn't exist (for new users)
DROP TRIGGER IF EXISTS trigger_create_default_reading_list ON "user";
CREATE TRIGGER trigger_create_default_reading_list
  AFTER INSERT ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION create_default_reading_list();

-- RLS Policies
ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_view_stats ENABLE ROW LEVEL SECURITY;

-- Reading lists: owner can do anything, others can view public lists
DROP POLICY IF EXISTS reading_lists_owner_policy ON reading_lists;
CREATE POLICY reading_lists_owner_policy ON reading_lists
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS reading_lists_public_view_policy ON reading_lists;
CREATE POLICY reading_lists_public_view_policy ON reading_lists
  FOR SELECT USING (is_public = true);

-- Reading list items: owner only
DROP POLICY IF EXISTS reading_list_items_owner_policy ON reading_list_items;
CREATE POLICY reading_list_items_owner_policy ON reading_list_items
  FOR ALL USING (user_id = auth.uid());

-- View history: owner only
DROP POLICY IF EXISTS view_history_owner_policy ON view_history;
CREATE POLICY view_history_owner_policy ON view_history
  FOR ALL USING (user_id = auth.uid());

-- Resource views: anyone can insert, owner can view their own
DROP POLICY IF EXISTS resource_views_insert_policy ON resource_views;
CREATE POLICY resource_views_insert_policy ON resource_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS resource_views_select_policy ON resource_views;
CREATE POLICY resource_views_select_policy ON resource_views
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Resource view stats: anyone can read
DROP POLICY IF EXISTS resource_view_stats_select_policy ON resource_view_stats;
CREATE POLICY resource_view_stats_select_policy ON resource_view_stats
  FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON reading_lists TO authenticated;
GRANT ALL ON reading_list_items TO authenticated;
GRANT ALL ON view_history TO authenticated;
GRANT INSERT, SELECT ON resource_views TO authenticated;
GRANT SELECT ON resource_view_stats TO authenticated;
GRANT INSERT ON resource_views TO anon;
GRANT SELECT ON resource_view_stats TO anon;

-- =====================================================
-- End of Migration
-- =====================================================
