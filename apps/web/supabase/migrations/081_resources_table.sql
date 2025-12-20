-- Migration: 081_resources_table
-- Description: Create main resources table with all fields for individual resource pages
-- Created: 2025-12-20

-- =============================================================================
-- MAIN RESOURCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS resources (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,

  -- Core Fields (migrated from JSON)
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT, -- MDX content for rich descriptions
  url VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),

  -- Status & Visibility
  status VARCHAR(50) DEFAULT 'community',
  is_featured BOOLEAN DEFAULT FALSE,
  featured_reason VARCHAR(100),
  is_published BOOLEAN DEFAULT TRUE,

  -- Difficulty & Audience
  difficulty VARCHAR(50),

  -- Versioning
  version VARCHAR(50),
  namespace VARCHAR(100),

  -- Pricing & Platform
  pricing VARCHAR(50) DEFAULT 'free',
  price_details JSONB, -- { "monthly": 20, "yearly": 200, "currency": "USD" }
  platforms TEXT[] DEFAULT '{}',
  license VARCHAR(100),

  -- External Links
  website_url VARCHAR(500),
  docs_url VARCHAR(500),
  changelog_url VARCHAR(500),
  discord_url VARCHAR(500),
  twitter_url VARCHAR(500),

  -- GitHub Integration
  github_owner VARCHAR(100),
  github_repo VARCHAR(100),
  github_stars INTEGER DEFAULT 0,
  github_forks INTEGER DEFAULT 0,
  github_issues INTEGER DEFAULT 0,
  github_language VARCHAR(50),
  github_last_commit TIMESTAMPTZ,
  github_contributors INTEGER DEFAULT 0,

  -- npm/PyPI Integration
  npm_package VARCHAR(255),
  npm_downloads_weekly INTEGER DEFAULT 0,
  pypi_package VARCHAR(255),
  pypi_downloads_monthly INTEGER DEFAULT 0,

  -- Media
  icon_url VARCHAR(500),
  banner_url VARCHAR(500),
  screenshots TEXT[] DEFAULT '{}',
  video_url VARCHAR(500),

  -- SEO
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  og_image_url VARCHAR(500),

  -- Community Stats (denormalized for performance)
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT resources_category_check CHECK (category IN (
    'official', 'tools', 'mcp-servers', 'rules', 'prompts',
    'agents', 'tutorials', 'sdks', 'showcases', 'community'
  )),
  CONSTRAINT resources_status_check CHECK (status IN (
    'official', 'community', 'beta', 'deprecated', 'archived'
  )),
  CONSTRAINT resources_difficulty_check CHECK (
    difficulty IS NULL OR difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')
  ),
  CONSTRAINT resources_pricing_check CHECK (pricing IN (
    'free', 'freemium', 'paid', 'open-source'
  ))
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_is_featured ON resources(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_resources_is_published ON resources(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_resources_github_stars ON resources(github_stars DESC) WHERE github_stars > 0;
CREATE INDEX IF NOT EXISTS idx_resources_average_rating ON resources(average_rating DESC) WHERE ratings_count > 0;
CREATE INDEX IF NOT EXISTS idx_resources_views_count ON resources(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_resources_added_at ON resources(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_pricing ON resources(pricing);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_resources_search ON resources USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(long_description, ''))
);

-- =============================================================================
-- RESOURCE TAGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS resource_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_resource_tags_tag ON resource_tags(tag);
CREATE INDEX IF NOT EXISTS idx_resource_tags_resource ON resource_tags(resource_id);

-- =============================================================================
-- RESOURCE AUTHORS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS resource_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Author info (can be linked user or external)
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'author',
  github_username VARCHAR(100),
  twitter_username VARCHAR(100),
  website_url VARCHAR(500),
  avatar_url VARCHAR(500),

  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT resource_authors_role_check CHECK (role IN (
    'author', 'maintainer', 'contributor', 'creator', 'team'
  ))
);

CREATE INDEX IF NOT EXISTS idx_resource_authors_resource ON resource_authors(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_authors_user ON resource_authors(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resource_authors_github ON resource_authors(github_username) WHERE github_username IS NOT NULL;

-- =============================================================================
-- RESOURCE ALTERNATIVES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS resource_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  alternative_resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'alternative',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_id, alternative_resource_id),
  CONSTRAINT resource_alternatives_not_self CHECK (resource_id != alternative_resource_id),
  CONSTRAINT resource_alternatives_relationship_check CHECK (relationship IN (
    'alternative', 'complement', 'successor', 'fork', 'similar'
  ))
);

CREATE INDEX IF NOT EXISTS idx_resource_alternatives_resource ON resource_alternatives(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_alternatives_alt ON resource_alternatives(alternative_resource_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_alternatives ENABLE ROW LEVEL SECURITY;

-- Public read access for published resources (defensive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE policyname = 'Public can view published resources' AND tablename = 'resources'
  ) THEN
    CREATE POLICY "Public can view published resources" ON resources FOR SELECT USING (is_published = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE policyname = 'Public can view resource tags' AND tablename = 'resource_tags'
  ) THEN
    CREATE POLICY "Public can view resource tags" ON resource_tags FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE policyname = 'Public can view resource authors' AND tablename = 'resource_authors'
  ) THEN
    CREATE POLICY "Public can view resource authors" ON resource_authors FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE policyname = 'Public can view resource alternatives' AND tablename = 'resource_alternatives'
  ) THEN
    CREATE POLICY "Public can view resource alternatives" ON resource_alternatives FOR SELECT USING (TRUE);
  END IF;
END $$;

-- =============================================================================
-- TRIGGER: Update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resources_updated_at ON resources;
CREATE TRIGGER trigger_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_resources_updated_at();
