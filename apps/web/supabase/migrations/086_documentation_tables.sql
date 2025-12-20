-- Migration 086: Documentation Tables
-- Stores MDX documentation in Supabase with full-text search and versioning
-- Created: 2025-12-20

-- ============================================================================
-- MAIN DOCUMENTATION TABLE
-- Stores MDX content with metadata for AI-powered updates
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentation (
  -- Primary Key - slug is the unique identifier (e.g., 'getting-started/installation')
  slug VARCHAR(255) PRIMARY KEY,

  -- Core Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,                    -- Raw MDX content (preserves formatting)

  -- Organization
  category VARCHAR(50) NOT NULL,            -- getting-started, configuration, api, etc.
  subcategory VARCHAR(100),                 -- Optional further grouping
  order_index INTEGER DEFAULT 0,            -- Sort order within category

  -- Source Attribution
  sources JSONB DEFAULT '[]',               -- [{title, url}] from ContentMeta
  source_urls TEXT[] DEFAULT '{}',          -- URLs for scraping/updates

  -- AI Metadata
  generated_date DATE,
  ai_model VARCHAR(100),
  ai_summary VARCHAR(500),                  -- AI-generated summary

  -- Content Stats (computed)
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  heading_count INTEGER DEFAULT 0,
  code_block_count INTEGER DEFAULT 0,

  -- Search
  search_vector TSVECTOR,                   -- Full-text search index

  -- Update Tracking
  content_hash VARCHAR(64),                 -- SHA-256 of content for change detection
  last_scraped_at TIMESTAMPTZ,
  scrape_status VARCHAR(50) DEFAULT 'pending'
    CHECK (scrape_status IN ('pending', 'scraping', 'success', 'error', 'stale')),

  -- Versioning
  version INTEGER DEFAULT 1,

  -- Visibility
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Navigation
  prev_slug VARCHAR(255),                   -- Previous doc in sequence
  next_slug VARCHAR(255),                   -- Next doc in sequence
  parent_slug VARCHAR(255),                 -- Parent doc (for hierarchy)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENTATION SECTIONS TABLE
-- Granular heading-level indexing for cross-linking and search
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentation_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_slug VARCHAR(255) NOT NULL REFERENCES documentation(slug) ON DELETE CASCADE,

  -- Heading Info
  heading_id VARCHAR(255) NOT NULL,         -- Anchor ID (e.g., 'installation-steps')
  heading_text VARCHAR(500) NOT NULL,       -- Display text
  heading_level INTEGER NOT NULL CHECK (heading_level BETWEEN 1 AND 6),

  -- Position
  order_index INTEGER NOT NULL,

  -- Content Preview
  content_preview TEXT,                     -- First ~200 chars after heading
  word_count INTEGER DEFAULT 0,

  -- Search
  search_vector TSVECTOR,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(doc_slug, heading_id)
);

-- ============================================================================
-- DOCUMENTATION HISTORY TABLE
-- Version control for all documentation changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_slug VARCHAR(255) NOT NULL REFERENCES documentation(slug) ON DELETE CASCADE,

  -- Version
  version INTEGER NOT NULL,

  -- Snapshot
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  sources JSONB,

  -- Change Info
  change_summary TEXT,                      -- What changed in this version
  change_type VARCHAR(50) NOT NULL
    CHECK (change_type IN ('create', 'update', 'scrape_update', 'manual_edit', 'ai_rewrite', 'rollback')),

  -- Who Made the Change
  changed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- AI Info (if applicable)
  ai_model VARCHAR(100),
  ai_confidence DECIMAL(3,2),               -- 0.00 to 1.00

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(doc_slug, version)
);

-- ============================================================================
-- DOCUMENTATION UPDATE JOBS TABLE
-- Tracks AI-powered documentation rewrite jobs (mirrors resource_update_jobs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentation_update_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_slug VARCHAR(255) NOT NULL REFERENCES documentation(slug) ON DELETE CASCADE,

  -- Job Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Job created, waiting to start
    'scraping',          -- Scraping source URLs
    'analyzing',         -- Claude analyzing content
    'ready_for_review',  -- Analysis complete, awaiting admin review
    'approved',          -- Admin approved, applying changes
    'rejected',          -- Admin rejected
    'applied',           -- Changes applied successfully
    'failed'             -- Job failed with error
  )),

  -- Trigger Info
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'cron', 'webhook')),
  triggered_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- Scraped Content
  scraped_content JSONB,                    -- Array of { url, markdown, metadata, scrapedAt }
  scraped_at TIMESTAMPTZ,
  scrape_errors JSONB,                      -- Array of { url, error }

  -- AI Analysis
  current_content TEXT,                     -- Snapshot of content before update
  proposed_content TEXT,                    -- New MDX content from AI
  proposed_title VARCHAR(255),
  proposed_description TEXT,
  proposed_sources JSONB,

  ai_summary TEXT,                          -- Summary of changes
  ai_model TEXT DEFAULT 'claude-opus-4-5-20251101',
  ai_confidence DECIMAL(3,2),               -- 0.00 to 1.00
  ai_warnings TEXT[],                       -- Any warnings from AI
  key_changes TEXT[],                       -- Array of main changes made
  analyzed_at TIMESTAMPTZ,

  -- Diff (computed)
  content_diff TEXT,                        -- Unified diff format

  -- Review
  reviewed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Error Handling
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Documentation indexes
CREATE INDEX IF NOT EXISTS idx_documentation_category ON documentation(category);
CREATE INDEX IF NOT EXISTS idx_documentation_is_published ON documentation(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_documentation_is_featured ON documentation(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_documentation_order ON documentation(category, order_index);
CREATE INDEX IF NOT EXISTS idx_documentation_parent ON documentation(parent_slug) WHERE parent_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documentation_updated ON documentation(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documentation_search ON documentation USING GIN (search_vector);

-- Sections indexes
CREATE INDEX IF NOT EXISTS idx_doc_sections_doc ON documentation_sections(doc_slug);
CREATE INDEX IF NOT EXISTS idx_doc_sections_level ON documentation_sections(heading_level);
CREATE INDEX IF NOT EXISTS idx_doc_sections_order ON documentation_sections(doc_slug, order_index);
CREATE INDEX IF NOT EXISTS idx_doc_sections_search ON documentation_sections USING GIN (search_vector);

-- History indexes
CREATE INDEX IF NOT EXISTS idx_doc_history_slug ON documentation_history(doc_slug);
CREATE INDEX IF NOT EXISTS idx_doc_history_version ON documentation_history(doc_slug, version DESC);
CREATE INDEX IF NOT EXISTS idx_doc_history_type ON documentation_history(change_type);
CREATE INDEX IF NOT EXISTS idx_doc_history_created ON documentation_history(created_at DESC);

-- Update jobs indexes
CREATE INDEX IF NOT EXISTS idx_doc_update_jobs_slug ON documentation_update_jobs(doc_slug);
CREATE INDEX IF NOT EXISTS idx_doc_update_jobs_status ON documentation_update_jobs(status);
CREATE INDEX IF NOT EXISTS idx_doc_update_jobs_pending ON documentation_update_jobs(status)
  WHERE status IN ('pending', 'ready_for_review');
CREATE INDEX IF NOT EXISTS idx_doc_update_jobs_created ON documentation_update_jobs(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update search vector on documentation
CREATE OR REPLACE FUNCTION update_doc_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.content, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doc_search_vector ON documentation;
CREATE TRIGGER trigger_doc_search_vector
  BEFORE INSERT OR UPDATE OF title, description, content ON documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_doc_search_vector();

-- Auto-update search vector on sections
CREATE OR REPLACE FUNCTION update_doc_section_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.heading_text, '') || ' ' ||
    coalesce(NEW.content_preview, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doc_section_search_vector ON documentation_sections;
CREATE TRIGGER trigger_doc_section_search_vector
  BEFORE INSERT OR UPDATE OF heading_text, content_preview ON documentation_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_doc_section_search_vector();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documentation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_documentation_timestamp ON documentation;
CREATE TRIGGER trigger_documentation_timestamp
  BEFORE UPDATE ON documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_documentation_timestamp();

-- Compute content stats on insert/update
CREATE OR REPLACE FUNCTION compute_doc_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Word count (approximate)
  NEW.word_count := array_length(regexp_split_to_array(NEW.content, '\s+'), 1);

  -- Reading time (assuming 200 words per minute)
  NEW.reading_time_minutes := GREATEST(1, CEIL(NEW.word_count::numeric / 200));

  -- Heading count (matches ## style headings)
  NEW.heading_count := (
    SELECT count(*)
    FROM regexp_matches(NEW.content, '^#{1,6}\s', 'gm')
  );

  -- Code block count
  NEW.code_block_count := (
    SELECT count(*)
    FROM regexp_matches(NEW.content, '```', 'g')
  ) / 2;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compute_doc_stats ON documentation;
CREATE TRIGGER trigger_compute_doc_stats
  BEFORE INSERT OR UPDATE OF content ON documentation
  FOR EACH ROW
  EXECUTE FUNCTION compute_doc_stats();

-- Auto-increment version and create history on update
CREATE OR REPLACE FUNCTION auto_version_documentation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.version := OLD.version + 1;

    -- Insert history record
    INSERT INTO documentation_history (
      doc_slug, version, title, description, content, sources,
      change_type, changed_by
    ) VALUES (
      OLD.slug, OLD.version, OLD.title, OLD.description, OLD.content, OLD.sources,
      'update', NULL -- changed_by set via application
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_version_doc ON documentation;
CREATE TRIGGER trigger_auto_version_doc
  BEFORE UPDATE ON documentation
  FOR EACH ROW
  EXECUTE FUNCTION auto_version_documentation();

-- Auto-update update_jobs timestamp
CREATE OR REPLACE FUNCTION update_doc_update_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doc_update_jobs_timestamp ON documentation_update_jobs;
CREATE TRIGGER trigger_doc_update_jobs_timestamp
  BEFORE UPDATE ON documentation_update_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_doc_update_jobs_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_update_jobs ENABLE ROW LEVEL SECURITY;

-- Public read for published docs
CREATE POLICY "Public can view published documentation"
  ON documentation FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Public can view documentation sections"
  ON documentation_sections FOR SELECT
  USING (TRUE);

-- Service role full access (app uses service_role key)
CREATE POLICY "service_role_documentation" ON documentation
  FOR ALL USING (TRUE);

CREATE POLICY "service_role_doc_sections" ON documentation_sections
  FOR ALL USING (TRUE);

CREATE POLICY "service_role_doc_history" ON documentation_history
  FOR ALL USING (TRUE);

CREATE POLICY "service_role_doc_update_jobs" ON documentation_update_jobs
  FOR ALL USING (TRUE);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get documentation with sections
CREATE OR REPLACE FUNCTION get_doc_with_sections(p_slug VARCHAR(255))
RETURNS TABLE (
  slug VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  content TEXT,
  category VARCHAR(50),
  sources JSONB,
  reading_time_minutes INTEGER,
  sections JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.slug,
    d.title,
    d.description,
    d.content,
    d.category,
    d.sources,
    d.reading_time_minutes,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', s.heading_id,
          'text', s.heading_text,
          'level', s.heading_level
        ) ORDER BY s.order_index
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) as sections
  FROM documentation d
  LEFT JOIN documentation_sections s ON s.doc_slug = d.slug
  WHERE d.slug = p_slug AND d.is_published = TRUE
  GROUP BY d.slug, d.title, d.description, d.content, d.category, d.sources, d.reading_time_minutes;
END;
$$ LANGUAGE plpgsql;

-- Search documentation
CREATE OR REPLACE FUNCTION search_documentation(
  p_query TEXT,
  p_category VARCHAR(50) DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  slug VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  headline TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.slug,
    d.title,
    d.description,
    d.category,
    ts_headline('english', d.content, plainto_tsquery('english', p_query),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as headline,
    ts_rank(d.search_vector, plainto_tsquery('english', p_query)) as rank
  FROM documentation d
  WHERE d.is_published = TRUE
    AND d.search_vector @@ plainto_tsquery('english', p_query)
    AND (p_category IS NULL OR d.category = p_category)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get documentation table of contents for a category
CREATE OR REPLACE FUNCTION get_category_toc(p_category VARCHAR(50))
RETURNS TABLE (
  slug VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  order_index INTEGER,
  heading_count INTEGER,
  reading_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.slug,
    d.title,
    d.description,
    d.order_index,
    d.heading_count,
    d.reading_time_minutes
  FROM documentation d
  WHERE d.category = p_category AND d.is_published = TRUE
  ORDER BY d.order_index;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE documentation IS 'Stores MDX documentation content with full-text search and versioning';
COMMENT ON TABLE documentation_sections IS 'Heading-level indexing for granular search and cross-linking';
COMMENT ON TABLE documentation_history IS 'Version history for all documentation changes';
COMMENT ON TABLE documentation_update_jobs IS 'Tracks AI-powered documentation rewrite jobs';

COMMENT ON COLUMN documentation.content IS 'Raw MDX content preserving all formatting';
COMMENT ON COLUMN documentation.sources IS 'JSON array of source attributions: [{title, url}]';
COMMENT ON COLUMN documentation.content_hash IS 'SHA-256 hash of content for change detection';
COMMENT ON COLUMN documentation_update_jobs.proposed_content IS 'New MDX content proposed by AI rewrite';
