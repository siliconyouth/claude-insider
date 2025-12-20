-- Migration 088: Resource Enhancements for AI Analysis
-- Adds AI-generated content fields and relationship denormalization
-- Created: 2025-12-20

-- ============================================================================
-- ADD AI-GENERATED CONTENT COLUMNS
-- ============================================================================

DO $$
BEGIN
  -- AI-generated overview (longer than description, MDX formatted)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'ai_overview'
  ) THEN
    ALTER TABLE resources ADD COLUMN ai_overview TEXT;
  END IF;

  -- AI-generated short summary (for cards, max 150 chars)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE resources ADD COLUMN ai_summary VARCHAR(500);
  END IF;

  -- When AI last analyzed this resource
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'ai_analyzed_at'
  ) THEN
    ALTER TABLE resources ADD COLUMN ai_analyzed_at TIMESTAMPTZ;
  END IF;

  -- AI analysis confidence score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'ai_confidence'
  ) THEN
    ALTER TABLE resources ADD COLUMN ai_confidence DECIMAL(3,2);
  END IF;

  -- Key features list (AI-extracted)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'key_features'
  ) THEN
    ALTER TABLE resources ADD COLUMN key_features TEXT[] DEFAULT '{}';
  END IF;

  -- Use cases (AI-identified)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'use_cases'
  ) THEN
    ALTER TABLE resources ADD COLUMN use_cases TEXT[] DEFAULT '{}';
  END IF;

  -- Pros (AI-analyzed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'pros'
  ) THEN
    ALTER TABLE resources ADD COLUMN pros TEXT[] DEFAULT '{}';
  END IF;

  -- Cons (AI-analyzed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'cons'
  ) THEN
    ALTER TABLE resources ADD COLUMN cons TEXT[] DEFAULT '{}';
  END IF;

  -- Target audience (AI-identified)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE resources ADD COLUMN target_audience TEXT[] DEFAULT '{}';
  END IF;

  -- Prerequisites (AI-identified)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'prerequisites'
  ) THEN
    ALTER TABLE resources ADD COLUMN prerequisites TEXT[] DEFAULT '{}';
  END IF;

END $$;

-- ============================================================================
-- ADD RELATIONSHIP DENORMALIZATION COLUMNS
-- ============================================================================

DO $$
BEGIN
  -- Count of related documentation pages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'related_docs_count'
  ) THEN
    ALTER TABLE resources ADD COLUMN related_docs_count INTEGER DEFAULT 0;
  END IF;

  -- Count of related resources
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'related_resources_count'
  ) THEN
    ALTER TABLE resources ADD COLUMN related_resources_count INTEGER DEFAULT 0;
  END IF;

  -- Array of related doc slugs (for quick lookup)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'related_doc_slugs'
  ) THEN
    ALTER TABLE resources ADD COLUMN related_doc_slugs TEXT[] DEFAULT '{}';
  END IF;

  -- Array of related resource slugs (for quick lookup)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'related_resource_slugs'
  ) THEN
    ALTER TABLE resources ADD COLUMN related_resource_slugs TEXT[] DEFAULT '{}';
  END IF;

END $$;

-- ============================================================================
-- ADD SCREENSHOT METADATA
-- ============================================================================

DO $$
BEGIN
  -- Screenshot metadata with dimensions, alt text, etc.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'screenshot_metadata'
  ) THEN
    ALTER TABLE resources ADD COLUMN screenshot_metadata JSONB DEFAULT '[]';
    -- Format: [{ url, width, height, alt, caption, order }]
  END IF;

  -- Primary screenshot URL (first/featured screenshot)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'primary_screenshot_url'
  ) THEN
    ALTER TABLE resources ADD COLUMN primary_screenshot_url VARCHAR(500);
  END IF;

  -- Thumbnail URL (smaller version for cards)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE resources ADD COLUMN thumbnail_url VARCHAR(500);
  END IF;

END $$;

-- ============================================================================
-- ADD TRENDING/POPULARITY COLUMNS
-- ============================================================================

DO $$
BEGIN
  -- Weekly views for trending calculation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'views_this_week'
  ) THEN
    ALTER TABLE resources ADD COLUMN views_this_week INTEGER DEFAULT 0;
  END IF;

  -- Trending score (computed from recent activity)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'trending_score'
  ) THEN
    ALTER TABLE resources ADD COLUMN trending_score DECIMAL(10, 4) DEFAULT 0;
  END IF;

  -- When trending was last calculated
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'trending_calculated_at'
  ) THEN
    ALTER TABLE resources ADD COLUMN trending_calculated_at TIMESTAMPTZ;
  END IF;

END $$;

-- ============================================================================
-- INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_resources_ai_analyzed
  ON resources(ai_analyzed_at DESC) WHERE ai_analyzed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resources_ai_confidence
  ON resources(ai_confidence DESC) WHERE ai_confidence IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resources_related_docs_count
  ON resources(related_docs_count DESC) WHERE related_docs_count > 0;

CREATE INDEX IF NOT EXISTS idx_resources_related_resources_count
  ON resources(related_resources_count DESC) WHERE related_resources_count > 0;

CREATE INDEX IF NOT EXISTS idx_resources_trending_score
  ON resources(trending_score DESC) WHERE trending_score > 0;

CREATE INDEX IF NOT EXISTS idx_resources_views_week
  ON resources(views_this_week DESC) WHERE views_this_week > 0;

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_resources_key_features
  ON resources USING GIN (key_features);

CREATE INDEX IF NOT EXISTS idx_resources_use_cases
  ON resources USING GIN (use_cases);

CREATE INDEX IF NOT EXISTS idx_resources_target_audience
  ON resources USING GIN (target_audience);

CREATE INDEX IF NOT EXISTS idx_resources_related_doc_slugs
  ON resources USING GIN (related_doc_slugs);

CREATE INDEX IF NOT EXISTS idx_resources_related_resource_slugs
  ON resources USING GIN (related_resource_slugs);

-- ============================================================================
-- TRIGGERS FOR RELATIONSHIP COUNT DENORMALIZATION
-- ============================================================================

-- Update resource's related_docs_count when doc_resource_relationships changes
CREATE OR REPLACE FUNCTION update_resource_related_docs_count()
RETURNS TRIGGER AS $$
DECLARE
  affected_resource_id UUID;
BEGIN
  -- Determine which resource was affected
  IF TG_OP = 'DELETE' THEN
    affected_resource_id := OLD.resource_id;
  ELSE
    affected_resource_id := NEW.resource_id;
  END IF;

  -- Update the count
  UPDATE resources
  SET related_docs_count = (
    SELECT count(*)
    FROM doc_resource_relationships
    WHERE resource_id = affected_resource_id AND is_active = TRUE
  ),
  related_doc_slugs = (
    SELECT COALESCE(array_agg(doc_slug), '{}')
    FROM doc_resource_relationships
    WHERE resource_id = affected_resource_id AND is_active = TRUE
  )
  WHERE id = affected_resource_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_resource_docs_count ON doc_resource_relationships;
CREATE TRIGGER trigger_update_resource_docs_count
  AFTER INSERT OR UPDATE OR DELETE ON doc_resource_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_related_docs_count();

-- Update resource's related_resources_count when resource_relationships changes
CREATE OR REPLACE FUNCTION update_resource_related_count()
RETURNS TRIGGER AS $$
DECLARE
  affected_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Collect all affected resource IDs
  IF TG_OP = 'DELETE' THEN
    affected_ids := ARRAY[OLD.source_resource_id];
    IF OLD.is_bidirectional THEN
      affected_ids := array_append(affected_ids, OLD.target_resource_id);
    END IF;
  ELSE
    affected_ids := ARRAY[NEW.source_resource_id];
    IF NEW.is_bidirectional THEN
      affected_ids := array_append(affected_ids, NEW.target_resource_id);
    END IF;
    -- Also handle old values on UPDATE if IDs changed
    IF TG_OP = 'UPDATE' THEN
      IF OLD.source_resource_id != NEW.source_resource_id THEN
        affected_ids := array_append(affected_ids, OLD.source_resource_id);
      END IF;
      IF OLD.target_resource_id != NEW.target_resource_id AND OLD.is_bidirectional THEN
        affected_ids := array_append(affected_ids, OLD.target_resource_id);
      END IF;
    END IF;
  END IF;

  -- Update counts for each affected resource
  UPDATE resources r
  SET related_resources_count = (
    SELECT count(DISTINCT
      CASE
        WHEN rel.source_resource_id = r.id THEN rel.target_resource_id
        ELSE rel.source_resource_id
      END
    )
    FROM resource_relationships rel
    WHERE (rel.source_resource_id = r.id OR (rel.target_resource_id = r.id AND rel.is_bidirectional))
      AND rel.is_active = TRUE
  ),
  related_resource_slugs = (
    SELECT COALESCE(array_agg(DISTINCT other.slug), '{}')
    FROM resource_relationships rel
    JOIN resources other ON other.id = CASE
      WHEN rel.source_resource_id = r.id THEN rel.target_resource_id
      ELSE rel.source_resource_id
    END
    WHERE (rel.source_resource_id = r.id OR (rel.target_resource_id = r.id AND rel.is_bidirectional))
      AND rel.is_active = TRUE
  )
  WHERE r.id = ANY(affected_ids);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_resource_rel_count ON resource_relationships;
CREATE TRIGGER trigger_update_resource_rel_count
  AFTER INSERT OR UPDATE OR DELETE ON resource_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_related_count();

-- ============================================================================
-- TRENDING SCORE CALCULATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_views_week INTEGER,
  p_views_total INTEGER,
  p_favorites INTEGER,
  p_ratings_count INTEGER,
  p_average_rating DECIMAL,
  p_github_stars INTEGER,
  p_added_at TIMESTAMPTZ
)
RETURNS DECIMAL AS $$
DECLARE
  recency_factor DECIMAL;
  engagement_score DECIMAL;
  quality_score DECIMAL;
  popularity_score DECIMAL;
BEGIN
  -- Recency: boost for newer resources (decays over 30 days)
  recency_factor := GREATEST(0, 1 - (EXTRACT(EPOCH FROM (NOW() - p_added_at)) / (30 * 24 * 60 * 60)));

  -- Engagement: recent activity weight
  engagement_score := (p_views_week * 10 + p_favorites * 50 + p_ratings_count * 30) / 1000.0;

  -- Quality: rating-based
  quality_score := CASE
    WHEN p_ratings_count >= 3 THEN p_average_rating / 5.0
    ELSE 0.5
  END;

  -- Popularity: GitHub stars (log scale to prevent dominance)
  popularity_score := CASE
    WHEN p_github_stars > 0 THEN LN(p_github_stars + 1) / 15.0
    ELSE 0
  END;

  -- Combined score with weights
  RETURN (
    (engagement_score * 0.4) +
    (quality_score * 0.25) +
    (popularity_score * 0.2) +
    (recency_factor * 0.15)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- REFRESH TRENDING SCORES (call from cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_trending_scores()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE resources
  SET
    trending_score = calculate_trending_score(
      views_this_week,
      views_count,
      favorites_count,
      ratings_count,
      average_rating,
      github_stars,
      added_at
    ),
    trending_calculated_at = NOW()
  WHERE is_published = TRUE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get enhanced resource with all relationships
CREATE OR REPLACE FUNCTION get_enhanced_resource(p_slug VARCHAR(255))
RETURNS TABLE (
  resource JSONB,
  related_docs JSONB,
  related_resources JSONB,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(r.*) as resource,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slug', d.slug,
        'title', d.title,
        'category', d.category,
        'relationship_type', rel.relationship_type,
        'confidence', rel.confidence_score
      ))
      FROM doc_resource_relationships rel
      JOIN documentation d ON d.slug = rel.doc_slug
      WHERE rel.resource_id = r.id AND rel.is_active = TRUE AND d.is_published = TRUE
      ORDER BY rel.confidence_score DESC
      LIMIT 5
    ), '[]'::jsonb) as related_docs,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slug', other.slug,
        'title', other.title,
        'category', other.category,
        'relationship_type', rel.relationship_type,
        'confidence', rel.confidence_score
      ))
      FROM resource_relationships rel
      JOIN resources other ON other.id = CASE
        WHEN rel.source_resource_id = r.id THEN rel.target_resource_id
        ELSE rel.source_resource_id
      END
      WHERE (rel.source_resource_id = r.id OR (rel.target_resource_id = r.id AND rel.is_bidirectional))
        AND rel.is_active = TRUE
        AND other.is_published = TRUE
      ORDER BY rel.confidence_score DESC
      LIMIT 6
    ), '[]'::jsonb) as related_resources,
    COALESCE((
      SELECT array_agg(tag)
      FROM resource_tags
      WHERE resource_id = r.id
    ), '{}') as tags
  FROM resources r
  WHERE r.slug = p_slug AND r.is_published = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Get featured and trending resources for homepage
CREATE OR REPLACE FUNCTION get_homepage_resources(
  p_featured_limit INTEGER DEFAULT 2,
  p_trending_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  featured JSONB,
  trending JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Featured resources (editor's picks)
    COALESCE((
      SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.added_at DESC)
      FROM (
        SELECT *
        FROM resources
        WHERE is_featured = TRUE AND is_published = TRUE
        ORDER BY added_at DESC
        LIMIT p_featured_limit
      ) r
    ), '[]'::jsonb) as featured,

    -- Trending resources
    COALESCE((
      SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.trending_score DESC)
      FROM (
        SELECT *
        FROM resources
        WHERE is_published = TRUE AND trending_score > 0
        ORDER BY trending_score DESC
        LIMIT p_trending_limit
      ) r
    ), '[]'::jsonb) as trending;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN resources.ai_overview IS 'AI-generated detailed overview in MDX format';
COMMENT ON COLUMN resources.ai_summary IS 'AI-generated short summary for cards (max 500 chars)';
COMMENT ON COLUMN resources.key_features IS 'Array of key features extracted by AI';
COMMENT ON COLUMN resources.use_cases IS 'Array of use cases identified by AI';
COMMENT ON COLUMN resources.pros IS 'Array of advantages identified by AI';
COMMENT ON COLUMN resources.cons IS 'Array of disadvantages identified by AI';
COMMENT ON COLUMN resources.related_docs_count IS 'Denormalized count of related documentation pages';
COMMENT ON COLUMN resources.related_resources_count IS 'Denormalized count of related resources';
COMMENT ON COLUMN resources.screenshot_metadata IS 'JSON array: [{url, width, height, alt, caption, order}]';
COMMENT ON COLUMN resources.trending_score IS 'Computed score for trending algorithm';
COMMENT ON FUNCTION calculate_trending_score IS 'Calculates trending score based on engagement, quality, popularity, and recency';
COMMENT ON FUNCTION refresh_trending_scores IS 'Refreshes all trending scores - call from cron job';
