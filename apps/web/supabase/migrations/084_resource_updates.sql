-- Migration 084: Resource Update Jobs and Changelog
-- Adds tables for AI-powered resource auto-updates with admin review workflow

-- ============================================================================
-- RESOURCE UPDATE JOBS
-- Tracks scrape/analysis jobs for resource updates
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_update_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Job created, waiting to start
    'scraping',          -- Scraping URLs
    'analyzing',         -- Claude analyzing content
    'screenshots',       -- Capturing screenshots
    'ready_for_review',  -- Analysis complete, awaiting admin review
    'approved',          -- Admin approved, applying changes
    'rejected',          -- Admin rejected
    'applied',           -- Changes applied successfully
    'failed'             -- Job failed with error
  )),

  -- Trigger info
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'cron')),
  triggered_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- Scraped content
  scraped_content JSONB,  -- Array of { url, markdown, metadata, scrapedAt }
  scraped_at TIMESTAMPTZ,
  scrape_errors JSONB,    -- Array of { url, error }

  -- AI analysis
  proposed_changes JSONB, -- Array of { field, oldValue, newValue, confidence, reason }
  ai_summary TEXT,
  ai_model TEXT DEFAULT 'claude-opus-4-5-20251101',
  analyzed_at TIMESTAMPTZ,
  overall_confidence DECIMAL(3,2), -- 0.00 to 1.00

  -- Screenshots
  new_screenshots TEXT[],    -- URLs of newly captured screenshots
  screenshot_errors TEXT[],  -- Error messages for failed screenshots

  -- Review
  reviewed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  selected_changes JSONB,    -- Array of field names to apply (subset of proposed)

  -- Error handling
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- RESOURCE CHANGELOG
-- Tracks history of applied changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  update_job_id UUID REFERENCES resource_update_jobs(id) ON DELETE SET NULL,

  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,

  -- Change details
  changes JSONB NOT NULL,  -- Array of { field, oldValue, newValue }
  ai_summary TEXT,

  -- Source info
  source_type TEXT CHECK (source_type IN ('auto_update', 'manual_edit', 'admin_sync', 'import')),
  source_urls TEXT[],      -- URLs that were scraped for this update

  -- Who applied
  applied_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stats snapshot at time of update (for historical tracking)
  stats_snapshot JSONB  -- { github_stars, npm_weekly, pypi_monthly, etc. }
);

-- ============================================================================
-- ALTER RESOURCES TABLE
-- Add update tracking columns
-- ============================================================================

DO $$
BEGIN
  -- Last update job reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'last_update_job_id'
  ) THEN
    ALTER TABLE resources ADD COLUMN last_update_job_id UUID REFERENCES resource_update_jobs(id) ON DELETE SET NULL;
  END IF;

  -- Last auto-update timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'last_auto_updated_at'
  ) THEN
    ALTER TABLE resources ADD COLUMN last_auto_updated_at TIMESTAMPTZ;
  END IF;

  -- Update frequency setting
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'update_frequency'
  ) THEN
    ALTER TABLE resources ADD COLUMN update_frequency TEXT DEFAULT 'weekly'
      CHECK (update_frequency IN ('daily', 'weekly', 'monthly', 'manual'));
  END IF;

  -- Auto-update toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'auto_update_enabled'
  ) THEN
    ALTER TABLE resources ADD COLUMN auto_update_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Update notes (for manual edits)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'update_notes'
  ) THEN
    ALTER TABLE resources ADD COLUMN update_notes TEXT;
  END IF;

  -- Changelog count (denormalized for performance)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'changelog_count'
  ) THEN
    ALTER TABLE resources ADD COLUMN changelog_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Update jobs indexes
CREATE INDEX IF NOT EXISTS idx_resource_update_jobs_resource
  ON resource_update_jobs(resource_id);

CREATE INDEX IF NOT EXISTS idx_resource_update_jobs_status
  ON resource_update_jobs(status);

CREATE INDEX IF NOT EXISTS idx_resource_update_jobs_status_pending
  ON resource_update_jobs(status)
  WHERE status IN ('pending', 'ready_for_review');

CREATE INDEX IF NOT EXISTS idx_resource_update_jobs_created
  ON resource_update_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_update_jobs_trigger
  ON resource_update_jobs(trigger_type, created_at DESC);

-- Changelog indexes
CREATE INDEX IF NOT EXISTS idx_resource_changelog_resource
  ON resource_changelog(resource_id);

CREATE INDEX IF NOT EXISTS idx_resource_changelog_applied
  ON resource_changelog(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_changelog_version
  ON resource_changelog(resource_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_resource_changelog_job
  ON resource_changelog(update_job_id);

-- Resources auto-update indexes
CREATE INDEX IF NOT EXISTS idx_resources_auto_update
  ON resources(auto_update_enabled, update_frequency, last_auto_updated_at)
  WHERE auto_update_enabled = true;

-- ============================================================================
-- TRIGGER: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_resource_update_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_update_jobs_timestamp ON resource_update_jobs;
CREATE TRIGGER trigger_resource_update_jobs_timestamp
  BEFORE UPDATE ON resource_update_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_update_jobs_timestamp();

-- ============================================================================
-- TRIGGER: Increment changelog version
-- ============================================================================

CREATE OR REPLACE FUNCTION set_changelog_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(
    (SELECT MAX(version) + 1 FROM resource_changelog WHERE resource_id = NEW.resource_id),
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_changelog_version ON resource_changelog;
CREATE TRIGGER trigger_set_changelog_version
  BEFORE INSERT ON resource_changelog
  FOR EACH ROW
  EXECUTE FUNCTION set_changelog_version();

-- ============================================================================
-- TRIGGER: Update changelog count on resources
-- ============================================================================

CREATE OR REPLACE FUNCTION update_resource_changelog_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE resources SET changelog_count = changelog_count + 1 WHERE id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE resources SET changelog_count = GREATEST(0, changelog_count - 1) WHERE id = OLD.resource_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_changelog_count ON resource_changelog;
CREATE TRIGGER trigger_update_changelog_count
  AFTER INSERT OR DELETE ON resource_changelog
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_changelog_count();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE resource_update_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_changelog ENABLE ROW LEVEL SECURITY;

-- Service role bypass (app uses service_role key) - defensive
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'service_role_update_jobs' AND tablename = 'resource_update_jobs') THEN
    CREATE POLICY "service_role_update_jobs" ON resource_update_jobs FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'service_role_changelog' AND tablename = 'resource_changelog') THEN
    CREATE POLICY "service_role_changelog" ON resource_changelog FOR ALL USING (true);
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE resource_update_jobs IS 'Tracks AI-powered resource update jobs with scraping, analysis, and review workflow';
COMMENT ON TABLE resource_changelog IS 'Historical record of all changes applied to resources';

COMMENT ON COLUMN resource_update_jobs.proposed_changes IS 'JSON array of proposed changes from AI analysis: [{ field, oldValue, newValue, confidence, reason }]';
COMMENT ON COLUMN resource_update_jobs.selected_changes IS 'JSON array of field names admin selected to apply (subset of proposed_changes)';
COMMENT ON COLUMN resource_changelog.stats_snapshot IS 'Snapshot of resource stats at time of update for historical tracking';
