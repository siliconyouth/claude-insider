-- Migration 091: Fix Resource Relationships
-- Creates missing resource_resource_relationships table and functions
-- Created: 2025-12-21

-- ============================================================================
-- RESOURCE-TO-RESOURCE RELATIONSHIPS TABLE
-- Using the name expected by the API: resource_resource_relationships
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_resource_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linked resources
  source_resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  target_resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'related'
    CHECK (relationship_type IN (
      'similar',        -- Similar purpose/functionality
      'alternative',    -- Drop-in replacement
      'complement',     -- Works well together
      'prerequisite',   -- Should use source before target
      'successor',      -- Target is newer version/evolution
      'uses',           -- Source uses target internally
      'integrates',     -- Source has integration with target
      'fork',           -- Source is forked from target
      'inspired_by',    -- Source was inspired by target
      'related'         -- General relationship
    )),

  -- AI Analysis
  confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.5
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_model VARCHAR(100),
  ai_reasoning TEXT,
  shared_tags TEXT[] DEFAULT '{}',
  similarity_factors JSONB DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Direction
  is_bidirectional BOOLEAN DEFAULT TRUE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_manual BOOLEAN DEFAULT FALSE,

  -- Display
  display_priority INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(source_resource_id, target_resource_id),
  CONSTRAINT no_self_relationship CHECK (source_resource_id != target_resource_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_res_res_rel_source
  ON resource_resource_relationships(source_resource_id);
CREATE INDEX IF NOT EXISTS idx_res_res_rel_target
  ON resource_resource_relationships(target_resource_id);
CREATE INDEX IF NOT EXISTS idx_res_res_rel_type
  ON resource_resource_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_res_res_rel_confidence
  ON resource_resource_relationships(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_res_res_rel_active
  ON resource_resource_relationships(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_res_res_rel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_res_res_rel_timestamp ON resource_resource_relationships;
CREATE TRIGGER trigger_res_res_rel_timestamp
  BEFORE UPDATE ON resource_resource_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_res_res_rel_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE resource_resource_relationships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public can view active resource-resource relationships' AND tablename = 'resource_resource_relationships') THEN
    CREATE POLICY "Public can view active resource-resource relationships"
      ON resource_resource_relationships FOR SELECT USING (is_active = TRUE);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'service_role_res_res_rel' AND tablename = 'resource_resource_relationships') THEN
    CREATE POLICY "service_role_res_res_rel"
      ON resource_resource_relationships FOR ALL USING (TRUE);
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Get Pending Analysis Jobs
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_analysis_jobs(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  job_type VARCHAR(50),
  target_type VARCHAR(50),
  target_id TEXT,
  created_at TIMESTAMPTZ,
  triggered_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.job_type,
    j.target_type,
    j.target_id,
    j.created_at,
    j.triggered_by
  FROM relationship_analysis_jobs j
  WHERE j.status = 'pending'
  ORDER BY j.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE get_relationship_stats TO INCLUDE RESOURCE-RESOURCE
-- ============================================================================

-- Drop the old function first (signature change)
DROP FUNCTION IF EXISTS get_relationship_stats();

CREATE OR REPLACE FUNCTION get_relationship_stats()
RETURNS TABLE (
  total_doc_resource_relationships BIGINT,
  docs_with_relationships BIGINT,
  resources_with_doc_relationships BIGINT,
  avg_doc_resource_confidence NUMERIC,
  total_resource_resource_relationships BIGINT,
  resources_with_resource_relationships BIGINT,
  avg_resource_resource_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM doc_resource_relationships WHERE is_active = TRUE) as total_doc_resource_relationships,
    (SELECT COUNT(DISTINCT doc_slug) FROM doc_resource_relationships WHERE is_active = TRUE) as docs_with_relationships,
    (SELECT COUNT(DISTINCT resource_id) FROM doc_resource_relationships WHERE is_active = TRUE) as resources_with_doc_relationships,
    (SELECT COALESCE(AVG(confidence_score), 0) FROM doc_resource_relationships WHERE is_active = TRUE) as avg_doc_resource_confidence,
    (SELECT COUNT(*) FROM resource_resource_relationships WHERE is_active = TRUE) as total_resource_resource_relationships,
    (SELECT COUNT(DISTINCT source_resource_id) FROM resource_resource_relationships WHERE is_active = TRUE) as resources_with_resource_relationships,
    (SELECT COALESCE(AVG(confidence_score), 0) FROM resource_resource_relationships WHERE is_active = TRUE) as avg_resource_resource_confidence;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Migration 091 complete: resource_resource_relationships table created';
END $$;
