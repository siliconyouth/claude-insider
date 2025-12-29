-- ============================================================================
-- Migration 107: User Resource Submissions
-- ============================================================================
-- Enables users to submit resources for addition to Claude Insider with
-- automated AI analysis and moderation workflow.
--
-- Flow: User submits URL → AI analysis → ResourceDiscoveryQueue → Admin review
-- ============================================================================

-- User resource submissions with status workflow
CREATE TABLE IF NOT EXISTS resource_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submission data
  url VARCHAR(2048) NOT NULL,
  title VARCHAR(500),                    -- Optional user-provided title
  description TEXT,                       -- Optional user-provided description
  notes TEXT,                             -- Why user thinks this is valuable

  -- Submitter info (similar to edit_suggestions pattern)
  submitter_type VARCHAR(20) NOT NULL DEFAULT 'public',  -- 'public', 'anonymous'
  submitter_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,  -- TEXT: Better Auth uses TEXT IDs
  submitter_email VARCHAR(255),          -- For anonymous submissions (optional notification)
  submitter_name VARCHAR(255),           -- For anonymous submissions (optional)
  submitter_ip_hash VARCHAR(64),         -- Hashed IP for rate limiting anonymous users

  -- Status workflow
  -- pending → analyzing → queued → approved / rejected
  status VARCHAR(30) NOT NULL DEFAULT 'pending',

  -- AI analysis results (stored for reference)
  ai_analysis JSONB,                     -- Full AI analysis response
  ai_confidence DECIMAL(3,2),            -- 0.00-1.00
  ai_relevance DECIMAL(3,2),             -- 0.00-1.00
  ai_quality DECIMAL(3,2),               -- 0.00-1.00
  ai_error TEXT,                         -- Error message if AI analysis failed

  -- Processing tracking
  discovery_queue_id UUID,               -- Links to resource_discovery_queue after AI analysis
  created_resource_id UUID,              -- Links to resources table after approval

  -- Review tracking
  reviewed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,  -- TEXT: Better Auth uses TEXT IDs
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason VARCHAR(100),         -- spam, duplicate, off-topic, low-quality, not-relevant

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE resource_submissions IS 'User-submitted resources awaiting AI analysis and moderation';
COMMENT ON COLUMN resource_submissions.status IS 'Workflow status: pending, analyzing, queued, approved, rejected';
COMMENT ON COLUMN resource_submissions.submitter_type IS 'Type of submitter: public (logged in), anonymous';
COMMENT ON COLUMN resource_submissions.ai_analysis IS 'Full AI analysis response including category, tags, difficulty, etc.';

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_resource_submissions_status
  ON resource_submissions(status);

CREATE INDEX IF NOT EXISTS idx_resource_submissions_user
  ON resource_submissions(submitter_user_id)
  WHERE submitter_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resource_submissions_url
  ON resource_submissions(url);

CREATE INDEX IF NOT EXISTS idx_resource_submissions_pending
  ON resource_submissions(status, created_at)
  WHERE status IN ('pending', 'analyzing');

CREATE INDEX IF NOT EXISTS idx_resource_submissions_ip_hash
  ON resource_submissions(submitter_ip_hash, created_at)
  WHERE submitter_ip_hash IS NOT NULL;

-- RLS policies
ALTER TABLE resource_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
-- Note: auth.uid() returns UUID, we cast to TEXT for Better Auth compatibility
CREATE POLICY "Users can view own submissions" ON resource_submissions
  FOR SELECT USING (
    submitter_user_id IS NOT NULL
    AND submitter_user_id = (auth.uid())::TEXT
  );

-- Anyone can create submissions (rate limiting handled in application)
CREATE POLICY "Anyone can create submissions" ON resource_submissions
  FOR INSERT WITH CHECK (true);

-- Admins/moderators can view all submissions
CREATE POLICY "Admins can view all submissions" ON resource_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = (auth.uid())::TEXT
      AND u.role IN ('admin', 'superadmin', 'moderator')
    )
  );

-- Admins/moderators can update submissions
CREATE POLICY "Admins can update submissions" ON resource_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = (auth.uid())::TEXT
      AND u.role IN ('admin', 'superadmin', 'moderator')
    )
  );

-- Service role can do everything (for cron jobs)
CREATE POLICY "Service role full access" ON resource_submissions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_resource_submissions_updated_at
  BEFORE UPDATE ON resource_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Add source_submission_id to resource_discovery_queue if it doesn't exist
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resource_discovery_queue'
    AND column_name = 'source_submission_id'
  ) THEN
    ALTER TABLE resource_discovery_queue
    ADD COLUMN source_submission_id UUID REFERENCES resource_submissions(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_resource_discovery_queue_submission
      ON resource_discovery_queue(source_submission_id)
      WHERE source_submission_id IS NOT NULL;

    COMMENT ON COLUMN resource_discovery_queue.source_submission_id IS 'Links to user submission that initiated this discovery';
  END IF;
END $$;

-- ============================================================================
-- Add notification types for resource submissions
-- ============================================================================
-- Update notification_preferences defaults to include new types
-- (handled in application code - no schema change needed)

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT ON resource_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON resource_submissions TO service_role;
