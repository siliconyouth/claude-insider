-- Reports System
-- Allows users to report other users or comments for review by admins
-- Admins can approve, reject, or investigate reports

-- ============================================
-- REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Reporter info
  reporter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  -- What is being reported (user or comment)
  report_type VARCHAR(20) NOT NULL, -- 'user' or 'comment'
  reported_user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  reported_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  -- Report content
  reason VARCHAR(50) NOT NULL, -- 'spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'other'
  description TEXT, -- User's description of the issue
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'investigating', 'action_taken', 'dismissed'
  -- Admin response
  reviewed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  review_notes TEXT, -- Admin's internal notes
  action_taken TEXT, -- What action was taken (warning, comment hidden, user banned, etc.)
  reporter_message TEXT, -- Message sent to reporter about outcome
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraints
  CONSTRAINT valid_report_type CHECK (report_type IN ('user', 'comment')),
  CONSTRAINT report_target_required CHECK (
    (report_type = 'user' AND reported_user_id IS NOT NULL) OR
    (report_type = 'comment' AND reported_comment_id IS NOT NULL)
  )
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id) WHERE reported_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_reported_comment ON reports(reported_comment_id) WHERE reported_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON reports(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Service role can manage all reports
CREATE POLICY "Service role can manage reports" ON reports
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (reporter_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON reports TO postgres;
GRANT ALL ON reports TO service_role;
GRANT SELECT, INSERT ON reports TO authenticated;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON reports;
CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

-- ============================================
-- REPORT HISTORY TABLE (for tracking multiple reports on same target)
-- ============================================

-- View to count reports per user/comment for detecting patterns
CREATE OR REPLACE VIEW report_counts AS
SELECT
  reported_user_id,
  reported_comment_id,
  report_type,
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'action_taken') as actioned_reports,
  MAX(created_at) as last_report_at
FROM reports
GROUP BY reported_user_id, reported_comment_id, report_type;

-- Grant access to the view
GRANT SELECT ON report_counts TO postgres;
GRANT SELECT ON report_counts TO service_role;
GRANT SELECT ON report_counts TO authenticated;
