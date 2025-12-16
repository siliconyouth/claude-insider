-- =============================================
-- Migration: 059_job_queue.sql
-- Description: Background job queue for async processing
-- Use cases: emails, webhooks, heavy processing
-- Created: 2025-12-16
-- =============================================

-- Job queue table
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  type TEXT NOT NULL,                -- 'email', 'webhook', 'notification', etc.

  -- Job data
  payload JSONB NOT NULL DEFAULT '{}',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Retry logic
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,

  -- Scheduling
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- For delayed jobs

  -- Metadata
  priority INT NOT NULL DEFAULT 0,  -- Higher = more important

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error tracking
  last_error TEXT,
  error_count INT NOT NULL DEFAULT 0
);

-- Index for fetching pending jobs efficiently
CREATE INDEX IF NOT EXISTS idx_job_queue_pending
  ON job_queue(status, priority DESC, run_at ASC)
  WHERE status = 'pending';

-- Index for cleanup of old completed jobs
CREATE INDEX IF NOT EXISTS idx_job_queue_completed
  ON job_queue(status, completed_at)
  WHERE status IN ('completed', 'failed', 'cancelled');

-- Index for finding jobs by type
CREATE INDEX IF NOT EXISTS idx_job_queue_type
  ON job_queue(type, status);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to add a job to the queue
CREATE OR REPLACE FUNCTION add_job(
  p_type TEXT,
  p_payload JSONB DEFAULT '{}',
  p_priority INT DEFAULT 0,
  p_run_at TIMESTAMPTZ DEFAULT now(),
  p_max_attempts INT DEFAULT 3
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO job_queue (type, payload, priority, run_at, max_attempts)
  VALUES (p_type, p_payload, p_priority, p_run_at, p_max_attempts)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to claim jobs for processing (atomic)
CREATE OR REPLACE FUNCTION claim_jobs(
  p_limit INT DEFAULT 10,
  p_types TEXT[] DEFAULT NULL
) RETURNS SETOF job_queue AS $$
BEGIN
  RETURN QUERY
  UPDATE job_queue
  SET
    status = 'processing',
    started_at = now(),
    attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM job_queue
    WHERE status = 'pending'
      AND run_at <= now()
      AND attempts < max_attempts
      AND (p_types IS NULL OR type = ANY(p_types))
    ORDER BY priority DESC, run_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_job(p_job_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE job_queue
  SET
    status = 'completed',
    completed_at = now()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as failed
CREATE OR REPLACE FUNCTION fail_job(
  p_job_id UUID,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_attempts INT;
  v_max_attempts INT;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM job_queue WHERE id = p_job_id;

  UPDATE job_queue
  SET
    status = CASE WHEN v_attempts >= v_max_attempts THEN 'failed' ELSE 'pending' END,
    last_error = p_error,
    error_count = error_count + 1,
    -- Reset started_at for retry
    started_at = CASE WHEN v_attempts >= v_max_attempts THEN started_at ELSE NULL END
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue stats
CREATE OR REPLACE FUNCTION get_job_queue_stats()
RETURNS TABLE(
  status TEXT,
  count BIGINT,
  oldest TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jq.status,
    COUNT(*)::BIGINT,
    MIN(jq.created_at)
  FROM job_queue jq
  GROUP BY jq.status;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CLEANUP
-- =============================================================================

-- Function to clean up old completed jobs (call from cron)
CREATE OR REPLACE FUNCTION cleanup_old_jobs(
  p_days INT DEFAULT 7
) RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM job_queue
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < now() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Only allow server-side access (no direct client access)
CREATE POLICY "Job queue is server-only" ON job_queue
  FOR ALL USING (false);

-- Service role can do everything
CREATE POLICY "Service role has full access" ON job_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE job_queue IS 'Background job queue for async processing (emails, webhooks, etc.)';
COMMENT ON COLUMN job_queue.type IS 'Job type: email, webhook, notification, cleanup';
COMMENT ON COLUMN job_queue.payload IS 'JSON payload with job-specific data';
COMMENT ON COLUMN job_queue.priority IS 'Higher priority jobs are processed first';
COMMENT ON COLUMN job_queue.run_at IS 'Scheduled execution time (for delayed jobs)';
