-- Migration 087: Documentation and Resource Relationship Tables
-- AI-analyzed relationships between docs and resources with confidence scores
-- Created: 2025-12-20

-- ============================================================================
-- DOC-TO-RESOURCE RELATIONSHIPS
-- Links documentation pages to relevant resources (AI-analyzed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS doc_resource_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linked entities
  doc_slug VARCHAR(255) NOT NULL REFERENCES documentation(slug) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Relationship metadata
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'related'
    CHECK (relationship_type IN (
      'related',        -- General relevance
      'mentioned',      -- Explicitly mentioned in doc
      'example',        -- Resource is used as an example
      'required',       -- Resource is required for this doc
      'recommended',    -- Resource is recommended
      'alternative',    -- Alternative to something in doc
      'extends',        -- Resource extends concepts in doc
      'implements'      -- Resource implements what doc describes
    )),

  -- AI Analysis
  confidence_score DECIMAL(4,3) NOT NULL    -- 0.000 to 1.000
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_model VARCHAR(100),
  ai_reasoning TEXT,                        -- Why AI linked these
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  context_snippet TEXT,                     -- Relevant text from doc
  doc_section VARCHAR(255),                 -- Which section links to resource

  -- Overrides
  is_manual BOOLEAN DEFAULT FALSE,          -- Manually set by admin
  is_active BOOLEAN DEFAULT TRUE,           -- Can be soft-deleted

  -- Display
  display_priority INTEGER DEFAULT 0,       -- For ordering in UI

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(doc_slug, resource_id)
);

-- ============================================================================
-- RESOURCE-TO-RESOURCE RELATIONSHIPS
-- Links related resources to each other (AI-discovered)
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linked resources
  source_resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  target_resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type VARCHAR(50) NOT NULL
    CHECK (relationship_type IN (
      'similar',        -- Similar purpose/functionality
      'alternative',    -- Drop-in replacement
      'complement',     -- Works well together
      'prerequisite',   -- Should use source before target
      'successor',      -- Target is newer version/evolution
      'uses',           -- Source uses target internally
      'integrates',     -- Source has integration with target
      'fork',           -- Source is forked from target
      'inspired_by'     -- Source was inspired by target
    )),

  -- AI Analysis
  confidence_score DECIMAL(4,3) NOT NULL
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_model VARCHAR(100),
  ai_reasoning TEXT,                        -- Explanation of relationship
  shared_tags TEXT[],                       -- Tags both resources have
  similarity_factors JSONB,                 -- { category, tags, description, audience }
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Direction
  is_bidirectional BOOLEAN DEFAULT TRUE,    -- If false, only source→target

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
-- RELATIONSHIP ANALYSIS JOBS
-- Tracks AI analysis jobs for discovering relationships
-- ============================================================================

CREATE TABLE IF NOT EXISTS relationship_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job type
  job_type VARCHAR(50) NOT NULL
    CHECK (job_type IN (
      'doc_to_resources',       -- Find resources for a doc
      'resource_to_docs',       -- Find docs for a resource
      'resource_to_resources',  -- Find related resources
      'batch_resources',        -- Analyze all resources
      'batch_docs',             -- Analyze all docs
      'full_reindex'            -- Complete relationship rebuild
    )),

  -- Target
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('doc', 'resource', 'all')),
  target_id TEXT NOT NULL,                  -- slug or uuid or 'all'

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'analyzing',
      'completed',
      'failed',
      'cancelled'
    )),

  -- Progress
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER DEFAULT 0,

  -- Results
  discovered_relationships JSONB DEFAULT '[]',  -- Array of relationship objects
  relationships_created INTEGER DEFAULT 0,
  relationships_updated INTEGER DEFAULT 0,
  relationships_skipped INTEGER DEFAULT 0,

  -- AI Info
  ai_model VARCHAR(100) DEFAULT 'claude-opus-4-5-20251101',
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10, 4),

  -- Error Handling
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  triggered_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'cron', 'webhook')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Doc-resource relationships
CREATE INDEX IF NOT EXISTS idx_doc_resource_rel_doc ON doc_resource_relationships(doc_slug);
CREATE INDEX IF NOT EXISTS idx_doc_resource_rel_resource ON doc_resource_relationships(resource_id);
CREATE INDEX IF NOT EXISTS idx_doc_resource_rel_type ON doc_resource_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_doc_resource_rel_confidence ON doc_resource_relationships(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_doc_resource_rel_active ON doc_resource_relationships(is_active)
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_doc_resource_rel_priority ON doc_resource_relationships(doc_slug, display_priority DESC)
  WHERE is_active = TRUE;

-- Resource relationships
CREATE INDEX IF NOT EXISTS idx_resource_rel_source ON resource_relationships(source_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_rel_target ON resource_relationships(target_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_rel_type ON resource_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_resource_rel_confidence ON resource_relationships(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_resource_rel_active ON resource_relationships(is_active)
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_resource_rel_bidirectional ON resource_relationships(source_resource_id, target_resource_id)
  WHERE is_bidirectional = TRUE AND is_active = TRUE;

-- Analysis jobs
CREATE INDEX IF NOT EXISTS idx_rel_jobs_status ON relationship_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rel_jobs_pending ON relationship_analysis_jobs(status, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_rel_jobs_target ON relationship_analysis_jobs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_rel_jobs_created ON relationship_analysis_jobs(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_doc_resource_rel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doc_resource_rel_timestamp ON doc_resource_relationships;
CREATE TRIGGER trigger_doc_resource_rel_timestamp
  BEFORE UPDATE ON doc_resource_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_doc_resource_rel_timestamp();

CREATE OR REPLACE FUNCTION update_resource_rel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_rel_timestamp ON resource_relationships;
CREATE TRIGGER trigger_resource_rel_timestamp
  BEFORE UPDATE ON resource_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_rel_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE doc_resource_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Relationship policies (defensive creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public can view active doc-resource relationships' AND tablename = 'doc_resource_relationships') THEN
    CREATE POLICY "Public can view active doc-resource relationships" ON doc_resource_relationships FOR SELECT USING (is_active = TRUE);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public can view active resource relationships' AND tablename = 'resource_relationships') THEN
    CREATE POLICY "Public can view active resource relationships" ON resource_relationships FOR SELECT USING (is_active = TRUE);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'service_role_doc_resource_rel' AND tablename = 'doc_resource_relationships') THEN
    CREATE POLICY "service_role_doc_resource_rel" ON doc_resource_relationships FOR ALL USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'service_role_resource_rel' AND tablename = 'resource_relationships') THEN
    CREATE POLICY "service_role_resource_rel" ON resource_relationships FOR ALL USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'service_role_rel_jobs' AND tablename = 'relationship_analysis_jobs') THEN
    CREATE POLICY "service_role_rel_jobs" ON relationship_analysis_jobs FOR ALL USING (TRUE);
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get related resources for a documentation page
CREATE OR REPLACE FUNCTION get_doc_related_resources(
  p_doc_slug VARCHAR(255),
  p_min_confidence DECIMAL DEFAULT 0.5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  resource_id UUID,
  resource_slug VARCHAR(255),
  resource_title VARCHAR(255),
  resource_description TEXT,
  resource_category VARCHAR(50),
  relationship_type VARCHAR(50),
  confidence_score DECIMAL(4,3),
  ai_reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as resource_id,
    r.slug as resource_slug,
    r.title as resource_title,
    r.description as resource_description,
    r.category as resource_category,
    rel.relationship_type,
    rel.confidence_score,
    rel.ai_reasoning
  FROM doc_resource_relationships rel
  JOIN resources r ON r.id = rel.resource_id
  WHERE rel.doc_slug = p_doc_slug
    AND rel.is_active = TRUE
    AND rel.confidence_score >= p_min_confidence
    AND r.is_published = TRUE
  ORDER BY rel.display_priority DESC, rel.confidence_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get related documentation for a resource
CREATE OR REPLACE FUNCTION get_resource_related_docs(
  p_resource_id UUID,
  p_min_confidence DECIMAL DEFAULT 0.5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  doc_slug VARCHAR(255),
  doc_title VARCHAR(255),
  doc_description TEXT,
  doc_category VARCHAR(50),
  relationship_type VARCHAR(50),
  confidence_score DECIMAL(4,3),
  ai_reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.slug as doc_slug,
    d.title as doc_title,
    d.description as doc_description,
    d.category as doc_category,
    rel.relationship_type,
    rel.confidence_score,
    rel.ai_reasoning
  FROM doc_resource_relationships rel
  JOIN documentation d ON d.slug = rel.doc_slug
  WHERE rel.resource_id = p_resource_id
    AND rel.is_active = TRUE
    AND rel.confidence_score >= p_min_confidence
    AND d.is_published = TRUE
  ORDER BY rel.display_priority DESC, rel.confidence_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get related resources for a resource (considers bidirectional relationships)
CREATE OR REPLACE FUNCTION get_related_resources(
  p_resource_id UUID,
  p_min_confidence DECIMAL DEFAULT 0.5,
  p_relationship_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  resource_id UUID,
  resource_slug VARCHAR(255),
  resource_title VARCHAR(255),
  resource_description TEXT,
  resource_category VARCHAR(50),
  relationship_type VARCHAR(50),
  confidence_score DECIMAL(4,3),
  ai_reasoning TEXT,
  direction TEXT  -- 'outgoing', 'incoming', 'bidirectional'
) AS $$
BEGIN
  RETURN QUERY
  -- Outgoing relationships (source → target)
  SELECT
    r.id as resource_id,
    r.slug as resource_slug,
    r.title as resource_title,
    r.description as resource_description,
    r.category as resource_category,
    rel.relationship_type,
    rel.confidence_score,
    rel.ai_reasoning,
    CASE WHEN rel.is_bidirectional THEN 'bidirectional' ELSE 'outgoing' END as direction
  FROM resource_relationships rel
  JOIN resources r ON r.id = rel.target_resource_id
  WHERE rel.source_resource_id = p_resource_id
    AND rel.is_active = TRUE
    AND rel.confidence_score >= p_min_confidence
    AND r.is_published = TRUE
    AND (p_relationship_types IS NULL OR rel.relationship_type = ANY(p_relationship_types))

  UNION

  -- Incoming bidirectional relationships (target → source, only if bidirectional)
  SELECT
    r.id as resource_id,
    r.slug as resource_slug,
    r.title as resource_title,
    r.description as resource_description,
    r.category as resource_category,
    rel.relationship_type,
    rel.confidence_score,
    rel.ai_reasoning,
    'incoming' as direction
  FROM resource_relationships rel
  JOIN resources r ON r.id = rel.source_resource_id
  WHERE rel.target_resource_id = p_resource_id
    AND rel.is_bidirectional = TRUE
    AND rel.is_active = TRUE
    AND rel.confidence_score >= p_min_confidence
    AND r.is_published = TRUE
    AND (p_relationship_types IS NULL OR rel.relationship_type = ANY(p_relationship_types))

  ORDER BY confidence_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get relationship statistics
CREATE OR REPLACE FUNCTION get_relationship_stats()
RETURNS TABLE (
  total_doc_resource_relationships BIGINT,
  total_resource_relationships BIGINT,
  avg_doc_resource_confidence DECIMAL(4,3),
  avg_resource_confidence DECIMAL(4,3),
  docs_with_relationships BIGINT,
  resources_with_doc_relationships BIGINT,
  resources_with_resource_relationships BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM doc_resource_relationships WHERE is_active = TRUE),
    (SELECT count(*) FROM resource_relationships WHERE is_active = TRUE),
    (SELECT COALESCE(avg(confidence_score), 0) FROM doc_resource_relationships WHERE is_active = TRUE),
    (SELECT COALESCE(avg(confidence_score), 0) FROM resource_relationships WHERE is_active = TRUE),
    (SELECT count(DISTINCT doc_slug) FROM doc_resource_relationships WHERE is_active = TRUE),
    (SELECT count(DISTINCT resource_id) FROM doc_resource_relationships WHERE is_active = TRUE),
    (SELECT count(DISTINCT source_resource_id) FROM resource_relationships WHERE is_active = TRUE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE doc_resource_relationships IS 'AI-analyzed links between documentation pages and resources';
COMMENT ON TABLE resource_relationships IS 'AI-discovered relationships between resources';
COMMENT ON TABLE relationship_analysis_jobs IS 'Tracks batch jobs for AI relationship analysis';

COMMENT ON COLUMN doc_resource_relationships.confidence_score IS 'AI confidence in the relationship (0.000 to 1.000)';
COMMENT ON COLUMN doc_resource_relationships.ai_reasoning IS 'Explanation of why AI linked these entities';
COMMENT ON COLUMN resource_relationships.is_bidirectional IS 'If true, relationship applies in both directions';
COMMENT ON COLUMN resource_relationships.similarity_factors IS 'JSON object with similarity breakdown by category, tags, etc.';
