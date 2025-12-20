-- ============================================================================
-- Migration 090: Resource Discovery Sources
-- ============================================================================
-- Creates tables for managing resource discovery sources including:
-- - Awesome lists (GitHub awesome-* repositories)
-- - GitHub repositories and searches
-- - Package registries (npm, PyPI)
-- - Websites, RSS feeds, and APIs
-- ============================================================================

-- Resource discovery sources configuration
CREATE TABLE IF NOT EXISTS resource_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'github_repo', 'github_search', 'awesome_list',
    'npm', 'pypi', 'website', 'rss', 'api', 'manual'
  )),
  url VARCHAR(500) NOT NULL,

  -- GitHub-specific configuration (JSON)
  github_config JSONB DEFAULT '{}'::JSONB,
  -- Expected structure:
  -- {
  --   "owner": "anthropics",
  --   "repo": "anthropic-cookbook",
  --   "branch": "main",
  --   "path": "README.md",
  --   "searchQuery": "claude ai tools",
  --   "topics": ["claude", "anthropic"]
  -- }

  -- Package registry configuration (JSON)
  registry_config JSONB DEFAULT '{}'::JSONB,
  -- Expected structure:
  -- {
  --   "searchQuery": "claude",
  --   "scope": "@anthropic-ai",
  --   "keywords": ["claude", "anthropic", "ai"]
  -- }

  -- Awesome list configuration (JSON)
  awesome_config JSONB DEFAULT '{}'::JSONB,
  -- Expected structure:
  -- {
  --   "sections": ["Tools", "Libraries", "Servers"],
  --   "excludeSections": ["Deprecated"]
  -- }

  -- Discovery settings
  default_category VARCHAR(50),
  default_subcategory VARCHAR(100),
  default_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  auto_approve BOOLEAN DEFAULT FALSE,
  min_stars INTEGER DEFAULT 0,
  min_downloads INTEGER DEFAULT 0,
  include_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  exclude_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Status and scheduling
  is_active BOOLEAN DEFAULT TRUE,
  scan_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (scan_frequency IN ('daily', 'weekly', 'monthly', 'manual')),
  last_scanned_at TIMESTAMPTZ,
  last_scan_status VARCHAR(20) DEFAULT 'never' CHECK (last_scan_status IN ('success', 'partial', 'failed', 'never')),
  last_scan_error TEXT,
  next_scan_at TIMESTAMPTZ,

  -- Statistics
  resource_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  last_discovered_count INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_resource_sources_type ON resource_sources(type);
CREATE INDEX IF NOT EXISTS idx_resource_sources_active ON resource_sources(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_resource_sources_next_scan ON resource_sources(next_scan_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_resource_sources_frequency ON resource_sources(scan_frequency);

-- Resource discovery queue (pending discoveries)
CREATE TABLE IF NOT EXISTS resource_discovery_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES resource_sources(id) ON DELETE CASCADE,

  -- Discovered resource data
  discovered_url VARCHAR(500) NOT NULL,
  discovered_title VARCHAR(255),
  discovered_description TEXT,
  discovered_data JSONB DEFAULT '{}'::JSONB,

  -- Processing status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'approved', 'rejected', 'duplicate', 'error'
  )),

  -- Review info
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,

  -- If approved, link to created resource
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,

  -- Metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for discovery queue
CREATE INDEX IF NOT EXISTS idx_discovery_queue_source ON resource_discovery_queue(source_id);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON resource_discovery_queue(status);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_pending ON resource_discovery_queue(status, discovered_at)
  WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS idx_discovery_queue_url ON resource_discovery_queue(discovered_url);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_resource_sources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resource_sources_updated_at ON resource_sources;
CREATE TRIGGER resource_sources_updated_at
  BEFORE UPDATE ON resource_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_sources_timestamp();

DROP TRIGGER IF EXISTS discovery_queue_updated_at ON resource_discovery_queue;
CREATE TRIGGER discovery_queue_updated_at
  BEFORE UPDATE ON resource_discovery_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_sources_timestamp();

-- Function to calculate next scan time
CREATE OR REPLACE FUNCTION calculate_next_scan(
  p_frequency VARCHAR,
  p_last_scan TIMESTAMPTZ DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TIMESTAMPTZ;
BEGIN
  v_base := COALESCE(p_last_scan, NOW());

  RETURN CASE p_frequency
    WHEN 'daily' THEN v_base + INTERVAL '1 day'
    WHEN 'weekly' THEN v_base + INTERVAL '1 week'
    WHEN 'monthly' THEN v_base + INTERVAL '1 month'
    ELSE NULL -- manual
  END;
END;
$$;

-- Function to mark source as scanned
CREATE OR REPLACE FUNCTION mark_source_scanned(
  p_source_id UUID,
  p_status VARCHAR,
  p_discovered_count INTEGER DEFAULT 0,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_frequency VARCHAR;
BEGIN
  SELECT scan_frequency INTO v_frequency FROM resource_sources WHERE id = p_source_id;

  UPDATE resource_sources
  SET
    last_scanned_at = NOW(),
    last_scan_status = p_status,
    last_scan_error = p_error,
    last_discovered_count = p_discovered_count,
    next_scan_at = calculate_next_scan(v_frequency, NOW())
  WHERE id = p_source_id;

  RETURN FOUND;
END;
$$;

-- Function to get sources due for scanning
CREATE OR REPLACE FUNCTION get_sources_due_for_scan()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  type VARCHAR,
  url VARCHAR,
  github_config JSONB,
  registry_config JSONB,
  awesome_config JSONB,
  default_category VARCHAR,
  default_tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.id,
    rs.name,
    rs.type,
    rs.url,
    rs.github_config,
    rs.registry_config,
    rs.awesome_config,
    rs.default_category,
    rs.default_tags
  FROM resource_sources rs
  WHERE rs.is_active = TRUE
    AND rs.scan_frequency != 'manual'
    AND (rs.next_scan_at IS NULL OR rs.next_scan_at <= NOW())
  ORDER BY rs.next_scan_at NULLS FIRST;
END;
$$;

-- RLS Policies
ALTER TABLE resource_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_discovery_queue ENABLE ROW LEVEL SECURITY;

-- Policies for resource_sources
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'resource_sources_select' AND tablename = 'resource_sources') THEN
    CREATE POLICY "resource_sources_select" ON resource_sources FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'resource_sources_insert' AND tablename = 'resource_sources') THEN
    CREATE POLICY "resource_sources_insert" ON resource_sources FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'resource_sources_update' AND tablename = 'resource_sources') THEN
    CREATE POLICY "resource_sources_update" ON resource_sources FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'resource_sources_delete' AND tablename = 'resource_sources') THEN
    CREATE POLICY "resource_sources_delete" ON resource_sources FOR DELETE USING (true);
  END IF;
END $$;

-- Policies for resource_discovery_queue
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'discovery_queue_select' AND tablename = 'resource_discovery_queue') THEN
    CREATE POLICY "discovery_queue_select" ON resource_discovery_queue FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'discovery_queue_insert' AND tablename = 'resource_discovery_queue') THEN
    CREATE POLICY "discovery_queue_insert" ON resource_discovery_queue FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'discovery_queue_update' AND tablename = 'resource_discovery_queue') THEN
    CREATE POLICY "discovery_queue_update" ON resource_discovery_queue FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'discovery_queue_delete' AND tablename = 'resource_discovery_queue') THEN
    CREATE POLICY "discovery_queue_delete" ON resource_discovery_queue FOR DELETE USING (true);
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON resource_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON resource_discovery_queue TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_scan TO authenticated;
GRANT EXECUTE ON FUNCTION mark_source_scanned TO authenticated;
GRANT EXECUTE ON FUNCTION get_sources_due_for_scan TO authenticated;

-- ============================================================================
-- End of Migration 090
-- ============================================================================
