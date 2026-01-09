-- ============================================================================
-- Migration: 133_prompt_library_expansion.sql
-- Description: Expand Prompt Library with versioning, Claude hints, community
--              contributions, and import tracking
--
-- Features:
-- 1. prompt_versions - Version history for prompts
-- 2. prompt_claude_hints - Claude optimization metadata
-- 3. prompt_submissions - Community contributions queue
-- 4. prompt_imports - Import job tracking
-- 5. New columns on prompts table
-- 6. 10 new categories (18 total)
--
-- Created: 2025-01-09 for Claude Insider v1.19.0
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns to prompts table
-- ============================================================================

-- Source tracking
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'original'
  CHECK (source_type IN ('original', 'imported', 'adapted', 'community'));
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS source_attribution TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS original_content TEXT;

-- Versioning
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS forked_from_id UUID REFERENCES prompts(id) ON DELETE SET NULL;

-- Metadata
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS difficulty TEXT
  CHECK (difficulty IS NULL OR difficulty IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS estimated_tokens INTEGER;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS use_cases TEXT[] DEFAULT '{}';

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_prompts_source_type ON prompts(source_type);
CREATE INDEX IF NOT EXISTS idx_prompts_forked_from ON prompts(forked_from_id) WHERE forked_from_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_difficulty ON prompts(difficulty) WHERE difficulty IS NOT NULL;

-- ============================================================================
-- STEP 2: Create prompt_versions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  change_summary TEXT,
  claude_adaptation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  CONSTRAINT unique_prompt_version UNIQUE(prompt_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created ON prompt_versions(created_at DESC);

-- RLS
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read versions of public prompts
CREATE POLICY "Public prompt versions readable" ON prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_versions.prompt_id
      AND (p.visibility = 'public' OR p.visibility = 'unlisted' OR p.is_system = TRUE)
    )
  );

-- Users can read versions of their own prompts
CREATE POLICY "Own prompt versions readable" ON prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_versions.prompt_id
      AND p.author_id = auth.uid()::text
    )
  );

-- Only prompt owners and admins can create versions
CREATE POLICY "Create own prompt versions" ON prompt_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_versions.prompt_id
      AND p.author_id = auth.uid()::text
    )
  );

-- ============================================================================
-- STEP 3: Create prompt_claude_hints table
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_claude_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

  -- Best practices flags
  uses_xml_tags BOOLEAN DEFAULT FALSE,
  uses_thinking_section BOOLEAN DEFAULT FALSE,
  uses_examples BOOLEAN DEFAULT FALSE,
  uses_chain_of_thought BOOLEAN DEFAULT FALSE,
  uses_system_context BOOLEAN DEFAULT FALSE,
  uses_output_format BOOLEAN DEFAULT FALSE,

  -- Optimization scores (0-100)
  structure_score INTEGER DEFAULT 0 CHECK (structure_score >= 0 AND structure_score <= 100),
  clarity_score INTEGER DEFAULT 0 CHECK (clarity_score >= 0 AND clarity_score <= 100),
  specificity_score INTEGER DEFAULT 0 CHECK (specificity_score >= 0 AND specificity_score <= 100),
  overall_optimization_score INTEGER DEFAULT 0 CHECK (overall_optimization_score >= 0 AND overall_optimization_score <= 100),

  -- Improvement suggestions
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"type": "add_xml_tags", "description": "...", "priority": "high|medium|low", "code_example": "..."}]

  -- Claude-specific metadata
  recommended_model TEXT CHECK (recommended_model IS NULL OR recommended_model IN ('opus', 'sonnet', 'haiku')),
  estimated_tokens INTEGER,
  complexity_level TEXT CHECK (complexity_level IS NULL OR complexity_level IN ('simple', 'moderate', 'complex')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,

  CONSTRAINT unique_prompt_hints UNIQUE(prompt_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_claude_hints_prompt ON prompt_claude_hints(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_claude_hints_score ON prompt_claude_hints(overall_optimization_score DESC);

-- RLS
ALTER TABLE prompt_claude_hints ENABLE ROW LEVEL SECURITY;

-- Anyone can read hints for public prompts
CREATE POLICY "Public prompt hints readable" ON prompt_claude_hints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_claude_hints.prompt_id
      AND (p.visibility = 'public' OR p.visibility = 'unlisted' OR p.is_system = TRUE)
    )
  );

-- Users can read hints for their own prompts
CREATE POLICY "Own prompt hints readable" ON prompt_claude_hints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = prompt_claude_hints.prompt_id
      AND p.author_id = auth.uid()::text
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_prompt_claude_hints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prompt_claude_hints_updated_at ON prompt_claude_hints;
CREATE TRIGGER trigger_prompt_claude_hints_updated_at
  BEFORE UPDATE ON prompt_claude_hints
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_claude_hints_updated_at();

-- ============================================================================
-- STEP 4: Create prompt_submissions table (Community contributions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submission content
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category_id UUID REFERENCES prompt_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  variables JSONB DEFAULT '[]'::jsonb,

  -- Source attribution
  source_url TEXT,
  source_name TEXT,  -- 'awesome-chatgpt-prompts', 'community', 'awesome-claude-prompts', etc.
  source_attribution TEXT,

  -- Submitter info
  submitter_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  submitter_ip_hash VARCHAR(64),
  submitter_email TEXT,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'needs_adaptation')),

  -- Review tracking
  reviewed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT CHECK (
    rejection_reason IS NULL OR
    rejection_reason IN ('duplicate', 'low_quality', 'inappropriate', 'spam', 'off_topic', 'needs_work', 'other')
  ),

  -- AI analysis results
  ai_analysis JSONB,
  ai_category_suggestion TEXT,
  ai_adaptation_suggestions TEXT,
  ai_adapted_content TEXT,
  ai_quality_score DECIMAL(3,2) CHECK (ai_quality_score IS NULL OR (ai_quality_score >= 0 AND ai_quality_score <= 1)),

  -- Duplicate detection
  duplicate_of_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  similarity_score DECIMAL(3,2),

  -- Links to created prompt after approval
  created_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_status ON prompt_submissions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_submitter ON prompt_submissions(submitter_user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_created ON prompt_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_category ON prompt_submissions(category_id);

-- Full-text search on submissions
CREATE INDEX IF NOT EXISTS idx_prompt_submissions_search ON prompt_submissions
  USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')));

-- RLS
ALTER TABLE prompt_submissions ENABLE ROW LEVEL SECURITY;

-- Users can see their own submissions
CREATE POLICY "Users see own submissions" ON prompt_submissions
  FOR SELECT USING (submitter_user_id = auth.uid()::text);

-- Users can create submissions
CREATE POLICY "Users can submit prompts" ON prompt_submissions
  FOR INSERT WITH CHECK (submitter_user_id = auth.uid()::text OR submitter_user_id IS NULL);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_prompt_submissions_updated_at ON prompt_submissions;
CREATE TRIGGER trigger_prompt_submissions_updated_at
  BEFORE UPDATE ON prompt_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_prompts_updated_at();

-- ============================================================================
-- STEP 5: Create prompt_imports table (Import job tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source info
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_version TEXT,

  -- Job status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

  -- Progress tracking
  total_prompts INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  adapted_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  -- Configuration
  import_config JSONB DEFAULT '{}'::jsonb,
  -- Format: {"adaptForClaude": true, "autoApprove": false, "categoryMapping": {...}}

  -- Results
  error_log JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"row": 5, "error": "...", "prompt_title": "..."}]

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Audit
  triggered_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_imports_status ON prompt_imports(status);
CREATE INDEX IF NOT EXISTS idx_prompt_imports_source ON prompt_imports(source_name);
CREATE INDEX IF NOT EXISTS idx_prompt_imports_created ON prompt_imports(created_at DESC);

-- RLS (admin only via service role)
ALTER TABLE prompt_imports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Add 10 new categories
-- ============================================================================

INSERT INTO prompt_categories (slug, name, description, icon, display_order, is_active)
VALUES
  ('roleplay', 'Roleplay', 'Character personas, scenarios, and interactive fiction', 'Theater', 9, TRUE),
  ('research', 'Research', 'Academic research, literature review, and citations', 'Search', 10, TRUE),
  ('marketing', 'Marketing', 'Copywriting, ads, social media, and SEO', 'Megaphone', 11, TRUE),
  ('legal', 'Legal', 'Legal documents, contracts, and compliance', 'Scale', 12, TRUE),
  ('healthcare', 'Healthcare', 'Medical information and patient education', 'Heart', 13, TRUE),
  ('education', 'Education', 'Lesson plans, quizzes, and curriculum development', 'GraduationCap', 14, TRUE),
  ('translation', 'Translation', 'Multilingual translation and localization', 'Languages', 15, TRUE),
  ('design', 'Design', 'UI/UX, visual design, and design systems', 'Palette', 16, TRUE),
  ('devops', 'DevOps', 'CI/CD, infrastructure, and deployment', 'Server', 17, TRUE),
  ('security', 'Security', 'Security audits and vulnerability analysis', 'Shield', 18, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- STEP 7: Create helper functions
-- ============================================================================

-- Function to create a new version when prompt is updated
CREATE OR REPLACE FUNCTION create_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO prompt_versions (
      prompt_id,
      version_number,
      content,
      variables,
      created_by
    ) VALUES (
      OLD.id,
      OLD.current_version,
      OLD.content,
      OLD.variables,
      NEW.author_id
    );

    -- Increment version number
    NEW.current_version = OLD.current_version + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (disabled by default - enable when ready)
-- DROP TRIGGER IF EXISTS trigger_create_prompt_version ON prompts;
-- CREATE TRIGGER trigger_create_prompt_version
--   BEFORE UPDATE OF content ON prompts
--   FOR EACH ROW
--   EXECUTE FUNCTION create_prompt_version();

-- Function to update fork count
CREATE OR REPLACE FUNCTION update_fork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.forked_from_id IS NOT NULL THEN
    UPDATE prompts
    SET fork_count = fork_count + 1
    WHERE id = NEW.forked_from_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fork_count ON prompts;
CREATE TRIGGER trigger_update_fork_count
  AFTER INSERT ON prompts
  FOR EACH ROW
  WHEN (NEW.forked_from_id IS NOT NULL)
  EXECUTE FUNCTION update_fork_count();

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON prompt_versions TO authenticated;
GRANT SELECT ON prompt_claude_hints TO authenticated;
GRANT SELECT, INSERT ON prompt_submissions TO authenticated;
GRANT SELECT ON prompt_imports TO authenticated;

-- Grant access to anon for public data
GRANT SELECT ON prompt_versions TO anon;
GRANT SELECT ON prompt_claude_hints TO anon;
GRANT INSERT ON prompt_submissions TO anon;

-- ============================================================================
-- STEP 9: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE prompt_versions IS 'Version history for prompts, created automatically on content changes';
COMMENT ON TABLE prompt_claude_hints IS 'Claude AI optimization metadata and improvement suggestions';
COMMENT ON TABLE prompt_submissions IS 'Community-submitted prompts awaiting moderation';
COMMENT ON TABLE prompt_imports IS 'Tracking for bulk prompt imports from external sources';

COMMENT ON COLUMN prompts.source_type IS 'Origin of the prompt: original (user created), imported (bulk import), adapted (AI-improved), community (user submitted)';
COMMENT ON COLUMN prompts.current_version IS 'Current version number, incremented on each content change';
COMMENT ON COLUMN prompt_claude_hints.overall_optimization_score IS 'Composite score (0-100) indicating how well the prompt follows Claude best practices';
COMMENT ON COLUMN prompt_submissions.ai_adapted_content IS 'AI-generated Claude-optimized version of the submitted prompt';

-- ============================================================================
-- Verification query (run manually)
-- ============================================================================
-- SELECT
--   (SELECT COUNT(*) FROM prompt_categories) AS category_count,
--   (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prompt_versions') AS has_versions_table,
--   (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prompt_claude_hints') AS has_hints_table,
--   (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prompt_submissions') AS has_submissions_table,
--   (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prompt_imports') AS has_imports_table;
