-- Migration: Resource Cache Invalidation Support
--
-- This migration adds support for tracking resource changes to enable
-- automatic cache invalidation. The revalidation is triggered via:
--
-- 1. Supabase Database Webhook (primary) - Configure in Dashboard:
--    - Go to Database > Webhooks
--    - Create webhook for 'resources' table
--    - Events: INSERT, UPDATE, DELETE
--    - URL: https://www.claudeinsider.com/api/revalidate/resources
--    - Headers: Authorization: Bearer <CRON_SECRET>
--
-- 2. Cron job (fallback) - Checks for recent changes every 5 minutes
--    - Endpoint: /api/cron/check-resource-updates
--
-- This table tracks when revalidations occurred for debugging/monitoring.

-- Resource cache invalidation log
CREATE TABLE IF NOT EXISTS resource_cache_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('webhook', 'cron', 'manual')),
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'BULK')),
  resource_slug TEXT,
  resource_category TEXT,
  tags_invalidated TEXT[],
  success BOOLEAN DEFAULT TRUE,
  error TEXT,
  duration_ms INTEGER
);

-- Index for querying recent logs
CREATE INDEX IF NOT EXISTS idx_resource_cache_logs_triggered_at
  ON resource_cache_logs(triggered_at DESC);

-- Auto-cleanup old logs (keep 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_cache_logs()
RETURNS VOID AS $$
BEGIN
  DELETE FROM resource_cache_logs
  WHERE triggered_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Track resource updates for cron-based invalidation
-- This is a fallback in case webhooks fail
CREATE TABLE IF NOT EXISTS resource_update_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE
);

-- Index for finding unprocessed updates
CREATE INDEX IF NOT EXISTS idx_resource_update_queue_unprocessed
  ON resource_update_queue(created_at)
  WHERE processed = FALSE;

-- Trigger function to queue resource updates
CREATE OR REPLACE FUNCTION queue_resource_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO resource_update_queue (resource_id, operation)
    VALUES (OLD.id, 'DELETE');
    RETURN OLD;
  ELSE
    INSERT INTO resource_update_queue (resource_id, operation)
    VALUES (NEW.id, TG_OP);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on resources table
DROP TRIGGER IF EXISTS resource_update_trigger ON resources;
CREATE TRIGGER resource_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON resources
  FOR EACH ROW EXECUTE FUNCTION queue_resource_update();

-- Also track tag changes
DROP TRIGGER IF EXISTS resource_tags_update_trigger ON resource_tags;
CREATE TRIGGER resource_tags_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON resource_tags
  FOR EACH ROW EXECUTE FUNCTION queue_resource_update();

-- Helper function to mark updates as processed
CREATE OR REPLACE FUNCTION mark_resource_updates_processed(update_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE resource_update_queue
  SET processed = TRUE, processed_at = NOW()
  WHERE id = ANY(update_ids);
END;
$$ LANGUAGE plpgsql;

-- Helper function to get pending updates
CREATE OR REPLACE FUNCTION get_pending_resource_updates(max_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  resource_id UUID,
  operation TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ruq.id,
    ruq.resource_id,
    ruq.operation,
    ruq.created_at
  FROM resource_update_queue ruq
  WHERE ruq.processed = FALSE
  ORDER BY ruq.created_at
  LIMIT max_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT ON resource_cache_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON resource_update_queue TO authenticated;

COMMENT ON TABLE resource_cache_logs IS 'Logs of cache invalidation events for resources';
COMMENT ON TABLE resource_update_queue IS 'Queue of resource changes pending cache invalidation';
