-- ============================================================================
-- Migration: 129_sentry_check_logs
-- Description: Create table for tracking Sentry error check cron job runs
-- ============================================================================

-- Sentry check logs table
-- Tracks hourly cron runs for error monitoring
CREATE TABLE IF NOT EXISTS sentry_check_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Stats from the check
  issues_found INTEGER NOT NULL DEFAULT 0,
  new_issues INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  fatal_count INTEGER NOT NULL DEFAULT 0,

  -- Notification tracking
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notification_id UUID REFERENCES admin_notifications(id) ON DELETE SET NULL,

  -- Error tracking for failed checks
  error TEXT,

  -- Duration of the check in milliseconds
  duration_ms INTEGER
);

-- Index for querying recent checks
CREATE INDEX IF NOT EXISTS idx_sentry_check_logs_checked_at
  ON sentry_check_logs(checked_at DESC);

-- Index for finding checks with errors
CREATE INDEX IF NOT EXISTS idx_sentry_check_logs_error
  ON sentry_check_logs(error) WHERE error IS NOT NULL;

-- Comment on table
COMMENT ON TABLE sentry_check_logs IS 'Tracks hourly Sentry error monitoring cron job runs';

-- RLS policies
ALTER TABLE sentry_check_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view check logs
CREATE POLICY "Admins can view sentry check logs"
  ON sentry_check_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = auth.uid()::text
      AND role IN ('admin', 'superadmin')
    )
  );

-- Only system (via service role) can insert/update
CREATE POLICY "Service role can insert sentry check logs"
  ON sentry_check_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update sentry check logs"
  ON sentry_check_logs
  FOR UPDATE
  TO service_role
  USING (true);

-- Cleanup old logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_sentry_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sentry_check_logs
  WHERE checked_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_sentry_logs IS 'Removes sentry check logs older than 90 days';
