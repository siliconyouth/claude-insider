-- ============================================================================
-- F-023: Export Jobs Table
-- ============================================================================
-- Tracks bulk export jobs for admin data exports.
-- Supports async processing, multiple formats, and scheduled exports.
-- ============================================================================

-- Create export_jobs table
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job ownership
  created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Export configuration
  export_type TEXT NOT NULL CHECK (export_type IN ('users', 'activity', 'content', 'audit_logs', 'all')),
  format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'xlsx')),

  -- Filtering options (JSONB for flexibility)
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Options structure:
  -- {
  --   "userIds": ["uuid1", "uuid2"],  -- Specific users, or all if empty
  --   "dateRange": { "start": "ISO", "end": "ISO" },
  --   "anonymize": false,  -- Replace names/emails with IDs
  --   "includeDeleted": false
  -- }

  -- Results
  file_path TEXT,  -- Path to exported file in storage
  file_size BIGINT,  -- Size in bytes
  row_count INTEGER,  -- Number of rows/records exported

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Progress tracking
  progress INTEGER DEFAULT 0,  -- 0-100 percentage
  current_step TEXT,  -- Human-readable current step

  -- Scheduling
  scheduled_for TIMESTAMPTZ,  -- NULL for immediate, or future date
  schedule_cron TEXT,  -- CRON expression for recurring exports

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- When the file should be deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_export_jobs_created_by ON export_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created_at ON export_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_jobs_scheduled ON export_jobs(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_export_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_export_jobs_updated_at ON export_jobs;
CREATE TRIGGER trigger_export_jobs_updated_at
  BEFORE UPDATE ON export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_export_jobs_updated_at();

-- RLS Policies
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own exports
CREATE POLICY "Users can view own exports" ON export_jobs
  FOR SELECT
  USING (auth.uid()::text = created_by);

-- Policy: Admins can view all exports
CREATE POLICY "Admins can view all exports" ON export_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Policy: Admins can create exports
CREATE POLICY "Admins can create exports" ON export_jobs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('admin', 'superadmin', 'moderator')
    )
  );

-- Policy: Admins can update exports
CREATE POLICY "Admins can update exports" ON export_jobs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Comment for documentation
COMMENT ON TABLE export_jobs IS 'Tracks bulk data export jobs for admin users';
COMMENT ON COLUMN export_jobs.options IS 'JSONB containing filter options like userIds, dateRange, anonymize flag';
COMMENT ON COLUMN export_jobs.file_path IS 'Storage path to the exported file, expires based on expires_at';
